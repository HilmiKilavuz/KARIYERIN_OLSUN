# CV Ayrıştırıcı (CV-Parser) ve Supabase Kaydedici

Bu proje, PDF formatındaki CV'leri okur, GPT-4o kullanarak içindeki önemli parametreleri (İsim, E-posta, Deneyim vb.) çıkarır ve bu yapılandırılmış veriyi bir Supabase veritabanına kaydeder.

## Kurulum

1.  **Projeyi klonlayın:**
    ```bash
    git clone [SENİN_GITHUB_REPO_URL'N]
    cd [PROJE_KLASOR_ADI]
    ```

2.  **Sanal ortam oluşturun ve aktifleştirin:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac için
    venv\Scripts\activate     # Windows için
    ```

3.  **Bağımlılıkları yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **.env dosyasını oluşturun:**
    Proje ana dizininde `.env` adında bir dosya oluşturun ve içine kendi API anahtarlarınızı girin:
    ```
    vtys=sk-OPENAI_API_ANAHTARINIZ
    ```
    *(Supabase URL ve Key'i kodun içine yazdık ama onları da buraya almak daha güvenli olurdu.)*

## Çalıştırma

Proje klasörüne `cv.pdf` adında bir CV dosyası koyun ve ana Python dosyasını çalıştırın:

```bash
python main.py  # (veya kodunun adı neyse)