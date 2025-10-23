# role_detector.py
from roadmap_repository import RoadmapRepository
from skill_extractor import SkillExtractor
from collections import defaultdict

class RoleDetector:
    """
    Bir CV'den ÖNCEDEN çıkarılmış yetkinlik listesine göre, AĞIRLIKLI puanlama
    kullanarak en olası rolü tespit eder.
    """
    def __init__(self, db_file):
        repository = RoadmapRepository(db_file)
        self.skill_extractor = SkillExtractor(db_file)
        # Veritabanından, her role ait yetkinlikleri ve AĞIRLIKLARINI al
        # Veri yapısı: {'RoleName': {'skill_lower': weight, 'alias_lower': weight, ...}}
        self.skills_by_roadmap = repository.get_all_skills_by_roadmap()

    def detect_role(self, cv_skills):
        """
        Verilen yetkinlik listesini analiz eder ve en yüksek AĞIRLIKLI puanı
        alan rolü döndürür.
        """
        if not self.skills_by_roadmap:
            return None

        # 1. Gelen yetkinlik listesini küçük harfe çevir ve set yap
        cv_skills_set = {skill.lower() for skill in cv_skills}

        scores = defaultdict(int) # Puanları toplamak için defaultdict kullanalım
        # 2. Her bir yol haritası için ağırlıklı puanlama yap
        for roadmap, roadmap_skills_weights in self.skills_by_roadmap.items():
            current_roadmap_score = 0
            # CV'deki her yetkinliği kontrol et
            for cv_skill in cv_skills_set:
                # Eğer bu yetkinlik, mevcut yol haritasının yetkinlik/ağırlık sözlüğünde varsa
                if cv_skill in roadmap_skills_weights:
                    # O yetkinliğin ağırlığını toplam puana ekle
                    current_roadmap_score += roadmap_skills_weights[cv_skill]

            scores[roadmap] = current_roadmap_score

        # 3. En yüksek puanı alan rolü bul ve döndür
        if not scores:
            return None

        # Puanı en yüksek olanı bul (eğer puanlar eşitse ilk bulunanı alır)
        best_match_role = max(scores, key=scores.get)

        # Eğer en yüksek puan 0 ise, hiçbir anlamlı eşleşme bulunamamıştır
        if scores[best_match_role] == 0:
            return None

        return best_match_role

# --- Bu sınıfı test etmek için basit bir kod ---
if __name__ == '__main__':
    DB_FILE = "roadmap_database.db"
    # Örnek CV Yetkinlikleri (Jude Hall'dan alınmış gibi)
    sample_cv_skills_test = [
        'Python', 'Kubernetes', 'TensorFlow', 'PyTorch', 'Deep Learning',
        'Machine Learning', 'AWS', 'Fine-Tuning', 'Azure AI'
    ]

    print("--- Ağırlıklı Rol Tespiti Testi ---")
    detector = RoleDetector(DB_FILE)
    detected_role_test = detector.detect_role(sample_cv_skills_test)

    if detected_role_test:
        print(f"Test CV'si için tespit edilen en olası rol: {detected_role_test}")
    else:
        print("Test CV'si için uygun bir rol bulunamadı.")