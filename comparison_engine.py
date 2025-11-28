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
            return {}, {}, 0.0, 0.0

        # CV yetkinliklerini küçük harfe çevirip set yap (hızlı arama için)
        cv_skills_set = {skill.lower() for skill in cv_skills}

        matched_skills = defaultdict(list)
        missing_skills = defaultdict(list)

        # Puanlama için sayaçlar (Başlangıç değerleri)
        total_roadmap_weight = 0
        total_core_skills_in_roadmap = 0
        matched_weight_sum = 0
        matched_core_skills_count = 0

        # Yol haritasındaki her bölüm ve yetkinlik için döngüye gir
        for section, skills_in_section in roadmap_data.items():
            for skill_obj in skills_in_section:
                is_found = False
                
                # Ağırlık ve Kritiklik bilgilerini al
                skill_weight = skill_obj.get('weight', 1)
                is_core = skill_obj.get('is_core', False)

                # Toplam puanları güncelle (Payda kısmı - Her durumda eklenmeli)
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
                    # Eşleşme varsa kazanılan puanları güncelle (Pay kısmı)
                    matched_weight_sum += skill_weight
                    if is_core:
                        matched_core_skills_count += 1
                else:
                    missing_skills[section].append(skill_obj)
        
        # --- HESAPLAMA KISMI (Döngü bittikten sonra yapılır) ---
        # Puanları Hesapla (Sıfıra bölünme hatasını önleyerek)
        if total_roadmap_weight > 0:
            overall_score = (matched_weight_sum / total_roadmap_weight) * 100
        else:
            overall_score = 0.0

        if total_core_skills_in_roadmap > 0:
            core_score = (matched_core_skills_count / total_core_skills_in_roadmap) * 100
        else:
            core_score = 0.0
        
        # Sonuçları ve hesaplanan puanları döndür (virgülden sonra 1 basamak)
        return dict(matched_skills), dict(missing_skills), round(overall_score, 1), round(core_score, 1)

if __name__ == '__main__':
    pass