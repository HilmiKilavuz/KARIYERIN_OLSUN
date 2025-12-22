# Kariyerin Olsun - Backend Gateway

API Gateway servisi - Frontend ile mikro servisler (CV Parser, Avatar Bot, Analysis Engine, Emotion API) arasında köprü görevi görür.

## 🎯 Görevler

1. **Proxy Yönetimi** - Frontend isteklerini ilgili servislere yönlendirir
2. **Authentication** - Kullanıcı giriş/kayıt işlemleri
3. **Profile Management** - CV profil CRUD işlemleri
4. **Interview History** - Mülakat geçmişi yönetimi
5. **Request Routing** - API endpoint'lerini organize eder

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji |
|----------|-----------|
| Runtime | Node.js (ES6 Modules) |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| HTTP Client | Axios |
| CORS | cors middleware |
| Logging | Custom Logger (Renkli, Emoji'li) |

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# Sunucuyu başlat
npm start
```

## 🔐 Environment Variables

`.env` dosyasında şunlar olmalı:

```env
# Server Configuration
PORT=4000
FRONTEND_URL=http://localhost:3000

# Microservices
CV_PARSER_URL=https://cv-parser-service-866597427116.europe-west1.run.app
AVATAR_BOT_URL=http://localhost:3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## 📂 Proje Yapısı

```
src/
├── app.js                 # Ana uygulama, routes mount
├── config/
│   └── env.js            # Environment config manager
├── controllers/
│   ├── authController.js # Login, register, profile, interview history
│   ├── cvController.js   # CV upload proxy
│   ├── avatarController.js # Avatar stream proxy
│   └── emotionController.js # Duygu analizi proxy
├── services/
│   ├── cvParserService.js
│   └── avatarService.js
├── routes/
│   └── api.js            # Ana route tanımları
└── utils/
    └── logger.js         # Professional logger
```

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/update-profile
GET  /api/auth/profile/:userId
GET  /api/auth/analysis/:userId
```

### Interview History
```
GET  /api/interview-history/:userId   # Kullanıcının tüm mülakatları
```

### CV Operations
```
POST /api/upload-cv       # Multipart form-data
```

### Avatar Streams
```
POST /api/streams/create
POST /api/streams/:id/start
POST /api/streams/:id/talk
DELETE /api/streams/:id
```

### Emotion Analysis (Proxy to Port 5001)
```
POST /api/emotion/analyze-frame
POST /api/emotion/score-answer
POST /api/emotion/save-interview
GET  /api/emotion/health
```

## 🔄 Servis Akışı

```
Frontend (3000)
    ↓
Backend Gateway (4000)
    ├─→ CV Parser (Google Cloud Run)
    ├─→ Avatar Bot (3001)
    ├─→ Emotion API (5001)
    └─→ Supabase (Database)
         ↓
    Analysis Engine (Background Worker)
```

## 📊 Database Tables

- **users** - Kullanıcı hesapları
- **aday_profil** - CV profil verileri
- **cv_drafts** - Onay bekleyen taslaklar
- **analiz_sonuclari** - AI analiz sonuçları
- **mulakat_gecmisi** - Mülakat kayıtları (sorular, duygular, AI puanları)

---

**Son Güncelleme:** 2025-12-16  
**Port:** 4000  
**Durum:** ✅ Production Ready
