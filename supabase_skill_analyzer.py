# supabase_skill_analyzer.py
import time
from roadmap_repository import RoadmapRepository
from comparison_engine import ComparisonEngine
from report_generator import ReportGenerator
# SkillExtractor'a artık burada ihtiyacımız yok, çünkü yetkinlikler hazır geliyor.
# from skill_extractor import SkillExtractor
from role_detector import RoleDetector
from supabase_cv_fetcher import SupabaseCvFetcher # <-- Supabase uzmanımız

# --- AYARLAR ---
DB_FILE = "roadmap_database.db"

def analyze_and_update_supabase(skill_record, repository, role_detector, engine, reporter, fetcher):
    """
    Tek bir yetkinlik listesi kaydını alır, analiz eder ve Supabase durumunu günceller.
    """
    input_id = skill_record.get('id')
    cv_skills = skill_record.get('skills') # Önceden ayrıştırılmış yetkinlik listesi

    if not input_id or not isinstance(cv_skills, list) or not cv_skills:
        print(f"   ⚠️ Geçersiz girdi kaydı ID: {input_id} (veya yetenek listesi boş). Atlanıyor.")
        if input_id: # ID varsa durumu error yap
             fetcher.save_results_and_update_status(input_id, 'error', error_message="Gecersiz yetenek listesi formati veya bos.")
        return

    print(f"--- Girdi ID {input_id} işleniyor... ---")
    
    # --- GÜNCELLEME ---
    # Başlangıçtaki 'processing' durum kaydını kaldırdık.
    # Artık 'analiz_sonuclari' tablosuna sadece tek bir (sonuç) kaydı atılacak.
    # fetcher.save_results_and_update_status(input_id, 'processing') 
    # --- GÜNCELLEME SONU ---

    try:
        # 1. Rolü otomatik olarak tespit et (Hazır yetkinlik listesiyle)
        detected_role = role_detector.detect_role(cv_skills)
        if not detected_role:
            print(f"   ❌ Girdi ID {input_id} için uygun bir rol bulunamadı.")
            fetcher.save_results_and_update_status(input_id, 'error', error_message="Uygun rol bulunamadı.")
            return

        print(f"   -> Tespit edilen rol: '{detected_role}'")

        # 2. Analiz sürecini yürüt
        roadmap_data = repository.get_skills_for_roadmap(detected_role)
        if not roadmap_data:
            print(f"   ❌ '{detected_role}' için yol haritası verisi bulunamadı.")
            fetcher.save_results_and_update_status(input_id, 'error', detected_role=detected_role, error_message=f"'{detected_role}' yol haritası bulunamadı.")
            return

        matched, missing, overall_score, core_score = engine.analyze_skills(cv_skills, roadmap_data)
        final_report = reporter.generate_report(detected_role, matched, missing, overall_score, core_score)

        # 3. Sonucu Supabase'e kaydet ve durumu 'completed' yap
        success = fetcher.save_results_and_update_status(input_id, 'completed',
                                                     detected_role=detected_role,
                                                     overall_score=overall_score,
                                                     core_score=core_score,
                                                     report_text=final_report)
        if success:
            print(f"   ✔️ Girdi ID {input_id} analizi tamamlandı ve Supabase güncellendi.\n")
        else:
             print(f"   ⚠️ Girdi ID {input_id} analizi tamamlandı ancak Supabase güncellenemedi.\n")

    except Exception as e:
        # Beklenmedik bir hata oluşursa durumu 'error' yap
        print(f"❌ Girdi ID {input_id} işlenirken beklenmedik hata: {e}")
        # Hata mesajını da kaydetmeyi deneyebiliriz
        fetcher.save_results_and_update_status(input_id, 'error', error_message=f"Analiz sırasında hata: {e}")

def main():
    """
    Supabase'den yetkinlik listelerini çeken ve analiz eden ana orkestra şefi.
    """
    print("Supabase tabanlı Yetkinlik Listesi Analiz süreci başlatılıyor...\n")
    start_time = time.time()

    # Gerekli uzmanları bir kere oluştur
    repository = RoadmapRepository(DB_FILE)
    role_detector = RoleDetector(DB_FILE) 
    engine = ComparisonEngine()
    reporter = ReportGenerator()
    fetcher = SupabaseCvFetcher() # <-- Supabase uzmanımız

    # Supabase'den işlenmeyi bekleyen yetkinlik listelerini çek
    # Önceki değişikliği geri alıyoruz (eğer yapmışsanız)
    # fetcher.py dosyasındaki .ilike('%pending%') yerine .eq('status', 'pending') 
    # daha sağlıklıdır, çünkü verimizin artık temiz olduğundan eminiz.
    pending_skill_lists = fetcher.get_pending_skill_lists(limit=50) # Tek seferde 50 kayıt çekelim

    if not pending_skill_lists:
        print("İşlem tamamlandı. Yeni yetkinlik listesi bulunamadı.")
        return

    # Her bir kayıt için analiz fonksiyonunu çalıştır
    processed_count = 0
    for skill_record in pending_skill_lists:
        analyze_and_update_supabase(skill_record, repository, role_detector, engine, reporter, fetcher)
        processed_count += 1

    end_time = time.time()
    print("\n--- Tüm Analizler Tamamlandı ---")
    print(f"Toplam {processed_count} yetkinlik listesi işlendi.")
    print(f"Toplam süre: {end_time - start_time:.2f} saniye")


if __name__ == "__main__":
    main()