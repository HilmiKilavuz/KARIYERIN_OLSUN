# roadmap_repository.py
import sqlite3
from collections import defaultdict

class RoadmapRepository:
    """
    Veritabanından yol haritası verilerini çekmekten sorumlu sınıf.
    Tek Sorumluluğu: Veritabanı okuma işlemleri.
    """
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = None

    def _connect(self):
        """Veritabanı bağlantısını kurar."""
        try:
            self.conn = sqlite3.connect(self.db_file)
            self.conn.row_factory = sqlite3.Row
        except sqlite3.Error as e:
            print(f"Veritabanı bağlantı hatası: {e}")
            raise

    def _close(self):
        """Veritabanı bağlantısını kapatır."""
        if self.conn:
            self.conn.close()

    def get_skills_for_roadmap(self, roadmap_name):
        """
        Belirtilen bir yol haritası için tüm yetkinlikleri ve takma adlarını,
        bölümlere göre gruplanmış zengin bir veri yapısı olarak döndürür.
        """
        # ... (Bu metodun içeriği aynı kalıyor, değişiklik yok) ...
        self._connect()
        cursor = self.conn.cursor()
        query = """
        SELECT
            sec.name as section_name,
            s.name as skill_name,
            s.is_core,
            sa.alias as alias_name
        FROM roadmaps r
        JOIN sections sec ON r.id = sec.roadmap_id
        JOIN skills s ON sec.id = s.section_id
        LEFT JOIN skill_aliases sa ON s.id = sa.skill_id
        WHERE r.name = ?
        ORDER BY sec.display_order;
        """
        try:
            cursor.execute(query, (roadmap_name,))
            rows = cursor.fetchall()
            if not rows:
                print(f"UYARI: '{roadmap_name}' adında bir yol haritası bulunamadı.")
                return None
            grouped_skills = defaultdict(dict)
            for row in rows:
                section, skill, alias = row['section_name'], row['skill_name'], row['alias_name']
                is_core = bool(row['is_core'])
                if skill not in grouped_skills[section]:
                    grouped_skills[section][skill] = {'name': skill, 'is_core': is_core, 'aliases': []}
                if alias:
                    grouped_skills[section][skill]['aliases'].append(alias)
            final_structure = defaultdict(list)
            for section, skills_dict in grouped_skills.items():
                final_structure[section] = list(skills_dict.values())
            return dict(final_structure)
        except sqlite3.Error as e:
            print(f"Veri çekme hatası: {e}")
            return None
        finally:
            self._close()

    def get_all_skills_and_aliases(self):
        """
        Veritabanındaki TÜM yetkinlikleri ve takma adlarını tek bir sözlükte toplar.
        """
        # ... (Bu metodun içeriği aynı kalıyor, değişiklik yok) ...
        self._connect()
        cursor = self.conn.cursor()
        query = "SELECT name FROM skills UNION SELECT alias FROM skill_aliases;"
        try:
            cursor.execute(query)
            return {row['name']: True for row in cursor.fetchall()}
        except sqlite3.Error as e:
            print(f"Tüm yetkinlikleri çekme hatası: {e}")
            return {}
        finally:
            self._close()

    def get_all_roadmap_names(self):
        """Veritabanındaki tüm yol haritası isimlerini bir liste olarak döndürür."""
        # ... (Bu metodun içeriği aynı kalıyor, değişiklik yok) ...
        self._connect()
        cursor = self.conn.cursor()
        query = "SELECT name FROM roadmaps ORDER BY name;"
        try:
            cursor.execute(query)
            return [row['name'] for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"Yol haritası isimleri çekilirken hata oluştu: {e}")
            return []
        finally:
            self._close()

    # --- YENİ GÜNCELLENMİŞ METOT ---
    def get_all_skills_by_roadmap(self):
        """
        Tüm yol haritalarını ve onlara ait tüm yetkinlikleri/takma adları
        ve AĞIRLIKLARINI gruplanmış bir sözlük olarak döndürür. RoleDetector için kullanılır.
        """
        self._connect()
        cursor = self.conn.cursor()

        # SQL Sorgusu güncellendi: Artık 'weight' sütununu da çekiyoruz.
        # Varsayılan ağırlık 1 olarak ayarlandı (eğer JSON'da belirtilmemişse).
        query = """
        SELECT
            r.name as roadmap_name,
            s.name as skill_name,
            sa.alias as alias_name,
            COALESCE(s.weight, 1) as weight  -- weight sütununu çek, yoksa 1 kabul et
        FROM roadmaps r
        JOIN sections sec ON r.id = sec.roadmap_id
        JOIN skills s ON sec.id = s.section_id
        LEFT JOIN skill_aliases sa ON s.id = sa.skill_id;
        """

        try:
            cursor.execute(query)
            rows = cursor.fetchall()

            # Veri yapısı güncellendi: Artık sadece set değil,
            # yetkinlik ismini anahtar, ağırlığını değer olarak tutan bir sözlük.
            skills_by_roadmap = defaultdict(dict)
            for row in rows:
                roadmap = row['roadmap_name']
                skill_lower = row['skill_name'].lower()
                weight = row['weight']

                # Yetkinliğin ana ismini ve ağırlığını kaydet (eğer daha yüksek ağırlık varsa güncelle)
                if skill_lower not in skills_by_roadmap[roadmap] or weight > skills_by_roadmap[roadmap][skill_lower]:
                   skills_by_roadmap[roadmap][skill_lower] = weight

                # Takma adları da aynı ağırlıkla kaydet
                if row['alias_name']:
                    alias_lower = row['alias_name'].lower()
                    if alias_lower not in skills_by_roadmap[roadmap] or weight > skills_by_roadmap[roadmap][alias_lower]:
                        skills_by_roadmap[roadmap][alias_lower] = weight

            # defaultdict'ları normal dict'e çevirerek döndür
            return {roadmap: dict(skills) for roadmap, skills in skills_by_roadmap.items()}

        except sqlite3.Error as e:
            print(f"Yol haritasına göre ağırlıklı yetkinlikleri çekerken hata: {e}")
            return {}
        finally:
            self._close()


# --- Test bloğunu da güncelleyelim ---
if __name__ == '__main__':
    DB_FILE = "roadmap_database.db"
    repository = RoadmapRepository(DB_FILE)

    print("--- Ağırlıklı Yetkinlikler Testi (AI Engineer Örneği) ---")
    all_weighted_skills = repository.get_all_skills_by_roadmap()
    if all_weighted_skills and "AI Engineer" in all_weighted_skills:
        ai_skills = all_weighted_skills["AI Engineer"]
        print(f"'AI Engineer' için toplam {len(ai_skills)} ağırlıklı yetkinlik/takma ad bulundu.")
        print("Örnekler:")
        # Ağırlığı 3 olan birkaç örnek gösterelim
        critical_examples = {k: v for k, v in ai_skills.items() if v == 3}
        print(f"  Ağırlık 3 (Kritik): {list(critical_examples.keys())[:5]}")
        # Ağırlığı 1 olan birkaç örnek gösterelim
        other_examples = {k: v for k, v in ai_skills.items() if v == 1}
        print(f"  Ağırlık 1 (Destekleyici): {list(other_examples.keys())[:5]}")