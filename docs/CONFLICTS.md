# CONFLICTS.md — Çelişki ve Karar Kaydı

> Claude Code bu dosyayı her oturumda okur.
> "GEÇERLI" olarak işaretlenen değer doğrudur. Diğer docs dosyalarındaki çelişen değer varsa bu dosya kazanır.
> "AKTARILDI" ibaresi: bu karar ilgili docs dosyasına zaten işlendi; burada yalnızca referans olarak tutulur.

---

## ÇELİŞKİLER — GEÇERLI DEĞERLER

### 1. Oturum Zaman Aşımı
- **GEÇERLI: 30 dakika** hareketsizlik → otomatik oturum sonlandırma
- Kaynak: 08_Gereksinim_Beyanı.xlsx (mülakat + beyin fırtınası)
- AKTARILDI → CLAUDE.md, platform_ayarlari seed (`session_timeout_minutes: "30"`)

### 2. Hesap Kilit ve IP Ban (Brute Force)
- **GEÇERLI: 5 başarısız giriş → 15 dakika kilit**
- **GEÇERLI: 50 başarısız giriş → 24 saat IP kara listesi**
- Kaynak: 08_Gereksinim_Beyanı.xlsx
- AKTARILDI → CLAUDE.md, SCHEMA.md (`ip_blacklist` tablosu), platform_ayarlari seed

### 3. Video Link Aktivasyon Süresi
- **GEÇERLI: Randevu saatinden 10 dakika önce aktif**
- Kaynak: 08_Gereksinim_Beyanı.xlsx
- AKTARILDI → CLAUDE.md, PRD.md (Faz 5), SCHEMA.md (`daily_room_token` notu), IMPLEMENTATION_PLAN.md

### 4. Eşzamanlı Kullanıcı Kapasitesi
- **GEÇERLI: En az 200 aktif eşzamanlı kullanıcı** (Vercel otomatik ölçekleme ile)
- Kaynak: 08_Gereksinim_Beyanı.xlsx
- AKTARILDI → PRD.md (başarı kriterleri)

### 5. Export Formatı
- **GEÇERLI: PDF + XLSX zorunlu** (CSV isteğe bağlı ek olarak kalabilir)
- Kaynak: 08_Gereksinim_Beyanı.xlsx
- AKTARILDI → PRD.md (admin finans + raporlar), ROUTES.md, IMPLEMENTATION_PLAN.md

### 6. Seans Türü Enum
- **GEÇERLI: SCHEMA.md'deki liste** → `bireysel, asenkron, grup, cift_aile, on_gorusme, supervizyon`
- 10a_Veri_Sözlüğü.xlsx'teki [Video; Mesajlaşma; Yüz Yüze] yalnızca 3.1 sürecini anlatır; enum olarak kullanılmaz
- Eşleşme: "Video" = bireysel, "Mesajlaşma" = asenkron

---

## KARARLAR — TÜM DOSYALARA AKTARILDI

Aşağıdaki kararlar analiz dosyalarından çıkarılıp docs dosyalarına eklendi.
Claude Code bunları yeniden eklemez; zaten mevcut.

| Karar | Aktarıldığı Dosya(lar) |
|---|---|
| Platform adı: **MindBridger** | CLAUDE.md, PRD.md, .env.local şablonu |
| PDF fatura (seans sonrası otomatik, kurumsal aylık PDF+XLSX) | SCHEMA.md (`seans_faturalari`), PRD.md, ROUTES.md, IMPLEMENTATION_PLAN.md |
| Dosya yükleme limiti: **10 MB** | CLAUDE.md, SCHEMA.md, IMPLEMENTATION_PLAN.md |
| Audit log saklama: **90 gün** | SCHEMA.md (`audit_logs.expires_at`), PRD.md, platform_ayarlari seed |
| Otomatik yedek: Supabase Pro gece 03:00, 30 gün retention | PRD.md (not olarak), CONFLICTS.md (aşağıda) |
| bcrypt: minimum 12 tur | CLAUDE.md |
| TLS: 1.2 veya üzeri | CLAUDE.md |
| Ödeme: AES-256 şifreleme | CLAUDE.md, SCHEMA.md |
| Danışman yorum yanıtı (`review_reply`) | SCHEMA.md, ROUTES.md, IMPLEMENTATION_PLAN.md |
| Kurumsal çalışan bütçesi (`monthly_budget_limit`) | SCHEMA.md, PRD.md, ROUTES.md, IMPLEMENTATION_PLAN.md |
| Hassas veri sınıflandırması (seans notu, test sonucu, günlük) | SCHEMA.md (⚠️ ibareleri), CLAUDE.md |
| Profil tamamlanma zorunluluğu (`profile_completion_percent`) | SCHEMA.md, PRD.md, IMPLEMENTATION_PLAN.md |
| SUS skoru min 72.5 (yayın öncesi test) | PRD.md |
| Yaş grubu filtresi ve danışman alanı (`age_groups`) | SCHEMA.md, PRD.md, IMPLEMENTATION_PLAN.md |
| Admin log görüntüleyici sayfası | ROUTES.md, IMPLEMENTATION_PLAN.md |
| iyzico webhook `tahsilat_onay_durumu` işleme | PRD.md (Faz 4), IMPLEMENTATION_PLAN.md |
| Daily.co erişilemez hata yönetimi + Türkçe mesaj | PRD.md (Faz 5), IMPLEMENTATION_PLAN.md |
| Kritik hesap işlemlerinde OTP/mevcut şifre doğrulaması | PRD.md, ROUTES.md, IMPLEMENTATION_PLAN.md |
| Uygulama içi bildirim kanalı | SCHEMA.md (`bildirim_tercihleri`), IMPLEMENTATION_PLAN.md |
| Bildirim başarısız teslimat + yeniden deneme | SCHEMA.md (`delivery_status`, `retry_count`), IMPLEMENTATION_PLAN.md |
| Kurumsal aylık fatura cron | IMPLEMENTATION_PLAN.md (Faz 10) |
| IP blacklist temizlik cron | IMPLEMENTATION_PLAN.md (Faz 10) |
| `sessions_used_this_month` sıfırlama cron | IMPLEMENTATION_PLAN.md (Faz 10) |
| Blog SEO keywords alanı | SCHEMA.md (`blog_posts.seo_keywords`) |
| Video görüşmede kayıt yapılmadığı notu (arayüzde göster) | PRD.md (Faz 5), IMPLEMENTATION_PLAN.md |

---

## AÇIK NOTLAR — KOD YAZARKEN DİKKAT ET

### Otomatik Yedek (Supabase Pro)
Supabase veritabanı her gün gece 03:00'te otomatik tam yedek alır; 30 gün saklanır; 30 dakika içinde geri yükleme yapılabilir. Bu özellik **Supabase Pro plan** ile gelir — Claude Code'un kod yazması gereken bir şey değil; proje başlatılırken Supabase dashboard'dan aktive edilmeli.

### Pentest (Yayın Öncesi)
Platform canlıya alınmadan önce bağımsız güvenlik denetimi (pentest) yapılmalı. CVSS 9.0+ açıklar kapatılmadan yayına geçilmemeli. Bu Claude Code'un otomatize edemeyeceği bir süreç.

### Supabase RLS Hassas Veri Politikası
`notes_private`, `gunluk_kayitlar.note`, `test_sonuclari.answers`, `onboarding_yanitlar.answers` alanları için RLS politikası şöyle olmalı:
- Müşteri: yalnızca kendi kaydını okuyabilir
- Danışman: yalnızca kendi danışanının paylaşıma açtığı kaydı okuyabilir
- Admin: bu alanlara direkt erişim yok; yalnızca anonim istatistik

### 7. Tasarım Sistemi — TÜM SAYFALARA BetterHelp Uygulanır

**GEÇERLI KARAR (2026-05-27, REVİZE: 2026-05-27):**
~~İki ayrı tasarım dili~~ → **TEK tasarım dili — tüm sayfalar BetterHelp-inspired yeşil/krem sistemine geçer.**

Admin paneli, danışman paneli, müşteri paneli, kurumsal panel **dahil** her sayfa bu sistemle yeniden yazılır.

| Alan | Tasarım Sistemi | Renk | Köşeler |
|---|---|---|---|
| **Tüm sayfalar** (public + panel + admin) | BetterHelp-inspired sıcak sistem | Koyu yeşil `#325343` / krem `#FFFCF6` | Yuvarlatılmış (pill btn 100px, 12px card) |

**Renk paleti (Chrome DevTools, betterhelp.com, 2026-05-27):**
```
#325343  →  Hero, dark sections, sidebar bg, primary/accent rengi
#FFFCF6  →  Sayfa arkaplanı (sıcak krem)
#F5F7F5  →  Surface/kart arkaplanı (açık yeşil-beyaz)
#A6DE9B  →  CTA buton arkaplanı, accent
#8ED485  →  CTA buton hover
#252625  →  Başlık metni (açık bg üzerinde)
#4A4D4A  →  Gövde metin, muted
#F5F7F5  →  Metin (koyu bg üzerinde)
#D4E4D8  →  Kenarlık
```

**globals.css güncellenecek (BETTERHELP_TASARIM.md Görev F detaylı tarif eder):**
- `--mb-primary: #A6DE9B` (yeşil CTA btn)
- `--mb-primary-text: #325343`
- `--mb-bg: #FFFCF6`
- `--mb-surface: #FFFFFF`
- `--mb-text: #252625`
- `--mb-muted: #4A4D4A`
- `--mb-border: #D4E4D8`
- `--mb-border-strong: #325343`
- `--radius-lg: 12px`, `--radius-sm: 4px`, `--radius-md: 8px`
- `--sidebar: #325343`, `--sidebar-foreground: #F5F7F5`
- `--font-sans: var(--font-inter)` (Inter body), heading'lerde Overpass
- `[class~="rounded"] { border-radius: 0 !important }` kuralları KALDIRILIR

**CSS değişkenleri:** `--pub-*` değişkenleri korunur (alias olarak) ama artık `--mb-*` ile aynı değerlere işaret eder. Tüm yeni kod `--mb-*` ile yazılır.

**Aktarıldığı dosya:** `BETTERHELP_TASARIM.md` (proje kökü) — Görev F

### Vercel Cron Güvenliği
Tüm `/api/cron/*` route'ları `CRON_SECRET` header kontrolü yapmalı:
```typescript
if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```
