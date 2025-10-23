# report_generator.py
from collections import defaultdict

class ReportGenerator:
    """
    Karşılaştırma motorundan gelen zenginleştirilmiş veriyi ve puanları alıp,
    insan tarafından okunabilir bir rapor oluşturur.
    """
    # generate_report metodu artık puanları da alıyor
    def generate_report(self, roadmap_name, matched_skills, missing_skills, overall_score, core_score):
        """
        Verilen verilerden ve puanlardan formatlanmış bir metin raporu oluşturur.
        """
        report_lines = []
        
        # --- Rapor Başlığı ---
        report_lines.append("="*60)
        report_lines.append(f"'{roadmap_name.upper()}' ROLÜ İÇİN YETKİNLİK ANALİZ RAPORU")
        report_lines.append("="*60)
        
        # --- PUANLARI EKLE ---
        report_lines.append(f"\n📊 Genel Uygunluk Puanı: {overall_score}% (Ağırlıklı)")
        report_lines.append(f"🔑 Kritik Yetkinlik Kapsamı: {core_score}%")
        report_lines.append("-" * 60)

        # --- Mevcut Yetkinlikler Bölümü ---
        report_lines.append("\n✔️ MEVCUT YETKİNLİKLERİNİZ:")
        # ... (bu bölüm aynı kalıyor) ...
        if not matched_skills:
            report_lines.append("  - Bu rol için CV'nizde doğrudan eşleşen bir yetkinlik bulunamadı.")
        else:
            for section, skills in matched_skills.items():
                report_lines.append(f"\n  [{section}]")
                for skill_obj in skills:
                    report_lines.append(f"    - {skill_obj['name']}")

        # --- Eksik Yetkinlikler Bölümü ---
        report_lines.append("\n" + "-"*60)
        report_lines.append("\n⚠️ GELİŞTİRİLMESİ GEREKEN ALANLAR:")
        # ... (bu bölüm aynı kalıyor) ...
        if not missing_skills:
             report_lines.append("  - Harika! Bu rol için yol haritasındaki tüm yetkinlikler CV'nizde mevcut görünüyor.")
        else:
            critical_missing = []
            other_missing_by_section = defaultdict(list)
            for section, skills in missing_skills.items():
                 for skill_obj in skills:
                    if skill_obj.get('is_core', False):
                        critical_missing.append(skill_obj['name'])
                    else:
                        all_names = [skill_obj['name']] + skill_obj.get('aliases', [])
                        other_missing_by_section[section].extend(all_names)

            if critical_missing:
                report_lines.append("\n  [❗ KRİTİK EKSİKLİKLER]")
                report_lines.append("  Bu rol için temel gereklilik olan aşağıdaki yetkinlikler CV'de bulunamadı:")
                for skill_name in sorted(list(set(critical_missing))):
                    report_lines.append(f"    - {skill_name}")

            if other_missing_by_section:
                report_lines.append("\n  [Diğer Önerilen Yetkinlikler]")
                for section, skills in sorted(other_missing_by_section.items()):
                    unique_skills = sorted(list(set(skills)))
                    report_lines.append(f"    - {section}: {', '.join(unique_skills)}")
        
        report_lines.append("\n" + "="*60)
        
        return "\n".join(report_lines)

# --- Test bloğunu da güncelleyelim ---
if __name__ == '__main__':
    sample_matched = { # Örnek eşleşen veriler
        'DevOps': [{'name': 'Docker', 'is_core': True, 'aliases': [], 'weight': 2}] 
    }
    sample_missing = { # Örnek eksik veriler
        'Frameworks': [
            {'name': 'React', 'is_core': True, 'aliases': ['React.js'], 'weight': 3},
            {'name': 'Angular', 'is_core': False, 'aliases': [], 'weight': 1}
        ],
        'Databases': [
            {'name': 'PostgreSQL', 'is_core': True, 'aliases': ['Postgres'], 'weight': 3}
        ]
    }
    sample_roadmap_name = "Full Stack"
    # Örnek puanlar (normalde ComparisonEngine'dan gelir)
    sample_overall_score = 75.5 
    sample_core_score = 80.0
    
    reporter = ReportGenerator()
    # generate_report artık puanları da alıyor
    report = reporter.generate_report(sample_roadmap_name, sample_matched, sample_missing, sample_overall_score, sample_core_score)
    print(report)