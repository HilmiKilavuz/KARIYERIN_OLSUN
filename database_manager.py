# database_manager.py
import sqlite3

class DatabaseManager:
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = None

    def connect(self):
        """Veritabanı bağlantısını kurar."""
        try:
            self.conn = sqlite3.connect(self.db_file)
            print(f"'{self.db_file}' veritabanına başarıyla bağlanıldı.")
        except sqlite3.Error as e:
            print(f"Veritabanı bağlantı hatası: {e}")
            raise

    def close(self):
        """Veritabanı bağlantısını kapatır."""
        if self.conn:
            self.conn.close()
            print("Veritabanı bağlantısı kapatıldı.")

    def _create_tables(self):
        """Tüm tabloları siler ve yeni şema ile yeniden oluşturur."""
        cursor = self.conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS skill_aliases")
        cursor.execute("DROP TABLE IF EXISTS skills")
        cursor.execute("DROP TABLE IF EXISTS sections")
        cursor.execute("DROP TABLE IF EXISTS roadmaps")
        
        cursor.execute('''
            CREATE TABLE roadmaps (id INTEGER PRIMARY KEY, name TEXT UNIQUE, description TEXT);
        ''')
        cursor.execute('''
            CREATE TABLE sections (id INTEGER PRIMARY KEY, roadmap_id INTEGER, name TEXT, display_order INTEGER,
            FOREIGN KEY(roadmap_id) REFERENCES roadmaps(id));
        ''')
        # --- skills TABLOSU GÜNCELLENDİ ---
        cursor.execute('''
            CREATE TABLE skills (
                id INTEGER PRIMARY KEY,
                section_id INTEGER,
                name TEXT,
                type TEXT,
                level TEXT,
                is_core BOOLEAN DEFAULT FALSE, -- is_core alanı eklendi (varsayılan FALSE)
                weight INTEGER DEFAULT 1,      -- weight alanı eklendi (varsayılan 1)
                FOREIGN KEY(section_id) REFERENCES sections(id)
            );
        ''')
        cursor.execute('''
            CREATE TABLE skill_aliases (id INTEGER PRIMARY KEY, skill_id INTEGER, alias TEXT UNIQUE,
            FOREIGN KEY(skill_id) REFERENCES skills(id));
        ''')
        print("Tablolar başarıyla (yeniden) oluşturuldu (weight ve is_core sütunları eklendi).")

    def populate_database(self, roadmaps_data):
        """Gelen veriyi kullanarak veritabanını doldurur (weight ve is_core dahil)."""
        try:
            self._create_tables()
            cursor = self.conn.cursor()
            for roadmap_data in roadmaps_data:
                roadmap_name = roadmap_data.get('roadmap_name', 'İsimsiz')
                roadmap_desc = roadmap_data.get('roadmap_description', '')
                cursor.execute("INSERT INTO roadmaps (name, description) VALUES (?, ?)", (roadmap_name, roadmap_desc))
                roadmap_id = cursor.lastrowid
                
                for section in roadmap_data.get("sections", []):
                    cursor.execute("INSERT INTO sections (roadmap_id, name, display_order) VALUES (?, ?, ?)",
                                   (roadmap_id, section['section_name'], section['display_order']))
                    section_id = cursor.lastrowid
                    for skill in section.get("skills", []):
                        # --- VERİ YÜKLEME GÜNCELLENDİ ---
                        # JSON'dan is_core ve weight değerlerini al (yoksa varsayılan kullan)
                        is_core_val = skill.get('is_core', False)
                        weight_val = skill.get('weight', 1)
                        
                        cursor.execute("""
                            INSERT INTO skills (section_id, name, type, level, is_core, weight) 
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (section_id, skill['name'], skill['type'], skill.get('level', 'junior'),
                             is_core_val, weight_val))
                        skill_id = cursor.lastrowid
                        
                        for alias in skill.get("aliases", []):
                            cursor.execute("INSERT OR IGNORE INTO skill_aliases (skill_id, alias) VALUES (?, ?)", (skill_id, alias))
            
            self.conn.commit()
            print(f"{len(roadmaps_data)} adet yol haritası veritabanına başarıyla eklendi (weight/is_core ile).")
        except sqlite3.Error as e:
            print(f"Veritabanı doldurma hatası: {e}")
            self.conn.rollback()
            raise