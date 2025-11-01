# KARIYERIN_OLSUN - Akıllı CV Ayrıştırıcı

Bu proje, PDF formatındaki CV'leri otomatik olarak işlemek için geliştirilmiştir. Python kullanarak CV'lerden ham metni çıkarır, OpenAI GPT-4o modeli ile bu metni analiz edip yapılandırılmış JSON verisine (İsim, E-posta, Deneyim vb.) dönüştürür ve son olarak bu verileri bir Supabase veritabanına kaydeder.

## Kullanılan Teknolojiler

* **Python 3.10+**
* **OpenAI GPT-4o:** Yapılandırılmamış CV metnini analiz edip JSON formatına çevirme.
* **Supabase:** Çıkarılan verileri depolamak için bulut tabanlı PostgreSQL veritabanı.
* **`pdfplumber`:** PDF dosyalarından metin çıkarma.
* **`sentence-transformers`:** CV metni ile hedef beceriler arasında vektör benzerliği hesaplama.

## Kurulum

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu klonlayın:**
    ```bash
    git clone [https://github.com/HilmiKilavuz/KARIYERIN_OLSUN.git](https://github.com/HilmiKilavuz/KARIYERIN_OLSUN.git)
    cd KARIYERIN_OLSUN
    ```

2.  **Sanal ortam (Virtual Environment) oluşturun:**
    ```bash
    python -m venv venv
    ```

3.  **Sanal ortamı aktifleştirin:**
    * *Windows (PowerShell):*
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    * *Windows (CMD):*
        ```bash
        venv\Scripts\activate
        ```
    * *Linux/Mac:*
        ```bash
        source venv/bin/activate
        ```

4.  **Gerekli kütüphaneleri yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

## Yapılandırma

Projenin çalışabilmesi için API anahtarlarına ve veritabanı kurulumuna ihtiyacı vardır.

### 1. API Anahtarları (.env)

Proje ana dizininde (`KARIYERIN_OLSUN` içinde) `.env` adında bir dosya oluşturun ve içeriğini aşağıdaki gibi doldurun:

```ini
# OpenAI API Anahtarınız (Kodda 'vtys' olarak adlandırılmış)
# BU ANAHTARI MUTLAKA GÜVENDE TUTUN!
vtys=sk-SIZEN_YENI_OPENAI_ANAHTARINIZ
```

**ÖNEMLİ:** `.env` dosyası, `.gitignore` tarafından güvence altına alınmıştır ve **asla** GitHub'a yüklenmemelidir.

### 2. Supabase Ayarları

1.  **Veritabanı Tablosu:** Supabase projenizde aşağıdaki SQL komutunu kullanarak `aday_profil` tablosunu oluşturun:
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

2.  **Bağlantı Bilgileri:** Ana Python dosyasındaki (`cv_parser.py`) şu değişkenleri kendi Supabase bilgilerinizle güncelleyin:
    ```python
    SUPABASE_URL = "[https://SENIN-PROJE-ID.supabase.co](https://SENIN-PROJE-ID.supabase.co)"
    SUPABASE_KEY = "SENIN-ANON-KEYIN-BURAYA-GELECEK"
    ```

## Kullanım

1.  Analiz edilmesini istediğiniz CV dosyasını `KARIYERIN_OLSUN` klasörünün içine koyun (örn: `ornek_cv.pdf`).
2.  Ana Python dosyasındaki (`cv_parser.py`) `pdf_file = "..."` değişkenini bu dosyanın adıyla güncelleyin.
3.  Script'i çalıştırın:
    ```bash
    python cv_parser.py
    ```

Script çalıştığında, PDF'i okuyacak, GPT-4o ile analiz edecek, çıkarılan verileri terminale basacak ve Supabase veritabanına kaydedecektir.