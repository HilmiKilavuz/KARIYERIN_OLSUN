import functions_framework
from flask import jsonify

# Yanındaki dosyadan (supabase_skill_analyzer.py) ana fonksiyonu çağırıyoruz
from supabase_skill_analyzer import process_all_pending_cvs

@functions_framework.http
def run_cv_analysis(request):
    """
    Google Cloud Run Tetikleyicisi.
    Sadece analiz sürecini başlatır ve sonucu ekrana basar.
    """
    try:
        # Analiz sürecini başlat
        result_message = process_all_pending_cvs()
        
        # Sonucu JSON olarak döndür
        return jsonify({
            "status": "success",
            "message": result_message
        }), 200

    except Exception as e:
        print(f"Kritik Server Hatası: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500