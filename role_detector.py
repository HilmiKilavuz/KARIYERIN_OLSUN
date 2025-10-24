# role_detector.py
from roadmap_repository import RoadmapRepository
from comparison_engine import ComparisonEngine

# Tespit için bir minimum puan eşiği belirleyelim.
# Bir rol, adayın yetenekleriyle %20'den az eşleşiyorsa,
# o rolü "uygun" saymayız.
MINIMUM_SCORE_THRESHOLD = 00.0 

class RoleDetector:
    """
    ComparisonEngine ve RoadmapRepository kullanarak, bir yetenek listesi için
    en uygun rolü puanlama yaparak tespit eder.
    """
    def __init__(self, repository: RoadmapRepository, engine: ComparisonEngine):
        """
        Gerekli uzmanları dışarıdan alır (Dependency Injection).
        """
        self.repository = repository
        self.engine = engine
        print("Akıllı RoleDetector başlatıldı (Puanlama motoru kullanılıyor).")

    def detect_role(self, cv_skills: list):
        """
        Verilen yetenek listesini, veritabanındaki TÜM rollerle karşılaştırır
        ve en yüksek puanı alan rolü döndürür.
        """
        if not cv_skills:
            return None

        # 1. Veritabanındaki tüm mevcut rol isimlerini al
        all_roles = self.repository.get_all_role_names()
        if not all_roles:
            print("❌ RoleDetector: Veritabanında hiç rol haritası bulunamadı.")
            return None

        role_scores = []

        # 2. Her bir rol için adayın puanını hesapla
        for role_name in all_roles:
            roadmap_data = self.repository.get_skills_for_roadmap(role_name)
            if not roadmap_data:
                continue # Bu rol için yol haritası yoksa atla

            # 3. Puanlama motorunu (ComparisonEngine) kullan
            matched, missing, overall_score, core_score = self.engine.analyze_skills(cv_skills, roadmap_data)
            
            # Puanlamada Genel Puanı (overall_score) baz alıyoruz
            role_scores.append({'role': role_name, 'score': overall_score})

        if not role_scores:
            print("❌ RoleDetector: Hiçbir rol için puanlama yapılamadı.")
            return None

        # 4. En yüksek puanı alan rolü bul
        best_match = max(role_scores, key=lambda x: x['score'])

        # 5. Minimum eşiği kontrol et
        if best_match['score'] < MINIMUM_SCORE_THRESHOLD:
            print(f"   ℹ️ RoleDetector: En yakın rol '{best_match['role']}' bulundu (%{best_match['score']:.1f}) ancak minimum eşiğin (%{MINIMUM_SCORE_THRESHOLD}) altında kaldı.")
            return None

        # En iyi ve eşiği geçen rolü döndür
        return best_match['role']