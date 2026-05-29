# IMPLEMENTATION_PLAN.md — Adım Adım Uygulama Planı

> Bu bir DOKÜMAN dosyasıdır. docs/ klasöründe durur, kod klasörlerine taşıma.
> CLAUDE.md'deki ÇALIŞMA KURALI geçerlidir: Her adımda sadece bir dosya veya görev.
> Her adım bittikten sonra "tamamlandı, devam edeyim mi?" de.
> Faz bitiminde `npm run type-check` ve `npm run build` çalıştır.

---

## FAZ 1 — Proje Altyapısı ve Auth

### 1.1 Paket Kurulumu
- [x] `npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"`
- [x] `npx shadcn@latest init`
- [x] `npm install @supabase/supabase-js @supabase/ssr`
- [x] `npm install react-hook-form zod @hookform/resolvers`
- [x] `npm install zustand @tanstack/react-query`
- [x] `npm install framer-motion`
- [x] `npm install resend react-email`
- [x] `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image`
- [x] `npm install recharts`
- [x] `npm install date-fns`
- [x] `npm install react-intersection-observer`
- [x] `npm install @react-pdf/renderer`

### 1.2 Yapılandırma Dosyaları
- [x] `.env.local` oluştur — CLAUDE.md'deki şablondan, tüm değişkenleri dahil et
- [x] `tsconfig.json` — strict mode aktif et
- [x] `next.config.ts` — Supabase Storage image domain ekle, güvenlik header'ları
- [x] `vercel.json` — tüm cron job'lar (CLAUDE.md'deki schedule'ları kullan)
- [x] `.gitignore` — `.env.local` dahil mi kontrol et

### 1.3 Supabase Kurulumu
- [x] `lib/supabase/client.ts` — browser client
- [x] `lib/supabase/server.ts` — server component client
- [x] `lib/supabase/middleware.ts` — middleware client
- [x] `supabase/migrations/001_initial_schema.sql` — SCHEMA.md'deki tüm tabloları yaz
- [x] `supabase/migrations/002_rls_policies.sql` — her tablo için RLS; hassas veri tablolarına kısıtlayıcı politika
- [x] `supabase/seed.sql` — platform_ayarlari (tüm değerler), rozet_tanim, kriz_kelimeleri
- [x] `npx supabase db push` çalıştır
- [x] `npx supabase gen types typescript --local > types/supabase.ts`

### 1.4 Middleware ve Route Koruması
- [x] `middleware.ts` — ROUTES.md'deki rol kontrol matrisini uygula + IP blacklist kontrolü

### 1.5 Global Stiller
- [x] `app/globals.css` — CLAUDE.md'deki CSS değişkenlerini ekle (renkler, dark mode, prefers-reduced-motion)

### 1.6 Auth Yardımcıları
- [x] `lib/auth/requireRole.ts` — rol kontrol fonksiyonu; tüm API route'larda kullanılacak
- [x] `lib/auth/bruteForce.ts` — başarısız giriş sayacı; 5→15 dk kilit, 50→24 saat IP ban; ip_blacklist tablosuna yaz
- [x] `lib/auth/encrypt.ts` — AES-256 şifreleme/çözme yardımcısı (banka IBAN, takvim token için)

### 1.7 Ortak Bileşenler
- [x] `components/shared/Header.tsx` — sabit header, giriş/kayıt butonları, dark mode toggle
- [x] `components/shared/Footer.tsx`
- [x] `components/shared/PageTransition.tsx` — Framer Motion AnimatePresence wrapper
- [x] `components/shared/LoadingSkeleton.tsx`
- [x] `components/shared/ErrorBoundary.tsx`
- [x] `components/shared/ChatbotWrapper.tsx` — sağ alt sabit, şimdilik boş
- [x] `components/shared/Toast.tsx` — shadcn Toaster + Framer Motion animasyonu

### 1.8 Auth Sayfaları
- [x] `app/(auth)/giris/page.tsx` — email+şifre formu, Google OAuth butonu, kilit geri sayımı (wf-01.html referans al)
- [x] `app/(auth)/kayit/page.tsx` — müşteri kayıt formu; zod validasyon; KVKK checkbox → kvkk_accepted_at + kvkk_ip log
- [x] `app/(auth)/danisan-kayit/page.tsx` — 4 adımlı wizard bileşeni
- [x] `app/(auth)/danisan-kayit/page.tsx` Adım 1 — kişisel bilgiler + yaş grupları checkbox
- [x] `app/(auth)/danisan-kayit/page.tsx` Adım 2 — uzmanlık + çalışma yöntemi
- [x] `app/(auth)/danisan-kayit/page.tsx` Adım 3 — belge yükleme (10 MB limit; client + server kontrol)
- [x] `app/(auth)/danisan-kayit/page.tsx` Adım 4 — banka bilgileri (AES-256 ile şifrele, loga yazma)
- [x] `app/(auth)/kurumsal-kayit/page.tsx` — şirket bilgileri + varsayılan çalışan bütçesi
- [x] `app/(auth)/sifremi-unuttum/page.tsx`
- [x] `app/(auth)/sifremi-sifirla/page.tsx` — query-param tabanlı (token_hash + type)
- [x] `app/(auth)/e-posta-dogrulama/page.tsx` — query-param tabanlı (token_hash + type)
- [x] `app/(auth)/onay-bekleniyor/page.tsx`

### 1.9 Auth API Route'ları
- [x] `app/api/auth/register/musteri/route.ts`
- [x] `app/api/auth/register/danisan/route.ts`
- [x] `app/api/auth/register/kurumsal/route.ts`
- [x] `app/api/auth/verify-email/route.ts`
- [x] `app/api/auth/forgot-password/route.ts`
- [x] `app/api/auth/reset-password/route.ts`
- [x] `app/api/auth/change-password/route.ts` — mevcut şifre veya OTP zorunlu
- [x] `app/api/auth/change-email/route.ts` — mevcut şifre veya OTP zorunlu
- [x] `app/api/auth/ip-blacklist/kontrol/route.ts`

### 1.10 Everboarding
- [x] `lib/everboarding/adimlar.ts` — müşteri ve danışman görev listesi; tamamlanma kontrolü; 3/7/14. gün hatırlatma tetikleyicisi

**✅ Faz 1 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 2 — Danışman Profilleri ve Keşif

### 2.1 Danışman Liste API
- [x] `app/api/danismanlar/route.ts` — filtreli GET; profile_completion_percent=100 ve profile_published=true kontrolü

### 2.2 Danışman Liste Sayfası
- [x] `components/public/DanismanKarti.tsx` — kart bileşeni
- [x] `components/public/FiltreSidebar.tsx` — tüm filtreler + yaş grubu
- [x] `app/(public)/danismanlar/page.tsx` — SSR, filtre sidebar, sonsuz scroll; wf-03.html referans al
- [x] `components/public/DanismanlarIstemci.tsx` — sonsuz scroll client wrapper

### 2.3 Danışman Profil API'leri
- [x] `app/api/danismanlar/[slug]/route.ts`
- [x] `app/api/danismanlar/[slug]/takvim/route.ts` — 30 günlük müsaitlik

### 2.4 Danışman Profil Sayfası
- [x] `app/(public)/danismanlar/[slug]/page.tsx` — SSR, generateMetadata, Person structured data; wf-04.html referans al

### 2.5 Şehir SEO Sayfaları
- [x] `app/(public)/[sehir]-psikolog/page.tsx` — SSG, generateStaticParams, LocalBusiness structured data

### 2.6 AI Eşleştirme Chatbotu
- [x] `app/api/chatbot/mesaj/route.ts` — Anthropic API (claude-sonnet-4-6)
- [x] `app/api/chatbot/oneri/route.ts` — danışman önerisi
- [x] `components/shared/Chatbot.tsx` — sağ alt drawer, 6 soruluk akış

**✅ Faz 2 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 3 — Randevu Sistemi

### 3.1 Takvim Yardımcıları
- [x] `lib/takvim/musaitlik.ts` — müsaitlik hesaplama
- [x] `lib/takvim/cakisma.ts` — çakışma kontrolü
- [x] `lib/takvim/sync.ts` — Google/Outlook token şifreli saklama

### 3.2 Takvim Sync API'leri
- [x] `app/api/takvim/sync/google/authorize/route.ts`
- [x] `app/api/takvim/sync/google/callback/route.ts`
- [x] `app/api/takvim/sync/outlook/authorize/route.ts`
- [x] `app/api/takvim/sync/outlook/callback/route.ts`
- [x] `app/api/takvim/sync/guncelle/route.ts`

### 3.3 Müsaitlik API'leri
- [x] `app/api/danismanlar/musaitlik/route.ts` — GET + PUT
- [x] `app/api/danismanlar/izin/route.ts` — POST + DELETE

### 3.4 Randevu Alma Sayfası
- [x] `app/(musteri)/panelim/randevu-al/[danisanSlug]/page.tsx` — çok adımlı sihirbaz; wf-05.html referans al
- [x] Adım bileşeni: SeansTipiSec
- [x] Adım bileşeni: TarihSaatSec
- [x] Adım bileşeni: PaketSec
- [x] Adım bileşeni: OdemeAdimi (Faz 4'te doldurulur)

### 3.5 Randevu API'leri
- [x] `app/api/randevular/route.ts` — GET (liste) + POST (oluştur)
- [x] `app/api/randevular/[id]/route.ts` — GET detay
- [x] `app/api/randevular/[id]/onayla/route.ts`
- [x] `app/api/randevular/[id]/reddet/route.ts`
- [x] `app/api/randevular/[id]/iptal/route.ts` — iade hesabı dahil
- [x] `app/api/randevular/[id]/tamamla/route.ts`
- [x] `app/api/randevular/[id]/no-show/route.ts`
- [x] `app/api/randevular/tekrarlayan/route.ts` — max 12 hafta

### 3.6 Bekleme Listesi
- [x] `lib/bekleme/bildirim.ts` — iptal → sıradakine otomatik bildirim
- [x] `app/api/bekleme-listesi/route.ts` — POST
- [x] `app/api/bekleme-listesi/[id]/route.ts` — DELETE

### 3.7 Grup Seans
- [x] `lib/grup-seans/kapasite.ts` — minimum katılımcı kontrolü; ulaşılmazsa iade
- [x] `app/api/grup-seans/kayit/[randevuId]/route.ts`
- [x] `app/api/grup-seans/[randevuId]/durum/route.ts`
- [x] `app/api/grup-seans/kayit/[id]/route.ts` — DELETE + iade (kayit/[randevuId]/route.ts ile birleştirildi)

**✅ Faz 3 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 4 — Ödeme + PDF Fatura

### 4.1 iyzico Yardımcıları
- [x] `lib/iyzico/client.ts` — SDK wrapper (server-only)
- [x] `lib/iyzico/komisyon.ts` — komisyon hesaplama
- [x] `lib/iyzico/iade.ts` — iade politikası hesaplama

### 4.2 Ödeme API'leri
- [x] `app/api/odeme/baslat/route.ts` — pre-authorization
- [x] `app/api/odeme/onayla/route.ts` — capture; başarılıysa fatura tetikle
- [x] `app/api/odeme/iptal/route.ts` — iptal + iade
- [x] `app/api/odeme/gecmis/route.ts`
- [x] `app/api/odeme/payout/isle/route.ts` — admin haftalık payout
- [x] `app/api/webhook/iyzico/route.ts`

### 4.3 PDF Fatura
- [x] `lib/fatura/numara.ts` — MBR-YYYY-NNNNNN formatı
- [x] `lib/fatura/template.tsx` — React PDF şablonu
- [x] `lib/fatura/olustur.ts` — PDF üret + Storage'a kaydet + URL döndür
- [x] `lib/fatura/danisan-ozet.ts` — danışman aylık özet PDF
- [x] `app/api/fatura/olustur/[randevuId]/route.ts` — server-only
- [x] `app/api/fatura/route.ts` — kullanıcının fatura listesi
- [x] `app/api/fatura/[id]/pdf/route.ts` — PDF stream

### 4.4 Randevu Ödeme Adımı
- [x] OdemeAdimi bileşenini tamamla (Faz 3'te iskelet kurulmuştu)

**✅ Faz 4 Bitti mi?** Sandbox test → `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 5 — Video Görüşme

### 5.1 Daily.co Yardımcıları
- [x] `lib/dailyco/client.ts` — API wrapper (server-only)
- [x] `lib/dailyco/oda.ts` — oda oluştur/sil; grup/webinar için max_participants; çift-aile için max 3
- [x] `lib/dailyco/token.ts` — token üret; partner_id varsa ayrı token
- [x] `lib/dailyco/fallback.ts` — erişilemez hata yönetimi + Türkçe mesaj

### 5.2 Video API'leri
- [x] `app/api/video/oda-olustur/route.ts` — server-only
- [x] `app/api/video/token/[randevuId]/route.ts` — 10 dk önce aktif kontrolü
- [x] `app/api/webhook/daily/route.ts`

### 5.3 Video Bileşeni
- [x] `components/shared/VideoGorusme.tsx` — Daily.co embed; kayıt kapalı notu

### 5.4 Asenkron Seans
- [x] `app/api/mesajlar/asenkron/route.ts`

**✅ Faz 5 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 6 — Admin Paneli

### 6.1 Admin Dashboard
- [x] `app/api/admin/istatistik/route.ts` — dashboard verileri
- [x] `app/(admin)/admin/dashboard/page.tsx` — recharts grafikleri; wf-07.html referans al

### 6.2 Kullanıcı Yönetimi
- [x] `app/(admin)/admin/kullanicilar/page.tsx`
- [x] `app/(admin)/admin/kullanicilar/[id]/page.tsx`
- [x] `app/api/admin/kullanicilar/route.ts`
- [x] `app/api/admin/kullanicilar/[id]/dondur/route.ts`
- [x] `app/api/admin/kullanicilar/[id]/aktif/route.ts`

### 6.3 Danışman Yönetimi
- [x] `app/(admin)/admin/danismanlar/basvurular/page.tsx`
- [x] `app/(admin)/admin/danismanlar/[id]/page.tsx`
- [x] `app/api/admin/danismanlar/basvurular/route.ts`
- [x] `app/api/admin/danismanlar/[id]/onayla/route.ts`
- [x] `app/api/admin/danismanlar/[id]/reddet/route.ts`

### 6.4 Randevu Yönetimi
- [x] `app/(admin)/admin/randevular/page.tsx`

### 6.5 Finansal Yönetim
- [x] `app/(admin)/admin/finans/page.tsx` — wf-08.html referans al
- [x] `app/(admin)/admin/finans/faturalar/page.tsx`
- [x] `app/api/admin/raporlar/[type]/route.ts` — CSV (komisyon, gelir, vergi, affiliate, kurumsal)

### 6.6 İçerik Yönetimi
- [x] `app/(admin)/admin/icerik/page.tsx` — blog, test, kaynak, SSS, webinar sekmeleri

### 6.7 Diğer Admin Sayfaları
- [x] `app/(admin)/admin/bildirimler/page.tsx`
- [x] `app/(admin)/admin/raporlar/page.tsx`
- [x] `app/(admin)/admin/raporlar/loglar/page.tsx`
- [x] `app/(admin)/admin/ayarlar/page.tsx`
- [x] `app/(admin)/admin/kurumsal/page.tsx`
- [x] `app/(admin)/admin/affiliate/page.tsx`
- [x] `app/api/admin/ayarlar/route.ts` — GET + PUT
- [x] `app/api/admin/loglar/route.ts`
- [x] `app/api/admin/churn-tarama/route.ts`

**✅ Faz 6 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 7 — Danışman Paneli

### 7.1 Dashboard
- [x] `app/(danisan)/danisan/dashboard/page.tsx`

### 7.2 Takvim
- [x] `app/(danisan)/danisan/takvim/page.tsx` — wf-06.html referans al

### 7.3 Randevular
- [x] `app/(danisan)/danisan/randevular/page.tsx`
- [x] `app/(danisan)/danisan/randevular/[id]/page.tsx`
- [x] `app/api/degerlendirmeler/[id]/yenit/route.ts` — yorum yanıtı

### 7.4 Danışan Yönetimi
- [x] `app/(danisan)/danisan/danisanlar/page.tsx`
- [x] `app/(danisan)/danisan/danisanlar/[id]/page.tsx`

### 7.5 Mesajlaşma
- [x] `app/(danisan)/danisan/mesajlar/page.tsx`
- [x] `app/(danisan)/danisan/mesajlar/[conversationId]/page.tsx`
- [x] `app/api/mesajlar/route.ts` — GET konuşmalar + POST mesaj
- [x] `app/api/mesajlar/[conversationId]/route.ts`
- [x] `app/api/mesajlar/[id]/oku/route.ts`

### 7.6 Finans
- [x] `lib/fatura/danisan-ozet.ts` (Faz 4'te kurulmuştu, mevcut)
- [x] `app/(danisan)/danisan/finans/page.tsx` — wf-09.html referans al
- [x] `app/api/danisan/finans/route.ts` — GET ?donem&sayfa
- [x] `components/danisan/FinansKlient.tsx`

### 7.7 Blog
- [x] `app/(danisan)/danisan/blog/page.tsx`
- [x] `app/(danisan)/danisan/blog/yeni/page.tsx`
- [x] `app/(danisan)/danisan/blog/[id]/duzenle/page.tsx`
- [x] `app/api/blog/route.ts` — GET public + POST
- [x] `app/api/blog/[id]/route.ts` — GET + PUT + DELETE
- [x] `app/api/blog/[id]/gonder/route.ts`
- [x] `app/api/blog/[id]/onayla/route.ts`
- [x] `app/api/blog/[id]/reddet/route.ts`
- [x] `components/danisan/BlogListeKlient.tsx`
- [x] `components/danisan/BlogEditorKlient.tsx`

### 7.8 Profil
- [x] `app/(danisan)/danisan/profil/page.tsx` — profil tamamlanma göstergesi, %100 olmadan yayın kapalı
- [x] `app/api/danismanlar/profil/route.ts` — GET + PUT
- [x] `components/danisan/ProfilKlient.tsx`

### 7.9 Araçlar
- [x] `app/(danisan)/danisan/onboarding-formlar/page.tsx`
- [x] `app/api/onboarding-formlar/yanit/route.ts`
- [x] `app/(danisan)/danisan/odevler/page.tsx`
- [x] `app/api/odevler/route.ts` — GET + POST
- [x] `app/api/odevler/[id]/tamamla/route.ts`
- [x] `app/(danisan)/danisan/supervizyon/page.tsx`
- [x] `app/(danisan)/danisan/performans/page.tsx`
- [x] `app/(danisan)/danisan/webinar/page.tsx`
- [x] `app/(danisan)/danisan/ayarlar/page.tsx`

**✅ Faz 7 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 8 — Müşteri Paneli

### 8.1 Dashboard
- [x] `app/(musteri)/panelim/dashboard/page.tsx` — wf-02.html referans al

### 8.2 Danışman Bulma
- [x] `app/(musteri)/panelim/danismanlar/page.tsx`

### 8.3 Randevular
- [x] `app/(musteri)/panelim/randevularim/page.tsx`
- [x] `app/(musteri)/panelim/randevularim/[id]/page.tsx`
- [x] `app/api/degerlendirmeler/route.ts` — POST yorum
- [x] `app/api/degerlendirmeler/[danisanId]/route.ts` — GET public

### 8.4 Mesajlar
- [x] `app/(musteri)/panelim/(main)/mesajlar/page.tsx`
- [x] `app/(musteri)/panelim/(main)/mesajlar/[conversationId]/page.tsx`
- [x] `components/musteri/MusteriMesajlarKlient.tsx`
- [x] `components/musteri/MusteriMesajlasmaKlient.tsx`

### 8.5 Günlük ve Ruh Hali
- [x] `app/(musteri)/panelim/gunluk/page.tsx` — kriz protokolü dahil; wf-10.html referans al
- [x] `app/api/gunluk/route.ts` — GET + POST
- [x] `app/api/gunluk/paylasim/route.ts` — toggle

### 8.6 Testler
- [x] `app/(musteri)/panelim/testler/page.tsx`
- [x] `app/(musteri)/panelim/testler/[slug]/page.tsx`
- [x] `app/api/testler/sonuc/route.ts`
- [x] `app/api/testler/gecmis/route.ts`

### 8.7 Ödevler ve Paketler
- [x] `app/(musteri)/panelim/odevler/page.tsx`
- [x] `app/(musteri)/panelim/paketlerim/page.tsx`

### 8.8 Gamification
- [x] `app/(musteri)/panelim/gamification/page.tsx`

### 8.9 Finans ve Webinar
- [x] `app/(musteri)/panelim/finans/page.tsx` — PDF fatura önizleme + indirme
- [x] `app/(musteri)/panelim/webinar/page.tsx`

### 8.10 Profil ve Danışman Değiştirme
- [x] `app/(musteri)/panelim/profil/page.tsx` — hesap sil + KVKK + OTP
- [x] `components/musteri/DanismanDegistirme.tsx` — gerekçe → 3 öneri → seç

**✅ Faz 8 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 9 — Blog + Testler + İçerik

### 9.1 Blog
- [x] `app/(public)/blog/page.tsx` — SSR, kategori, arama
- [x] `app/(public)/blog/[slug]/page.tsx` — SSR, dynamic meta, yazar kartı
- [x] `app/api/blog/[slug]/route.ts` — GET public detay (→ app/api/blog/slug/[slug]/route.ts olarak oluşturuldu; [id] ile çakışma önlendi)

### 9.2 Psikolojik Testler
- [x] `lib/testler/scoring.ts` — jsonb scoring logic
- [x] `app/(public)/testler/page.tsx`
- [x] `app/(public)/testler/[slug]/page.tsx`
- [x] `app/api/testler/route.ts` — GET liste
- [x] `app/api/testler/[slug]/route.ts` — GET detay + sorular

### 9.3 Kaynak Kütüphanesi
- [x] `app/(public)/kaynaklar/page.tsx`
- [x] `app/api/kaynaklar/route.ts` — GET public + POST admin

### 9.4 Webinar (Public)
- [x] `app/(public)/webinar/page.tsx`
- [x] `app/(public)/webinar/[id]/page.tsx`
- [x] `app/api/webinar/route.ts` — GET liste + POST
- [x] `app/api/webinar/[id]/route.ts` — GET detay + PUT
- [x] `app/api/webinar/[id]/yayinla/route.ts`
- [x] `app/api/webinar/[id]/iptal/route.ts`
- [x] `app/api/webinar/[id]/kayit/route.ts`
- [x] `app/api/webinar/[id]/katilimcilar/route.ts`
- [x] `components/public/WebinarKayitButonu.tsx`

**✅ Faz 9 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 10 — Bildirimler

### 10.1 Mail Şablonları
- [x] `lib/resend/templates/kayit-aktivasyon.tsx`
- [x] `lib/resend/templates/danisan-onay.tsx`
- [x] `lib/resend/templates/danisan-red.tsx`
- [x] `lib/resend/templates/randevu-talep.tsx`
- [x] `lib/resend/templates/randevu-onay.tsx`
- [x] `lib/resend/templates/randevu-hatirlatma.tsx`
- [x] `lib/resend/templates/odeme-onay.tsx` — fatura PDF eki dahil
- [x] `lib/resend/templates/iade-onay.tsx`
- [x] `lib/resend/templates/sifre-sifirla.tsx`
- [x] `lib/resend/templates/churn.tsx`
- [x] `lib/resend/templates/everboarding.tsx`
- [x] `lib/resend/templates/kurumsal-butce-uyari.tsx`

### 10.2 SMS ve Merkezi Bildirim
- [x] `lib/netgsm/sms.ts` — SMS wrapper
- [x] `lib/bildirim/gonder.ts` — merkezi fonksiyon; kanal seç; delivery_status güncelle; max 3 yeniden deneme
- [x] `lib/bildirim/uygulama-ici.ts` — bildirimler tablosuna yaz + Supabase Realtime

### 10.3 Cron Job'lar
- [x] `app/api/cron/hatirlatma/route.ts` — 24h + 2h + 15dk
- [x] `app/api/cron/payout/route.ts`
- [x] `app/api/cron/churn/route.ts`
- [x] `app/api/cron/kurumsal-fatura/route.ts`
- [x] `app/api/cron/log-temizlik/route.ts`
- [x] `app/api/cron/butce-sifirla/route.ts`
- [x] `app/api/cron/ip-temizlik/route.ts`

### 10.4 Bildirim API'leri ve UI
- [x] `app/api/bildirimler/route.ts`
- [x] `app/api/bildirimler/[id]/oku/route.ts`
- [x] `app/api/bildirimler/tumunu-oku/route.ts`
- [x] `app/api/bildirim-tercihleri/route.ts` — GET + PUT
- [x] `app/api/bildirimler/duyuru/route.ts` — admin toplu duyuru
- [x] Bildirim tercihleri UI (musteri/danisan ayarlar sayfasına ekle)

**✅ Faz 10 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 11 — Kurumsal + Affiliate

### 11.1 Kurumsal Panel
- [x] `app/(kurumsal)/kurumsal-panel/dashboard/page.tsx`
- [x] `app/(kurumsal)/kurumsal-panel/davetler/page.tsx`
- [x] `app/(kurumsal)/kurumsal-panel/butce/page.tsx`
- [x] `app/(kurumsal)/kurumsal-panel/raporlar/page.tsx`
- [x] `app/(kurumsal)/kurumsal-panel/faturalar/page.tsx`
- [x] `app/(kurumsal)/kurumsal-panel/ayarlar/page.tsx`

### 11.2 Kurumsal Yardımcılar
- [x] `lib/kurumsal/davet.ts`
- [x] `lib/kurumsal/rapor.ts`
- [x] `lib/kurumsal/butce.ts` — ödeme sırasında limit kontrolü; bakiye yetersizliğinde bireysel ödeme seçeneği
- [x] `lib/kurumsal/fatura.ts` — aylık PDF + XLSX üretimi

### 11.3 Kurumsal API'leri
- [x] `app/api/kurumsal/rapor/route.ts`
- [x] `app/api/kurumsal/rapor/xlsx/route.ts`
- [x] `app/api/kurumsal/davet/route.ts`
- [x] `app/api/kurumsal/katil/route.ts`
- [x] `app/api/kurumsal/lisans/route.ts`
- [x] `app/api/kurumsal/butce/route.ts`
- [x] `app/api/kurumsal/butce/[userId]/route.ts`
- [x] `app/api/kurumsal/butce/ozet/route.ts`

### 11.4 Affiliate Panel
- [x] `app/(affiliate)/affiliate-panel/dashboard/page.tsx`
- [x] `app/(affiliate)/affiliate-panel/linklerim/page.tsx`
- [x] `app/(affiliate)/affiliate-panel/kazanclar/page.tsx`
- [x] `app/(affiliate)/affiliate-panel/ayarlar/page.tsx`

### 11.5 Affiliate Yardımcıları ve API'leri
- [x] `lib/affiliate/utm.ts`
- [x] `app/api/affiliate/basvuru/route.ts`
- [x] `app/api/affiliate/link/route.ts`
- [x] `app/api/affiliate/click/route.ts`
- [x] `app/api/affiliate/istatistik/route.ts`
- [x] `app/api/affiliate/kazanclar/route.ts`

**✅ Faz 11 Bitti mi?** `npm run type-check` → `npm run build` → PROGRESS.md güncelle

---

## FAZ 12 — Gamification + PWA + SEO

### 12.1 Gamification
- [x] `lib/gamification/rozet.ts` — rozet kontrol ve verme
- [x] Tüm rozet trigger noktalarına `rozet.ts` çağrısı ekle (seans tamamlama, test, günlük giriş serisi)
- [x] `app/api/cron/hedef/route.ts` — haftalık hedef sıfırla

### 12.2 PWA
- [x] `public/manifest.json`
- [x] `public/sw.ts` — service worker
- [x] Offline: dashboard ve takvim sayfaları

### 12.3 SEO
- [x] `generateMetadata` tüm sayfalarda eksik olanları tamamla
- [x] Structured data: Person, LocalBusiness, FAQPage, BreadcrumbList
- [x] `app/sitemap.ts` — otomatik sitemap
- [x] `app/robots.ts`

### 12.4 Performans
- [x] `next/image` tüm görsellerde kontrol et
- [x] Core Web Vitals optimizasyonu (lazy load, code split)
- [x] Lighthouse audit: tüm sayfalar 90+

### 12.5 Erişilebilirlik (WCAG 2.1 AA)
- [x] aria-label, role, semantik HTML kontrol
- [x] Klavye navigasyonu ve focus ring kontrol
- [x] Form hata mesajları aria-describedby
- [x] Tüm görsellere alt metin
- [x] axe-core ile otomatik a11y taraması

**✅ Faz 12 Bitti mi?** `npm run type-check` → `npm run build` → Lighthouse → PROGRESS.md güncelle

---

## Kod Şablonları

### Her API Route
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'

export async function POST(req: Request) {
  const supabase = createServerClient()
  const user = await requireRole(supabase, ['admin'])
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    // iş mantığı
  } catch (error) {
    return Response.json({ error: 'İşlem başarısız' }, { status: 500 })
  }
}
```

### Dosya Yükleme Kontrolü
```typescript
const MAX_MB = 10
const file = formData.get('file') as File
if (file.size > MAX_MB * 1024 * 1024) {
  return Response.json({ error: `Maksimum ${MAX_MB} MB` }, { status: 400 })
}
```

### Cron Route Güvenliği
```typescript
if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Her Form
```typescript
const schema = z.object({ email: z.string().email() })
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

### Hassas Veri Loglama Yasağı
```typescript
// YAPMA: console.log(bankIban), console.log(cardToken)
// YAP:   console.log('İşlem başlatıldı', { randevuId })
```
