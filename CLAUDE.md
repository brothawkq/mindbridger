# CLAUDE.md

## ⚡ HER OTURUM BAŞINDA — KOD YAZMADAN ÖNCE BUNU YAP

```
1. docs/PRD.md               oku
2. docs/SCHEMA.md            oku
3. docs/ROUTES.md            oku
4. docs/IMPLEMENTATION_PLAN.md oku
5. docs/PROGRESS.md          oku → hangi fazda olduğunu öğren
6. docs/CONFLICTS.md         oku → çelişkiler ve geçerli değerler burada
7. wireframes/wf-01.html oku → tasarım dilini, renk sistemini ve bileşen yapısını içselleştir
```

Okuduktan sonra şunu söyle:
"Dokümanları okudum. Şu an [FAZ X - ADIM Y] üzerindeyim. [Son yaptığım şey]. Devam edeyim mi?"

Dosyalar bulunamazsa: "docs/ klasörü bulunamadı, lütfen dosyaları yerleştir." de ve dur.

---

## PLATFORM ADI

**MindBridger**
Tüm UI metinleri, mail şablonları, meta tag'ler ve marka referanslarında bu isim kullanılır.

---

## KLASÖR YAPISI — KARIŞTIRMA

```
PROJE_KOKU/                        ← Claude Code bu klasörü açar
│
├── CLAUDE.md                      ← BU DOSYA — proje kökünde, sabit
│
├── docs/                          ← SADECE DOKÜMAN — kod dosyası girmez
│   ├── PRD.md
│   ├── SCHEMA.md
│   ├── ROUTES.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PROGRESS.md
│   └── CONFLICTS.md               ← ÇELİŞKİ ÇÖZÜM KAYDI — her zaman oku
│
├── app/                           ← Next.js App Router — KOD BURAYA
│   ├── (public)/
│   ├── (auth)/
│   ├── (admin)/
│   ├── (danisan)/
│   ├── (musteri)/
│   ├── (kurumsal)/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── shared/
│   ├── admin/
│   ├── danisan/
│   ├── musteri/
│   └── public/
│
├── lib/
│   ├── supabase/
│   ├── iyzico/
│   ├── dailyco/
│   ├── resend/
│   ├── netgsm/
│   └── utils/
│
├── hooks/
├── types/
│   └── supabase.ts
├── public/
├── supabase/
│   └── migrations/
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

├── wireframes/               ← HTML wireframe referansları — KOD DEĞİL, REFERANS
│   ├── wf-01.html  Giriş Ekranı (tüm kullanıcılar)
│   ├── wf-02.html  Müşteri Dashboard
│   ├── wf-03.html  Danışman Keşfi ve Filtreleme
│   ├── wf-04.html  Danışman Profil Sayfası
│   ├── wf-05.html  Randevu Alma Sihirbazı
│   ├── wf-06.html  Danışman Takvim ve Müsaitlik
│   ├── wf-07.html  Admin Dashboard
│   ├── wf-08.html  Admin Finansal Yönetim
│   ├── wf-09.html  Danışman Finans Paneli
│   └── wf-10.html  Müşteri Günlük ve Ruh Hali

### Klasör Kuralları — ASLA YAPMA
- `docs/` veya `wireframes/` klasörüne hiçbir zaman kod dosyası koyma
- `app/` veya `components/` içine doküman koyma
- `CLAUDE.md`'yi taşıma veya içeriğini silme
- `docs/CONFLICTS.md` ve `docs/PROGRESS.md` dışında doküman dosyalarını değiştirme
- Wireframe HTML dosyalarını değiştirme

---

## TASARIM SİSTEMİ — TÜM SAYFALARDA UYGULA

> Bu kurallar `wireframes/` klasöründeki HTML wireframe'lerden çıkarılmıştır.
> Wireframe olan sayfalarda o dosyayı oku, wireframe olmayan sayfalarda bu kurallara uy.
> Her sayfayı kodlamadan önce varsa karşılık gelen wireframe'i oku.

### Renk Paleti — DEĞİŞTİRME
```
--color-bg:        #F5F5F5   ← sayfa arkaplanı
--color-surface:   #FFFFFF   ← kart, panel, modal arkaplanı
--color-border:    #E0E0E0   ← standart kenarlık
--color-border-strong: #212121 ← vurgulu kenarlık, butonlar
--color-muted:     #BDBDBD   ← placeholder, ikincil metin, ikon
--color-text:      #212121   ← ana metin, başlık
--color-primary:   #212121   ← primary buton arkaplanı
--color-primary-text: #FFFFFF ← primary buton metni
```
Dark mode'da bu değişkenler tersine çevrilir; Tailwind `dark:` prefix ile.

### Tipografi
- Font: `system-ui, Arial, sans-serif`
- Base: 13px
- Sayfa başlığı: 16px bold
- Bölüm başlığı: 10px bold, letter-spacing 1px, uppercase
- Etiket: 9-10px bold, letter-spacing 0.8px, uppercase, `#BDBDBD`
- Meta/yardımcı metin: 10-11px, `#BDBDBD`

### Bileşen Kuralları

**Butonlar**
- Primary: `background #212121`, `color #FFFFFF`, `border none`, `padding 11px`, `font-weight 700` — border-radius YOK
- Secondary / Outline: `background #FFFFFF`, `border 1.5px solid #212121`, `color #212121` — border-radius YOK
- Ghost / Link buton: `color #212121`, `text-decoration underline`
- Disabled / muted: `border 1.5px dashed #BDBDBD`, `color #BDBDBD`

**Kartlar**
- Kenarlık: `1.5px solid #E0E0E0`
- Vurgulu kart (aktif, seçili): `1.5px solid #212121`
- Padding: `12-14px`
- Border-radius: YOK — tüm köşeler keskin

**Input Alanları**
- Kenarlık: `1.5px solid #212121`
- Padding: `9px 12px`
- Font: 13px
- Error state: arkaplan `#F5F5F5` + `⚠` simgesi

**Tablo**
- Header: `background #F5F5F5`, `font-weight 700`, `font-size 10px`, uppercase
- Satır hover: `background #F5F5F5`
- Kenarlık: `1px solid #E0E0E0`

**Sidebar**
- Genişlik: 190px (sabit)
- Kenarlık sağ: `1.5px solid #E0E0E0`
- Aktif nav item: `font-weight 700`
- Bölüm başlığı: 9px uppercase, `#BDBDBD`, alt çizgi `1px dotted #E0E0E0`

**Frame Header (panel sayfaları)**
- Arkaplan: `#F5F5F5`
- Alt kenarlık: `1.5px solid #212121`
- Sayfa adı: 12px bold
- Rol badge: `border 1.5px solid #212121`, `padding 1px 7px`
- Anotasyon: 10.5px italic, `#BDBDBD`

**Pill / Badge**
- Dolu: `background #212121`, `color #FFFFFF`, `border-radius 0`
- Outline: `background #FFFFFF`, `border 1.5px solid #212121`, `color #212121`
- Muted: `border 1.5px dashed #BDBDBD`, `color #BDBDBD`

**Progress Bar**
- Arkaplan: `#E0E0E0`, `border 1px solid #BDBDBD`, height 8px
- Dolgu: `background #212121`

**Grafik (recharts)**
- Çubuk rengi: `#212121`
- Grid çizgisi: `#E0E0E0`
- Tooltip arkaplan: `#FFFFFF`, `border 1px solid #E0E0E0`

### Animasyon ve Geçiş Kuralları — ZORUNLU

Wireframe'ler yapısal iskelet olarak kullanılır; final tasarım modern, animasyonlu ve geçiş efektlidir.

**Sayfa Geçişleri**
- Route değişimlerinde `Framer Motion` `AnimatePresence` ile fade + slide geçiş
- Varsayılan: `opacity 0→1`, `y 12→0`, `duration 0.2s`, `ease easeOut`

**Bileşen Animasyonları**
- Modal / drawer açılışı: `scale 0.96→1` + `opacity 0→1`, `duration 0.18s`
- Liste öğeleri (danışman kartları, randevu listesi): `staggerChildren 0.05s`, yukarıdan aşağı cascade
- Toast bildirimleri: sağdan kayarak gir, sola kayarak çık
- Buton hover: `scale 1.01`, `duration 0.1s`
- Kart hover: `y -2`, `boxShadow` hafif derinlik, `duration 0.15s`

**Progress Bar ve Sayaçlar**
- Progress bar dolumu: `width` animasyonu, `duration 0.6s`, `ease easeInOut`
- KPI sayıları: `countUp` efekti (0'dan hedefe), `duration 0.8s`

**Kurallar**
- Animasyonlar işlevselliği engellememeli; `prefers-reduced-motion` medya sorgusu zorunlu
- Aşırı animasyondan kaçın: her bileşende olmak zorunda değil, önemli noktalarda olmalı
- `npm install framer-motion` Faz 1'de kurulum listesine ekle

Her sayfayı kodlamadan önce aşağıdan bak; varsa ilgili wireframe'i oku.

| Sayfa | Wireframe |
|---|---|
| `/giris` | `wireframes/wf-01.html` |
| `/panelim/dashboard` | `wireframes/wf-02.html` |
| `/danismanlar` (liste) | `wireframes/wf-03.html` |
| `/danismanlar/[slug]` (profil) | `wireframes/wf-04.html` |
| `/panelim/randevu-al/[slug]` | `wireframes/wf-05.html` |
| `/danisan/takvim` | `wireframes/wf-06.html` |
| `/admin/dashboard` | `wireframes/wf-07.html` |
| `/admin/finans` | `wireframes/wf-08.html` |
| `/danisan/finans` | `wireframes/wf-09.html` |
| `/panelim/gunluk` | `wireframes/wf-10.html` |
| Diğer tüm sayfalar | Wireframe yok → bu tasarım sistemi kurallarını uygula |

> ⚠️ WF-01'deki "5 dk" ifadesi düzeltildi → **15 dk** (CONFLICTS.md ile tutarlı)

---

## Proje Özeti

**MindBridger** — Türkiye'ye özel psikolog ve PDR danışmanlarını bireysel + kurumsal müşterilerle buluşturan online terapi marketplace. Platform %20 komisyon alır, danışmanlar kendi fiyatlarını belirler.

**Kullanıcı rolleri:** `admin` | `danisan` | `musteri` | `kurumsal` | `affiliate`

---

## Teknoloji Yığını — DEĞİŞTİRME

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14+ App Router (SSR zorunlu) |
| Veritabanı | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Ödeme | iyzico |
| Video | Daily.co API |
| E-posta | Resend |
| SMS | Netgsm |
| Depolama | Supabase Storage |
| Stil | Tailwind CSS + shadcn/ui |
| Animasyon | Framer Motion |
| State | Zustand + React Query |
| Deploy | Vercel |

---

## ÇALIŞMA KURALI — HER ADIMDA SADECE BİR ŞEY YAP

Bu kural hata oranını düşürür. Kesinlikle uy.

```
1. IMPLEMENTATION_PLAN.md'den sıradaki TEK [ ] adımını al
2. Yalnızca o adımı yap — başka hiçbir dosyaya dokunma
3. Adım bittikten sonra şunu söyle:
   "[Adım adı] tamamlandı. Devam edeyim mi?"
4. Onay gelince [ ] → [x] yap, PROGRESS.md güncelle
5. Bir sonraki adıma geç
```

### Yasak
- Birden fazla dosyayı aynı anda oluşturma
- Bir adımı bitirmeden diğerine başlama
- "Şunu da yapayım, verimli olur" deme — YAP DEĞİL
- Faz bitiminde `npm run type-check` ve `npm run build` çalıştırmadan sonraki faza geçme

### İstisna
Bir dosya diğerini import ediyorsa (örn. route.ts → lib/x.ts) ikisini birlikte yazabilirsin.
Ama bu durumu önce söyle: "Bu adım için X ve Y birlikte gerekiyor, ikisini yazıyorum."

- TypeScript strict, `any` yasak
- Supabase: sadece server component veya API route'ta sorgula
- Formlar: `react-hook-form` + `zod`
- Her API route başında rol kontrolü
- Ödeme: sadece server-side, client kart verisi görmez
- Daily.co oda: sadece server-side
- Hata: try/catch + kullanıcıya anlamlı Türkçe mesaj
- Loading state: her async işlemde
- Dark mode: CSS variables + Tailwind `dark:` prefix
- Para birimi: TL, tarih: DD.MM.YYYY, saat dilimi: UTC+3 (timestamptz)
- Dosya yükleme limiti: maksimum 10 MB (server ve client tarafında kontrol)

---

## Güvenlik Parametreleri — CONFLICTS.md ile tutarlı

- Oturum zaman aşımı: **30 dakika** hareketsizlik
- Hesap kilidi: **5 başarısız giriş → 15 dakika kilit**
- IP kara listesi: **50 başarısız giriş → 24 saat ban**
- bcrypt: minimum 12 tur
- TLS: 1.2 veya üzeri
- Video link aktif: randevu saatinden **10 dakika önce**
- Ödeme: AES-256 şifreleme, PCI-DSS uyumlu iyzico altyapısı

---

## Veritabanı Kuralları

- Her tablo: `id uuid default gen_random_uuid() primary key`
- Her tablo: `created_at`, `updated_at`, `deleted_at` (soft delete)
- RLS tüm tablolarda aktif
- Migration: `/supabase/migrations/YYYYMMDD_aciklama.sql`
- Seans notları, psikolojik geçmiş, terapi verileri = hassas veri (RLS'de ayrı politika)

---

## Güvenlik — ASLA YAPMA

- Client'ta `service_role` key kullanma
- Ödeme / finansal veri loglama
- Video token'ı client URL'ine koyma
- Admin route'ları rol kontrolsüz bırakma
- `.env.local` dosyasını git'e ekleme
- 10 MB'dan büyük dosya yüklemeye izin verme

---

## Komutlar

```bash
npm run dev
npm run build                    # Her faz sonunda çalıştır
npm run type-check               # Her faz sonunda çalıştır
npx supabase db push
npx supabase gen types typescript --local > types/supabase.ts
```

---

## .env.local Şablonu

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
DAILY_CO_API_KEY=
RESEND_API_KEY=
NETGSM_USER=
NETGSM_PASSWORD=
ANTHROPIC_API_KEY=
CRON_SECRET=
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_NAME=MindBridger
```

> `ENCRYPTION_KEY`: AES-256 için 32 byte random string. Banka IBAN, takvim OAuth token'ları bu key ile şifrelenir. `openssl rand -hex 32` ile üret.
> `CRON_SECRET`: Vercel Cron job'larını dışarıdan tetiklenmeye karşı korur. `openssl rand -hex 32` ile üret.

---

## Faz Sırası

```
Faz 1:  Altyapı + Auth
Faz 2:  Danışman profilleri + Arama
Faz 3:  Randevu sistemi
Faz 4:  Ödeme (iyzico) + PDF Fatura
Faz 5:  Video görüşme (Daily.co)
Faz 6:  Admin paneli
Faz 7:  Danışman paneli
Faz 8:  Müşteri paneli
Faz 9:  Blog + Testler + İçerik
Faz 10: Bildirimler (mail + SMS)
Faz 11: Kurumsal + Affiliate
Faz 12: Gamification + PWA + SEO
```

Bir fazı bitirmeden sonrakine geçme.
Faz bittikçe `docs/PROGRESS.md` dosyasını güncelle.
