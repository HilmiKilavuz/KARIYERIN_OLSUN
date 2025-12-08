# server.py
import os
import logging
from flask import Flask, jsonify
from supabase_skill_analyzer import process_all_approved_cvs

app = Flask(__name__)

# Cloud Run logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.errorhandler(Exception)
def handle_exception(e):
    """Tüm yakalanmamış hataları logla ve 500 döndür."""
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


@app.route('/', methods=['GET', 'POST', 'HEAD'])
def home():
    """Cloud Run health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Kariyerin Olsun - CV Analysis Service"
    }), 200

@app.route('/analyze', methods=['GET', 'POST'])
def analyze():
    """CV analiz işlemini başlat."""
    try:
        print("🚀 Supabase Analiz Sistemi başlatılıyor...")
        result_message = process_all_approved_cvs()
        print("✅ " + result_message)
        return jsonify({
            "status": "success",
            "message": result_message
        })
    except Exception as e:
        error_msg = f"❌ Genel hata: {e}"
        print(error_msg)
        return jsonify({
            "status": "error",
            "message": error_msg
        }), 500

if __name__ == "__main__":
    # Cloud Run PORT environment variable'ını kullan
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
