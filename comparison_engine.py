# comparison_engine.py
from collections import defaultdict

class ComparisonEngine:
    """
    Bir yetkinlik listesini, bir yol haritası ile karşılaştırır ve
    uygunluk puanlarını hesaplar.
    """
    def analyze_skills(self, cv_skills, roadmap_data):
        """
        CV'den gelen yetkinlikleri, yol haritasındaki yetkinliklerle karşılaştırır.
        Sonuçları ve iki farklı uygunluk puanını döndürür.
        """
        if not roadmap_data:
            # Eğer yol haritası verisi yoksa, boş sonuçlar ve 0 puan döndür
            return {}, {}, 0.0, 0.0

        cv_skills_set = {skill.lower() for skill in cv_skills}

        matched_skills = defaultdict(list)
        missing_skills = defaultdict(list)

        total_roadmap_weight = 0
        total_core_skills_in_roadmap = 0
        matched_weight_sum = 0
        matched_core_skills_count = 0

        # Yol haritasındaki her bölüm ve yetkinlik için döngüye gir
        for section, skills_in_section in roadmap_data.items():
            for skill_obj in skills_in_section:
                is_found = False
                skill_weight = skill_obj.get('weight', 1) # Ağırlığı al (yoksa 1)
                is_core = skill_obj.get('is_core', False) # Kritik mi?

                # Toplam ağırlığı ve kritik yetkinlik sayısını hesapla
                total_roadmap_weight += skill_weight
                if is_core:
                    total_core_skills_in_roadmap += 1

                # Hem ana ismi hem de takma adları kontrol et
                all_names_to_check = [skill_obj['name']] + skill_obj.get('aliases', [])
                
                for name_variant in all_names_to_check:
                    if name_variant.lower() in cv_skills_set:
                        is_found = True
                        break 
                
                if is_found:
                    matched_skills[section].append(skill_obj)
                    # Bulunan yetkinliğin ağırlığını ve kritik durumunu topla
                    matched_weight_sum += skill_weight
                    if is_core:
                        matched_core_skills_count += 1
                else:
                    missing_skills[section].append(skill_obj)
        
        # Puanları Hesapla
        overall_score = (matched_weight_sum / total_roadmap_weight) * 100 if total_roadmap_weight > 0 else 0.0
        core_score = (matched_core_skills_count / total_core_skills_in_roadmap) * 100 if total_core_skills_in_roadmap > 0 else 0.0
        
        # Sonuçları ve hesaplanan puanları döndür
        return dict(matched_skills), dict(missing_skills), round(overall_score, 1), round(core_score, 1)

# --- Test bloğunu da güncelleyelim ---
if __name__ == '__main__':
    sample_cv_skills = ['React.js', 'Docker', 'SQL', 'Postgres']
    sample_roadmap_data = {
        'Frameworks': [
            {'name': 'React', 'is_core': True, 'aliases': ['React.js'], 'weight': 3},
            {'name': 'Angular', 'is_core': False, 'aliases': [], 'weight': 1}
        ],
        'Databases': [
            {'name': 'PostgreSQL', 'is_core': True, 'aliases': ['Postgres'], 'weight': 3},
            {'name': 'MySQL', 'is_core': True, 'aliases': [], 'weight': 2}
        ],
        'DevOps': [
            {'name': 'Docker', 'is_core': True, 'aliases': [], 'weight': 2},
            {'name': 'Kubernetes', 'is_core': False, 'aliases': ['K8s'], 'weight': 1}
        ]
    }
    engine = ComparisonEngine()
    # Artık 4 değer döndürüyor:
    matched, missing, overall_score_test, core_score_test = engine.analyze_skills(sample_cv_skills, sample_roadmap_data)
    
    print("--- PUAN HESAPLAMALI KARŞILAŞTIRMA SONUCU ---")
    print(f"\nGenel Uygunluk Puanı: {overall_score_test}%")
    print(f"Kritik Yetkinlik Kapsamı: {core_score_test}%")
    
    print("\n✔️ EŞLEŞEN YETKİNLİKLER:")
    # ... (eşleşenleri yazdırma kısmı aynı kalabilir) ...
    print("\n⚠️ EKSİK YETKİNLİKLER:")
    # ... (eksikleri yazdırma kısmı aynı kalabilir) ...