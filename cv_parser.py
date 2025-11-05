import os
import json
import re
import numpy as np
import pdfplumber
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import openai

# --- Flask başlat ---
app = Flask(__name__)

# --- Ortam değişkenleri yükle ---
load_dotenv()
vtys = os.getenv("vtys")
if not vtys:
    raise ValueError("OpenAI API anahtarı bulunamadı.")
openai.api_key = vtys

# --- Supabase bağlantısı ---
SUPABASE_URL = "url"
SUPABASE_KEY = "anon_key"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Yardımcı fonksiyonlar ---
def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    if len(text.strip()) < 50:
        print("⚠️ PDF'ten çok az metin çıkarıldı.")
    return text

def embed_text(text):
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L12-v2')
    emb = model.encode([text])
    return np.array(emb).astype('float32')

def cosine_similarity(v1, v2):
    v1n = v1 / np.linalg.norm(v1)
    v2n = v2 / np.linalg.norm(v2)
    return np.dot(v1n, v2n.T)[0][0]

def safe_json_parse(content):
    try:
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        else:
            print("⚠️ GPT JSON formatı dışında yanıt döndürdü:")
            print(content)
            return {}
    except Exception as e:
        print("❌ JSON parse hatası:", e)
        print("Ham içerik:", content)
        return {}

def parse_cv_fields(cv_text):
    prompt = f"""
    Aşağıda bir CV metni var. Bu CV'den aşağıdaki alanları çıkar:
    - ad_soyad
    - e_posta
    - telefon_numarasi
    - adres
    - egitim_bilgileri
    - linkedin_url
    - github_url
    - deneyim
    - yetenekler
    - sertifikalar
    - diller
    - projeler

    Eğer bir bilgi yoksa null yaz.
    Sadece geçerli JSON formatında döndür.
    CV:
    {cv_text}
    """
    response = openai.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    content = response.choices[0].message.content.strip()
    return safe_json_parse(content)

def find_missing_fields(data):
    return [k for k, v in data.items() if v in [None, "", "null", []]]

# --- Supabase kayıt ---
def save_to_supabase(data, raw_text):
    payload = {
        "ad_soyad": data.get("ad_soyad"),
        "e_posta": data.get("e_posta"),
        "telefon_numarasi": data.get("telefon_numarasi"),
        "adres": data.get("adres"),
        "egitim_bilgileri": json.dumps(data.get("egitim_bilgileri"), ensure_ascii=False),
        "linkedin_url": data.get("linkedin_url"),
        "github_url": data.get("github_url"),
        "deneyim": json.dumps(data.get("deneyim"), ensure_ascii=False),
        "yetenekler": json.dumps(data.get("yetenekler"), ensure_ascii=False),
        "sertifikalar": json.dumps(data.get("sertifikalar"), ensure_ascii=False),
        "diller": json.dumps(data.get("diller"), ensure_ascii=False),
        "projeler": json.dumps(data.get("projeler"), ensure_ascii=False),
        "cv_raw_text": raw_text
    }

    res = supabase.table("aday_profil").insert(payload).execute()
    if not res.data:
        res = supabase.table("aday_profil").select("*").order("id", desc=True).limit(1).execute()
    if res.data:
        print("✅ Supabase'e kaydedildi.")
        return res.data[0]
    else:
        print("⚠️ Supabase boş yanıt döndürdü.")
        return None

def update_supabase(record_id, updates):
    res = supabase.table("aday_profil").update(updates).eq("id", record_id).execute()
    return res.data[0] if res.data else None

# --- API endpointleri ---
@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "CV Analiz API aktif 🚀"})

@app.route("/upload_cv", methods=["POST"])
def upload_cv():
    if "file" not in request.files:
        return jsonify({"error": "Dosya yüklenmedi."}), 400

    file = request.files["file"]
    pdf_path = f"temp_{file.filename}"
    file.save(pdf_path)

    try:
        cv_text = extract_text_from_pdf(pdf_path)
        parsed_data = parse_cv_fields(cv_text)
        missing = find_missing_fields(parsed_data)
        cv_vec = embed_text(cv_text)
        target_vec = embed_text("Python, SQL, REST API, Git, Docker, Machine Learning")
        sim_score = cosine_similarity(cv_vec, target_vec)
        record = save_to_supabase(parsed_data, cv_text)

        response = {
            "id": record["id"] if record else None,
            "parsed_data": parsed_data,
            "missing_fields": missing,
            "similarity_score": round(float(sim_score), 3)
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

@app.route("/update/<int:record_id>", methods=["POST"])
def update_record(record_id):
    updates = request.get_json()
    updated = update_supabase(record_id, updates)
    if updated:
        return jsonify({"message": "✅ Güncellendi", "updated_record": updated})
    return jsonify({"error": "Kayıt güncellenemedi"}), 400

# --- Uygulama başlat ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
