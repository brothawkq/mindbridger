# BETTERHELP_TASARIM.md — Tasarım Yenileme + Admin Görsel Yönetimi

> Bu dosya başka bir Claude Code oturumunun okuyup uygulayacağı görev belgesidir.
> Tüm kararlar, değerler ve sıra buradadır. Soru sormadan başla.

---

## 0. ÖNCE OKU — Proje Bağlamı

**Proje:** MindBridger — Next.js 14 App Router, Tailwind v4, Supabase, TypeScript strict
**Klasör:** `/Users/baran/Desktop/mindbridger`
**Tailwind:** v4 — `tailwind.config.ts` YOK, `@theme` bloğu `app/globals.css` içinde

CLAUDE.md'yi ve docs/ klasörünü oku (PRD, SCHEMA, ROUTES, PROGRESS, CONFLICTS).

---

## 1. NE YAPILDI (MEVCUT DURUM)

Aşağıdakiler zaten mevcut; bunları tekrar yazma:

### globals.css — Yapıldı ✅
- `@theme inline` bloğuna `--color-pub-*` renk token'ları eklendi
  → Tailwind sınıfları olarak `bg-pub-dark`, `text-pub-on-dark` vb. artık çalışır
- `:root` içinde `--pub-*` CSS değişkenleri doğru BetterHelp değerleriyle güncellendi
- `--font-overpass` ve `--font-inter` font değişkenleri eklendi

### layout.tsx — Yapıldı ✅
- `Overpass` (300,400,500,600,700,800) ve `Inter` (400,500,600) next/font/google ile yüklendi
- `<html>` elementine `className={overpass.variable + " " + inter.variable}` eklendi

### Bileşenler (kısmen)
- `HeroSection.tsx` — var ama SVG fill bug'ı var
- `StatsTicker.tsx`, `StatsSection.tsx`, `HowItWorksSection.tsx` — var ama `var(--pub-*)` kullanıyor
- `WhySection.tsx`, `FeaturedConsultantsSection.tsx`, `TestimonialsSection.tsx` — var
- `KurumsalCtaSection.tsx`, `FinalCtaSection.tsx`, `FaqSection.tsx` — var
- Veritabanı: `site_settings` tablosu + migration + seed var
- Admin API: `app/api/admin/site-settings/route.ts` var
- Admin sayfa: `app/(admin)/admin/site-settings/page.tsx` var
- Sidebar: "Site İçeriği" nav item var

---

## 2. GERÇEK BETTERHELP RENK PALETİ

> Chrome DevTools ile 2026-05-27 tarihinde `betterhelp.com`'dan alındı. Bunlar kesin değerler.

```
Arkaplanlar:
  #325343  →  Hero, dark sections (html bg, dark-bg class)
  #FFFCF6  →  Warm cream (numbers, FAQ, partners sections)
  #F5F7F5  →  Light green-white (steps section, near-white)
  #F7F0E6  →  Amber cream (gift/special sections)

Yeşil tonları (kart renkleri):
  #397A4A  →  Individual (Bireysel) kart
  #457777  →  Couples (Çift) kart — teal
  #A75D00  →  Teen (Genç) kart — amber/brown

Butonlar:
  #A6DE9B  →  Ana CTA buton arkaplanı (açık yeşil pill)
  #325343  →  CTA buton metin rengi
  #F5F7F5  →  Dark section'da buton arkaplanı (beyazımsı)
  100px    →  Border-radius (pill)
  Boyut: height 40px (normal), 56px (büyük/lg)

Metin:
  #F5F7F5  →  H1, H2 on dark bg
  #252625  →  H2 on light bg
  #4A4D4A  →  Body text (p), footer
  #4A4D4A  →  Body text muted (aynı)

Tipografi:
  Font heading: Overpass, sans-serif (fontWeight 300 başlıklar için!)
  Font body:    Inter, sans-serif
  H1: 48px, fontWeight 300 (ince!), lineHeight 56px, color #F5F7F5
  H2: 48px, fontWeight 300, lineHeight 56px, color #252625 (light bg)
  H2 on dark: color #F5F7F5
  Body: 20px, fontWeight 400, lineHeight 32px, color #4A4D4A
  Button: 16px, fontWeight 500

Section class → bg color:
  hero-wrapper          → #325343
  .numbers              → #FFFCF6
  .steps                → #F5F7F5
  .comparison-table-wrap→ #325343
  .testimonial-in-quotes→ #325343
  .home-faq             → #FFFCF6
  .home-gift            → #F7F0E6

Diğer önemli değerler:
  Outline button (dark bg'de): bg transparent, color #F5F7F5, border 1px solid #F5F7F5, radius 100px
  Light green accent: #A6DE9B (CTA hover-state da aynı tona yakın)
  Box shadow (kartlarda): none veya çok hafif (BetterHelp minimal shadow kullanıyor)
  Nav: transparent bg, 64px yükseklik
```

---

## 3. NEDEN ŞUANKI TASARIM BOZUK

1. **SVG fill bug**: `<path fill="var(--pub-green-dark)">` → SVG presentation attribute'ları CSS variable okuyamaz → siyah çıkıyor
2. **@theme'e eklenmemiş** (eski durum): `--pub-*` değişkenleri `@theme inline` bloğunda yoktu → `bg-pub-green-dark` Tailwind class'ı generate edilmiyordu
3. **Yanlış renkler**: Önceki değerler BetterHelp'ten farklıydı

**ŞİMDİ** globals.css güncellendi (Madde 1'de belirtildi) — `--color-pub-*` artık `@theme inline` içinde.

---

## 4. YAPILACAK GÖREVLER — SIRAYLA YAP

Her görevi bitirince devam et. Onay bekleme.

---

### GÖREV A — Tüm public homepage bileşenlerini yeniden yaz

Her bileşende şu kuralları uygula:

**Kural 1: SVG fill'lere kesinlikle CSS variable kullanma**
```tsx
// ❌ YANLIŞ — siyah çıkar
<path fill="var(--pub-green-dark)" />

// ✅ DOĞRU — hardcoded hex
<path fill="#325343" />
```

**Kural 2: Tailwind class'larını kullan, inline style kullanımını minimuma indir**
```tsx
// ❌ YANLIŞ
<section style={{ background: "var(--pub-green-dark)" }}>

// ✅ DOĞRU — @theme'e eklendi, artık class olarak çalışır
<section className="bg-pub-dark">
```

**Kural 3: Font'ları CSS variable ile uygula**
```tsx
// Heading'ler için Overpass
<h1 style={{ fontFamily: "var(--font-overpass)" }}>
// Body için Inter
<p style={{ fontFamily: "var(--font-inter)" }}>
```

**Kural 4: BetterHelp font-weight kuralı**
- Büyük başlıklar (H1, H2): `fontWeight: 300` (ince! BetterHelp bunu yapıyor)
- Butonlar: `fontWeight: 500`
- Küçük label/etiket: `fontWeight: 600` veya `700`

---

#### A.1 — `components/public/home/HeroSection.tsx`

**BetterHelp hero yapısı:**
- Koyu yeşil (`#325343`) tam arkaplan — hero section
- Ortada H1: Overpass, 48px, fontWeight 300, renk `#F5F7F5`
- Altında pill CTA buton: `#A6DE9B` bg, `#325343` text, 100px radius, 56px yükseklik
- İkinci (outline) buton: transparent bg, `#F5F7F5` border+text, 100px radius
- 3 kategori kartı: bireysel(`#397A4A`), çift(`#457777`), kurumsal(`#325343`—daha koyu varyant)
- Alt geçiş: SVG path fill **hardcoded `#FFFCF6`** (cream bg'ye geçiş)

```tsx
// Yapı iskelet:
<section className="bg-pub-dark overflow-hidden">
  <div className="mx-auto max-w-5xl px-6 pt-20 pb-0 text-center">
    {/* Üst etiket */}
    <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600,
                letterSpacing: "1.2px", textTransform: "uppercase", color: "#A6DE9B",
                marginBottom: 20 }}>
      Türkiye'nin Online Terapi Platformu
    </p>
    
    {/* H1 */}
    <motion.h1 style={{ fontFamily: "var(--font-overpass)", fontSize: "clamp(36px,5vw,56px)",
                        fontWeight: 300, color: "#F5F7F5", lineHeight: 1.2, marginBottom: 12 }}>
      {settings.hero_title_1 ?? "Mutlu hissetmeyi"}
      <br />
      <strong style={{ fontWeight: 700, color: "#A6DE9B" }}>
        {settings.hero_title_2 ?? "hak ediyorsunuz."}
      </strong>
    </motion.h1>
    
    {/* Alt başlık */}
    <p style={{ fontFamily: "var(--font-inter)", fontSize: 18, color: "rgba(245,247,245,0.75)",
                marginBottom: 40, lineHeight: 1.6 }}>
      {settings.hero_subtitle ?? "Hangi terapi türünü arıyorsunuz?"}
    </p>
    
    {/* 2 CTA buton yan yana */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
      <Link href="/danismanlar" style={{ background: "#A6DE9B", color: "#325343",
              borderRadius: 100, padding: "16px 36px", fontSize: 16, fontWeight: 500,
              fontFamily: "var(--font-inter)", textDecoration: "none", display: "inline-block" }}>
        Danışman Bul →
      </Link>
      <Link href="/kayit" style={{ background: "transparent", color: "#F5F7F5",
              border: "1px solid #F5F7F5", borderRadius: 100, padding: "16px 36px",
              fontSize: 16, fontWeight: 500, fontFamily: "var(--font-inter)",
              textDecoration: "none", display: "inline-block" }}>
        Ücretsiz Başla
      </Link>
    </div>
    
    {/* 3 Kategori kartı */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {/* BIREYSEL: bg #397A4A */}
      {/* ÇIFT: bg #457777 */}
      {/* KURUMSAL: bg darken(#325343, 10%) → #243d30 */}
    </div>
    
    {/* Alt not */}
    <p style={{ fontSize: 12, color: "rgba(245,247,245,0.55)", marginTop: 20, marginBottom: 0 }}>
      İlk 15 dakika ücretsiz tanışma · Lisanslı uzmanlar · KVKK uyumlu
    </p>
  </div>
  
  {/* ALT DALGA — hardcoded fill! */}
  <div style={{ lineHeight: 0, marginTop: 40 }}>
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:"100%", display:"block" }}>
      <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#FFFCF6" />
    </svg>
  </div>
</section>
```

---

#### A.2 — `components/public/home/StatsTicker.tsx`

- bg `#325343`, text `rgba(245,247,245,0.85)`
- `var(--pub-green-dark)` → className `bg-pub-dark` veya inline `backgroundColor: "#325343"`

---

#### A.3 — `components/public/home/StatsSection.tsx`

- bg `#325343` (koyu yeşil dark section)
- Sol H2: Overpass, fontWeight 300, color `#F5F7F5`
- Sayılar: 36px bold white
- Alt dalga: SVG path fill hardcoded `#FFFCF6`
- `var(--pub-bg)` → `#FFFCF6`
- `var(--pub-green-btn)` → `#A6DE9B`

---

#### A.4 — `components/public/home/HowItWorksSection.tsx`

- Section bg `#F5F7F5` (açık yeşil-beyaz, BetterHelp .steps section gibi)
- H2: Overpass fontWeight 300, color `#252625`
- Adım numaraları: daire bg `#A6DE9B`, text `#325343`
- Kart/visual bg `#FFFFFF`
- `var(--pub-green-light)` → `#EDF7ED` (soft green)
- `var(--pub-text)` → `#252625`
- `var(--pub-text-muted)` → `#4A4D4A`
- `var(--pub-green-btn)` → `#A6DE9B`
- Alt geçiş dalga: `#325343` (dark section'a geçiş için)

---

#### A.5 — `components/public/home/WhySection.tsx`

- Section bg `#FFFCF6` (krem)
- H2: Overpass fontWeight 300, `#252625`
- `var(--pub-*)` → hardcoded değerler

---

#### A.6 — `components/public/home/FeaturedConsultantsSection.tsx`

- Section bg `#F5F7F5`
- H2: Overpass fontWeight 300, `#252625`
- Kart bg `#FFFFFF`, border-radius 12px, shadow `0 2px 12px rgba(0,0,0,0.06)`
- CTA: `#A6DE9B` pill buton

---

#### A.7 — `components/public/home/TestimonialsSection.tsx`

- Section bg `#325343` (dark — BetterHelp testimonials dark bg'de)
- H2: `#F5F7F5`, Overpass fontWeight 300
- Kart bg: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.15)`, radius 12px
- Star rengi: sarı `#F5C518`
- Yorum metni: `rgba(245,247,245,0.85)`
- Alt dalga: hardcoded `#FFFCF6`

---

#### A.8 — `components/public/home/KurumsalCtaSection.tsx`

- Section bg `#325343`
- H2: `#F5F7F5`, Overpass fontWeight 300
- CTA: `#A6DE9B` pill
- `var(--pub-*)` → hardcoded

---

#### A.9 — `components/public/home/FinalCtaSection.tsx`

- Section bg `#FFFCF6` (krem)
- H2: `#252625`, Overpass fontWeight 300
- CTA: `#A6DE9B` pill
- `var(--pub-*)` → hardcoded

---

#### A.10 — `components/public/home/FaqSection.tsx`

- İllüstrasyon şeridinin bg: `#325343` hardcoded (SVG fill de hardcoded)
- FAQ section bg `#FFFCF6`
- H2: `#252625`, Overpass fontWeight 300
- Accordion border: `#D4E4D8`
- `var(--pub-*)` → hardcoded

---

### GÖREV B — Diğer public sayfa bileşenlerinde --pub-* kullanımını düzelt

Aşağıdaki sayfa/bileşen dosyalarında `var(--pub-green-dark)`, `var(--pub-green-btn)`, `var(--pub-bg)` vs. kullanıyorsa hepsini hardcoded hex'e çevir:

```
components/public/          (tüm alt klasörler)
app/(public)/               (varsa)
app/danismanlar/            (public sayfalar)
app/hakkimizda/
app/iletisim/
app/sss/
app/fiyatlandirma/
app/blog/
app/affiliate/
app/kurumsal/
app/kvkk/
app/gizlilik-politikasi/
```

Kontrol etmek için:
```bash
grep -r "var(--pub-" components/public/ app/ --include="*.tsx" -l
```

Her dosyada bulduğun `var(--pub-xxx)` string'ini hardcoded karşılığıyla değiştir:

| CSS Değişken | Hardcoded Değer |
|---|---|
| `var(--pub-bg)` | `#FFFCF6` |
| `var(--pub-bg-alt)` | `#F5F7F5` |
| `var(--pub-bg-warm)` | `#F7F0E6` |
| `var(--pub-green-dark)` | `#325343` |
| `var(--pub-green)` | `#397A4A` |
| `var(--pub-green-teal)` | `#457777` |
| `var(--pub-green-amber)` | `#A75D00` |
| `var(--pub-btn)` | `#A6DE9B` |
| `var(--pub-btn-hover)` | `#8ED485` |
| `var(--pub-text)` | `#252625` |
| `var(--pub-text-body)` | `#4A4D4A` |
| `var(--pub-text-on-dark)` | `#F5F7F5` |
| `var(--pub-text-muted)` | `#4A4D4A` |
| `var(--pub-border)` | `#D4E4D8` |
| `var(--pub-green-btn)` | `#A6DE9B` |
| `var(--pub-green-btn-hover)` | `#8ED485` |
| `var(--pub-green-light)` | `#EDF7ED` |
| `var(--pub-radius-btn)` | `100px` (inline style'da) |
| `var(--pub-radius-card)` | `12px` (inline style'da) |

> ⚠️ SVG `fill` attribute'larında kesinlikle `var()` kullanma — hardcoded hex zorunlu.

---

### GÖREV C — Header ve Footer'ı public tasarıma uyarla

Dosyalar: `components/shared/Header.tsx`, `components/shared/Footer.tsx`

**Header:**
- Public sayfalarda (admin/panel dışında): transparent bg, hero üzerinde float
- Logo rengi: `#F5F7F5` (dark bg üzerinde beyaz)
- Nav link rengi: `#F5F7F5`
- Scroll sonrası: bg `#325343`, hafif shadow
- CTA buton: `#A6DE9B` pill

**Footer:**
- bg `#325343`
- Text: `rgba(245,247,245,0.75)`
- Link hover: `#A6DE9B`

Mevcut Header/Footer'ın içeriğini koru, sadece renk/font değerlerini güncelle.

---

### GÖREV D — Admin Görsel & Tasarım Yönetimi

Bu görev 4 alt adımdan oluşur:

#### D.1 — Supabase Storage bucket

Migration dosyası: `supabase/migrations/016_site_images.sql`

```sql
-- Storage bucket oluştur (Supabase dashboard'da yapılabilir ama migration ile de olur)
-- site-images bucket için RLS politikaları
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- Herkes okuyabilir (public bucket)
create policy "Public read site-images"
  on storage.objects for select
  using (bucket_id = 'site-images');

-- Sadece admin yükleyebilir
create policy "Admin insert site-images"
  on storage.objects for insert
  with check (
    bucket_id = 'site-images'
    and auth.jwt() ->> 'role' = 'admin'
  );

-- Sadece admin silebilir/güncelleyebilir
create policy "Admin update site-images"
  on storage.objects for update
  using (bucket_id = 'site-images' and auth.jwt() ->> 'role' = 'admin');

create policy "Admin delete site-images"
  on storage.objects for delete
  using (bucket_id = 'site-images' and auth.jwt() ->> 'role' = 'admin');
```

Ayrıca `site_settings` tablosuna görsel key'leri ekle:
```sql
insert into site_settings (key, value, description) values
  ('hero_image_url', '', 'Hero bölümü arkaplan/yan görseli (Supabase Storage URL)'),
  ('hero_image_alt', 'Online terapi platformu', 'Hero görseli alt text'),
  ('why_section_image_url', '', 'Neden Biz bölümü görseli'),
  ('how_step1_image_url', '', 'Nasıl çalışır adım 1 görseli'),
  ('how_step2_image_url', '', 'Nasıl çalışır adım 2 görseli'),
  ('how_step3_image_url', '', 'Nasıl çalışır adım 3 görseli'),
  ('corporate_section_image_url', '', 'Kurumsal bölüm görseli'),
  ('og_image_url', '', 'Open Graph paylaşım görseli')
on conflict (key) do nothing;
```

#### D.2 — Upload API route

Dosya: `app/api/admin/site-images/route.ts`

```typescript
// POST: Görsel yükle → Supabase Storage'a kaydet → URL'i site_settings'e yaz
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await requireRole(supabase, "admin")

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const settingKey = formData.get("key") as string | null

  if (!file || !settingKey) {
    return Response.json({ error: "Dosya ve key zorunlu" }, { status: 400 })
  }

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Dosya 10 MB limitini aşıyor" }, { status: 400 })
  }

  // Sadece görsel kabul et
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
  if (!allowed.includes(file.type)) {
    return Response.json({ error: "Geçersiz dosya türü" }, { status: 400 })
  }

  const ext = file.name.split(".").pop()
  const filename = `${settingKey}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("site-images")
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from("site-images")
    .getPublicUrl(uploadData.path)

  // site_settings'i güncelle
  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert({ key: settingKey, value: urlData.publicUrl, updated_at: new Date().toISOString() })

  if (settingsError) {
    return Response.json({ error: settingsError.message }, { status: 500 })
  }

  return Response.json({ url: urlData.publicUrl })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  await requireRole(supabase, "admin")
  
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  
  if (!key) return Response.json({ error: "key zorunlu" }, { status: 400 })
  
  // site_settings'ten URL'i al
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single()
  
  if (data?.value) {
    // Storage'dan sil (URL'den path çıkar)
    const url = data.value
    const storageUrl = supabase.storage.from("site-images").getPublicUrl("").data.publicUrl
    const path = url.replace(storageUrl.replace(/\/$/, "") + "/", "")
    await supabase.storage.from("site-images").remove([path])
  }
  
  // site_settings'i temizle
  await supabase.from("site_settings").update({ value: "" }).eq("key", key)
  
  return Response.json({ ok: true })
}
```

#### D.3 — Admin Image Manager bileşeni

Dosya: `components/admin/SiteImageManager.tsx`

```typescript
"use client"
// Özellikler:
// - Her görsel key için upload alanı göster
// - Mevcut görsel varsa önizleme göster
// - Drag-and-drop + click-to-upload
// - 10MB limit, sadece görsel türleri
// - Yükleme progress bar
// - Başarı/hata toast
// - "Kaldır" butonu

// Görsel key listesi:
const IMAGE_KEYS = [
  { key: "hero_image_url", label: "Hero Görseli", desc: "Ana sayfa hero bölümü" },
  { key: "why_section_image_url", label: "Neden Biz Görseli", desc: "Neden Biz bölümü" },
  { key: "how_step1_image_url", label: "Adım 1 Görseli", desc: "Nasıl çalışır - Adım 1" },
  { key: "how_step2_image_url", label: "Adım 2 Görseli", desc: "Nasıl çalışır - Adım 2" },
  { key: "how_step3_image_url", label: "Adım 3 Görseli", desc: "Nasıl çalışır - Adım 3" },
  { key: "corporate_section_image_url", label: "Kurumsal Görseli", desc: "Kurumsal CTA bölümü" },
  { key: "og_image_url", label: "OG Görseli", desc: "Sosyal medya paylaşım önizlemesi (1200x630)" },
]
```

Bileşen; `POST /api/admin/site-images` endpoint'ine `FormData` ile `file` + `key` göndermeli.
Drag-drop için HTML5 native drag events kullan (framer-motion drag değil).

#### D.4 — Admin Site Settings sayfasını genişlet

Dosya: `app/(admin)/admin/site-settings/page.tsx` ve `components/admin/SiteSettingsKlient.tsx`

Sayfaya 2 sekme ekle:
1. **İçerik** — mevcut metin düzenleme tablosu (zaten var)
2. **Görseller** — `SiteImageManager` bileşeni

Sekme implementasyonu için shadcn/ui `<Tabs>` kullan.

---

### GÖREV E — Renk/tema değişkenlerini admin'den ayarlama (BONUS)

Bu görev opsiyonel ama yapılabiliyorsa ekle.

`site_settings` tablosuna renk key'leri ekle:

```sql
insert into site_settings (key, value, description) values
  ('theme_color_hero_bg', '#325343', 'Hero ve dark section arkaplan rengi'),
  ('theme_color_cta_btn', '#A6DE9B', 'Ana CTA buton rengi'),
  ('theme_color_heading', '#252625', 'Başlık rengi (açık zemin)'),
  ('theme_color_body', '#4A4D4A', 'Gövde metin rengi')
on conflict (key) do nothing;
```

Ana layout veya public layout'ta bu değerleri oku ve CSS inline style olarak `<html>` veya `<body>` elementine dinamik CSS değişken yaz:

```tsx
// app/layout.tsx içinde (veya public-specific layout)
const themeVars = {
  "--pub-green-dark": settings["theme_color_hero_bg"] ?? "#325343",
  "--pub-btn": settings["theme_color_cta_btn"] ?? "#A6DE9B",
  "--pub-text": settings["theme_color_heading"] ?? "#252625",
  "--pub-text-body": settings["theme_color_body"] ?? "#4A4D4A",
}
// <html style={themeVars}>
```

Admin ayarlar sayfasındaki "Görünüm" sekmesine renk picker'lar ekle (HTML `<input type="color">`).

---

## 5. TEKNIK NOTLAR

### CSS Variable → Tailwind class eşleşmeleri (globals.css'te @theme'e eklendi)

```
--color-pub-bg        → bg-pub-bg, text-pub-bg
--color-pub-bg-alt    → bg-pub-bg-alt
--color-pub-bg-warm   → bg-pub-bg-warm
--color-pub-dark      → bg-pub-dark, text-pub-dark
--color-pub-medium    → bg-pub-medium
--color-pub-teal      → bg-pub-teal
--color-pub-amber     → bg-pub-amber
--color-pub-btn       → bg-pub-btn
--color-pub-heading   → text-pub-heading
--color-pub-body      → text-pub-body
--color-pub-on-dark   → text-pub-on-dark
--color-pub-border    → border-pub-border
```

### Font kullanımı

```tsx
// Overpass — büyük başlıklar
style={{ fontFamily: "var(--font-overpass)" }}
// veya className kullanmak istersen globals.css'e utility ekle:
// .font-overpass { font-family: var(--font-overpass); }

// Inter — body, buton, label
style={{ fontFamily: "var(--font-inter)" }}
```

### Section geçiş dalgaları

```tsx
// Koyu → Krem (dark section'dan cream'e)
<svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:"100%", display:"block" }}>
  <path d="M0,30 C480,0 960,60 1440,20 L1440,60 L0,60 Z" fill="#FFFCF6" />
</svg>

// Krem → Koyu
<svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:"100%", display:"block" }}>
  <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#325343" />
</svg>

// Krem → Açık beyaz-yeşil
<svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:"100%", display:"block" }}>
  <path d="M0,40 C720,0 1080,60 1440,30 L1440,60 L0,60 Z" fill="#F5F7F5" />
</svg>
```

---

## 6. TAMAMLAMA KONTROL LİSTESİ

Her görevi bitirince bu dosyada [ ] → [x] yap.

### Görev A — Homepage Bileşenleri
- [ ] A.1 HeroSection — dark green bg, pill CTA, hardcoded SVG fills
- [ ] A.2 StatsTicker — dark green bg
- [ ] A.3 StatsSection — dark green, hardcoded SVG fill
- [ ] A.4 HowItWorksSection — light bg, step circles
- [ ] A.5 WhySection — cream bg
- [ ] A.6 FeaturedConsultantsSection — light bg, cards
- [ ] A.7 TestimonialsSection — dark green bg, cards
- [ ] A.8 KurumsalCtaSection — dark green bg
- [ ] A.9 FinalCtaSection — cream bg
- [ ] A.10 FaqSection — hardcoded SVG fill

### Görev B — Tüm public sayfalarda var(--pub-*) temizle
- [ ] B.1 `grep -r "var(--pub-"` çalıştır, tüm dosyaları bul
- [ ] B.2 Her dosyayı hardcoded değerlerle güncelle

### Görev C — Header & Footer
- [ ] C.1 Header — transparent → dark bg scroll davranışı
- [ ] C.2 Footer — dark green bg

### Görev D — Admin Görsel Yönetimi
- [ ] D.1 `supabase/migrations/016_site_images.sql`
- [ ] D.2 `app/api/admin/site-images/route.ts`
- [ ] D.3 `components/admin/SiteImageManager.tsx`
- [ ] D.4 Admin site-settings sayfasına sekme ekle

### Görev E — Renk Admin (Opsiyonel)
- [ ] E.1 site_settings'e renk key'leri ekle (migration)
- [ ] E.2 Layout'ta dinamik CSS variable inject
- [ ] E.3 Admin'de renk picker UI

---

## 7. SON ADIM — Build Kontrol

Tüm görevler bittikten sonra:
```bash
cd /Users/baran/Desktop/mindbridger
npm run type-check   # 0 hata olmalı
npm run build        # başarılı olmalı
```

Hata varsa düzelt, sonra PROGRESS.md'yi güncelle.

---

## 8. KISITLAMALAR — ASLA YAPMA

- TypeScript `any` kullanma
- Client'ta `service_role` key kullanma
- 10 MB'dan büyük dosya yüklemeye izin verme
- Admin route'ları `requireRole` kontrolsüz bırakma
- SVG `fill` attribute'larında `var(--xxx)` kullanma
- `docs/` klasöründeki dosyaları (PROGRESS.md ve CONFLICTS.md hariç) değiştirme
- CLAUDE.md'yi değiştirme
