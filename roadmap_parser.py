# roadmap_parser.py
import os
import json
import glob

class RoadmapParser:
    def __init__(self, roadmaps_folder):
        self.roadmaps_folder = roadmaps_folder

    def load_all_roadmaps(self):
        """Klasördeki tüm JSON dosyalarını bulur, okur ve bir liste olarak döndürür."""
        json_files = glob.glob(os.path.join(self.roadmaps_folder, '*.json'))
        if not json_files:
            print(f"UYARI: '{self.roadmaps_folder}' klasöründe .json dosyası bulunamadı.")
            return []

        all_roadmaps_data = []
        for filepath in json_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    all_roadmaps_data.append(data)
                    print(f"'{filepath}' başarıyla okundu ve yüklendi.")
            except Exception as e:
                print(f"HATA: '{filepath}' dosyası okunurken bir sorun oluştu: {e}")

        return all_roadmaps_data