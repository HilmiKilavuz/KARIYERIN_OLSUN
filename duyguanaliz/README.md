# 🎭 Duygu Analizi ve Mülakat Simülasyonu Modülü

Bu modül, adayların mülakat sürecindeki **duygu durumlarını**, **stres seviyelerini** ve **cevap kalitelerini** analiz eden yapay zeka destekli bir mülakat simülasyon aracıdır.

Kamera görüntüsü ve verilen cevaplar üzerinden gerçek zamanlı analiz yaparak, mülakat sonunda detaylı bir performans raporu sunar.

---

## 🚀 Özellikler

- 🎥 **Gerçek Zamanlı Duygu Analizi**  
  Kamera görüntüsü üzerinden anlık duygu tespiti (mutlu, üzgün, öfkeli, stresli vb.)

- 👁️ **Göz Kırpma Takibi (Stres Analizi)**  
  Göz kırpma sıklığı analiz edilerek stres seviyesi ölçümü

- ⚡ **Threading Mimarisi**  
  Donma olmadan, yüksek FPS ile akıcı video işleme

- 📊 **Detaylı Raporlama**  
  Mülakat sonunda grafikler ve pasta diyagramları ile duygu dağılımı

- 🧠 **Cevap Kalitesi Analizi**  
  OpenAI API kullanılarak verilen cevapların içerik, tutarlılık ve kalite analizi

---

## 🛠️ Kullanılan Teknolojiler

- **DeepFace** → Duygu analizi  
- **MediaPipe** → Yüz ve göz takibi  
- **Streamlit** → Web arayüzü  
- **OpenAI API** → Metin ve cevap analizi  
- **Python** → Ana geliştirme dili  

---

## 📦 Kurulum

Projeyi çalıştırmadan önce gerekli kütüphaneleri yükleyin:

```bash
pip install -r requirements.txt

▶️ Çalıştırma

Modül klasörünün içindeyken terminalden aşağıdaki komutu çalıştırın:

streamlit run app.py


Uygulama tarayıcı üzerinden otomatik olarak açılacaktır

📈 Çıktılar

Anlık duygu durumu grafikleri

Göz kırpma (stres) analizi

Mülakat sonunda genel performans özeti

Duygu dağılımı pasta grafiği

🎯 Amaç

Bu modülün amacı:

Adayların mülakat performansını objektif şekilde analiz etmek

Stres ve duygu değişimlerini ölçmek

Yapay zeka destekli geri bildirim sunmaktır

👤 Geliştirici

Oğulcan Narin
Yazılım Mühendisliği Öğrencisi