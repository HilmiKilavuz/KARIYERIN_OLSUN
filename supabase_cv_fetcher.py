# supabase_cv_fetcher.py
import os
import json  # <-- BU EKSİKTİ, EKLENDİ
from supabase import create_client, Client
from dotenv import load_dotenv

# .env dosyasındaki bilgileri yükle
load_dotenv()

# Bilgileri koddan değil, ortam değişkenlerinden al
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Tablo İsimleri
TABLE_NAME = 'aday_profil'         # Kaynak tablo
ANALIZ_TABLE_NAME = 'analiz_sonuclari' # Hedef tablo

class SupabaseCvFetcher:
    """
    Supabase'deki 'aday_profil' tablosundan 'yetenekler' çeker ve
    analiz sonuçlarını 'analiz_sonuclari' tablosuna kaydeder.
    """
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ HATA: .env dosyası bulunamadı veya içinde SUPABASE_URL/SUPABASE_KEY eksik.")
            self.supabase = None
            return

        try:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"❌ Supabase bağlantı hatası: {e}")
            self.supabase = None

    def _flatten_skills(self, data):
        """Yardımcı Fonksiyon: Karmaşık JSON/Dict/List yapılarını düz bir string listesine çevirir."""
        flat_list = []
        if isinstance(data, list):
            for item in data:
                flat_list.extend(self._flatten_skills(item))
        elif isinstance(data, dict):
            for key, value in data.items():
                flat_list.extend(self._flatten_skills(value))
        elif isinstance(data, str):
            cleaned = data.strip().strip('"').strip("'").strip()
            if cleaned:
                flat_list.append(cleaned)
        return flat_list

    def get_approved_skill_lists(self, limit=10):
        """
        Durumu 'approved' olan kayıtları çeker ve 'yetenekler' sütununu ayrıştırır.
        """
        if not self.supabase: return []
        try:
            response = self.supabase.table(TABLE_NAME) \
                                     .select('id, yetenekler') \
                                     .eq('status', 'approved') \
                                     .limit(limit) \
                                     .execute()

            if response.data:
                print(f"{len(response.data)} adet işlenecek kayıt bulundu.")
                results = []
                for record in response.data:
                    skills_raw = record.get('yetenekler')
                    skills_list = []

                    if skills_raw:
                        # DURUM 1: Veri zaten Python Listesi veya Sözlüğü ise
                        if isinstance(skills_raw, (list, dict)):
                            skills_list = self._flatten_skills(skills_raw)

                        # DURUM 2: Veri String (Metin) ise
                        elif isinstance(skills_raw, str):
                            # Önce JSON olup olmadığını dene
                            try:
                                parsed_data = json.loads(skills_raw)
                                skills_list = self._flatten_skills(parsed_data)
                            except json.JSONDecodeError:
                                # JSON değilse, virgülle ayrılmış düz metindir
                                skills_list = [
                                    skill.strip().strip('"').strip("'").strip() 
                                    for skill in skills_raw.split(',') 
                                    if skill.strip()
                                ]
                    
                    if skills_list:
                        results.append({'id': record['id'], 'skills': skills_list})
                    else:
                        print(f"   ⚠️ ID {record['id']} için yetenek verisi boş/geçersiz. Hata olarak işaretleniyor.")
                        self.save_results_and_update_status(record['id'], 'error', error_message="Yetenek verisi boş/geçersiz.")

                return results
            else:
                print("İşlenecek yeni kayıt yok.")
                return []
        except Exception as e:
            print(f"❌ Veri çekme hatası: {e}")
            return []

    def save_results_and_update_status(self, input_id, new_status, detected_role=None, overall_score=None, core_score=None, report_text=None, error_message=None):
        """
        Sonuçları kaydeder ve durumu günceller.
        """
        if not self.supabase: return False
        
        report_content = report_text
        if error_message: report_content = f"HATA: {error_message}"

        # ADIM 1: Sonuçları 'analiz_sonuclari' tablosuna ekle (Sadece completed veya error ise)
        if new_status in ['completed', 'error']:
            try:
                result_data = {
                    'aday_id': input_id,
                    'status': new_status,
                    'detected_role': detected_role,
                    'overall_score': overall_score,
                    'core_score': core_score,
                    'report_text': report_content
                }
                result_data = {k: v for k, v in result_data.items() if v is not None}

                insert_response = self.supabase.table(ANALIZ_TABLE_NAME).insert(result_data).execute()
                if not insert_response.data:
                    print(f"   ❌ Sonuçlar kaydedilemedi (ID: {input_id}).")
                    return False
                
            except Exception as e:
                print(f"❌ Sonuç kaydetme hatası (ID: {input_id}): {e}")
                return False

        # ADIM 2: 'aday_profil' tablosundaki durumu güncelle
        try:
            self.supabase.table(TABLE_NAME).update({'status': new_status}).eq('id', input_id).execute()
            if new_status == 'completed':
                print(f"   ✔️ ID {input_id} başarıyla işlendi.")
            return True
        except Exception as e:
            print(f"❌ Durum güncelleme hatası (ID: {input_id}): {e}")
            return False