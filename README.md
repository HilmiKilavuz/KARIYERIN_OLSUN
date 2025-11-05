# 🚀 CV Parser - Akıllı CV Ayrıştırıcı ve Analiz Sistemi

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**AI destekli CV analiz ve veritabanı yönetim sistemi**

[Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Kullanım](#-kullanım) • [API Dokümantasyonu](#-api-endpointleri)

</div>

---

## 📋 Proje Hakkında

CV Parser, PDF formatındaki CV'leri otomatik olarak işleyen, yapılandırılmış veri çıkaran ve Supabase veritabanına kaydeden gelişmiş bir AI destekli sistemdir. OpenAI GPT-4o modeli kullanarak CV'lerden kritik bilgileri çıkarır ve Flask REST API ile entegre edilmiştir.

### 🎯 Temel Özellikler

- ✅ **PDF'den Metin Çıkarma**: `pdfplumber` ile yüksek kaliteli metin çıkarımı
- ✅ **AI Destekli Analiz**: GPT-4o ile yapılandırılmamış metni JSON formatına dönüştürme
- ✅ **Vektör Benzerlik Analizi**: Sentence Transformers ile beceri eşleştirmesi
- ✅ **REST API**: Flask ile RESTful endpoint'ler
- ✅ **Supabase Entegrasyonu**: Bulut tabanlı PostgreSQL veritabanı desteği
- ✅ **Otomatik Veri Yapılandırma**: CV bilgilerini yapılandırılmış JSON formatına dönüştürme

---

## 🛠️ Teknoloji Stack

| Kategori | Teknoloji |
|----------|-----------|
| **Backend Framework** | Flask 2.0+ |
| **AI/ML** | OpenAI GPT-4o, Sentence Transformers |
| **Database** | Supabase (PostgreSQL) |
| **PDF Processing** | pdfplumber |
| **Vector Embeddings** | sentence-transformers/all-MiniLM-L12-v2 |
| **Language** | Python 3.10+ |

---

## 📦 Kurulum

### 1. Repository'yi Klonlayın

```bash
git clone https://github.com/HilmiKilavuz/KARIYERIN_OLSUN.git
cd KARIYERIN_OLSUN
git checkout cv-parser-guncel
```

### 2. Sanal Ortam Oluşturun ve Aktifleştirin

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
```

### 3. Bağımlılıkları Yükleyin

```bash
pip install -r requirements.txt
```

---

## ⚙️ Yapılandırma

### 1. Environment Variables (.env)

Proje ana dizininde `.env` dosyası oluşturun:

```ini
# OpenAI API Anahtarı
# ⚠️ BU DOSYA ASLA GITHUB'A COMMIT EDİLMEMELİDİR!
vtys=sk-YOUR_OPENAI_API_KEY_HERE
```

> **Güvenlik Notu:** `.env` dosyası `.gitignore` tarafından korunmaktadır. API anahtarlarınızı asla public repository'lerde paylaşmayın!

### 2. Supabase Yapılandırması

#### Veritabanı Tablosu Oluşturma

Supabase SQL Editor'de aşağıdaki komutu çalıştırın:

```sql
CREATE TABLE aday_profil (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now(),
    ad_soyad TEXT,
    e_posta TEXT,
    telefon_numarasi TEXT,
    adres TEXT,
    egitim_bilgileri TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    deneyim TEXT,
    yetenekler TEXT,
    sertifikalar TEXT,
    diller TEXT,
    projeler TEXT,
    cv_raw_text TEXT
);
```

#### Bağlantı Bilgilerini Güncelleme

`cv_parser.py` dosyasında Supabase bilgilerinizi güncelleyin:

```python
SUPABASE_URL = "https://your-project-id.supabase.co"
SUPABASE_KEY = "your-anon-key-here"
```

---

## 🚀 Kullanım

### Komut Satırından Çalıştırma

1. Analiz edilecek CV dosyasını proje klasörüne koyun
2. `cv_parser.py` dosyasını düzenleyip `pdf_file` değişkenini güncelleyin
3. Script'i çalıştırın:

```bash
python cv_parser.py
```

### Flask API Server Olarak Çalıştırma

```bash
python cv_parser.py
```

Server varsayılan olarak `http://0.0.0.0:5000` adresinde çalışacaktır.

---

## 🔌 API Endpointleri

### `GET /`

API durum kontrolü.

**Response:**
```json
{
  "status": "ok",
  "message": "CV Analiz API aktif 🚀"
}
```

---

### `POST /upload_cv`

CV dosyası yükleme ve analiz endpoint'i.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (PDF dosyası)

**cURL Örneği:**
```bash
curl -X POST http://localhost:5000/upload_cv \
  -F "file=@cv_example.pdf"
```

**Response:**
```json
{
  "id": 123,
  "parsed_data": {
    "ad_soyad": "Ahmet Yılmaz",
    "e_posta": "ahmet@example.com",
    "telefon_numarasi": "+90 555 123 4567",
    "adres": "İstanbul, Türkiye",
    "egitim_bilgileri": "...",
    "linkedin_url": "https://linkedin.com/in/ahmet",
    "github_url": "https://github.com/ahmet",
    "deneyim": "...",
    "yetenekler": ["Python", "JavaScript", "SQL"],
    "sertifikalar": "...",
    "diller": ["Türkçe", "İngilizce"],
    "projeler": "..."
  },
  "missing_fields": [],
  "similarity_score": 0.856
}
```

**Response Alanları:**
- `id`: Supabase'de oluşturulan kayıt ID'si
- `parsed_data`: GPT-4o ile çıkarılan yapılandırılmış veri
- `missing_fields`: Eksik bilgi alanları listesi
- `similarity_score`: CV ile hedef beceriler arasındaki benzerlik skoru (0-1 arası)

---

### `POST /update/<record_id>`

Mevcut kaydı güncelleme endpoint'i.

**Request:**
- Method: `POST`
- URL Parameter: `record_id` (integer)
- Content-Type: `application/json`
- Body: Güncellenecek alanların JSON formatı

**cURL Örneği:**
```bash
curl -X POST http://localhost:5000/update/123 \
  -H "Content-Type: application/json" \
  -d '{"yetenekler": "Python, JavaScript, React, Node.js"}'
```

**Response:**
```json
{
  "message": "✅ Güncellendi",
  "updated_record": {
    "id": 123,
    "yetenekler": "Python, JavaScript, React, Node.js",
    ...
  }
}
```

---

## 📊 Çıkarılan Veri Alanları

CV'lerden otomatik olarak çıkarılan alanlar:

| Alan | Açıklama | Tip |
|------|----------|-----|
| `ad_soyad` | Ad ve Soyad | String |
| `e_posta` | E-posta adresi | String |
| `telefon_numarasi` | Telefon numarası | String |
| `adres` | Adres bilgisi | String |
| `egitim_bilgileri` | Eğitim geçmişi | JSON Array |
| `linkedin_url` | LinkedIn profil URL'i | String |
| `github_url` | GitHub profil URL'i | String |
| `deneyim` | İş deneyimi | JSON Array |
| `yetenekler` | Yetenekler/Beceriler | JSON Array |
| `sertifikalar` | Sertifikalar | JSON Array |
| `diller` | Dil bilgileri | JSON Array |
| `projeler` | Proje bilgileri | JSON Array |
| `cv_raw_text` | Ham CV metni | String |

---

## 🔒 Güvenlik

- ✅ `.env` dosyası `.gitignore` ile korunur
- ✅ API anahtarları environment variables üzerinden yönetilir
- ✅ Hassas dosyalar (`keys.docx`) `.gitignore`'da yer alır
- ⚠️ Production ortamında Supabase RLS (Row Level Security) kullanılması önerilir

---

## 🐛 Sorun Giderme

### PDF'ten metin çıkarılamıyor
- PDF'in metin tabanlı (scan edilmemiş) olduğundan emin olun
- OCR gerekiyorsa, PDF'i önce metin formatına dönüştürün

### OpenAI API hatası
- `.env` dosyasında API anahtarının doğru olduğundan emin olun
- API quota'nızı kontrol edin

### Supabase bağlantı hatası
- `SUPABASE_URL` ve `SUPABASE_KEY` değerlerini kontrol edin
- Supabase projenizin aktif olduğundan emin olun

---

## 📝 Lisans

Bu proje [KARIYERIN_OLSUN](https://github.com/HilmiKilavuz/KARIYERIN_OLSUN) projesinin bir parçasıdır.

---

## 👥 Katkıda Bulunanlar

- **Hilmi Kılavuz** - Proje Yöneticisi
- **Ahmet Yaşarcan** - CV Parser Geliştiricisi

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by KariyerinOlsun Team

</div>
