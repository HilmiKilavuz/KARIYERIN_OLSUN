# main.py
from database_manager import DatabaseManager
from roadmap_parser import RoadmapParser

# --- AYARLAR ---
DB_FILE = "roadmap_database.db"
ROADMAPS_FOLDER = "roadmaps"

def main():
    """Orkestra şefi: İş akışını yönetir."""
    print("Veritabanı doldurma işlemi başlatılıyor...")

    # 1. Adım: Roadmap verilerini JSON dosyalarından oku.
    parser = RoadmapParser(ROADMAPS_FOLDER)
    roadmaps_data = parser.load_all_roadmaps()

    if not roadmaps_data:
        print("İşlenecek veri bulunamadı. İşlem sonlandırılıyor.")
        return

    # 2. Adım: Veritabanını yönet ve okunan veriyi ekle.
    db_manager = DatabaseManager(DB_FILE)
    try:
        db_manager.connect()
        db_manager.populate_database(roadmaps_data)
    except Exception as e:
        print(f"Ana işlem sırasında bir hata oluştu: {e}")
    finally:
        db_manager.close()

    print("\nİşlem tamamlandı.")

if __name__ == "__main__":
    main()