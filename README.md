# Kariyerin Olsun - Frontend

Modern, AI-destekli kariyer geliştirme platformunun kullanıcı arayüzü. CV analizi, canlı avatar mülakat simülasyonu ve kişiselleştirilmiş kariyer roadmap'i sunar.

## 🚀 Özellikler

### 🎯 Ana Modüller
- **Dashboard** - Genel durum özeti, CV analiz skorları, gelişim önerileri, son mülakat geçmişi
- **Kişisel Bilgilerim** - CV yükleme, profil düzenleme, taslak onaylama
- **Simülasyon** - D-ID ile canlı avatar mülakat (WebRTC, sesli tanıma, duygu analizi)
- **Mülakat Geçmişi** - Tüm mülakat kayıtları, detaylı soru-cevap tabloları
- **Ayarlar** - Hesap bilgileri, şifre değiştirme

### ✨ Mülakat Sırasında
- **Gerçek zamanlı duygu analizi** (DeepFace ile)
- **Baskın duygu tespiti** (her soru için)
- **AI puanlama** (PUAN/DURUM/EKSİK/ÖNERİ formatında)
- **İstatistik tablosu** (mülakat sonunda detaylı rapor)
- **Speech-to-Text** (Türkçe ses tanıma)

### 📊 Analiz & Görselleştirme
- **Roadmap-style** gelişim önerileri
- Öncelik bazlı kategorizasyon (Kritik/Yüksek/Orta)
- Dinamik veri parsing (GPT analiz sonuçları)

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Dil | TypeScript, React 19 |
| Stil | Tailwind CSS v4 |
| State | Zustand |
| HTTP | Axios |
| İkonlar | Lucide React |
| WebRTC | Native API (Avatar) |
| Speech | Web Speech API (TR) |
| Emotion | DeepFace API (Port 5001) |

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıda aç
http://localhost:3000
```

## 📂 Proje Yapısı

```
src/
├── app/                    # Next.js routes
│   ├── dashboard/         # Ana kontrol paneli
│   ├── profile/           # Kişisel bilgiler (CV yükleme)
│   ├── simulation/        # Avatar mülakat + duygu analizi
│   ├── interview-history/ # Mülakat geçmişi listesi
│   ├── settings/          # Hesap ayarları
│   └── layout.tsx         # Root layout
├── components/            # UI bileşenleri
│   ├── dashboard/         # Dashboard componentleri
│   ├── AvatarPlayer.tsx   # WebRTC video player
│   ├── Navbar.tsx         # Ana navigasyon
│   └── GlassCard.tsx      # Glassmorphism wrapper
├── context/               # React Context
│   └── AuthContext.tsx    # Kullanıcı yetkilendirme
├── stores/                # Zustand stores
│   └── useAnalysisStore.ts
└── lib/                   # Utilities
    ├── emotionAnalyzer.ts # Duygu analizi client
    └── logger.ts          # Frontend logger
```

## 🔗 API Entegrasyonu

Frontend, backend gateway (`http://localhost:4000`) üzerinden şu servislere bağlanır:

- **Auth API** - Login, register, profile update
- **CV Parser** - PDF analizi
- **Avatar Bot** - D-ID stream oluşturma
- **Analysis Engine** - Profil skorlama
- **Interview History** - Mülakat geçmişi CRUD
- **Emotion API** - Duygu analizi (Port 5001)

## 🎤 Sesli Cevap Sistemi

```tsx
// Türkçe ses tanıma - continuous mode
recognition.lang = 'tr-TR';
recognition.continuous = true;
recognition.interimResults = true;
```

Özellikler:
- Anlık yazıya çevirme
- Otomatik mesaj gönderme
- Interim results gösterimi

---

**Son Güncelleme:** 2025-12-16  
**Versiyon:** 2.1  
**Durum:** ✅ Production Ready
