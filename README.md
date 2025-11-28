# 🤖 AI Avatar Interview System

<div align="center">

**Yapay Zeka Destekli Dinamik Mülakat Sistemi**

*D-ID Avatar teknolojisi ve OpenAI ile gerçek zamanlı görüntülü iş görüşmeleri*

[![TypeScript](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![D-ID](https://img.shields.io/badge/D--ID-FF6B6B?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRY/hPADAwMDAwMDIyMjAwMDL8//+fgQgwMDDwAwxMDAwMDIyMjAwM////Z2BiYmJgZGJiYmD4//8/AwMDAwMjIyMDw////xkYGBgYGf7/Z2BgYGBg+P///z8GBgYGhv///zMwMDAwMPz//5+BgYGBgYHh////DAwMDAwM////Z2BgYGD4////fwYGBgaG////MzAwMDAwMPz//5+BgYGBgYHh////DAwMDAz///9nYGBgYGD4////fwYGBgYGhv///zMwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAADQGRUAMI3KTQAAAABJRU5ErkJggg==&logoColor=white)](https://www.d-id.com/)

[🎥 Demo](#-demo) • [🚀 Kurulum](#-kurulum) • [📖 Kullanım](#-kullanım) • [🔧 Yapılandırma](#-yapılandırma)

</div>

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Yapılandırma](#-yapılandırma)
- [API Anahtarları](#-api-anahtarları)
- [Proje Yapısı](#-proje-yapısı)
- [Katkıda Bulunma](#-katkıda-bulunma)

---

## 🌟 Genel Bakış

**AI Avatar Interview System**, modern işe alım süreçlerini dönüştüren yenilikçi bir platformdur. D-ID'nin gerçekçi avatar teknolojisi ve OpenAI'ın güçlü doğal dil işleme yeteneklerini birleştirerek, adaylara 7/24 erişilebilir, tutarlı ve önyargısız bir mülakat deneyimi sunar.

### 🎯 Neden Bu Proje?

- **🤖 Otomasyon**: İnsan kaynakları ekiplerinin yükünü azaltır
- **🎨 Dinamik İçerik**: Her mülakatta farklı, yaratıcı sorular
- **🌍 Erişilebilirlik**: Zaman ve mekan kısıtlaması olmadan mülakat
- **📊 Kalite**: Standardize edilmiş, profesyonel görüşme deneyimi
- **💰 Maliyet Etkin**: İlk eleme turlarını otomatikleştirir

---

## ✨ Özellikler

### 🎭 Dinamik Avatar Teknolojisi
- **Gerçek Zamanlı Video**: D-ID teknolojisi ile canlı avatar animasyonu
- **Doğal Konuşma**: Microsoft Azure Neural TTS ile akıcı Türkçe ses
- **Yüz İfadeleri**: Profesyonel görüşme atmosferi için doğal mimikler

### 🧠 Yapay Zeka Destekli Sorular
- **OpenAI GPT-3.5**: Her mülakatta özgün, bağlamsal sorular
- **Adaptif Sorgulama**: Adayın cevaplarına göre şekillenen sorular
- **Çeşitli Konular**: Deneyim, beceriler, hedefler, liderlik, problem çözme

### 🎤 Çok Kanallı Giriş
- **Ses Tanıma**: Tarayıcı tabanlı Web Speech API ile konuşma girişi
- **Metin Girişi**: Klavye ile yanıt verme seçeneği
- **Çift Yönlü Video**: Adayın kamerasını açma/kapama özgürlüğü

### ⚙️ Özelleştirilebilir Sistem
- **Soru Sayısı**: Kolayca ayarlanabilir mülakat uzunluğu (şu an: 3 soru)
- **Ses Seçimi**: Farklı cinsiyet ve aksanlarda ses alternatifleri
- **Dil Desteği**: Türkçe ve İngilizce desteği

---

## 🛠 Teknoloji Stack

### Backend
```
Node.js + Express     → API sunucusu
OpenAI GPT-3.5       → Dinamik soru üretimi
D-ID Streaming API   → Avatar video akışı
Axios                → HTTP istekleri
dotenv               → Ortam değişkenleri
```

### Frontend
```
React 19             → UI framework
Vite                 → Build tool
Tailwind CSS         → Stil sistemi
Lucide React         → İkonlar
Web Speech API       → Ses tanıma
WebRTC               → Video streaming
```

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** 18+ 
- **npm** veya **yarn**
- **D-ID API** hesabı ([d-id.com](https://www.d-id.com/))
- **OpenAI API** anahtarı ([platform.openai.com](https://platform.openai.com/))

### Adım 1: Projeyi Klonlayın

```bash
git clone -b canliavatar https://github.com/HilmiKilavuz/KARIYERIN_OLSUN.git
cd KARIYERIN_OLSUN
```

### Adım 2: Backend Kurulumu

```bash
# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun
cp .env.example .env
```

**`.env` dosyasını düzenleyin:**
```env
D_ID_API_KEY=your_username:your_password
OPENAI_API_KEY=sk-your-openai-api-key
```

### Adım 3: Frontend Kurulumu

```bash
cd frontend
npm install
```

### Adım 4: Uygulamayı Başlatın

**Terminal 1 (Backend):**
```bash
node server.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine gidin! 🎉

---

## 📖 Kullanım

### 1️⃣ Avatar'a Bağlanma

- Ana ekranda **"Bağlan"** butonuna tıklayın
- WebRTC bağlantısı kurulana kadar bekleyin
- Avatar ekranda görünecektir

### 2️⃣ Mülakatı Başlatma

- **"🎤 Başlat"** butonuna basın
- Avatar otomatik olarak karşılama mesajı ve ilk soruyu soracaktır

### 3️⃣ Sorulara Cevap Verme

**Seçenek A: Sesli Yanıt**
- 🎤 Mikrofon butonuna basın
- Cevabınızı söyleyin
- Bittiğinde "Gönder" butonuna tıklayın

**Seçenek B: Yazılı Yanıt**
- Metin kutusuna cevabınızı yazın
- "Gönder" butonuna tıklayın

### 4️⃣ Mülakat Akışı

1. Avatar her cevabınızı dinler
2. Kısa bir geri bildirim verir
3. Bir sonraki soruyu sorar
4. 3 soru tamamlandığında mülakat sona erer

---

## 🔧 Yapılandırma

### Mülakat Soru Sayısını Değiştirme

**`server.js` dosyasında (satır 51):**
```javascript
const TOTAL_INTERVIEW_QUESTIONS = 3; // İstediğiniz sayıya değiştirin
```

### Ses Seçenekleri

Arayüzde sunulan sesler:
- 🇹🇷 **Ahmet** (Erkek - Türkçe)
- 🇹🇷 **Emel** (Kadın - Türkçe)
- 🇺🇸 **Jenny** (Kadın - İngilizce)
- 🇺🇸 **Guy** (Erkek - İngilizce)

Daha fazla ses eklemek için `App.jsx` dosyasındaki `<select>` elementini düzenleyin.

---

## 🔑 API Anahtarları

### D-ID API Anahtarı Alma

1. [studio.d-id.com](https://studio.d-id.com/) adresine gidin
2. Hesap oluşturun / Giriş yapın
3. **Settings → API Keys** bölümüne gidin
4. **Create API Key** tıklayın
5. `username:password` formatında anahtarınızı kopyalayın

⚠️ **Not**: D-ID ücretli bir servistir, kredi satın almanız gerekebilir.

### OpenAI API Anahtarı Alma

1. [platform.openai.com](https://platform.openai.com/) adresine gidin
2. **API Keys** sekmesine gidin
3. **+ Create new secret key** tıklayın
4. Anahtarınızı güvenli bir yere kaydedin

---

## 📁 Proje Yapısı

```
KARIYERIN_OLSUN/
├── 📄 server.js              # Backend - Express API
├── 📄 package.json           # Backend bağımlılıkları
├── 📄 .env                   # Ortam değişkenleri (GİTİGNORE)
├── 📄 .gitignore             # Git ignore kuralları
│
└── 📁 frontend/
    ├── 📄 index.html         # Ana HTML
    ├── 📄 package.json       # Frontend bağımlılıkları
    ├── 📄 vite.config.js     # Vite yapılandırması
    ├── 📄 tailwind.config.js # Tailwind CSS
    ├── 📄 postcss.config.js  # PostCSS
    │
    └── 📁 src/
        ├── 📄 main.jsx       # React entry point
        ├── 📄 App.jsx        # Ana uygulama komponenti
        └── 📄 index.css      # Global stiller
```

---

## 🎨 Özellik Detayları

### Backend API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/streams/create` | POST | Yeni avatar stream oluşturur |
| `/api/streams/:id/start` | POST | WebRTC bağlantısı başlatır |
| `/api/streams/:id/talk` | POST | Avatar'ı konuşturur |
| `/api/streams/:id/start-interview` | POST | Mülakatı başlatır |
| `/api/streams/:id` | DELETE | Stream'i sonlandırır |
| `/api/streams/:id/ice` | POST | ICE candidate ekler |
| `/api/health` | GET | Sunucu durumu |

### OpenAI Prompt Stratejisi

Sistem, **iki farklı prompt modu** kullanır:

**1. Normal Sohbet Modu:**
```javascript
"Sen D-ID tarafından canlandırılan yardımsever bir yapay zeka asistanısın."
```

**2. Mülakat Modu:**
```javascript
"Sen profesyonel bir İnsan Kaynakları uzmanısın ve iş mülakatı yapıyorsun.
Adayın önceki cevabına kısa yorum yap, ardından yeni ve özgün bir soru sor."
```

**Temperature:** `0.9` (Yüksek yaratıcılık için)

---

## 🐛 Bilinen Sorunlar & Çözümler

### Sorun: "Insufficient Credits" Hatası
**Çözüm:** D-ID hesabınıza kredi ekleyin

### Sorun: Avatar bağlantısı kurulamıyor
**Çözüm:** 
- `.env` dosyasındaki API anahtarlarını kontrol edin
- D-ID API key formatının `username:password` olduğundan emin olun

### Sorun: Ses tanıma çalışmıyor
**Çözüm:** 
- Chrome veya Edge tarayıcısı kullanın
- Mikrofon izinlerini kontrol edin
- HTTPS bağlantısı kullanın (localhost'ta çalışır)

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik: ...'`)
4. Branch'inizi push edin (`git push origin feature/YeniOzellik`)
5. Pull Request oluşturun

---

## 📝 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır.

---

## 👥 Ekip

Geliştirme Ekibi:
- **Proje Sahibi**: [Hilmi Kılavuz](https://github.com/HilmiKilavuz)
- **Geliştirici**: Oğulcan Narin

---

## 🙏 Teşekkürler

Bu proje aşağıdaki harika teknolojiler olmadan mümkün olmazdı:

- [D-ID](https://www.d-id.com/) - Avatar teknolojisi
- [OpenAI](https://openai.com/) - GPT-3.5 Turbo
- [React](https://reactjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Stil sistemi
- [Vite](https://vitejs.dev/) - Build tool

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! ⭐**

[🔝 Başa Dön](#-ai-avatar-interview-system)

</div>
