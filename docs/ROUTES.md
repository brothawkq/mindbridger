# ROUTES.md — Rota Haritası

---

## Sayfa Rotaları (Next.js App Router)

### Public (Ziyaretçi)
```
/                              Ana sayfa
/danismanlar                   Danışman listesi + filtre
/danismanlar/[slug]            Danışman profil (SSR)
/[sehir]-psikolog              Şehir SEO sayfası (SSG)
/blog                          Blog listesi
/blog/[slug]                   Blog detay (SSR)
/testler                       Psikolojik test listesi
/testler/[slug]                Test akışı
/kaynaklar                     Kaynak kütüphanesi
/webinar                       Webinar listesi (public)
/webinar/[id]                  Webinar detay + kayıt (public)
/hakkimizda
/iletisim
/gizlilik-politikasi
/kvkk
/sss
/fiyatlandirma
/kurumsal                      Kurumsal tanıtım
/affiliate                     Affiliate başvuru
```

### Auth
```
/giris
/kayit
/danisan-kayit                 Çok adımlı danışman kayıt formu
/kurumsal-kayit
/sifremi-unuttum
/sifremi-sifirla/[token]
/e-posta-dogrulama/[token]
/2fa                           İki faktörlü doğrulama
```

### Admin (role: admin)
```
/admin
/admin/dashboard
/admin/kullanicilar
/admin/kullanicilar/[id]
/admin/danismanlar
/admin/danismanlar/[id]
/admin/danismanlar/basvurular
/admin/randevular
/admin/finans
/admin/finans/odemeler
/admin/finans/iadeler
/admin/finans/danisan-odemeleri
/admin/icerik
/admin/icerik/blog
/admin/icerik/testler
/admin/icerik/kaynaklar
/admin/icerik/sss
/admin/bildirimler
/admin/raporlar
/admin/raporlar/loglar              Audit log görüntüleyici (90 gün, filtreli)
/admin/finans/faturalar             Tüm fatura listesi (bireysel + kurumsal)
/admin/ayarlar
/admin/kurumsal
/admin/kurumsal/[id]
/admin/affiliate
/admin/affiliate/[id]
```

### Danışman Paneli (role: danisan)
```
/danisan
/danisan/dashboard
/danisan/takvim
/danisan/randevular
/danisan/randevular/[id]
/danisan/danisanlar
/danisan/danisanlar/[id]
/danisan/mesajlar
/danisan/mesajlar/[conversationId]
/danisan/finans
/danisan/blog
/danisan/blog/yeni
/danisan/blog/[id]/duzenle
/danisan/profil
/danisan/onboarding-formlar
/danisan/odevler
/danisan/supervizyon
/danisan/performans
/danisan/webinar                Webinar oluştur ve yönet
/danisan/ayarlar
```

### Müşteri Paneli (role: musteri)
```
/panelim
/panelim/dashboard
/panelim/danismanlar
/panelim/randevularim
/panelim/randevularim/[id]
/panelim/randevu-al/[danisanSlug]  Randevu alma akışı
/panelim/mesajlar
/panelim/mesajlar/[conversationId]
/panelim/gunluk
/panelim/testler
/panelim/testler/[slug]
/panelim/odevler
/panelim/paketlerim
/panelim/gamification
/panelim/finans
/panelim/profil
/panelim/ayarlar
/panelim/webinar                   Webinar listesi + kayıtlarım
```

### Kurumsal Panel (role: kurumsal)
```
/kurumsal-panel
/kurumsal-panel/dashboard
/kurumsal-panel/davetler
/kurumsal-panel/butce               Çalışan bazlı bütçe yönetimi
/kurumsal-panel/raporlar
/kurumsal-panel/faturalar           PDF + XLSX indirme + önizleme
/kurumsal-panel/ayarlar
```

### Affiliate Paneli (role: affiliate)
```
/affiliate-panel
/affiliate-panel/dashboard
/affiliate-panel/linklerim
/affiliate-panel/kazanclar
/affiliate-panel/ayarlar
```

---

## API Rotaları

### Auth
```
POST   /api/auth/register/musteri
POST   /api/auth/register/danisan
POST   /api/auth/register/kurumsal
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password        Kritik: mevcut şifre veya OTP doğrulaması zorunlu
POST   /api/auth/change-email           Kritik: mevcut şifre veya OTP doğrulaması zorunlu
POST   /api/auth/2fa/setup
POST   /api/auth/2fa/verify
POST   /api/auth/ip-blacklist/kontrol   IP ban kontrolü (middleware tarafından çağrılır)
```

### Danışman
```
GET    /api/danismanlar                    Filtreli liste (public)
GET    /api/danismanlar/[slug]             Profil detay (public)
PUT    /api/danismanlar/profil             Profil güncelle (danisan)
GET    /api/danismanlar/musaitlik          Müsait saatleri getir
PUT    /api/danismanlar/musaitlik          Müsaitlik şablonu güncelle
POST   /api/danismanlar/izin              İzin günü ekle
DELETE /api/danismanlar/izin/[id]
GET    /api/danismanlar/paketler          Paketleri listele
POST   /api/danismanlar/paketler          Paket oluştur
PUT    /api/danismanlar/paketler/[id]
DELETE /api/danismanlar/paketler/[id]
GET    /api/danismanlar/[id]/takvim       30 günlük müsaitlik (public)
```

### Randevu
```
GET    /api/randevular                    Kullanıcının randevuları
POST   /api/randevular                    Randevu oluştur
GET    /api/randevular/[id]
PUT    /api/randevular/[id]/onayla        Danışman onaylar
PUT    /api/randevular/[id]/reddet        Danışman reddeder
PUT    /api/randevular/[id]/iptal         İptal et (musteri veya danisan)
PUT    /api/randevular/[id]/tamamla       Seans tamamlandı işaretle
PUT    /api/randevular/[id]/no-show       No-show işaretle (danisan)
GET    /api/randevular/[id]/video-token   Daily.co token al
POST   /api/randevular/tekrarlayan        Tekrarlayan randevu oluştur
POST   /api/bekleme-listesi               Bekleme listesine gir
DELETE /api/bekleme-listesi/[id]          Listeden çık
```

### Ödeme
```
POST   /api/odeme/baslat                  iyzico payment init
POST   /api/odeme/onayla                  iyzico callback / capture
POST   /api/odeme/iptal                   İptal + iade hesapla
GET    /api/odeme/gecmis                  Ödeme geçmişi
POST   /api/odeme/iade/[paymentId]        Manuel iade (admin)
GET    /api/odeme/payout/danisan          Danışman ödeme özeti
POST   /api/odeme/payout/isle            Haftalık payout tetikle (admin)
```

### Video
```
POST   /api/video/oda-olustur             Daily.co oda oluştur (server only)
DELETE /api/video/oda-sil/[roomName]      Oda sil
GET    /api/video/token/[randevuId]       Token al — yalnızca randevu sahibine, randevudan 10 dk önce aktif
```

### Mesajlaşma
```
GET    /api/mesajlar                       Konuşma listesi
GET    /api/mesajlar/[conversationId]      Mesajları getir
POST   /api/mesajlar                       Yeni mesaj
POST   /api/mesajlar/asenkron             Asenkron seans talebi
PUT    /api/mesajlar/[id]/oku
```

### İçerik
```
GET    /api/blog                           Yayınlanan yazılar (public)
GET    /api/blog/[slug]                    Yazı detay (public)
POST   /api/blog                           Yeni yazı (danisan)
PUT    /api/blog/[id]                      Güncelle (danisan)
PUT    /api/blog/[id]/gonder              Admin onayına gönder
PUT    /api/blog/[id]/onayla             Admin onaylar
PUT    /api/blog/[id]/reddet             Admin reddeder (+ reason)
DELETE /api/blog/[id]

GET    /api/testler                        Test listesi (public)
GET    /api/testler/[slug]                 Test detay + sorular (public)
POST   /api/testler/sonuc                  Test sonucu kaydet
GET    /api/testler/gecmis                 Geçmiş sonuçlar (musteri)

GET    /api/kaynaklar                      (public)
POST   /api/kaynaklar                      (admin)
```

### Değerlendirme
```
POST   /api/degerlendirmeler              Yorum yaz (musteri, seans sonrası)
GET    /api/degerlendirmeler/[danisanId]  Danışman yorumları (public)
PUT    /api/degerlendirmeler/[id]/yenit   Danışman yanıt yazar (danisan)
PUT    /api/degerlendirmeler/[id]/gizle   Admin: gizle
```

### Danışan Araçları
```
GET    /api/gunluk                         Ruh hali kayıtları
POST   /api/gunluk                         Yeni kayıt
PUT    /api/gunluk/paylasim               Danışmanla paylaş toggle

GET    /api/odevler                        Ödevler listesi
POST   /api/odevler                        Ödev gönder (danisan)
PUT    /api/odevler/[id]/tamamla           Tamamla (musteri)

GET    /api/onboarding-formlar/[danisanId] Formu getir
POST   /api/onboarding-formlar/yanit       Yanıtla
```

### Fatura
```
GET    /api/fatura                        Kullanıcının fatura listesi
GET    /api/fatura/[id]/pdf               PDF fatura indir / önizle
POST   /api/fatura/olustur/[randevuId]    Seans sonrası otomatik fatura oluştur (server)
POST   /api/fatura/kurumsal/[donem]       Kurumsal aylık toplu fatura oluştur (cron)
GET    /api/fatura/xlsx/[kurumsal_id]     Kurumsal XLSX export
```
```
GET    /api/bildirimler                    Kullanıcı bildirimleri
PUT    /api/bildirimler/[id]/oku
PUT    /api/bildirimler/tumunu-oku
GET    /api/bildirim-tercihleri
PUT    /api/bildirim-tercihleri
POST   /api/bildirimler/duyuru            Admin: toplu duyuru
```

### Kurumsal
```
GET    /api/kurumsal/rapor                 Anonim kullanım raporu
GET    /api/kurumsal/rapor/xlsx            XLSX export
POST   /api/kurumsal/davet                 Davet kodu oluştur
POST   /api/kurumsal/katil                 Davet koduyla katıl
PUT    /api/kurumsal/lisans                Lisans sayısı güncelle
GET    /api/kurumsal/butce                 Çalışan bazlı bütçe listesi
PUT    /api/kurumsal/butce/[userId]        Çalışan bütçesini güncelle
GET    /api/kurumsal/butce/ozet            Bu ay harcanan / kalan bütçe özeti
```

### Takvim Senkronizasyonu
```
GET    /api/takvim/sync/google/authorize   Google OAuth başlat
GET    /api/takvim/sync/google/callback    Google OAuth callback + token kaydet
GET    /api/takvim/sync/outlook/authorize  Outlook OAuth başlat
GET    /api/takvim/sync/outlook/callback   Outlook OAuth callback + token kaydet
DELETE /api/takvim/sync/[provider]        Bağlantıyı kes + token sil
POST   /api/takvim/sync/guncelle          Manuel senkronizasyon tetikle
```

### Webinar
```
GET    /api/webinar                        Yayındaki webinarlar listesi (public)
GET    /api/webinar/[id]                   Webinar detay (public)
POST   /api/webinar                        Webinar oluştur (danisan, admin)
PUT    /api/webinar/[id]                   Güncelle
PUT    /api/webinar/[id]/yayinla           Yayına al
PUT    /api/webinar/[id]/iptal             İptal et
POST   /api/webinar/[id]/kayit            Webinara kayıt ol + ödeme (musteri)
GET    /api/webinar/[id]/katilimcilar      Katılımcı listesi (danisan, admin)
```

### Grup Seans
```
POST   /api/grup-seans/kayit/[randevuId]  Grup seansına kayıt + ödeme
GET    /api/grup-seans/[randevuId]/durum  Mevcut katılımcı sayısı + min kontrol
DELETE /api/grup-seans/kayit/[id]         Kayıttan çıkılırsa iade akışı
```
GET    /api/affiliate/istatistik
GET    /api/affiliate/kazanclar
POST   /api/affiliate/basvuru
GET    /api/affiliate/link                 Referral link oluştur
POST   /api/affiliate/click               Tıklama logla
```

### Admin
```
GET    /api/admin/istatistik               Dashboard verileri
GET    /api/admin/kullanicilar
PUT    /api/admin/kullanicilar/[id]/dondur
PUT    /api/admin/kullanicilar/[id]/aktif
DELETE /api/admin/kullanicilar/[id]

GET    /api/admin/danismanlar/basvurular
PUT    /api/admin/danismanlar/[id]/onayla
PUT    /api/admin/danismanlar/[id]/reddet

GET    /api/admin/ayarlar
PUT    /api/admin/ayarlar

GET    /api/admin/raporlar/[type]          PDF + XLSX export (type: komisyon | gelir | vergi | affiliate | kurumsal)
GET    /api/admin/loglar                   Audit log listesi (filtreli, max 90 gün)
POST   /api/admin/churn-tarama            Churn riski hesapla ve mail at
```

### Cron (Vercel Cron — server only)
```
POST   /api/cron/hatirlatma               Randevu hatırlatma zinciri (24h + 2h + 15dk)
POST   /api/cron/payout                   Haftalık danışman ödemesi (Cuma)
POST   /api/cron/churn                    14 gün giriş yapmayan kullanıcılara mail
POST   /api/cron/kurumsal-fatura          Ay sonu kurumsal fatura oluştur
POST   /api/cron/log-temizlik             90 günden eski audit logları sil
POST   /api/cron/butce-sifirla            Her ay 1'inde sessions_used_this_month sıfırla
POST   /api/cron/ip-temizlik              Süresi geçmiş IP ban'ları sil
```

### Chatbot / AI Eşleştirme
```
POST   /api/chatbot/mesaj                  Kullanıcı mesajı al, yanıt üret
POST   /api/chatbot/oneri                  Danışman önerisi (tercih objesiyle filtreli)
```

### Sistem
```
GET    /api/health                         Health check
POST   /api/webhook/iyzico                 iyzico webhook
POST   /api/webhook/daily                  Daily.co webhook
GET    /api/sitemap                        Dinamik sitemap.xml
```

---

## Middleware Rol Kontrol Matrisi

| Route Prefix | İzin Verilen Roller |
|---|---|
| `/admin/*` | admin |
| `/danisan/*` | danisan |
| `/panelim/*` | musteri |
| `/kurumsal-panel/*` | kurumsal |
| `/affiliate-panel/*` | affiliate |
| `/api/admin/*` | admin |
| `/api/danismanlar/profil` PUT | danisan |
| `/api/randevular` POST | musteri, danisan |
| `/api/randevular/[id]/onayla` | danisan |
| `/api/randevular/[id]/no-show` | danisan |
| `/api/odeme/*` | musteri (initiate), admin (payout) |
| `/api/video/oda-olustur` | server only |
| `/api/video/token/*` | musteri, danisan (sadece randevu sahibi) |
| `/api/fatura/olustur/*` | server only |
| `/api/fatura/kurumsal/*` | admin, kurumsal |
| `/api/degerlendirmeler` POST | musteri |
| `/api/degerlendirmeler/[id]/yenit` | danisan |
| `/api/degerlendirmeler/[id]/gizle` | admin |
| `/api/kurumsal/butce/*` | kurumsal |
| `/api/kurumsal/rapor/xlsx` | kurumsal |
| `/api/admin/loglar` | admin |
| `/api/cron/*` | server only (Vercel Cron secret header) |
| `/api/auth/change-password` | musteri, danisan, kurumsal, admin |
| `/api/auth/change-email` | musteri, danisan, kurumsal, admin |
| `/api/takvim/sync/*` | danisan |
| `/api/webinar` POST | danisan, admin |
| `/api/webinar/[id]/kayit` | musteri |
| `/api/webinar/[id]/katilimcilar` | danisan, admin |
| `/api/grup-seans/kayit/*` | musteri |
| `/api/grup-seans/[id]/durum` | musteri, danisan, admin |
