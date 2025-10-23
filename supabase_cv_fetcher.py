# supabase_cv_fetcher.py
import os
from supabase import create_client, Client
import json 

# URL ve KEY bilgilerini buraya girdiğinden emin ol
SUPABASE_URL: str = "https://huyyknstzknrmdbafpwq.supabase.co"
SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eXlrbnN0emtucm1kYmFmcHdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzNjk5NiwiZXhwIjoyMDc2NzEyOTk2fQ.dIxKWLU3eKHYxP-_yEHwNa4isH8vrmlDw5T7XjYnNnY"

# --- Tablo İsimleri ---
TABLE_NAME = 'aday_profil'         # Kaynak tablo (Okuma + Durum Güncelleme)
ANALIZ_TABLE_NAME = 'analiz_sonuclari' # Hedef tablo (Sonuçları Yazma)

class SupabaseCvFetcher:
    """
    Supabase'deki 'aday_profil' tablosundan 'yetenekler' çeker ve
    analiz sonuçlarını 'analiz_sonuclari' tablosuna kaydeder.
    """
    def __init__(self):
        try:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("Supabase istemcisi başarıyla oluşturuldu.")
        except Exception as e:
            print(f"❌ Supabase istemcisi oluşturulurken hata: {e}")
            self.supabase = None

    def get_pending_skill_lists(self, limit=10):
        """
        'aday_profil' tablosundan durumu 'pending' olan kayıtları çeker.
        """
        if not self.supabase:
            print("⚠️ Supabase istemcisi başlatılamadığı için işlem yapılamıyor.")
            return []
        try:
            # 'aday_profil' tablosundan 'status'u 'pending' olanları seç
            response = self.supabase.table(TABLE_NAME) \
                                     .select('id, yetenekler') \
                                     .eq('status', 'pending') \
                                     .limit(limit) \
                                     .execute()
            
            if response.data:
                print(f"{len(response.data)} adet işlenmeyi bekleyen yetenek listesi bulundu.")

                results = []
                for record in response.data:
                    skills_raw = record.get('yetenekler') 
                    skills_list = []
                    
                    # Yetenekler metnini virgülle ayırıp listeye çevir
                    if skills_raw and isinstance(skills_raw, str):
                        skills_list = [skill.strip() for skill in skills_raw.split(',') if skill.strip()]

                    if skills_list: 
                       results.append({'id': record['id'], 'skills': skills_list})
                    else:
                        # Yetenek listesi boşsa, bunu bir hata olarak kaydet
                        print(f"   ⚠️ Girdi ID {record['id']} için 'yetenekler' sütunu boş veya geçersiz. Atlanıyor.")
                        self.save_results_and_update_status(record['id'], 'error', error_message="Yetenekler sütunu boş veya geçersiz formatta.")

                return results
            else:
                print("İşlenecek yeni yetenek listesi bulunamadı.")
                return []
        except Exception as e:
            # Bu hata genellikle 'status' sütunu olmadığında alınır
            print(f"❌ Supabase'den '{TABLE_NAME}' tablosundaki 'yetenekler' çekilirken hata: {e}")
            return []

    def save_results_and_update_status(self, input_id, new_status, detected_role=None, overall_score=None, core_score=None, report_text=None, error_message=None):
        """
        ÖNCE: Analiz sonuçlarını 'analiz_sonuclari' tablosuna YAZAR (INSERT).
        SONRA: 'aday_profil' tablosundaki durumu GÜNCELLER (UPDATE).
        """
        if not self.supabase:
            print(f"   -> (Girdi ID {input_id} güncellenemedi, Supabase istemcisi yok.)")
            return False
            
        report_content = None
        if error_message:
            report_content = f"HATA: {error_message}"
        elif report_text:
            report_content = report_text

        # ADIM 1: Sonuçları 'analiz_sonuclari' tablosuna ekle
        try:
            result_data = {
                'aday_id': input_id,  # 'aday_profil' tablosundaki ID'ye bağlanır
                'status': new_status,
                'detected_role': detected_role,
                'overall_score': overall_score,
                'core_score': core_score,
                'report_text': report_content
            }
            
            # None olan değerleri sözlükten temizle (Supabase'e null göndermek için)
            result_data = {k: v for k, v in result_data.items() if v is not None}

            insert_response = self.supabase.table(ANALIZ_TABLE_NAME) \
                                            .insert(result_data) \
                                            .execute()

            if not insert_response.data:
                print(f"   ❌ HATA: Sonuçlar '{ANALIZ_TABLE_NAME}' tablosuna EKLENEMEDİ (ID: {input_id}). Yanıt: {insert_response}")
                return False
            
            print(f"   -> Girdi ID {input_id} için sonuçlar '{ANALIZ_TABLE_NAME}' tablosuna eklendi.")

        except Exception as e:
            print(f"❌ '{ANALIZ_TABLE_NAME}' tablosuna yazılırken hata (ID: {input_id}): {e}")
            print("   Muhtemel Sebepler: 'analiz_sonuclari' tablosu veya sütun adları ('aday_id', 'overall_score' vb.) yanlış olabilir.")
            return False

        # ADIM 2: 'aday_profil' tablosundaki durumu güncelle (işin bittiğini işaretle)
        try:
            update_data = {'status': new_status} 

            update_response = self.supabase.table(TABLE_NAME) \
                                           .update(update_data) \
                                           .eq('id', input_id) \
                                           .execute()

            if update_response.data:
                print(f"   -> 'aday_profil' Girdi ID {input_id} durumu '{new_status}' olarak güncellendi.")
                return True
            else:
                print(f"   ⚠️ 'aday_profil' Girdi ID {input_id} durumu güncellenemedi. Yanıt: {update_response}")
                return False
        
        except Exception as e:
            print(f"❌ 'aday_profil' durumu güncellenirken hata (ID: {input_id}): {e}")
            return False

# --- Test bloğu ---
if __name__ == '__main__':
     print("Supabase tabanlı Yetkinlik Listesi Analiz süreci başlatılıyor...\n")
     fetcher = SupabaseCvFetcher()
     
     if fetcher.supabase:
         pending_lists = fetcher.get_pending_skill_lists(limit=1)
         
         if pending_lists:
             print("\nİlk bulunan yetkinlik listesi:")
             print(f"  ID: {pending_lists[0]['id']}")
             print(f"  Skills: {pending_lists[0]['skills']}")
             
             # --- SAHTE ANALİZ BÖLÜMÜ ---
             # Normalde burada 'skills' listesini alıp analiz yapan
             # başka bir Python modülünü çağırırsınız.
             # Biz şimdilik test için sahte sonuçlar üretiyoruz.
             
             print("\nSahte analiz sonucu yazma testi...")
             test_id = pending_lists[0]['id']
             
             # 'save_results_and_update_status' fonksiyonunu çağırıyoruz
             success = fetcher.save_results_and_update_status(
                 test_id, 
                 'completed',  # Yeni status 'completed' olacak
                 detected_role='Test Role (Sahte)', 
                 overall_score=99.5,
                 core_score=90.0,
                 report_text="Bu bir test raporudur. Analiz başarılı."
             )
             
             if success:
                 print("\nİşlem başarıyla tamamlandı.")
             else:
                 print("\nİşlem sırasında bir hata oluştu.")
         
         else:
             print("\nİşlem tamamlandı. Yeni yetkinlik listesi bulunamadı.")
     else:
        print("\nSupabase istemcisi başlatılamadığı için işlem durduruldu.")