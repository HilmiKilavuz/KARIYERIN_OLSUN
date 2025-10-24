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
        Bu fonksiyon artık 'yetenekler' sütununun hem 'text' (virgülle ayrılmış)
        hem de 'jsonb' (kategorize edilmiş sözlük) olmasını destekler
        ve BAŞTAKİ/SONDAKİ TIRNAK İŞARETLERİNİ TEMİZLER.
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
                    skills_raw = record.get('yetenekler') # Bu artık 'text' veya 'dict' olabilir
                    skills_list = []

                    # --- GÜNCELLENEN TIRNAK TEMİZLEME BÖLÜMÜ ---

                    if isinstance(skills_raw, dict):
                        # YENİ YÖNTEM: Veri JSON/Sözlük ise
                        print(f"   -> Girdi ID {record['id']} için JSON formatında yetenekler bulundu. Düzleştiriliyor...")
                        for category_key, skills_in_category in skills_raw.items():
                            if isinstance(skills_in_category, list):
                                # Listeye eklemeden önce string yap, boşlukları ve tırnakları temizle
                                skills_list.extend([
                                    str(skill).strip().strip('"').strip() # Boşluk -> Tırnak -> Boşluk temizle
                                    for skill in skills_in_category if str(skill).strip()
                                ])
                            elif isinstance(skills_in_category, str): # Bazen JSON içinde tek yetenek string olabilir
                                cleaned_skill = skills_in_category.strip().strip('"').strip() # Boşluk -> Tırnak -> Boşluk temizle
                                if cleaned_skill: skills_list.append(cleaned_skill)

                    elif isinstance(skills_raw, str):
                        # ESKİ YÖNTEM: Veri metin ise (virgülle ayrılmış)
                        # Metni virgülle ayır, her parçanın boşluğunu VE TIRNAKLARINI temizle
                        skills_list = [
                            skill.strip().strip('"').strip() # Boşluk -> Tırnak -> Boşluk temizle
                            for skill in skills_raw.split(',') if skill.strip()
                        ]

                    # --- GÜNCELLEME SONU ---

                    if skills_list:
                       # Hata ayıklama mesajı
                       print(f"   DEBUG (Fetcher): ID {record['id']} için oluşturulan Yetenek Listesi: {skills_list}") # DEBUG
                       results.append({'id': record['id'], 'skills': skills_list})
                    else:
                        print(f"   ⚠️ Girdi ID {record['id']} için 'yetenekler' sütunu boş veya geçersiz formatta. Atlanıyor.")
                        # Hatalı/Boş kayıt için sonuçları kaydet ve durumu güncelle
                        self.save_results_and_update_status(record['id'], 'error', error_message="Yetenekler sütunu boş veya geçersiz formatta.")

                return results
            else:
                print("İşlenecek yeni yetenek listesi bulunamadı.")
                return []
        except Exception as e:
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
                'aday_id': input_id,
                'status': new_status,
                'detected_role': detected_role,
                'overall_score': overall_score,
                'core_score': core_score,
                'report_text': report_content
            }

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

        # ADIM 2: 'aday_profil' tablosundaki durumu güncelle
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
             # DEBUG mesajı zaten yukarıda olduğu için burası biraz gereksiz ama kalsın
             print(f"  Skills (Cleaned List): {pending_lists[0]['skills']}")

             # Test amaçlı sahte bir sonuç yazmayı deneyelim:
             print("\nSahte analiz sonucu yazma testi...")
             test_id = pending_lists[0]['id']
             success = fetcher.save_results_and_update_status(
                 test_id,
                 'completed',
                 detected_role='Test Role',
                 overall_score=99.5,
                 core_score=90.0,
                 report_text="Bu bir test raporudur."
             )
             if success: print("\nTest yazma başarılı.")
             else: print("\nTest yazma BAŞARISIZ.")

         else:
             print("\nİşlem tamamlandı. Test için yeni yetkinlik listesi bulunamadı.")
     else:
        print("\nSupabase istemcisi başlatılamadığı için test durduruldu.")