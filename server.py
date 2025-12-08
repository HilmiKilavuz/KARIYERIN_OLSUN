# server.py
import os
import logging
import threading
import time
from flask import Flask, jsonify
from supabase_skill_analyzer import process_all_approved_cvs

app = Flask(__name__)

# Cloud Run logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Background worker kontrolü
worker_running = False
worker_thread = None

def background_cv_analyzer():
    """
    Arka planda sürekli çalışan worker.
    Her 60 saniyede bir approved CV'leri kontrol eder ve işler.
    """
    global worker_running
    logger.info("🔄 Background CV analyzer başlatıldı...")
    
    while worker_running:
        try:
            logger.info("📊 Approved CV'ler kontrol ediliyor...")
            result = process_all_approved_cvs()
            logger.info(f"✅ Analiz tamamlandı: {result}")
        except Exception as e:
            logger.error(f"❌ Background worker hatası: {e}", exc_info=True)
        
        # 60 saniye bekle (Cloud Run için optimal)
        time.sleep(60)
    
    logger.info("🛑 Background CV analyzer durduruldu.")

def start_background_worker():
    """Background worker thread'ini başlat."""
    global worker_running, worker_thread
    
    if worker_running:
        logger.warning("Worker zaten çalışıyor!")
        return
    
    worker_running = True
    worker_thread = threading.Thread(target=background_cv_analyzer, daemon=True)
    worker_thread.start()
    logger.info("✅ Background worker thread başlatıldı.")

# Gunicorn ile çalışırken worker'ı başlat
# Flask app oluşturulduğunda bir kere çalıştır
if not worker_running:
    start_background_worker()


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
        "service": "Kariyerin Olsun - CV Analysis Service",
        "worker_status": "running" if worker_running else "stopped"
    }), 200

@app.route('/analyze', methods=['GET', 'POST'])
def analyze():
    """Manuel CV analiz trigger endpoint."""
    try:
        logger.info("🚀 Manuel analiz tetiklendi...")
        result_message = process_all_approved_cvs()
        logger.info("✅ " + result_message)
        return jsonify({
            "status": "success",
            "message": result_message
        })
    except Exception as e:
        error_msg = f"❌ Genel hata: {e}"
        logger.error(error_msg)
        return jsonify({
            "status": "error",
            "message": error_msg
        }), 500

@app.route('/worker/status', methods=['GET'])
def worker_status():
    """Background worker durumunu kontrol et."""
    return jsonify({
        "worker_running": worker_running,
        "worker_alive": worker_thread.is_alive() if worker_thread else False
    })

if __name__ == "__main__":
    # Background worker'ı başlat
    start_background_worker()
    
    # Cloud Run PORT environment variable'ını kullan
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

