# server.py
import os
from flask import Flask, jsonify
from supabase_skill_analyzer import process_all_approved_cvs

app = Flask(__name__)

@app.route('/')
def home():
    """Cloud Run health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Kariyerin Olsun - CV Analysis Service"
    })

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
