# master_analyzer.py
from roadmap_repository import RoadmapRepository
from comparison_engine import ComparisonEngine
from report_generator import ReportGenerator
from skill_extractor import SkillExtractor
from role_detector import RoleDetector # <-- Yeni uzmanımızı dahil ediyoruz

# --- AYARLAR ---
DB_FILE = "roadmap_database.db"

# --- GİRDİ ---
# Herhangi bir yerden (web arayüzü, API, başka bir sistem) geldiğini varsaydığımız ham CV metni
# Test etmek için bu metni değiştirebilirsiniz.
raw_cv_text = """
Michael Chen - Senior Software Architect

Expert in designing and implementing scalable, high-availability microservices architectures for enterprise-level cloud solutions. Proven ability to lead cross-functional teams in adopting modern software design patterns and DevOps principles.

AREAS OF EXPERTISE:
- System Design & Architecture: Microservices, Domain-Driven Design (DDD), Service-Oriented Architecture (SOA)
- Cloud Platforms: Amazon Web Services (AWS), Microsoft Azure, Google Cloud (GCP)
- Containerization & Orchestration: Docker, Kubernetes (K8s)
- Infrastructure as Code (IaC): Terraform, Ansible
- Programming Languages: Java, Python, Go
- Databases: PostgreSQL, MongoDB, Redis
- API Design: REST, gRPC
"""

def analyze_fully_automated(cv_text):
    """
    Verilen ham metni alıp, rolü otomatik tespit edip tam analiz yapan fonksiyon.
    """
    # ADIM 1: Rolü otomatik olarak tespit et.
    print("--- Adım 1: Rol Tespiti Başlatılıyor ---")
    role_detector = RoleDetector(DB_FILE)
    detected_role = role_detector.detect_role(cv_text)

    if not detected_role:
        print("❌ CV metnine uygun bir rol bulunamadı. Analiz sonlandırılıyor.")
        return
    
    print(f"✔️ En Olası Rol Tespit Edildi: {detected_role}\n")
    
    # ADIM 2: Gerekli uzmanları ve verileri hazırla
    skill_extractor = SkillExtractor(DB_FILE)
    repository = RoadmapRepository(DB_FILE)
    engine = ComparisonEngine()
    reporter = ReportGenerator()
    
    # ADIM 3: Analiz sürecini yürüt (bildiğimiz adımlar)
    cv_skills = skill_extractor.extract_skills_from_text(cv_text)
    roadmap_data = repository.get_skills_for_roadmap(detected_role)
    matched, missing = engine.analyze_skills(cv_skills, roadmap_data)
    final_report = reporter.generate_report(detected_role, matched, missing)
    
    # ADIM 4: Nihai raporu yazdır
    print(final_report)


if __name__ == "__main__":
    analyze_fully_automated(raw_cv_text)