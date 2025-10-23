# skill_extractor.py
import spacy
from spacy.matcher import PhraseMatcher
from roadmap_repository import RoadmapRepository

class SkillExtractor:
    """
    Ham metinden yetkinlikleri akıllıca çıkarmaktan sorumlu sınıf.
    Tek Sorumluluğu: NLP kullanarak metinden yetkinlik listesi üretmek.
    """
    def __init__(self, db_file):
        # spaCy'nin İngilizce modelini yükle
        self.nlp = spacy.load("en_core_web_sm")
        
        # Veritabanından tüm yetkinlikleri çekmek için repository'i kullan
        repository = RoadmapRepository(db_file)
        # Tüm yol haritalarındaki tüm yetkinlikleri tek bir listede topla
        all_skills_dict = repository.get_all_skills_and_aliases()
        
        self.all_skills = list(all_skills_dict.keys())
        
        # PhraseMatcher'ı hazırla
        self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        patterns = [self.nlp.make_doc(skill) for skill in self.all_skills]
        self.matcher.add("SKILL_MATCHER", patterns)

    def extract_skills_from_text(self, text):
        """
        Verilen metni işler ve içinde geçen yetkinlikleri bir liste olarak döndürür.
        """
        doc = self.nlp(text)
        matches = self.matcher(doc)
        
        found_skills = set() # Tekrarları önlemek için set kullan
        for match_id, start, end in matches:
            span = doc[start:end]
            found_skills.add(span.text)
            
        return list(found_skills)

# --- Sınıfı Test Etmek İçin ---
if __name__ == '__main__':
    # Önemli Not: Bu testin çalışması için RoadmapRepository sınıfında küçük bir ekleme yapacağız.
    # Şimdilik bu kısmı geçici olarak yorum satırı yapabilir veya bir sonraki adımı bekleyebilirsiniz.
    # Bu testin amacı, SkillExtractor'ın mantığını göstermektir.
    
    # Simüle edilmiş yetkinlik listesi (veritabanı yerine)
    simulated_skills = [
        "Python", "JavaScript", "React", "React.js", "Node.js", "Docker",
        "Kubernetes", "Amazon Web Services", "AWS", "Large Language Model", "Fine-Tuning"
    ]

    # spaCy modelini yükle
    nlp_test = spacy.load("en_core_web_sm")
    matcher_test = PhraseMatcher(nlp_test.vocab, attr="LOWER")
    patterns_test = [nlp_test.make_doc(skill) for skill in simulated_skills]
    matcher_test.add("SKILL_MATCHER", patterns_test)
    
    sample_cv_text = """
    Seasoned AI Engineer with experience in Python and JavaScript.
    Developed applications using React.js and Node.js.
    Expert in containerization with Docker and orchestration with Kubernetes (K8s).
    Deployed solutions on Amazon Web Services (AWS).
    Specialized in Large Language Model Fine-Tuning.
    """
    
    doc_test = nlp_test(sample_cv_text)
    matches_test = matcher_test(doc_test)
    
    found_skills_test = set()
    for match_id, start, end in matches_test:
        span = doc_test[start:end]
        found_skills_test.add(span.text)
    
    print("--- Akıllı Yetkinlik Çıkarma Testi ---")
    print("Bulunan Yetkinlikler:")
    for skill in found_skills_test:
        print(f"- {skill}")