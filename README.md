# Supabase CV Analiz Motoru

Bu proje, Supabase veritabanındaki aday profillerini çeken, bu profillerdeki yetenek listelerini yerel bir SQLite veritabanında tanımlı rol haritalarıyla karşılaştıran ve analiz sonuçlarını (puanlama, rol tespiti, rapor) tekrar Supabase'e yazan bir Python servisidir.

Sistem, "iş kuyruğu" mantığıyla çalışır; `aday_profil` tablosundaki `status='pending'` olarak işaretlenmiş kayıtları işler ve işi bitince `status='completed'` olarak günceller.

## Ana Özellikler

* **Veritabanı Güdümlü:** Yerel dosya sistemi yerine Supabase'i bir iş kuyruğu olarak kullanır.
* **Otomatik Rol Tespiti:** Adayın yetenek listesine göre en uygun rolü (`Backend`, `Frontend` vb.) otomatik olarak bulur.
* **Detaylı Puanlama:** Adayın role olan uygunluğunu `overall_score` (Genel Puan) ve `core_score` (Kritik Yetkinlik Puanı) olarak hesaplar.
* **Modüler (SOLID):** Her bileşen kendi sorumluluğuna odaklanmıştır (örn: `SupabaseCvFetcher` sadece veritabanıyla, `ComparisonEngine` sadece puanlamayla ilgilenir).

## Proje Mimarisi ve İş Akışı

1.  **Tetikleme:** `supabase_skill_analyzer.py` script'i çalıştırılır.
2.  **Veri Çekme:** `SupabaseCvFetcher`, `aday_profil` tablosundan `status='pending'` olan tüm kayıtları çeker.
3.  **Analiz (Döngü):** Her bir aday için:
    * `RoleDetector`, adayın yetenek listesine (`yetenekler`) bakarak en uygun rolü (`detected_role`) bulur.
    * `RoadmapRepository`, bu rol için gereken yetenekleri `roadmap_database.db` (SQLite) dosyasından okur.
    * `ComparisonEngine`, adayın yetenekleri ile rolün gerektirdiği yetenekleri karşılaştırır, `overall_score` ve `core_score` hesaplanır.
    * `ReportGenerator`, bu verilerle detaylı bir metin raporu oluşturur.
4.  **Veri Yazma:** `SupabaseCvFetcher`, bu analiz sonuçlarını (rol, puanlar, rapor) `analiz_sonuclari` tablosuna **yeni bir satır** olarak ekler.
5.  **İşaretleme:** `SupabaseCvFetcher`, son olarak orijinal kaydın (`aday_profil` tablosundaki) `status`'unu `'completed'` olarak günceller ki bu iş bir daha yapılmasın.

## Proje Dosya Yapısı (Çekirdek Modüller)

Proje, SOLID prensiplerine uygun olarak modüllere ayrılmıştır:

| Dosya | Sorumluluğu |
| :--- | :--- |
| **`supabase_skill_analyzer.py`** | **(Ana Çalıştırıcı)** Orkestra şefi. Tüm analiz akışını yönetir. |
| **`supabase_cv_fetcher.py`** | Supabase ile iletişimi yönetir (Veri Çekme / Veri Yazma). |
| **`comparison_engine.py`** | Analiz motoru. Yetenekleri karşılaştırır ve puanları hesaplar. |
| **`role_detector.py`** | Adayın yetenek listesine göre en uygun rolü tespit eder. |
| **`roadmap_repository.py`** | `roadmap_database.db`'den rol haritası verilerini okur. |
| **`report_generator.py`** | Analiz sonuçlarını metin bir rapora dönüştürür. |
| **`roadmap_database.db`** | Rol haritalarını, yetenekleri ve ağırlıkları içeren SQLite veritabanı. |
| | |
| **`main.py`** (Araç) | `roadmaps/` klasöründeki JSON'ları okuyup `roadmap_database.db` dosyasını oluşturur. |
| **`database_manager.py`** (Araç) | `main.py` tarafından kullanılan, SQLite DB şemasını oluşturan modül. |
| **`roadmap_parser.py`** (Araç) | `main.py` tarafından kullanılan, JSON dosyalarını okuyan modül. |
| `roadmaps/` (Klasör) | Rol haritalarının JSON formatında saklandığı yer. |

## Kurulum (Setup)

1.  **Depoyu Klonla:**
    ```bash
    git clone [HTTPS_VEYA_SSH_LINKINIZ]
    cd CVANALIZPROJESI
    ```

2.  **Bağımlılıkları Yükle:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Supabase Kurulumu:**
    * Supabase projenizde iki tablo oluşturun:
        * **`aday_profil`**: Aday bilgilerini ve `yetenekler` (text) sütununu içermelidir. Mutlaka `status` (text) adında bir sütun ekleyin ve "Default Value" olarak `'pending'` atayın.
        * **`analiz_sonuclari`**: `aday_id` (foreign key), `detected_role` (text), `overall_score` (float4), `core_score` (float4), `report_text` (text) sütunlarını içermelidir. `created_at` sütununun "Default Value" olarak `now()` kullandığından emin olun.
    * `supabase_cv_fetcher.py` dosyasının içine kendi `SUPABASE_URL` ve `SUPABASE_KEY` bilgilerinizi girin. (Güvenlik için bunları Environment Variables olarak ayarlamanız tavsiye edilir.)

4.  **Rol Haritası Veritabanını Oluştur (İlk Kurulum):**
    Projenin analiz yapabilmesi için `roadmap_database.db` dosyasına ihtiyacı vardır. Bu dosyayı `roadmaps/` klasöründeki JSON'ları kullanarak oluşturmak için `main.py` script'ini çalıştırın:
    ```bash
    python main.py
    ```
    (Bu işlemi sadece `roadmap_database.db` yoksa veya rol haritalarını güncellediyseniz yapmanız gerekir.)

## Kullanım

Sistemi çalıştırmak (Supabase'deki `'pending'` işleri kontrol edip işlemek) için ana orkestra şefi script'ini çalıştırmanız yeterlidir:

```bash
python supabase_skill_analyzer.py