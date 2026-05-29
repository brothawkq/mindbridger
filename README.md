# MindBridger 🧠

**MindBridger**, bireysel kullanıcıları, kurumsal müşterileri ve ruh sağlığı uzmanlarını tek bir platformda buluşturan, Türkiye'ye özel bir **online terapi marketplace**'idir.

---

## 🌐 Platform Hakkında

MindBridger; psikologlar, klinik psikologlar, PDR uzmanları ve psikoterapistlerin hizmetlerini çevrimiçi sunabildiği, bireylerin ve şirketlerin bu uzmanlara kolayca ulaşabildiği kapsamlı bir dijital sağlık platformudur.

Platform %20 komisyon modeli üzerinden çalışır; danışmanlar kendi ücretlerini ve müsaitlik takvimlerini yönetir.

---

## ✨ Özellikler

### Bireysel Kullanıcılar
- Uzmanlık alanı, cinsiyet, dil ve fiyata göre danışman arama ve filtreleme
- Danışman profili inceleme, değerlendirme okuma
- 15 dakikalık ücretsiz tanışma seansı ayarlama
- Video, ses veya mesaj ile online seans
- Psikolojik testler ve sonuç takibi
- Kişisel günlük ve ruh hali takibi
- Ödev ve hedef yönetimi
- Gamification sistemi (rozetler, seri takibi)

### Danışmanlar
- Profil oluşturma ve yayınlama (admin onayıyla)
- Takvim ve müsaitlik yönetimi
- Randevu takibi, seans notları
- Finansal panel ve haftalık ödeme sistemi
- Blog yazarlığı
- Webinar düzenleme ve yönetimi

### Kurumsal
- Çalışanlara terapi imkânı sunan kurumsal paketler
- Lisans yönetimi ve kişi başı aylık bütçe kontrolü
- Davet sistemi ile çalışan kaydı
- Kullanım raporları ve fatura yönetimi

### Admin
- Danışman başvuru onaylama / reddetme
- Kullanıcı yönetimi ve dondurma
- Finansal yönetim, komisyon ve ödeme takibi
- Site ayarları, görsel yönetimi
- Duyuru ve bildirim sistemi

---

## 🛠️ Teknoloji Altyapısı

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14+ (App Router, SSR) |
| Veritabanı | Supabase PostgreSQL |
| Kimlik Doğrulama | Supabase Auth |
| Ödeme | iyzico |
| Video Görüşme | Daily.co |
| E-posta | Resend |
| SMS | Netgsm |
| Dosya Depolama | Supabase Storage |
| Stil | Tailwind CSS + shadcn/ui |
| Animasyon | Framer Motion |
| State Yönetimi | Zustand + React Query |
| Deploy | Netlify |

---

## 🏗️ Proje Yapısı

```
├── app/                  # Next.js App Router sayfaları
│   ├── (public)/         # Genel ziyaretçi sayfaları
│   ├── (auth)/           # Giriş, kayıt, şifre sıfırlama
│   ├── (admin)/          # Admin paneli
│   ├── (danisan)/        # Danışman paneli
│   ├── (musteri)/        # Müşteri paneli
│   ├── (kurumsal)/       # Kurumsal panel
│   ├── (affiliate)/      # Affiliate paneli
│   └── api/              # API route'ları
├── components/           # UI bileşenleri
├── lib/                  # Servis entegrasyonları
├── supabase/             # Veritabanı migration'ları
└── docs/                 # Proje dokümantasyonu
```

---

## 🔐 Güvenlik

- Row Level Security (RLS) tüm veritabanı tablolarında aktif
- Brute-force koruması (5 başarısız giriş → 15 dk kilit, 50 deneme → 24 saat IP ban)
- IBAN ve hassas finansal veriler AES-256-GCM ile şifrelenir
- KVKK uyumlu veri işleme ve onay sistemi
- Oturum zaman aşımı (30 dakika hareketsizlik)
- CSP, HSTS, X-Frame-Options güvenlik başlıkları

---

## ⚙️ Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Veritabanı migration'larını uygula
npx supabase db push
```

### Gerekli Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
DAILY_CO_API_KEY=
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
ENCRYPTION_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## 📄 Lisans

Bu proje özel bir müşteri projesidir. Tüm hakları saklıdır.
