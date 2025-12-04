import functions_framework
from supabase_cv_fetcher import SupabaseCvFetcher
# Aşağıdaki sınıfların proje klasöründe olduğunu görselden teyit ettim:
try:
    from roadmap_repository import RoadmapRepository
    from comparison_engine import ComparisonEngine
    from report_generator import ReportGenerator
    from role_detector import RoleDetector
except ImportError as e:
    print(f"Kritik Hata: Modüller yüklenemedi! {e}")

DB_FILE = "roadmap_database.db"

@functions_framework.http
def run_cv_analysis(request):
    """
    Bu fonksiyon, senin mevcut sistemini Google Cloud üzerinde çalıştırır.
    Mevcut kodlarına dokunmaz, onları sadece çağırır.
    """
    print("--- Cloud Analiz Başlatıldı ---")

    # 1. Senin Supabase Fetcher sınıfını kullanıyoruz
    fetcher = SupabaseCvFetcher()
    if not fetcher.supabase:
        return "Supabase bağlantısı kurulamadı (.env kontrolü yapın).", 500

    # 2. Bekleyen işleri al
    pending_list = fetcher.get_pending_skill_lists()
    if not pending_list:
        return "İşlenecek yeni veri yok.", 200

    print(f"{len(pending_list)} adet kayıt işlenecek.")

    # 3. Senin analiz sınıflarını hazırlıyoruz
    try:
        repository = RoadmapRepository(DB_FILE)
        engine = ComparisonEngine()
        reporter = ReportGenerator()
        role_detector = RoleDetector(DB_FILE)
    except Exception as e:
        return f"Sınıflar başlatılamadı: {e}", 500

    processed_count = 0

    # 4. Analiz Döngüsü (Senin mantığın)
    for item in pending_list:
        try:
            input_id = item['id']
            cv_skills = item['skills']
            
            # A) Rolü Bul
            detected_role = role_detector.detect_role(cv_skills)
            if not detected_role:
                print(f"ID {input_id}: Rol bulunamadı.")
                fetcher.save_results_and_update_status(input_id, 'error', error_message="Rol tespit edilemedi")
                continue

            # B) Roadmap Verisini Çek
            roadmap_data = repository.get_skills_for_roadmap(detected_role)

            # C) Puanla
            matched, missing, overall_score, core_score = engine.analyze_skills(cv_skills, roadmap_data)

            # D) Rapor Yaz
            report_text = reporter.generate_report(detected_role, matched, missing, overall_score, core_score)

            # E) Kaydet
            success = fetcher.save_results_and_update_status(
                input_id, 'completed', detected_role, overall_score, core_score, report_text
            )
            
            if success: processed_count += 1

        except Exception as e:
            print(f"Hata (ID {item['id']}): {e}")
            fetcher.save_results_and_update_status(item['id'], 'error', error_message=str(e))

    return f"İşlem tamam. {processed_count} adet analiz yapıldı.", 200