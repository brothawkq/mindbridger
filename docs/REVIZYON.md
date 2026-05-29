# REVIZYON.md — Kullanıcı Geri Bildirim Revizyonları

> Bu bir DOKÜMAN dosyasıdır. docs/ klasöründe durur, kod klasörlerine taşıma.
> CLAUDE.md'deki ÇALIŞMA KURALI geçerlidir: Her adımda sadece bir dosya veya görev.
> Her adım bittikten sonra "tamamlandı, devam edeyim mi?" de.
> Revizyon fazı bitiminde `npm run type-check` ve `npm run build` çalıştır.

Oluşturulma: 2026-05-27
Kaynak: Kullanıcı ekran görüntüleri + geri bildirim (oturum 22) + Claude Code otomatik tarama

---

## Kapsam Özeti

| # | Madde | Kaynak | Öncelik | Durum |
|---|---|---|---|---|
| R-01 | Next.js dev toolbar kaldırma | Kullanıcı | Kritik | ✅ Tamamlandı |
| R-02 | Ana sayfa tasarımı + admin içerik editörü | Kullanıcı | Yüksek | ✅ Tamamlandı |
| R-03 | Global tasarım animasyon/efekt iyileştirme | Kullanıcı | Orta | ✅ Tamamlandı |
| R-04 | Chatbot: draggable + history + 50 Q&A + rol bazlı | Kullanıcı | Orta | ✅ Tamamlandı |
| R-05 | Test hesapları (tüm roller) | Kullanıcı | Yüksek | ✅ Tamamlandı |
| R-06 | Rol bazlı kayıt maili şablonları | Kullanıcı | Düşük | ✅ Tamamlandı |
| R-07 | 8 eksik public sayfa (footer + sitemap 404) | Claude tarama | **Kritik** | ✅ Tamamlandı |
| R-08 | Admin sidebar kırık linkler (7 adet 404) | Claude tarama | **Kritik** | ✅ Tamamlandı |
| R-09 | Sitemap eksik rotalar (SEO kaybı) | Claude tarama | Yüksek | ✅ Tamamlandı |
| R-10 | `affiliate` pending durum boşluğu (proxy.ts) | Claude tarama | Orta | ✅ Tamamlandı |
| R-11 | `loading.tsx` + `error.tsx` eksik (UX) | Claude tarama | Orta | ✅ Tamamlandı |
| R-12 | Panel layout + sidebar tasarım (frame-card, unicode icon) | Kullanıcı | **Yüksek** | ✅ Tamamlandı |
| R-13 | Admin blog yazısı oluşturma / düzenleme sayfası eksik | Kullanıcı | **Yüksek** | ✅ Tamamlandı |

Uygulama sırası: R-01 ✅ → R-07 ✅ → R-08 ✅ → R-05 ✅ → R-09 ✅ → R-10 ✅ → R-11 ✅ → R-06 ✅ → R-12 ✅ → R-13 ✅ → R-04 ✅ → R-03 ✅ → **R-02**

---

## TASARIM KURALLARI — ASLA DEĞİŞTİRME

Tüm yeni dosyalar CLAUDE.md tasarım sistemi ile uyumlu olacak:

```
border-radius: YOK (0px)
primary renk: #212121
primary text: #FFFFFF
background: #F5F5F5
surface: #FFFFFF
border: 1.5px solid #E0E0E0  (standart)
border strong: 1.5px solid #212121  (vurgulu)
muted: #BDBDBD
font: system-ui, Arial, sans-serif
base font-size: 13px
buton padding: 11px
input padding: 9px 12px
```

### Tasarım Tonu: Kurumsal & Etkileyici
Talkspace / McKinsey tarzı: büyük sayılar, cesur başlıklar, yüksek kontrast.
Sıcak-empatik değil; güven ve otorite hissi.

### Animasyon Kuralları (CLAUDE.md'den)
- `useReducedMotion()` her animated component'ta zorunlu
- Sayfa geçişi: `opacity 0→1`, `y 12→0`, `duration 0.2s`, `ease easeOut`
- Kart hover: `y -2`, hafif `box-shadow`, `duration 0.15s`
- Liste stagger: `staggerChildren 0.05s`
- Scroll-trigger: `useInView` (react-intersection-observer) ile tetikle
- `prefers-reduced-motion` medya sorgusu globals.css'te zaten mevcut

---

## R-01: Next.js Dev Toolbar Kaldırma ✅

**Tamamlandı:** `next.config.ts` → `devIndicators: false` eklendi.

---

## R-05: Test Hesapları

**Neden bu önce:** Diğer revizyonlar gerçek oturumlarla test edilebilsin.

### Teknik Gereksinimler
- Supabase Admin Client kullan (`createAdminClient()`) — service_role key ile
- `email_confirm: true` ile doğrulama adımını atla
- Şifre bcrypt 12 tur (Supabase dahili) — `.env.local`'e yazma
- Seed script sadece `NODE_ENV !== 'production'` veya `--allow-seed` flag ile çalışsın
- `danisanlar` tablosunda danisan hesabı için tüm zorunlu alanlar dolu olacak
- `kurumsal_hesaplar` tablosunda kurumsal hesap için kayıt olacak

### Oluşturulacak Hesaplar

| E-posta | Rol | Durum | Ad Soyad | Şifre |
|---|---|---|---|---|
| admin@mindbridger.com | admin | active | Admin Kullanıcı | MindTest2024! |
| danisan@test.mindbridger.com | danisan | active | Ayşe Kaya | MindTest2024! |
| musteri@test.mindbridger.com | musteri | active | Mehmet Yılmaz | MindTest2024! |
| kurumsal@test.mindbridger.com | kurumsal | active | Zeynep Demir | MindTest2024! |
| affiliate@test.mindbridger.com | affiliate | active | Can Arslan | MindTest2024! |

### Adımlar

- [x] **R-05.1** `supabase/seeds/test_accounts.ts` oluştur
  - `import { createAdminClient } from "@/lib/supabase/admin"`
  - Her hesap için: `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
  - `profiles` tablosuna INSERT: `role`, `status: 'active'`, `first_name`, `last_name`
  - Danışan hesabı için `danisanlar` tablosuna INSERT:
    - `profile_id`, `slug: 'ayse-kaya-test'`, `title: 'Psikolog'`
    - `specialties: ['Anksiyete', 'Depresyon']`, `approach: ['BDT']`
    - `languages: ['Türkçe']`, `age_groups: ['Yetişkin']`
    - `is_online: true`, `price_individual: 400`, `profile_completion_percent: 100`
    - `profile_published: true`, `is_active: true`
    - `city: 'İstanbul'`, `bio: 'Test danışman hesabı'`
  - Kurumsal hesap için `kurumsal_hesaplar` tablosuna INSERT:
    - `profile_id`, `company_name: 'Test Şirketi A.Ş.'`
    - `employee_count: 50`, `monthly_budget_limit: 5000`
    - `status: 'active'`
  - Mevcut hesapları silme/üzerine yazma — `maybeSingle()` ile önce kontrol et
  - Hata varsa anlamlı mesaj yaz ve process.exit(1) ile çık
  - Başarılıysa giriş bilgilerini konsola yaz

- [x] **R-05.2** `package.json`'a script ekle:
  - `"seed:test": "npx tsx supabase/seeds/test_accounts.ts"`

- [x] **R-05.3** Script çalıştır: `npm run seed:test`
  - Çıktıda tüm 5 hesabın başarıyla oluşturulduğunu doğrula
  - Her rol için giriş yapıp doğru dashboard'a yönlendirildiğini manuel test et

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Admin: `/admin/dashboard` → erişim var
- Danışan: `/danisan/takvim` → erişim var
- Müşteri: `/panelim/dashboard` → erişim var
- Kurumsal: `/kurumsal-panel/dashboard` → erişim var
- Affiliate: `/affiliate-panel/dashboard` → erişim var

---

## R-06: Rol Bazlı Kayıt Maili Şablonları

### Sorun
Şu an `lib/resend/templates/kayit-aktivasyon.tsx` tek şablon, her rol alıyor.
Danışan: "Başvurun inceleniyor" bilgisi yok. Kurumsal: "Ekibimiz sizinle iletişime geçecek" yok.

### Teknik Gereksinimler
- Şablon tipi: `@react-email/components` (mevcut şablonlarla aynı)
- Tasarım: `kayit-aktivasyon.tsx` ile aynı stil (brandSection, divider, contentSection)
- Renk değerleri hardcode: `#212121`, `#FFFFFF`, `#F5F5F5`, `#BDBDBD`, `#E0E0E0`
- Her şablonda `PreviewProps` ile örnek veri
- Route'larda `await resend.emails.send(...)` çağrısı try/catch ile; hata mail gönderimini engellemez (loglayıp devam)

### Adımlar

- [x] **R-06.1** `lib/resend/templates/danisan-kayit-onay-bekleniyor.tsx` oluştur
  - Props: `{ isim: string }`  (aktivasyon URL'i yok — admin onaylayana kadar giremez)
  - Başlık: "Başvurunuz Alındı"
  - İçerik: "24-48 saat içinde belgeleriniz incelenir, onay sonrası giriş yapabilirsiniz"
  - CTA yok; sadece bilgilendirme + destek e-posta linki

- [x] **R-06.2** `lib/resend/templates/kurumsal-kayit-onay-bekleniyor.tsx` oluştur
  - Props: `{ isim: string; sirketAdi: string }`
  - Başlık: "Kurumsal Başvurunuz Alındı"
  - İçerik: "Ekibimiz 1-2 iş günü içinde sizinle iletişime geçecek"
  - CTA yok; destek e-posta

- [x] **R-06.3** `app/api/auth/register/danisan/route.ts` güncelle
  - Resend import eklendi; `danisan-kayit-onay-bekleniyor` şablonu import edildi
  - try/catch ile mail gönderimi; hata kayıt sürecini engellemez

- [x] **R-06.4** `app/api/auth/register/kurumsal/route.ts` güncelle
  - Resend import eklendi; `kurumsal-kayit-onay-bekleniyor` şablonu import edildi
  - `isim: contact_name` + `sirketAdi: company_name` gönderildi

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Danışan kayıt: konsol logunda "Mail gönderildi" + doğru şablon adı
- Kurumsal kayıt: aynı

---

## R-04: Chatbot Geliştirme

### Kapsam (Kullanıcı kararı: Rol bazlı farklı chatbot)

| Rol | Chatbot Davranışı |
|---|---|
| visitor (giriş yok) | Mevcut 6 soruluk danışman eşleştirme akışı |
| musteri | Hızlı butonlar: Randevu Al / Seanslarım / Ödeme → Serbest sohbet |
| danisan | Hızlı butonlar: Takvim / Gelirlerim / Destek → Serbest sohbet |
| admin, kurumsal, affiliate | Chatbot gösterilmez |

### Teknik Gereksinimler

**Rol Tespiti:**
- `ChatbotWrapper` → `app/layout.tsx`'te server component tarafından `userRole` prop olarak geçilecek
- `app/layout.tsx` → `createClient()` + `supabase.auth.getUser()` + `profiles` sorgusu
- `userRole: UserRole | null` tipinde prop; null = giriş yok = visitor

**Draggable Panel:**
- `@use-gesture/react` paketi kurulacak: `npm install @use-gesture/react`
- `useDrag` hook ile mouse + touch drag
- `useRef` ile panel pozisyon state'i tut (`{ x: number; y: number }`)
- Ekran sınırı kontrolü: `Math.max(0, Math.min(window.innerWidth - 320, x))`
- Son pozisyon `localStorage`'a kayıt: `mb_chatbot_pos`
- Sayfa yüklenince `localStorage`'dan pozisyon restore et

**Chat History:**
- `localStorage` key: `mb_chatbot_history`
- Saklanan veri: `{ faz: Faz; adimIndex: number; mesajlar: MesajItem[]; tercih: TercihProfili; sohbetGecmis: SohbetGecmisItem[] }`
- Maksimum 30 mesaj sakla (eski mesajları kes)
- "Geçmişi temizle" butonu (🗑 ikonu, panel başlığında)
- Müşteri/danışan fazlarında farklı history key: `mb_chatbot_history_${userRole}`

**Minimize:**
- Panel başlığına tıklayınca `minimized` state toggle
- Minimize: sadece başlık çubuğu görünür (48px yükseklik), içerik gizli
- Minimize state localStorage'da: `mb_chatbot_minimized`

**Rate Limit:**
- Mevcut `/api/chatbot/mesaj` rate limit korunur (20 istek/dakika)
- Yeni müşteri/danışan sohbet endpoint'i ayrı route olacak: `/api/chatbot/panel-mesaj`
- Rate limit aynı: 20/dakika

### System Prompt Genişletme (50+ Q&A)

`app/api/chatbot/mesaj/route.ts` içindeki `SYSTEM_PROMPT` sabitine eklenir.
Aşağıdaki 10 konu kategorisinde en az 5'er örnek bilgi:

1. **Platform Kullanımı** — kayıt, giriş, profil düzenleme, şifre sıfırlama
2. **Danışman Bulma** — filtreler, eşleştirme kriterleri, profil doğrulama süreci
3. **Randevu Sistemi** — alma, değiştirme, iptal (24 saat kuralı), no-show
4. **Ödeme ve İade** — iyzico güvenlik, iade süreci (3-5 iş günü), fatura
5. **Online Terapi** — etkililik araştırmaları, gizlilik, güvenlik, KVKK
6. **Danışman Kimlik** — lisans doğrulama, admin onay süreci, puanlama sistemi
7. **Teknik Sorunlar** — video bağlantı, tarayıcı gereksinimleri, destek kanalı
8. **Seans Türleri** — bireysel, çift/aile, asenkron, ön görüşme (15 dk ücretsiz)
9. **Kriz Durumları** — 182 ALO Psikiyatri, 112, İntihar Önleme Hattı 182
10. **Kurumsal Paket** — çalışan bütçesi, İK raporu, şirket paketi fiyatlandırma

### Adımlar

- [ ] **R-04.1** `npm install @use-gesture/react`

- [ ] **R-04.2** `app/layout.tsx` güncelle
  - `createClient()` + `supabase.auth.getUser()` + `profiles.role` sorgusu ekle
  - `ChatbotDynamic` bileşenine `userRole` prop ekle (tip: `string | null`)
  - Sorgu hatası olursa `userRole = null` (visitor davranışı)

- [ ] **R-04.3** `components/shared/ChatbotDynamic.tsx` güncelle
  - `userRole: string | null` prop kabul et
  - `ChatbotWrapper`'a geçir

- [ ] **R-04.4** `components/shared/ChatbotWrapper.tsx` yeniden yaz
  - `userRole: string | null` prop
  - `useDrag` ile draggable panel
  - `minimized` state + başlığa tıklayınca toggle
  - `localStorage` history + pozisyon persist
  - "Geçmişi temizle" butonu (başlıkta, 🗑)
  - `admin`, `kurumsal`, `affiliate` rollerinde `return null`
  - `musteri` veya `danisan` ise → `PanelChatbot` bileşeni render et
  - `visitor` ise → mevcut `Chatbot` (danışman eşleştirme)

- [ ] **R-04.5** `components/shared/PanelChatbot.tsx` oluştur (musteri/danisan için)
  - `userRole: 'musteri' | 'danisan'` prop
  - Müşteri hızlı butonları: "Randevu Al →", "Seanslarımı Gör →", "Ödeme Geçmişi →", "Soru Sor"
  - Danışan hızlı butonları: "Takvimim →", "Gelirlerim →", "Hasta Mesajları →", "Soru Sor"
  - "Soru Sor" seçilince serbest metin input açılır
  - Serbest metin `/api/chatbot/panel-mesaj` route'una gönderilir
  - Rate limit hatası: "Çok fazla mesaj gönderildi, lütfen bekleyin" Türkçe mesajı

- [ ] **R-04.6** `app/api/chatbot/panel-mesaj/route.ts` oluştur
  - `requireAuth(supabase)` — giriş kontrolü (401 döner)
  - Rate limit: dakikada 20 istek (`chatbot_rate_limits` tablosu, mevcut fonksiyon)
  - Body: `{ mesaj: string; gecmis: SohbetGecmisItem[]; rol: 'musteri' | 'danisan' }`
  - `MUSTERI_SYSTEM_PROMPT` ve `DANISAN_SYSTEM_PROMPT` sabitleri (ayrı, özelleştirilmiş)
  - Müşteri system prompt: randevu alma rehberi, platform navigasyonu, terapi soruları
  - Danışan system prompt: takvim yönetimi, gelir soruları, platform kılavuzu
  - Kriz kelimeleri kontrolü: `kriz_kelimeleri` tablosundan çek → eşleşme varsa 182/112 yönlendir
  - Anthropic API çağrısı aynı şemada (mevcut `mesaj/route.ts`'den kopyala)
  - `security definer` yok — normal user client kullan

- [ ] **R-04.7** `app/api/chatbot/mesaj/route.ts` güncelle
  - `SYSTEM_PROMPT` sabitini 50+ Q&A ile genişlet (R-04 konu kategorileri)
  - Maksimum karakter sayısı `SYSTEM_PROMPT` için 8000 char sınırı

**YASAK:**
- Kullanıcının kişisel verisini (id, email, isim) system prompt'a yazma
- Chat history'i Supabase'e kaydetme (privacy) — sadece localStorage

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Visitor: chatbot açılır, 6 soru akışı çalışır
- Müşteri: chatbot açılır, hızlı butonlar görünür, serbest sohbet çalışır
- Danışan: farklı butonlar, serbest sohbet çalışır
- Admin girişiyle: chatbot görünmez
- Drag: panel taşınabilir, pozisyon sayfa yenilemede korunur
- Minimize: panel başlığa tıklayınca küçülür

---

## R-03: Global Tasarım Animasyon ve Efekt İyileştirme

### Sorun
Tasarım wireframe ile birebir aynı görünüyor. Hover efektleri tutarsız uygulanmış.

### Teknik Gereksinimler
- Yeni `box-shadow` CSS değişkenleri eklenmeli
- `react-intersection-observer` zaten yüklü — `useInView` kullanılacak
- countUp için harici paket KURMA — CSS animation + JS interval ile yap (bundle size)
- Tüm animasyonlar `useReducedMotion()` kontrolüyle

### CSS Değişkenleri (globals.css'e eklenecek)

```css
--mb-shadow: 0 2px 8px rgba(0,0,0,0.06);
--mb-shadow-hover: 0 6px 20px rgba(0,0,0,0.10);
--mb-shadow-strong: 0 8px 24px rgba(0,0,0,0.14);
```

### Adımlar

- [x] **R-03.1** `app/globals.css` güncelle
  - `--mb-shadow`, `--mb-shadow-hover`, `--mb-shadow-strong` değişkenlerini ekle
  - Dark mode karşılıkları: `rgba(255,255,255,0.04)` varyantları
  - `.card-hover` utility class: `transition: transform 0.15s, box-shadow 0.15s`
  - Hover: `transform: translateY(-2px); box-shadow: var(--mb-shadow-hover)`
  - `@media (prefers-reduced-motion)` içinde `.card-hover:hover` → transform sıfırlanır

- [x] **R-03.2** `hooks/useCountUp.ts` oluştur
  - `useCountUp(target: number, duration = 800, trigger = false): number`
  - `trigger` true olunca animasyon başlar (useInView ile entegrasyon için)
  - `useReducedMotion` kontrolü: reduced ise direkt `target` döndür, animasyon yok
  - `requestAnimationFrame` ile smooth artış (setInterval değil)
  - Return: mevcut sayı (`number`)

- [x] **R-03.3** `hooks/useTypewriter.ts` oluştur
  - `useTypewriter(texts: string[], typingSpeed = 60, pauseMs = 1800): string`
  - Birden fazla metin arasında döngü: yaz → bekle → sil → sonraki
  - `useReducedMotion` kontrolü: reduced ise texler[0] direkt döndür
  - Return: görüntülenecek mevcut string

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- `.card-hover` class'ı danışman kartlarında hover efekti veriyor
- `useCountUp` hook unit test edilebilir şekilde export edildi
- `useTypewriter` doğru cycling yapıyor

---

## R-02: Ana Sayfa Tasarımı + Admin İçerik Editörü

### Yaklaşım: Hibrit (Kod + DB İçerik)
- Tasarım / layout / animasyonlar → kodda hardcode
- Metinler / istatistikler / görünürlük → DB'den (`site_settings` tablosu)
- Admin `/admin/site-settings` sayfasından anahtar-değer çifti düzenlenir
- DB boşsa her bileşen kendi varsayılan değerini kullanır (fallback)

### Tasarım Tonu: Kurumsal & Etkileyici (McKinsey / Talkspace tarzı)

#### Bölüm Listesi (sırayla, scroll sırası)

```
1. HERO          — 60/40 split layout; büyük H1; typewriter alt satır; 4 stat grid
2. TICKER        — siyah şerit (bg:#212121); yatay kayan metin
3. NASIL ÇALIŞIR — 3 sütun; büyük dekoratif numara (01/02/03); scroll-trigger
4. NEDEN BİZ     — 2 sütun; 6 madde feature list; scroll-trigger
5. DANIŞMANLAR   — Supabase'den canlı 4 kart; scroll-trigger
6. YORUMLAR      — 3 testimonial kartı
7. KURUMSAL CTA  — border-strong çerçeveli bölüm
8. KAYIT CTA     — full-width #212121 bg; beyaz metin
9. SSS           — mevcut FAQ schema + accordion
```

### Veritabanı

- [x] **R-02.1** `supabase/migrations/013_site_settings.sql` oluştur
  - `site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, description TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`
  - RLS: SELECT herkes (anon dahil); INSERT/UPDATE/DELETE sadece admin role
  - Admin RLS politikası: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`
  - Seed: hero_title_1, hero_title_2, hero_subtitle, hero_cta_primary, hero_cta_secondary
  - Seed: stat_1_value ('500+'), stat_1_label ('Onaylı Danışman'), stat_2_value ('15.000+'), stat_2_label ('Tamamlanan Seans'), stat_3_value ('%97'), stat_3_label ('Memnuniyet'), stat_4_value ('7/24'), stat_4_label ('Destek')
  - Seed: ticker_text, how_title, why_title, consultants_title, testimonials_title, cta_final_title, cta_final_sub
  - Varsayılan değerler TR dilinde, kurumsal & etkileyici ton
  - `npx supabase db push` ve `npx supabase gen types typescript --local > types/supabase.ts`

### Ana Sayfa Bileşenleri

Her bileşen: `"use client"`, Framer Motion animasyon, `useReducedMotion()`, `useInView()` scroll-trigger.

- [ ] **R-02.2** `components/public/home/HeroSection.tsx`
  - Props: `settings: Record<string, string>` (DB'den gelenler) — fallback için tüm değerler optional
  - Layout: `display: grid; grid-template-columns: 1.5fr 1fr` (desktop), stacked (mobile < 768px)
  - Sol: küçük badge (`TÜRK TERAPİ PLATFORMU` uppercase), `<h1>` iki satır (settings'ten), `useTypewriter` hook ile dönen alt metin (bireysel/çift/travma/kariyer), 2 CTA buton
  - Sağ: 2×2 stat grid; her hücre `border: 1.5px solid #E0E0E0`; `useCountUp` + `useInView` ile sayaç animasyonu; büyük değer (32px bold) + küçük etiket
  - Arka plan: CSS dot grid pattern (background-image: radial-gradient)
  - Tüm sınır: `border-bottom: 1.5px solid #212121`

- [ ] **R-02.3** `components/public/home/StatsTicker.tsx`
  - `background: #212121; color: #FFFFFF`
  - CSS `@keyframes ticker-scroll` ile sonsuz yatay kayma (soldan sağa, 20s)
  - İçerik: `settings.ticker_text` veya varsayılan (500+ Danışman · İlk 15 dk Ücretsiz · KVKK Uyumlu · Onaylı Belgeler ·)
  - `prefers-reduced-motion`: animasyon durdurulur, metin statik gösterilir
  - `overflow: hidden; white-space: nowrap`

- [ ] **R-02.4** `components/public/home/HowItWorksSection.tsx`
  - Props: `settings: Record<string, string>`
  - 3 sütun: `display: grid; grid-template-columns: repeat(3, 1fr)` — her sütun arası `border-left: 1.5px solid #E0E0E0`
  - Her adım: büyük dekoratif numara `01` (48px, `#E0E0E0`), başlık, açıklama
  - `useInView` trigger → `staggerChildren 0.08s` Framer Motion
  - Adım içerikleri: (1) Profil Oluştur, (2) Danışman Seç, (3) Seans Yap
  - Mobile: stacked, dekoratif çizgi kaldırılır

- [ ] **R-02.5** `components/public/home/WhySection.tsx`
  - 2 sütun: sol feature list, sağ büyük vurgu kutusu
  - Feature list (6 madde): `✓` işaretli, `font-size: 13px`
    - Onaylı & Lisanslı Danışmanlar
    - Güvenli Online Ödeme (iyzico)
    - KVKK & Gizlilik Uyumlu
    - Video + Yüz Yüze Seçeneği
    - 24 Saat İptal Garantisi
    - Kurumsal Paketler Mevcut
  - Sağ kutu: `border: 1.5px solid #212121; padding: 32px`; büyük tırnak işareti + kısa güven mesajı

- [ ] **R-02.6** `components/public/home/FeaturedConsultantsSection.tsx`
  - Server component değil — `useEffect` ile `/api/danismanlar?limit=4&profile_published=true` fetch
  - Mevcut `DanismanKarti` bileşenini kullanır
  - Yatay scroll container (desktop) veya 2 sütun grid (mobile)
  - "Tüm Danışmanları Gör →" link: `/danismanlar`
  - Fetch hatası: sessizce gizle (section render edilmez)

- [ ] **R-02.7** `components/public/home/TestimonialsSection.tsx`
  - Props: hardcoded 3 testimonial (DB'den değil — admin editable değil, şimdilik)
  - Kart: `border: 1.5px solid #E0E0E0`, büyük tırnak `"`, metin, ad + unvan
  - `useInView` + stagger

- [ ] **R-02.8** `components/public/home/KurumsalCtaSection.tsx`
  - `border: 1.5px solid #212121; padding: 40px 48px`
  - 2 sütun: sol başlık+açıklama, sağ CTA butonu
  - Link: `/kurumsal` sayfasına

- [ ] **R-02.9** `components/public/home/FinalCtaSection.tsx`
  - `background: #212121; color: #FFFFFF`
  - Büyük başlık (settings'ten), alt metin (settings'ten), tek CTA butonu (beyaz bg, siyah metin)
  - Link: `/kayit`

- [ ] **R-02.10** `components/public/home/FaqSection.tsx`
  - Mevcut `page.tsx`'teki `faqSchema` verisini kullan
  - Accordion: `<details><summary>` ile native veya state toggle
  - `useInView` + stagger açılma animasyonu

### Ana Sayfa (Server Component)

- [ ] **R-02.11** `app/page.tsx` yeniden yaz
  - Server component (async)
  - `createClient()` ile `site_settings` tablosundan tüm satırları çek
  - `Record<string, string>` map'e dönüştür
  - JSON-LD schema'ları koru (websiteSchema, organizationSchema, faqSchema)
  - Tüm section bileşenlerini sırayla import et ve `settings` prop geçir
  - `export const revalidate = 3600` — saatte bir yeniden oluştur

### Admin İçerik Editörü

- [ ] **R-02.12** `app/api/admin/site-settings/route.ts` oluştur
  - GET: `requireRole(supabase, ['admin'])` → tüm `site_settings` kayıtlarını döndür
  - PATCH: `requireRole(supabase, ['admin'])` → body: `{ key: string; value: string }[]` — toplu güncelleme
  - Her key için `UPDATE site_settings SET value = $value, updated_at = NOW() WHERE key = $key`
  - Maksimum 500 char per value (güvenlik)
  - Audit log: `admin_log` tablosuna `action: 'site_settings_update'` yaz

- [ ] **R-02.13** `app/(admin)/admin/site-settings/page.tsx` oluştur
  - Server component: `requireRole` kontrolü, settings fetch
  - Başlık: "SİTE İÇERİK YÖNETİMİ"

- [ ] **R-02.14** `app/(admin)/admin/site-settings/SiteSettingsKlient.tsx` oluştur
  - `settings: { key: string; value: string; description: string | null }[]` prop
  - Inline düzenleme: her satır `key` (readonly), `description` (gray, readonly), `value` (input)
  - "Kaydet" butonu: `/api/admin/site-settings` PATCH ile toplu kayıt
  - Başarı: toast "İçerik güncellendi"
  - Hata: toast "Kayıt başarısız"
  - Değişiklik yoksa buton disabled

- [ ] **R-02.15** Admin sidebar'a link ekle
  - `components/admin/AdminSidebar.tsx` — "Site İçeriği" nav item ekle → `/admin/site-settings`

**Doğrulama:**
- `npx supabase db push` başarılı
- `tsc --noEmit` → 0 hata
- `npm run build` → ✅
- Ana sayfa: 9 bölüm görünür, boş değil
- Ticker animasyonu çalışıyor
- İstatistik sayaçları scroll'da tetikleniyor
- Danışman kartları yükleniyor
- Admin `/admin/site-settings` → hero başlığını değiştir → ana sayfada 1 saat içinde yansıyor
- Lighthouse SEO: 90+ (mevcut JSON-LD korundu)

---

---

## R-07: Eksik Public Sayfalar — Footer + Sitemap 404

**Kaynak:** Claude Code tarama — footer linkleri kontrol edildi.

### Sorun (KRİTİK)
`components/shared/Footer.tsx` aşağıdaki linkleri içeriyor ama karşılık gelen `page.tsx` dosyası YOK.
Ziyaretçi bu linklere tıkladığında Next.js 404 sayfasına düşüyor:

| URL | Footer'da Görünüyor | Sayfa Var mı? |
|---|---|---|
| `/hakkimizda` | "Hakkımızda" | ❌ |
| `/iletisim` | "İletişim" | ❌ |
| `/gizlilik-politikasi` | "Gizlilik Politikası" | ❌ |
| `/kvkk` | "KVKK Aydınlatma" | ❌ |
| `/sss` | "Sık Sorulan Sorular" | ❌ |
| `/fiyatlandirma` | "Fiyatlar" | ❌ (header'da da var) |
| `/kurumsal` | "Kurumsal Çözümler" | ❌ |
| `/affiliate` | "Affiliate Programı" | ❌ |

Header'da da `/fiyatlandirma` linki var — aynı sorun.

### Teknik Gereksinimler
- Her sayfa `app/(public)/[rota]/page.tsx` olarak oluşturulacak
- Server component (async değil — statik içerik)
- Her sayfada `export const metadata`: title, description, robots
- Tasarım: CLAUDE.md sistemi — `border: 1.5px solid #E0E0E0`, tipografi sistemi, keskin köşe
- Minimal içerik — sonradan admin editörüyle genişletilebilir
- SSS sayfası (`/sss`): mevcut `faqSchema` verisini kullanacak, accordion bileşeni

### Adımlar

- [x] **R-07.1** `app/(public)/hakkimizda/page.tsx` oluştur
  - Metadata: `"Hakkımızda | MindBridger"`
  - İçerik: misyon, vizyon, kurucu ekip placeholder, değerler
  - Statik metin

- [x] **R-07.2** `app/(public)/iletisim/page.tsx` oluştur
  - Metadata: `"İletişim | MindBridger"`
  - E-posta: `platform@mindbridger.com`
  - Basit iletişim formu: ad, email, mesaj (Resend ile gönder)
  - Form API: `app/api/iletisim/route.ts` — rate limit (10/saat per IP), spam kontrolü, Resend ile admin'e ilet

- [x] **R-07.3** `app/(public)/gizlilik-politikasi/page.tsx` oluştur
  - Metadata: `"Gizlilik Politikası | MindBridger"`, `robots: { index: true }`
  - Statik metin: veri toplama, kullanım, KVKK, üçüncü taraflar, çerezler
  - Uzun form sayfa — `<article>` semantik element

- [x] **R-07.4** `app/(public)/kvkk/page.tsx` oluştur
  - Metadata: `"KVKK Aydınlatma Metni | MindBridger"`
  - 6698 sayılı KVKK kapsamında aydınlatma metni
  - Statik metin

- [x] **R-07.5** `app/(public)/sss/page.tsx` oluştur
  - Metadata: `"Sık Sorulan Sorular | MindBridger"`
  - `app/page.tsx`'teki `faqSchema` FAQ verisi ile accordion
  - `FaqSection` bileşeni R-02.10'dan import et (yoksa burada oluştur)
  - JSON-LD FAQPage schema koru

- [x] **R-07.6** `app/(public)/fiyatlandirma/page.tsx` oluştur
  - Metadata: `"Fiyatlandırma | MindBridger"`
  - Platform komisyonu bilgisi, danışman fiyat aralıkları
  - "Danışman fiyatlarını gör" CTA → `/danismanlar`
  - Kurumsal paket özeti → `/kurumsal`

- [x] **R-07.7** `app/(public)/kurumsal/page.tsx` oluştur
  - Metadata: `"Kurumsal Çözümler | MindBridger"`
  - B2B landing: özellikler, paket bilgisi, ROI argümanları
  - CTA: `/kurumsal-kayit` (Kurumsal Başvur)
  - Kurumsal chatbot butonu (R-04 ile entegre)

- [x] **R-07.8** `app/(public)/affiliate/page.tsx` oluştur
  - Metadata: `"Affiliate Programı | MindBridger"`
  - Program açıklaması, komisyon oranı (%10), ödeme koşulları
  - CTA: affiliate başvuru formu → `app/api/affiliate/basvuru/route.ts` (mevcut)

**YASAK:**
- `app/api/iletisim/route.ts` içinde gelen mesajı loglama (içerik mahremiyeti)
- KVKK ve Gizlilik sayfaları için `robots: { index: false }` kullanma — bu sayfalar indexlenmeli

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Her 8 URL'e browser'dan git → 404 değil, içerik görünür
- Footer tüm linkler çalışıyor
- Header `/fiyatlandirma` linki çalışıyor

---

## R-08: Admin Sidebar Kırık Linkler

**Kaynak:** Claude Code tarama — `AdminSidebar.tsx` linkleri ile gerçek sayfa yapısı karşılaştırıldı.

### Sorun (KRİTİK)
Admin panelindeki sidebar 7 adet kırık link içeriyor. Admin kullanıcı bu menü öğelerine tıkladığında 404 alıyor:

| Sidebar Linki | Gerçek Durum | Çözüm |
|---|---|---|
| `/admin/danismanlar` | Sayfa yok (sadece `[id]` ve `basvurular` var) | Liste sayfası oluştur |
| `/admin/finans/odemeler` | Sayfa yok (sadece `/admin/finans/` var) | Finans sayfasına yönlendir veya oluştur |
| `/admin/finans/iadeler` | Sayfa yok | Finans sayfasına tab olarak ekle |
| `/admin/finans/affiliate` | Sayfa yok (`/admin/affiliate` var ama farklı) | Linki düzelt |
| `/admin/blog` | Sayfa yok (`/admin/icerik` altında olmalı) | Linki düzelt veya oluştur |
| `/admin/testler` | Sayfa yok | `icerik` altına ekle veya sidebar linki düzelt |
| `/admin/kategoriler` | Sayfa yok | Sidebar'dan kaldır veya oluştur |
| `/admin/loglar` | Sayfa `/admin/raporlar/loglar`'da var | Sidebar linkini düzelt |

### Teknik Gereksinimler
- `requireRole(supabase, ['admin'])` her yeni admin sayfasında zorunlu
- Mevcut `AdminSidebar.tsx`'te href değerleri düzeltilecek veya sayfalar oluşturulacak
- Sidebar güncellenmesi sırasında çalışan linkler bozulmamalı

### Adımlar

- [x] **R-08.1** `app/(admin)/admin/danismanlar/page.tsx` oluştur
  - Server component: `requireRole` + admin kontrolü
  - Supabase'den `danisanlar JOIN profiles` sorgusu, paginated (20/sayfa)
  - Tablo: ad, uzmanlık, şehir, puan, durum, son güncelleme
  - Filtre: aktif/pasif/onay bekleyen
  - Her satırda "Profili Gör" → `/admin/danismanlar/[id]`
  - Client bileşeni: `components/admin/DanismanlarListeKlient.tsx`

- [x] **R-08.2** `components/admin/AdminSidebar.tsx` güncelle
  - `/admin/finans/odemeler` → `/admin/finans` (alt sekme mantığıyla)
  - `/admin/finans/iadeler` → kaldır (finans sayfası zaten içeriyor)
  - `/admin/finans/affiliate` → `/admin/affiliate` (doğru yol)
  - `/admin/blog` → `/admin/icerik` (blog icerik altında)
  - `/admin/testler` → `/admin/icerik` (aynı sayfada tab)
  - `/admin/kategoriler` → sidebar'dan kaldır (henüz implement edilmedi)
  - `/admin/loglar` → `/admin/raporlar/loglar` (doğru yol)

**NOT:** Sidebar güncellemesi tek adım — tüm href düzeltmeleri `R-08.2`'de yapılır.
Sadece gerçekten eksik olan `danismanlar` liste sayfası oluşturulur (`R-08.1`).

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Admin sidebar tüm linkler çalışıyor
- `/admin/danismanlar` → liste sayfası açılıyor
- Kaldırılan `/admin/kategoriler` linki sidebar'da görünmüyor

---

## R-09: Sitemap Eksik Rotalar

**Kaynak:** Claude Code tarama — `app/sitemap.ts` incelendi.

### Sorun
`app/sitemap.ts` yalnızca `/`, `/danismanlar`, `/blog`, `/giris`, `/kayit` içeriyor.
Arama motorları diğer önemli sayfaları bulamıyor → SEO kaybı.

### Mevcut Sitemap'e Eklenecek URL'ler

```
/testler               (changeFrequency: weekly, priority: 0.7)
/kaynaklar             (changeFrequency: weekly, priority: 0.6)
/webinar               (changeFrequency: daily,  priority: 0.6)
/hakkimizda            (changeFrequency: monthly, priority: 0.5)
/iletisim              (changeFrequency: monthly, priority: 0.4)
/gizlilik-politikasi   (changeFrequency: yearly,  priority: 0.3)
/kvkk                  (changeFrequency: yearly,  priority: 0.3)
/sss                   (changeFrequency: monthly, priority: 0.5)
/fiyatlandirma         (changeFrequency: monthly, priority: 0.6)
/kurumsal              (changeFrequency: monthly, priority: 0.7)
/affiliate             (changeFrequency: monthly, priority: 0.5)
```

Dinamik eklenecekler:
```
/testler/[slug]        — yayınlanmış testler (tests tablosu, status=published)
/webinar/[id]          — aktif webinarlar (webinar tablosu, is_active=true)
```

### Adımlar

- [ ] **R-09.1** `app/sitemap.ts` güncelle
  - Statik rotalar dizisine yukarıdaki 11 URL'i ekle
  - Dinamik testler sorgusu: `test_templates` tablosundan `slug`, `updated_at` (published)
  - Dinamik webinarlar sorgusu: `webinars` tablosundan `id`, `updated_at` (is_active=true)
  - **ÖNEMLİ:** R-07 sayfaları tamamlanmadan bu adım yapılmaz — önce sayfalar var olmalı

**Doğrulama:**
- `/sitemap.xml` rotasına git → tüm yeni URL'ler görünür
- 404 olan URL sitemap'te yer almıyor

---

## R-10: `affiliate` Pending Durum Boşluğu

**Kaynak:** Claude Code tarama — `proxy.ts` satır 167.

### Sorun
`proxy.ts` satır 167:
```typescript
if (userStatus === "pending" && (userRole === "danisan" || userRole === "kurumsal")) {
```
`affiliate` rolü bu kontrolde yok. `status=pending` olan bir affiliate `/affiliate-panel`'e erişebilir.

### Analiz
Affiliate iş akışına bakıldığında (`app/api/affiliate/basvuru/route.ts`):
- Başvuru sonrası `status=pending` kaydedilir
- Admin onaylayana kadar `status=active` olmaz
- Affiliate panelindeki `layout.tsx` `status=active` kontrolü yapıyor (korumalı)
- **Bu demek ki:** pending affiliate, layout.tsx'e girse bile redirect oluyor
- Ancak proxy.ts seviyesinde tutarsızlık var — diğer pending roller `/onay-bekleniyor`'a gönderilirken affiliate gönderilmiyor

### Adımlar

- [ ] **R-10.1** `proxy.ts` güncelle
  - Satır 167: `userRole === "affiliate"` koşulunu ekle
  ```typescript
  if (userStatus === "pending" && (userRole === "danisan" || userRole === "kurumsal" || userRole === "affiliate")) {
  ```
  - `/onay-bekleniyor` sayfası zaten var — metin "başvurunuz inceleniyor" olarak kalır

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- `status=pending` affiliate ile giriş → `/onay-bekleniyor`'a yönleniyor

---

## R-11: `loading.tsx` ve `error.tsx` Eksik

**Kaynak:** Claude Code tarama + DENETİM 4.11 açık madde.

### Sorun
Hiçbir route'da `loading.tsx` veya `error.tsx` yok.
- `loading.tsx` eksikse: sayfa yüklenirken boş beyaz ekran gösterir
- `error.tsx` eksikse: beklenmedik hata → Next.js generic error sayfası gösterir

### Teknik Gereksinimler
- `loading.tsx`: `LoadingSkeleton` bileşeni (mevcut `components/shared/LoadingSkeleton.tsx`) kullanılacak
- `error.tsx`: `"use client"` zorunlu (Next.js requirement) + `reset()` butonu
- Tasarım sistemi: `#F5F5F5` bg, `#212121` metin, border sistemi
- Öncelikli rotalar: public sayfalar + panel sayfaları

### Adımlar

- [ ] **R-11.1** `app/loading.tsx` oluştur (root-level)
  - `LoadingSkeleton` bileşenini import et
  - Tam sayfa yükleme skeleton

- [ ] **R-11.2** `app/error.tsx` oluştur (root-level)
  - `"use client"`
  - Props: `{ error: Error & { digest?: string }; reset: () => void }`
  - Türkçe hata mesajı: "Beklenmedik bir hata oluştu"
  - "Tekrar Dene" butonu → `reset()` çağırır
  - "Ana Sayfaya Dön" linki → `/`
  - Hata detayı (digest) küçük font ile gösterilir (debug için)

- [ ] **R-11.3** `app/(musteri)/panelim/loading.tsx` oluştur
  - Panel spesifik skeleton (sidebar + içerik alanı)

- [ ] **R-11.4** `app/(danisan)/danisan/loading.tsx` oluştur
  - Danışman panel skeleton

- [ ] **R-11.5** `app/(admin)/admin/loading.tsx` oluştur
  - Admin panel skeleton

**Doğrulama:**
- Yavaş ağda (Chrome DevTools → Slow 3G) sayfa geçişlerinde skeleton görünür
- Bir bileşende kasıtlı hata throw edilince `error.tsx` görünür
- `tsc --noEmit` → 0 hata

---

## Revizyon Tamamlama Kontrol Listesi

```
[ ] R-01 ✅ (devIndicators: false)
[x] R-07 tamamlandı → 8 public sayfa oluşturuldu, footer linkleri çalışıyor
[x] R-08 tamamlandı → admin sidebar düzeltildi, danismanlar listesi var
[x] R-05 tamamlandı → 5 test hesabı oluşturuldu, giriş test edildi
[x] R-09 tamamlandı → sitemap güncellendi, testler/webinar dinamik
[x] R-06 tamamlandı → danisan/kurumsal kayıt maili ayrıştırıldı
[x] R-10 tamamlandı → affiliate pending proxy.ts'e eklendi
[x] R-12 tamamlandı → panel layout tam ekran, sidebar unicode chars temizlendi
[x] R-13 tamamlandı → admin blog yazısı oluşturma/düzenleme
[x] R-04 tamamlandı → chatbot draggable + rol bazlı + 50 Q&A
[x] R-03 tamamlandı → shadow token, useCountUp, useTypewriter
[x] R-02 tamamlandı → BetterHelp-inspired public tasarım, 9 bölüm, admin editör, migration
[x] R-11 tamamlandı → loading.tsx + error.tsx tüm paneller

npm run type-check → 0 hata
npm run build      → ✅ başarılı
```

---

---

## R-12: Panel Layout + Sidebar Tasarım İyileştirmesi

**Kaynak:** Kullanıcı ekran görüntüleri (oturum 23) — "karikatürize, wireframe gibi, tam oturmuyor"

### Sorunlar (Ekran Görüntüsünden Tespit)

| Panel | Sorun | Etki |
|---|---|---|
| Danışan (`/danisan/*`) | `max-w-[1200px] mx-auto my-6` → ekranda yüzen kart, kenarlardan boşluk | Wireframe izlenimi |
| Müşteri (`/panelim/*`) | Aynı frame-card stili | Aynı sorun |
| Danışan sidebar | ▣ ◫ ◻ ◈ ◬ ◧ ◩ Unicode box chars → nav ikonları gibi görünüyor ama çirkin | Amatörce görünüm |
| Müşteri sidebar | Aynı Unicode box chars | Aynı sorun |
| Danışan frame header | `MindBridger [Danışman]` badge + border → fazla wireframe-ish | Amatörce görünüm |
| Müşteri frame header | Aynı badge stili | Aynı sorun |
| Affiliate / Kurumsal | Full-screen layout (doğru) ama içerik çok seyrek, boş alan fazla | UX kalitesi düşük |

### Teknik Gereksinimler

- **Layout düzeltmesi:** Danışan ve müşteri layout'larındaki frame-card kaldırılır → admin/affiliate/kurumsal gibi tam ekran sidebar+main yapısına geçilir
- **Frame header:** Kaldırılır. Yerine admin layout'undaki gibi `sidebar içinde logo + rol badge` yerleşir
- **Sidebar icon'ları:** Unicode box chars kaldırılır → admin sidebar'ındaki `[+]`/`[]` tipi sade metin marker'ı ile değiştirilir VEYA tamamen icon yok, sadece metin (daha temiz)
- **Layout yüksekliği:** `min-h-screen` tüm panellerde korunacak, içerik alanı `overflow-y-auto`

### Adımlar

- [ ] **R-12.1** `app/(danisan)/layout.tsx` güncelle
  - `max-w-[1200px] mx-auto my-6 border-[1.5px]` wrapper div kaldır
  - Frame Header bölümü kaldır
  - Yeni yapı: `<div class="flex min-h-screen bg-[#F5F5F5]"><DanisanSidebar/><main class="flex-1 overflow-y-auto">{children}</main></div>`
  - DanisanSidebar'a `adSoyad` prop gönder (layout'ta profiles sorgusu zaten yapılıyor)

- [ ] **R-12.2** `app/(musteri)/panelim/(main)/layout.tsx` güncelle
  - Aynı frame-card wrapper kaldır
  - Frame Header kaldır
  - Yeni yapı admin/affiliate ile aynı: tam ekran sidebar+main
  - `kullaniciIsim` prop MusteriSidebar'a zaten geçiliyor, koruyacak

- [ ] **R-12.3** `components/danisan/DanisanSidebar.tsx` güncelle
  - Nav item'lardan `ic` alanını kaldır (Unicode box chars temizle)
  - Logo alanı (`border-dashed MindBridger`) → admin sidebar stili: solid border, platform adı
  - Üstte kullanıcı adı + "Danışman" rolü küçük badge olarak göster (admin sidebar gibi)
  - Aktif item: admin sidebar'ındaki `[+]`/`[]` marker → veya sadece `font-bold` + sol border `border-l-2 border-[#212121]`
  - `adSoyad?: string` prop kabul et (layout'tan gelen)

- [ ] **R-12.4** `components/musteri/MusteriSidebar.tsx` güncelle
  - Aynı düzeltmeler: Unicode box chars kaldır, admin sidebar stili
  - `kullaniciIsim` prop zaten var, rol badge "Müşteri" olarak göster

- [ ] **R-12.5** `components/affiliate/AffiliateSidebar.tsx` iyileştir
  - Mevcut stile bak — eğer admin sidebar ile tutarsızsa hizala
  - İçerik seyrekliği için sidebar'a "yardım / destek" link'i ekle (padding dolgusu için değil, gerçek link)

- [ ] **R-12.6** `components/kurumsal/KurumsalSidebar.tsx` iyileştir
  - Mevcut stile bak — admin sidebar ile hizala

**YASAK:**
- Layout değişikliği yapılırken sayfa içeriklerine (dashboard, randevular vb.) dokunma
- `requireRole` kontrollerini kaldırma

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- Danışan paneli tam ekran dolduruyor, kenarlardan boşluk yok
- Müşteri paneli tam ekran dolduruyor
- Sidebar'larda Unicode box chars görünmüyor
- Admin sidebar görünümü ile tutarlı hizalanmış

---

## R-13: Admin Blog Yazısı Oluşturma / Düzenleme

**Kaynak:** Kullanıcı geri bildirimi — "admin blog yazısı yazmak istiyor, eksik"

### Sorun

`/admin/icerik` sayfası mevcut blog yazılarını listeler ve **onaylama/reddetme** yapabilir.
Ama admin'in kendi blog yazısı **oluşturması** veya mevcut yazıyı **düzenlemesi** için sayfa yok.

Danışan panelinde `/danisan/blog/yeni` ve `/danisan/blog/[id]/duzenle` var — admin eşdeğeri eksik.

### Teknik Gereksinimler

- Server component page.tsx: `requireRole(supabase, ['admin'])`
- Form: `react-hook-form` + `zod`
- Rich text: **`textarea` ile markdown** (Tiptap gibi paket kurma — bundle büyür, aşamalı iyileştirme)
- Blog yazısı: `blog_posts` tablosuna INSERT (yeni) veya UPDATE (düzenleme)
- Yazar: admin profil ID'si (`author_id`)
- Durum: varsayılan `draft`, admin isterse direkt `published`
- Slug: başlıktan otomatik üretilir (Türkçe karakter normalize)
- Kapak görseli: URL input (Supabase Storage upload sonrası — şimdilik URL)
- Kategori: mevcut kategoriler listesinden seçim (blog_categories tablosu, varsa)

### Adımlar

- [ ] **R-13.1** `app/(admin)/admin/icerik/blog/yeni/page.tsx` oluştur
  - Server component: `requireRole` + admin kontrolü
  - Blog kategorileri Supabase'den çek (varsa)
  - `<BlogYazisiFormKlient>` bileşenini render et
  - Metadata: `"Yeni Blog Yazısı — Admin | MindBridger"`

- [ ] **R-13.2** `app/(admin)/admin/icerik/blog/[id]/duzenle/page.tsx` oluştur
  - Server component: `requireRole` + mevcut yazıyı çek
  - `blog_posts` tablosundan `id` ile yazıyı getir
  - `<BlogYazisiFormKlient initialVeri={yazi}>` şeklinde geçir
  - Yazı bulunamazsa `notFound()` çağır
  - Metadata: `"Blog Yazısı Düzenle — Admin | MindBridger"`

- [ ] **R-13.3** `components/admin/BlogYazisiFormKlient.tsx` oluştur
  - `"use client"`, `react-hook-form` + `zod`
  - Zod schema: `{ baslik: string.min(5).max(200), icerik: string.min(100), slug: string, ozet: string.max(300), durum: 'draft'|'published', kapak_url: string.url().optional() }`
  - `baslik` değişince `slug` otomatik üretilir: Türkçe → ASCII, boşluk → `-`, lowercase
  - `icerik` için: `<textarea rows={20}>` (markdown destekli, şimdilik plain text)
  - Gönderim: yeni yazı → `POST /api/admin/blog`, düzenleme → `PATCH /api/admin/blog/[id]`
  - Başarı: `/admin/icerik` sayfasına yönlendir + toast
  - Hata: form üzerinde Türkçe hata mesajı

- [ ] **R-13.4** `app/api/admin/blog/route.ts` oluştur (POST)
  - `requireRole(supabase, ['admin'])` — 401 döner yetkisiz
  - Body validation: R-13.3 Zod schema ile
  - `blog_posts` tablosuna INSERT
  - `author_id`: oturumdaki admin user.id
  - Slug çakışma kontrolü: mevcut slug varsa `-2`, `-3` suffix ekle
  - Return: `{ id, slug }`

- [ ] **R-13.5** `app/api/admin/blog/[id]/route.ts` oluştur (PATCH + DELETE)
  - PATCH: yazıyı güncelle — sadece admin kendi yazdığı veya tüm yazıları düzenleyebilir
  - DELETE: soft delete (`deleted_at = NOW()`)
  - Her ikisi de `requireRole(supabase, ['admin'])` gerektirir

- [ ] **R-13.6** `components/admin/IcerikKlient.tsx` güncelle
  - Blog tab'ına "Yeni Yazı +" butonu ekle → `/admin/icerik/blog/yeni`
  - Her blog satırına "Düzenle" linki ekle → `/admin/icerik/blog/[id]/duzenle`
  - Mevcut "Yayınla / Reddet" aksiyonları korunur

**Doğrulama:**
- `tsc --noEmit` → 0 hata
- `/admin/icerik/blog/yeni` → form açılıyor
- Form doldur → kaydet → `/admin/icerik` listeleniyor
- Düzenle → değiştir → güncellendi
- Non-admin kullanıcı → 401

---

## AÇIK NOTLAR

### Fotoğraf / Görsel
Ana sayfada danışman fotoğrafı veya hero görseli yok — CSS pattern ve tipografi ile etkileyici tasarım yapılacak. İleride Supabase Storage'dan görsel eklenebilir.

### Testimonial Verileri
`TestimonialsSection.tsx` başlangıçta 3 hardcoded testimonial ile gelir. İleride admin editörüne eklenebilir.

### countUp Sayaç Değerleri
İstatistik değerleri `site_settings`'te metin olarak saklanır (örn. "500+"). `useCountUp` sayısal kısmı parse eder, "+" suffix'ini korur.

### Mevcut `app/page.tsx` JSON-LD
`websiteSchema`, `organizationSchema`, `faqSchema` yapıları R-02.11'de korunur. FAQ accordion ile `faqSchema` senkronize olacak.

### R-07 ve R-09 Bağımlılığı
R-09 (sitemap) ancak R-07 (sayfalar) tamamlandıktan sonra yapılacak.
Var olmayan sayfaları sitemap'e eklemek arama motorlarında 404 sinyali verir.

### İletişim Formu Rate Limit
`app/api/iletisim/route.ts` — `ip_blacklist` tablosundan yararlanmak yerine bağımsız rate limit:
chatbot rate limit tablosuna benzer şekilde `iletisim_rate_limits` tablosu düşünülebilir,
ya da mevcut `chatbot_rate_limits` tablosunun tip alanı genişletilebilir.
Karar: önce `chatbot_rate_limits` tablosu incelenir, uygunsa `source` kolonu eklenir.
