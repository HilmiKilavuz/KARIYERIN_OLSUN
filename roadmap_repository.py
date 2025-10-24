# roadmap_repository.py
import sqlite3
from collections import defaultdict

class RoadmapRepository:
    """
    'roadmap_database.db' SQLite veritabanından rol haritası verilerini
    okumaktan (sorgulamaktan) sorumlu sınıf.
    """
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = None
        self._connect()

    def _connect(self):
        """Veritabanı bağlantısını kurar."""
        try:
            # check_same_thread=False, çoklu thread'lerde (gelecekte gerekirse) sorun çıkmasını engeller
            self.conn = sqlite3.connect(self.db_file, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row # Sonuçlara sütun isimleriyle erişim sağlar
            print(f"'{self.db_file}' veritabanına başarıyla bağlanıldı (Repository).")
        except sqlite3.Error as e:
            print(f"Veritabanı bağlantı hatası (Repository): {e}")
            raise

    def get_skills_for_roadmap(self, roadmap_name: str):
        """
        Belirli bir rol (roadmap) için tüm bölümleri ve yetkinlikleri
        ComparisonEngine'in anlayacağı formatta (sözlük) döndürür.
        """
        if not self.conn:
            print("Hata: Veritabanı bağlantısı yok.")
            return {}

        # 'roadmaps', 'sections', 'skills', 'skill_aliases' tablolarını birleştir
        query = """
        SELECT 
            s.name AS section_name,
            sk.name AS skill_name,
            sk.is_core,
            sk.weight,
            GROUP_CONCAT(sa.alias) AS aliases
        FROM roadmaps r
        JOIN sections s ON r.id = s.roadmap_id
        JOIN skills sk ON s.id = sk.section_id
        LEFT JOIN skill_aliases sa ON sk.id = sa.skill_id
        WHERE r.name = ?
        GROUP BY s.name, sk.name, sk.is_core, sk.weight, s.display_order
        ORDER BY s.display_order, sk.name;
        """
        
        try:
            cursor = self.conn.cursor()
            cursor.execute(query, (roadmap_name,))
            
            # Veriyi defaultdict kullanarak bölümlere göre grupla
            roadmap_data = defaultdict(list)
            
            for row in cursor.fetchall():
                skill_obj = {
                    'name': row['skill_name'],
                    'is_core': bool(row['is_core']), # 0/1'i True/False'a çevir
                    'weight': row['weight'],
                    # 'aliases' null değilse listeye çevir, null ise boş liste yap
                    'aliases': row['aliases'].split(',') if row['aliases'] else []
                }
                roadmap_data[row['section_name']].append(skill_obj)
                
            return dict(roadmap_data) # defaultdict'u normal dict'e çevir

        except Exception as e:
            print(f"Yol haritasına göre yetkinlikleri çekerken hata: {e}")
            return {}

    # --- YENİ EKLENEN FONKSİYON ---
    def get_all_role_names(self):
        """
        'roadmaps' tablosundaki tüm rol isimlerinin bir listesini döndürür.
        Bu, RoleDetector tarafından kullanılır.
        """
        if not self.conn:
            print("Hata: Veritabanı bağlantısı yok.")
            return []
            
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT name FROM roadmaps")
            # Sonucu [( 'Backend',), ('Frontend',)] yerine ['Backend', 'Frontend'] listesine çevir
            roles = [row['name'] for row in cursor.fetchall()]
            return roles
        except Exception as e:
            print(f"Tüm rol isimlerini çekerken hata: {e}")
            return []

    def close(self):
        """Veritabanı bağlantısını kapatır."""
        if self.conn:
            self.conn.close()
            print("Veritabanı bağlantısı kapatıldı (Repository).")

# --- Test bloğu ---
if __name__ == '__main__':
    # Bu dosyayı tek başına çalıştırarak test edebilirsiniz
    # roadmap_database.db dosyanızın aynı klasörde olduğundan emin olun
    try:
        repo = RoadmapRepository("roadmap_database.db")
        
        print("\n--- Tüm Rol İsimleri Testi ---")
        all_roles = repo.get_all_role_names()
        print(f"Veritabanında bulunan roller: {all_roles}")
        
        if all_roles:
            print(f"\n--- İlk Rolün Veri Çekme Testi ('{all_roles[0]}') ---")
            skills_data = repo.get_skills_for_roadmap(all_roles[0])
            if skills_data:
                print(f"'{all_roles[0]}' rolü için {len(skills_data)} bölüm bulundu.")
                # İlk bölümün yeteneklerini yazdır
                first_section = list(skills_data.keys())[0]
                print(f"İlk bölüm '{first_section}' ve yetenekleri:")
                for skill in skills_data[first_section][:3]: # İlk 3 yeteneği göster
                    print(f"  - {skill['name']} (Core: {skill['is_core']}, Weight: {skill['weight']})")
            else:
                print(f"'{all_roles[0]}' rolü için veri bulunamadı.")
        
        repo.close()
        
    except Exception as e:
        print(f"Repository testi sırasında hata: {e}")