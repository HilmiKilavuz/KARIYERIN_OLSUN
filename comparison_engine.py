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

        # Gelen CV yetenek listesini küçük harfe çevirip bir küme (set) yapalım
        # Bu, karşılaştırmayı hızlandırır ve büyük/küçük harf sorununu çözer
        cv_skills_set = {str(skill).lower().strip() for skill in cv_skills if str(skill).strip()}

        # --- HATA AYIKLAMA MESAJI EKLENDİ ---
        print(f"   DEBUG (Engine): Karşılaştırılacak CV Yetenekleri (Set): {cv_skills_set}") # DEBUG
        # --- HATA AYIKLAMA SONU ---

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

                # Hem ana ismi hem de takma adları (aliases) kontrol et
                all_names_to_check = [skill_obj['name']] + skill_obj.get('aliases', [])

                for name_variant in all_names_to_check:
                    # print(f"      DEBUG (Engine): Kontrol ediliyor: DB Yeteneği='{name_variant.lower().strip()}' CV Setinde var mı?") # İsteğe bağlı, çok detaylı çıktı verir
                    if name_variant.lower().strip() in cv_skills_set:
                        is_found = True
                        break # Yeteneği bulduk, diğer takma adlara bakmaya gerek yok

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

# --- Test bloğu ---
if __name__ == '__main__':
    sample_cv_skills = ['React.js', 'Docker', 'SQL', 'Postgres']
    sample_roadmap_data = {
        'Frameworks': [
            {'name': 'React', 'is_core': True, 'aliases': ['React.js'], 'weight': 7},
            {'name': 'Angular', 'is_core': False, 'aliases': [], 'weight': 5}
        ],
        'Databases': [
            {'name': 'PostgreSQL', 'is_core': True, 'aliases': ['Postgres'], 'weight': 7},
            {'name': 'MySQL', 'is_core': True, 'aliases': [], 'weight': 6}
        ],
        'DevOps': [
            {'name': 'Docker', 'is_core': True, 'aliases': [], 'weight': 7},
            {'name': 'Kubernetes', 'is_core': False, 'aliases': ['K8s'], 'weight': 4}
        ]
    }
    engine = ComparisonEngine()
    # Artık 4 değer döndürüyor:
    matched, missing, overall_score_test, core_score_test = engine.analyze_skills(sample_cv_skills, sample_roadmap_data)

    print("--- PUAN HESAPLAMALI KARŞILAŞTIRMA SONUCU ---")
    print(f"\nGenel Uygunluk Puanı: {overall_score_test}%")
    print(f"Kritik Yetkinlik Kapsamı: {core_score_test}%")

    print("\n✔️ EŞLEŞEN YETKİNLİKLER:")
    for section, skills in matched.items():
        print(f"  {section}:")
        for skill in skills:
            print(f"    - {skill['name']} (Core: {skill['is_core']}, Weight: {skill['weight']})")

    print("\n⚠️ EKSİK YETKİNLİKLER:")
    for section, skills in missing.items():
        print(f"  {section}:")
        for skill in skills:
            print(f"    - {skill['name']} (Core: {skill['is_core']}, Weight: {skill['weight']})")