# BETTERHELP_TASARIM.md — Tam Tasarım Yenileme Görevi

> Başka bir Claude Code oturumu bu dosyayı okuyarak tüm görevleri sırayla, onay beklemeden uygular.
> CLAUDE.md + docs/CONFLICTS.md + docs/PROGRESS.md'yi de oku.

---

## 0. PROJE BAĞLAMI

- **Proje:** MindBridger — Next.js 14 App Router, Tailwind v4, Supabase, TypeScript strict
- **Klasör:** `/Users/baran/Desktop/mindbridger`
- **Tailwind v4:** `tailwind.config.ts` YOK. Renkler `@theme inline` ile `app/globals.css` içinde tanımlanır.
- **Karar (CONFLICTS.md §7):** Tüm sayfalar — public + panel + admin — BetterHelp-inspired yeşil/krem tasarıma geçer.

---

## 1. GERÇEK BETTERHELP RENK PALETİ

> Chrome DevTools, betterhelp.com, 2026-05-27

```
Arkaplanlar:
  #325343  →  Koyu yeşil — hero, dark sections, sidebar, header
  #FFFCF6  →  Sıcak krem — ana sayfa bg, krem bölümler
  #F5F7F5  →  Açık yeşil-beyaz — card bg, steps, panel surface
  #F7F0E6  →  Amber krem — özel bölümler

Kart renkleri (kategori):
  #397A4A  →  Bireysel kart
  #457777  →  Çift kart (teal)
  #A75D00  →  Teen kart (amber)

Buton:
  #A6DE9B  →  Primary CTA buton bg (açık yeşil)
  #8ED485  →  CTA hover
  #325343  →  CTA buton yazı rengi
  100px    →  Pill border-radius

Metin:
  #F5F7F5  →  Koyu bg üzerinde (H1, H2, nav)
  #252625  →  Açık bg üzerinde başlıklar
  #4A4D4A  →  Gövde metin, muted

Kenarlık:  #D4E4D8
Accent:    #A6DE9B (açık yeşil vurgu)

Tipografi:
  Heading: Overpass, fontWeight 300 (büyük başlık), 700 (vurgu)
  Body:    Inter, fontWeight 400-500
  H1: 48px, fontWeight 300, lineHeight 56px
  H2: 48px, fontWeight 300 (bold vurgu: 700)
  Body: 16-20px, lineHeight 1.6-1.7
  Button: 16px, fontWeight 500-600

Section arkaplanları:
  .hero / .dark-section  → #325343
  .numbers / .faq        → #FFFCF6
  .steps / .panel        → #F5F7F5
```

---

## 2. CSS DEĞİŞKEN → HARDCODED EŞLEŞMESİ

SVG fill attribute'larına asla `var()` yazma — hardcoded hex kullan.

| Eski değişken | Hardcoded hex |
|---|---|
| var(--pub-bg) / var(--mb-bg) | #FFFCF6 |
| var(--pub-bg-alt) | #F5F7F5 |
| var(--pub-green-dark) / var(--mb-border-strong) | #325343 |
| var(--pub-green) / var(--pub-green-btn) | #A6DE9B |
| var(--pub-green-btn-hover) | #8ED485 |
| var(--pub-green-light) | #EDF7ED |
| var(--pub-text) / var(--mb-text) | #252625 |
| var(--pub-text-muted) / var(--mb-muted) | #4A4D4A |
| var(--pub-text-on-dark) | #F5F7F5 |
| var(--pub-border) / var(--mb-border) | #D4E4D8 |
| var(--mb-primary) | #A6DE9B |
| var(--mb-primary-text) | #325343 |
| var(--mb-surface) | #FFFFFF |

---

## 3. TAMAMLANDI — DOKUNMA

Bu görevler önceki oturumda bitti:

### globals.css (kısmen)
- `@theme inline` bloğuna `--color-pub-*` eklendi
- `:root --pub-*` BetterHelp değerleriyle güncellendi
- `--font-overpass`, `--font-inter` eklendi

### layout.tsx
- Overpass + Inter `next/font/google` ile yüklendi

### Homepage bileşenleri — components/public/home/ (10 dosya)
HeroSection, StatsTicker, StatsSection, HowItWorksSection, WhySection,
FeaturedConsultantsSection, TestimonialsSection, KurumsalCtaSection,
FinalCtaSection, FaqSection — tümü hardcoded renklerle yeniden yazıldı.

---

## 4. GÖREVLER — SIRAYLA YAP, ONAY BEKLEME

---

### GÖREV F — globals.css Ana Tasarım Sistemini Güncelle

**Bu görev tüm diğer görevlerin öncüsüdür — önce bunu yap.**

`app/globals.css` içinde yapılacak değişiklikler:

#### F.1 — @theme inline bloğunu güncelle

```css
@theme inline {
  /* ... mevcut shadcn color mapping'leri koru ... */

  /* Tipografi */
  --font-sans:     var(--font-inter);      /* Inter → tüm site body */
  --font-heading:  var(--font-overpass);   /* Overpass → başlıklar */
  --font-mono:     ui-monospace, monospace;
  --font-overpass: "Overpass", system-ui, sans-serif;
  --font-inter:    "Inter", system-ui, sans-serif;

  /* Border radius — BetterHelp yuvarlatılmış */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-2xl: 20px;
  --radius-3xl: 24px;
  --radius-4xl: 32px;

  /* Public renk token'ları — koru */
  --color-pub-bg:      #FFFCF6;
  --color-pub-bg-alt:  #F5F7F5;
  --color-pub-bg-warm: #F7F0E6;
  --color-pub-dark:    #325343;
  --color-pub-medium:  #397A4A;
  --color-pub-teal:    #457777;
  --color-pub-amber:   #A75D00;
  --color-pub-btn:     #A6DE9B;
  --color-pub-heading: #252625;
  --color-pub-body:    #4A4D4A;
  --color-pub-on-dark: #F5F7F5;
  --color-pub-border:  #D4E4D8;
}
```

#### F.2 — :root değişkenlerini güncelle

```css
:root {
  /* ---- MindBridger özel değişkenler — BetterHelp sistemi ---- */
  --mb-bg:             #FFFCF6;   /* sıcak krem — sayfa bg */
  --mb-surface:        #FFFFFF;   /* card, panel, modal */
  --mb-border:         #D4E4D8;   /* standart kenarlık */
  --mb-border-strong:  #325343;   /* vurgulu kenarlık, sidebar */
  --mb-muted:          #4A4D4A;   /* gövde metin, ikincil */
  --mb-text:           #252625;   /* ana metin, başlık */
  --mb-primary:        #A6DE9B;   /* primary buton bg */
  --mb-primary-text:   #325343;   /* primary buton yazı */

  /* ---- Gölge ---- */
  --mb-shadow:        0 2px 8px rgba(50,83,67,0.08);
  --mb-shadow-hover:  0 6px 20px rgba(50,83,67,0.14);
  --mb-shadow-strong: 0 8px 24px rgba(50,83,67,0.18);

  /* ---- shadcn/ui token'ları ---- */
  --background:           #FFFCF6;
  --foreground:           #252625;
  --card:                 #FFFFFF;
  --card-foreground:      #252625;
  --popover:              #FFFFFF;
  --popover-foreground:   #252625;
  --primary:              #A6DE9B;
  --primary-foreground:   #325343;
  --secondary:            #F5F7F5;
  --secondary-foreground: #252625;
  --muted:                #F5F7F5;
  --muted-foreground:     #4A4D4A;
  --accent:               #325343;
  --accent-foreground:    #F5F7F5;
  --destructive:          oklch(0.577 0.245 27.325);
  --border:               #D4E4D8;
  --input:                #325343;
  --ring:                 #A6DE9B;
  --radius:               8px;

  /* ---- Grafik ---- */
  --chart-1: #325343;
  --chart-2: #397A4A;
  --chart-3: #A6DE9B;
  --chart-4: #457777;
  --chart-5: #A75D00;

  /* ---- Sidebar — koyu yeşil ---- */
  --sidebar:                    #325343;
  --sidebar-foreground:         #F5F7F5;
  --sidebar-primary:            #A6DE9B;
  --sidebar-primary-foreground: #325343;
  --sidebar-accent:             rgba(166,222,155,0.12);
  --sidebar-accent-foreground:  #F5F7F5;
  --sidebar-border:             rgba(245,247,245,0.1);
  --sidebar-ring:               #A6DE9B;
}
```

#### F.3 — Dark mode güncellenecek

```css
.dark {
  --mb-bg:             #1A2E22;
  --mb-surface:        #1F3829;
  --mb-border:         rgba(166,222,155,0.15);
  --mb-border-strong:  #A6DE9B;
  --mb-muted:          rgba(245,247,245,0.55);
  --mb-text:           #F5F7F5;
  --mb-primary:        #A6DE9B;
  --mb-primary-text:   #1A2E22;

  --background:           #1A2E22;
  --foreground:           #F5F7F5;
  --card:                 #1F3829;
  --card-foreground:      #F5F7F5;
  --popover:              #1F3829;
  --popover-foreground:   #F5F7F5;
  --primary:              #A6DE9B;
  --primary-foreground:   #1A2E22;
  --secondary:            #243d30;
  --secondary-foreground: #F5F7F5;
  --muted:                #243d30;
  --muted-foreground:     rgba(245,247,245,0.55);
  --accent:               #A6DE9B;
  --accent-foreground:    #1A2E22;
  --border:               rgba(166,222,155,0.15);
  --input:                #A6DE9B;
  --ring:                 #A6DE9B;

  --sidebar:                    #1A2E22;
  --sidebar-foreground:         #F5F7F5;
  --sidebar-primary:            #A6DE9B;
  --sidebar-primary-foreground: #1A2E22;
  --sidebar-accent:             rgba(166,222,155,0.1);
  --sidebar-accent-foreground:  #F5F7F5;
  --sidebar-border:             rgba(166,222,155,0.12);
  --sidebar-ring:               #A6DE9B;
}
```

#### F.4 — Agresif border-radius sıfırlama kurallarını kaldır

globals.css @layer base içinde şu bloku SİL:
```css
/* SİL — bu artık geçersiz */
[class~="rounded"],
[class~="rounded-sm"],
[class~="rounded-md"],
[class~="rounded-lg"],
[class~="rounded-xl"],
[class~="rounded-2xl"],
[class~="rounded-3xl"] {
  border-radius: 0 !important;
}
[class*="rounded-[min"] {
  border-radius: 0 !important;
}
```

#### F.5 — @layer base html/body font güncellemesi

```css
html {
  font-family: var(--font-inter), system-ui, sans-serif;
  /* font-size 13px → 14px (BetterHelp daha büyük base) */
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}
```

#### F.6 — Buton utility class'larını güncelle

```css
.btn-primary {
  background-color: var(--mb-primary);
  color: var(--mb-primary-text);
  border: none;
  padding: 10px 22px;
  font-family: var(--font-inter), system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 100px;   /* pill */
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn-primary:hover { background-color: #8ED485; }

.btn-secondary {
  background-color: transparent;
  border: 1.5px solid var(--mb-border-strong);
  color: var(--mb-border-strong);
  padding: 10px 22px;
  font-family: var(--font-inter), system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 100px;   /* pill */
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn-secondary:hover { background-color: rgba(50,83,67,0.05); }
```

- [ ] F.1 @theme inline güncellendi
- [ ] F.2 :root değişkenleri güncellendi
- [ ] F.3 dark mode güncellendi
- [ ] F.4 border-radius sıfırlama kuralları silindi
- [ ] F.5 html font-size 14px + Inter
- [ ] F.6 btn utility class'ları güncellendi

---

### GÖREV G — Admin Sidebar + Layout

**Dosyalar:**
- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminHeader.tsx` (varsa)
- `app/(admin)/layout.tsx`

**AdminSidebar değişiklikleri:**
- bg `#325343` (koyu yeşil) — `var(--sidebar)` ile de olur
- Yazılar `#F5F7F5` — `var(--sidebar-foreground)`
- Aktif nav item: `background: rgba(166,222,155,0.15)`, `color: #A6DE9B`, `border-left: 3px solid #A6DE9B`
- Hover: `background: rgba(255,255,255,0.06)`
- Bölüm başlıkları (section headers): `color: rgba(245,247,245,0.45)`, 9px uppercase
- Logo/marka: `color: #A6DE9B` (yeşil tonda)
- Sidebar genişliği: 220px (190px → 220px, BetterHelp daha geniş)

**AdminHeader değişiklikleri:**
- bg `#F5F7F5` veya `#FFFFFF`
- border-bottom `1px solid #D4E4D8`
- Başlık metni `#252625`
- Rol badge: `background: rgba(50,83,67,0.1)`, `color: #325343`, `border-radius: 100px`

- [ ] G.1 AdminSidebar — renk + boyut
- [ ] G.2 AdminHeader — renk güncellendi

---

### GÖREV H — Admin Dashboard + Tüm Admin Sayfaları

**Etkilenen sayfalar:** `app/(admin)/admin/*` altındaki tüm sayfalar

**Genel kural — tüm admin sayfalarında:**
- Sayfa bg: `#FFFCF6` (veya `var(--mb-bg)`)
- Card/panel bg: `#FFFFFF` (veya `var(--mb-surface)`)
- Card `border: 1px solid #D4E4D8`, `border-radius: 12px`
- Card box-shadow: `0 2px 8px rgba(50,83,67,0.06)`
- Tablo header bg: `#F5F7F5`
- Tablo row hover: `#F5F7F5`
- Primary buton: `bg #A6DE9B`, `color #325343`, `border-radius: 100px`
- Secondary buton: `border: 1.5px solid #325343`, `color #325343`, `border-radius: 100px`
- Input/select border: `1px solid #D4E4D8`, `border-radius: 8px`, focus: `border-color #325343`
- Başlıklar (H1/H2): `font-family: var(--font-overpass)`, `fontWeight: 300`, `color: #252625`
- KPI sayı rengi (dashboard): `color: #325343`
- Aktif badge/pill: `bg #A6DE9B`, `color #325343`, `border-radius: 100px`

**Kontrol et, rengi hardcoded `#212121` olanları güncelle:**
```bash
grep -r "#212121" app/(admin)/ components/admin/ --include="*.tsx" -l
grep -r "var(--mb-primary)" app/(admin)/ components/admin/ --include="*.tsx" -l
grep -r "border-radius: 0" app/(admin)/ components/admin/ --include="*.tsx" -l
```

- [ ] H.1 Dashboard KPI kartlar — yeşil aksan
- [ ] H.2 Tablo bileşenleri — kenarlık ve hover rengi
- [ ] H.3 Modal ve form input'lar — rounded + yeşil focus
- [ ] H.4 Buton renkleri — pill + yeşil

---

### GÖREV I — Danışman Paneli

**Etkilenen sayfalar:** `app/(danisan)/danisan/*`, `components/danisan/*`

Görev H ile aynı renk kuralları. Ek olarak:
- Danışman sidebar: `#325343` bg (aynı admin sidebar)
- Takvim sayfası: randevu kutucukları `bg #A6DE9B` (aktif), `bg #F5F7F5` (boş)
- Finans sayfası: gelir grafik rengi `#325343`
- Profil sayfası: tamamlanma yüzdesi bar dolgusu `#A6DE9B`

```bash
grep -r "#212121\|border-radius: 0\|#F5F5F5" app/\(danisan\)/ components/danisan/ --include="*.tsx" -l
```

- [ ] I.1 Danışman sidebar rengi
- [ ] I.2 Takvim renkleri
- [ ] I.3 Finans/grafik renkleri
- [ ] I.4 Profil progress bar

---

### GÖREV J — Müşteri Paneli

**Etkilenen sayfalar:** `app/(musteri)/panelim/*`, `components/musteri/*`

Görev H ile aynı renk kuralları. Ek olarak:
- Müşteri sidebar/nav: `#325343`
- Randevu kartları: `border-left: 3px solid #A6DE9B`
- Ruh hali (mood) renkleri korunur (5 renk skalası)
- Günlük/journal: `bg #FFFCF6`, yazı alanı `border: 1px solid #D4E4D8`

- [ ] J.1 Sidebar/nav rengi
- [ ] J.2 Randevu kartları
- [ ] J.3 Günlük sayfası

---

### GÖREV K — Kurumsal Panel

**Etkilenen sayfalar:** `app/(kurumsal)/kurumsal-panel/*`, `components/kurumsal/*`

Görev H ile aynı renk kuralları.

- [ ] K.1 Kurumsal panel sidebar ve sayfaları

---

### GÖREV L — Giriş / Kayıt Sayfaları

**Dosyalar:** `app/(auth)/giris/page.tsx`, `app/(auth)/kayit/page.tsx`

- Sayfa sol yarısı (varsa): bg `#325343`, dekoratif görseller
- Form alanı: bg `#FFFFFF`, card `border-radius: 16px`, shadow
- "Giriş Yap" butonu: `bg #A6DE9B`, `color #325343`, `border-radius: 100px`
- Input'lar: `border: 1px solid #D4E4D8`, `border-radius: 8px`
- Link rengi: `#397A4A`
- Logo: yeşil tonda

- [ ] L.1 Giriş sayfası BetterHelp tasarımı
- [ ] L.2 Kayıt sayfası BetterHelp tasarımı

---

### GÖREV M — Header & Footer

**Header:** `components/shared/Header.tsx`

Public sayfalarda (panel prefix'leri dışında):
```
- Transparent bg, logo + linkler #F5F7F5
- scroll > 50px: backgroundColor #325343 + smooth geçiş (transition: background-color 0.2s ease)
- Logo: fontFamily var(--font-overpass), color #F5F7F5
- Nav linkler: color rgba(245,247,245,0.8), hover: #F5F7F5
- Aktif link: color #A6DE9B, border-bottom: 2px solid #A6DE9B
- Giriş butonu: transparent bg, border: 1px solid rgba(245,247,245,0.6), color #F5F7F5, radius 100px
- Kayıt / Danışman Bul CTA: bg #A6DE9B, color #325343, radius 100px
- Dark mode toggle: border color rgba(245,247,245,0.3), color rgba(245,247,245,0.7)
- Dropdown menü: bg #325343, border: 1px solid rgba(245,247,245,0.15)
```

Scroll davranışı için `useEffect` + `window.addEventListener("scroll", ...)` kullan.

**Footer:** `components/shared/Footer.tsx`
```
- bg #325343
- Logo rengi #F5F7F5
- Gövde metin rgba(245,247,245,0.65)
- Link hover: color #A6DE9B
- Bölüm başlıkları: color rgba(245,247,245,0.4), uppercase, 10px
- Bölüm separator: border-top 1px solid rgba(245,247,245,0.1)
- Alt bar bg: rgba(0,0,0,0.15)
- "Danışman Ol" butonu: border 1px solid rgba(245,247,245,0.4), color #F5F7F5, radius 100px
```

- [ ] M.1 Header — scroll + renk + pill butonlar
- [ ] M.2 Footer — dark green

---

### GÖREV N — Diğer Public Sayfalar

Aşağıdaki sayfalardaki component'lerde `#212121`, `var(--mb-*)` (eski değerler), keskin köşe (`border-radius: 0`) varsa güncelle:

```
app/danismanlar/page.tsx + components/public/DanismanKarti.tsx
app/danismanlar/[slug]/page.tsx
app/sss/page.tsx
app/hakkimizda/page.tsx
app/iletisim/page.tsx
app/kurumsal/page.tsx
app/fiyatlandirma/page.tsx
app/blog/page.tsx + app/blog/[slug]/page.tsx
app/affiliate/page.tsx
app/kvkk/page.tsx
app/gizlilik-politikasi/page.tsx
```

Kontrol:
```bash
grep -r "#212121\|border-radius: 0\|var(--mb-primary)" app/ components/public/ --include="*.tsx" -l | grep -v "(admin)\|(danisan)\|(musteri)\|(kurumsal)"
```

- [ ] N.1 DanismanKarti — kart rengi + buton pill
- [ ] N.2 Danışman liste sayfası
- [ ] N.3 Danışman profil sayfası
- [ ] N.4 Diğer public sayfalar

---

### GÖREV C — Header & Footer (özet = Görev M ile aynı)

Görev M'ye bakın.

---

### GÖREV D — Admin Görsel & Tasarım Yönetimi

#### D.1 — Storage migration
Dosya: `supabase/migrations/016_site_images.sql`

```sql
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "Public read site-images"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "Admin insert site-images"
  on storage.objects for insert
  with check (
    bucket_id = 'site-images'
    and (auth.jwt() ->> 'role') = 'admin'
  );

create policy "Admin update site-images"
  on storage.objects for update
  using (bucket_id = 'site-images' and (auth.jwt() ->> 'role') = 'admin');

create policy "Admin delete site-images"
  on storage.objects for delete
  using (bucket_id = 'site-images' and (auth.jwt() ->> 'role') = 'admin');

insert into site_settings (key, value, description) values
  ('hero_image_url', '', 'Hero bölümü yan görseli'),
  ('hero_image_alt', 'Online terapi', 'Hero görseli alt text'),
  ('why_section_image_url', '', 'Neden Biz görseli'),
  ('how_step1_image_url', '', 'Adım 1 görseli'),
  ('how_step2_image_url', '', 'Adım 2 görseli'),
  ('how_step3_image_url', '', 'Adım 3 görseli'),
  ('corporate_section_image_url', '', 'Kurumsal bölüm görseli'),
  ('og_image_url', '', 'OG paylaşım görseli 1200x630')
on conflict (key) do nothing;
```

#### D.2 — Upload API
Dosya: `app/api/admin/site-images/route.ts`

```typescript
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await requireRole(supabase, "admin")
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const settingKey = formData.get("key") as string | null
  if (!file || !settingKey) return Response.json({ error: "Dosya ve key zorunlu" }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "10 MB limitini aşıyor" }, { status: 400 })
  const allowed = ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"]
  if (!allowed.includes(file.type)) return Response.json({ error: "Geçersiz dosya türü" }, { status: 400 })
  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${settingKey}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { data: up, error: upErr } = await supabase.storage
    .from("site-images").upload(filename, buffer, { contentType: file.type, upsert: true })
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 })
  const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(up.path)
  const { error: sErr } = await supabase.from("site_settings")
    .upsert({ key: settingKey, value: urlData.publicUrl, updated_at: new Date().toISOString() })
  if (sErr) return Response.json({ error: sErr.message }, { status: 500 })
  return Response.json({ url: urlData.publicUrl })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  await requireRole(supabase, "admin")
  const key = new URL(request.url).searchParams.get("key")
  if (!key) return Response.json({ error: "key zorunlu" }, { status: 400 })
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single()
  if (data?.value) {
    const base = supabase.storage.from("site-images").getPublicUrl("").data.publicUrl
    const path = data.value.replace(base.replace(/\/$/, "") + "/", "")
    if (path) await supabase.storage.from("site-images").remove([path])
  }
  await supabase.from("site_settings").update({ value: "" }).eq("key", key)
  return Response.json({ ok: true })
}
```

#### D.3 — SiteImageManager bileşeni
Dosya: `components/admin/SiteImageManager.tsx`

- Her görsel key için upload kartı (Görev G'nin tasarım sistemi — yeşil sidebar ile tutarlı)
- Mevcut görsel: `<img>` önizleme, max-height 140px, `border-radius: 8px`
- Drag-and-drop: HTML5 native events (onDragOver, onDrop)
- Click-to-upload: `<input type="file" hidden>` + button trigger
- 10MB limit + görsel türü kontrolü (client-side da)
- Loading spinner, toast başarı/hata
- "Kaldır" butonu → DELETE endpoint

```typescript
const IMAGE_KEYS = [
  { key: "hero_image_url",              label: "Hero Görseli",     desc: "Ana sayfa — hero bölümü" },
  { key: "why_section_image_url",       label: "Neden Biz",        desc: "Neden Biz bölümü" },
  { key: "how_step1_image_url",         label: "Adım 1",           desc: "Nasıl çalışır — Adım 1" },
  { key: "how_step2_image_url",         label: "Adım 2",           desc: "Nasıl çalışır — Adım 2" },
  { key: "how_step3_image_url",         label: "Adım 3",           desc: "Nasıl çalışır — Adım 3" },
  { key: "corporate_section_image_url", label: "Kurumsal",         desc: "Kurumsal CTA bölümü" },
  { key: "og_image_url",                label: "OG Görseli",       desc: "Sosyal medya 1200×630px" },
]
```

#### D.4 — Admin site-settings sayfası
Dosyalar: `app/(admin)/admin/site-settings/page.tsx`, `components/admin/SiteSettingsKlient.tsx`

shadcn/ui `<Tabs>` ile 2 sekme:
1. **"İçerik"** — mevcut text düzenleme tablosu
2. **"Görseller"** — `<SiteImageManager settings={settings} />`

- [ ] D.1 migration 016_site_images.sql
- [ ] D.2 app/api/admin/site-images/route.ts
- [ ] D.3 components/admin/SiteImageManager.tsx
- [ ] D.4 admin/site-settings sayfasına sekme eklendi

---

### GÖREV E — Renk Yönetimi Admin'den (Opsiyonel)

```sql
insert into site_settings (key, value, description) values
  ('theme_hero_bg',      '#325343', 'Hero arkaplan rengi'),
  ('theme_cta_btn',      '#A6DE9B', 'CTA buton rengi'),
  ('theme_heading_light','#252625', 'Başlık rengi (açık bg)'),
  ('theme_body_text',    '#4A4D4A', 'Gövde metin rengi')
on conflict (key) do nothing;
```

Admin site-settings'e "Renkler" sekmesi: `<input type="color">` picker'lar.

Layout veya public sayfalarda dinamik CSS variable inject:
```tsx
const themeStyle = {
  "--pub-green-dark": settings["theme_hero_bg"] ?? "#325343",
  "--mb-primary":     settings["theme_cta_btn"] ?? "#A6DE9B",
} as React.CSSProperties
// <html style={themeStyle}>
```

- [ ] E.1 Migration: renk key'leri
- [ ] E.2 Admin renk picker UI
- [ ] E.3 Dinamik CSS variable inject

---

## 5. TEKNİK KURALLAR

```
- TypeScript any kullanma
- SVG fill attribute'larına var() yazma — hardcoded hex
- Admin route'ları requireRole(supabase, "admin") kontrolsüz bırakma
- 10 MB üzeri dosya yüklemeyi reddet
- Client'ta service_role key kullanma
- docs/ klasörü: yalnızca PROGRESS.md + CONFLICTS.md değiştirilebilir
- CLAUDE.md değiştirme

Font kullanımı:
  style={{ fontFamily: "var(--font-overpass)" }}  ← başlıklar
  style={{ fontFamily: "var(--font-inter)" }}      ← body/buton

BetterHelp başlık boyutları:
  H1: fontSize 48px, fontWeight 300 (ince!)
  H2: fontSize 40-48px, fontWeight 300
  Bold vurgu: <strong style={{ fontWeight: 700, color: "#A6DE9B" }}>

Section geçiş dalgaları (fill hardcoded):
  Dark → Krem:  fill="#FFFCF6"
  Krem → Açık:  fill="#F5F7F5"
  Açık → Dark:  fill="#325343"
```

---

## 6. GÖREV TAMAMLAMA SIRASI

```
F (globals.css) → G (Admin Sidebar) → H (Admin sayfaları) →
I (Danışman paneli) → J (Müşteri paneli) → K (Kurumsal panel) →
L (Giriş/Kayıt) → M (Header/Footer) → N (Diğer public) →
D (Görsel yönetimi) → E (Opsiyonel renk admin)
```

---

## 7. SON ADIM — BUILD KONTROL

```bash
cd /Users/baran/Desktop/mindbridger
npm run type-check   # 0 hata olmalı
npm run build        # başarılı olmalı
```

Başarılıysa `docs/PROGRESS.md`'yi güncelle.

---

## 8. TAMAMLANMA KONTROL LİSTESİ

- [x] globals.css —pub-* renk token'ları + @theme + font vars (kısmen)
- [x] layout.tsx — Overpass + Inter yüklendi
- [x] 10 homepage bileşeni (components/public/home/) — hardcoded hex, 0 var() kaldı
- [ ] **F** — globals.css ana sistem BetterHelp renkleriyle tam güncellendi
- [ ] **G** — Admin sidebar koyu yeşil
- [ ] **H** — Admin tüm sayfalar
- [ ] **I** — Danışman paneli
- [ ] **J** — Müşteri paneli
- [ ] **K** — Kurumsal panel
- [ ] **L** — Giriş / Kayıt sayfaları
- [ ] **M** — Header scroll + Footer dark green
- [ ] **N** — Diğer public sayfalar
- [ ] **D** — Admin görsel yönetimi (Storage + API + UI)
- [ ] **E** — Renk admin (opsiyonel)
