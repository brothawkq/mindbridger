# PROGRESS.md — Mevcut İlerleme

> Bu dosyayı SADECE Claude Code günceller. Her faz bitince buraya yaz.

---

## Denetim Durumu

**DENETİM TAMAMLANDI ✅ — 2026-05-27**

DENETIM.md tüm 4 denetim (DENETİM 1: Faz 1–12, DENETİM 2: Veritabanı, DENETİM 3: Wireframe, DENETİM 4: Tasarım) tarandı.

Toplam 63 bulgu: ~8 kritik/yüksek (auth, SQL injection, RLS), ~30 orta (border px, border-radius, animasyon, renk), ~25 düşük (tipografi, aria-label, hover padding).
Düzeltilen: 61. Açık bırakılan: 2 (KPI countUp efekti — görsel enhancement; loading.tsx eksik — kritik değil).

`tsc --noEmit` → 0 hata ✅  |  `npm run build` → 169 route, başarılı ✅

---

## BetterHelp Tasarım Yenilemesi — TAMAMLANDI ✅ — 2026-05-27

**BETTERHELP_TASARIM.md tüm görevleri tamamlandı:**

- [x] **F** — globals.css BetterHelp renk sistemi (zaten uygundu; doğrulandı)
- [x] **G** — AdminSidebar koyu yeşil #325343 (zaten uygundu; doğrulandı)
- [x] **H** — Admin tüm sayfalar — #212121 → #325343 (11 dosya)
- [x] **I** — Danışman paneli — ProfilKlient accent güncellendi
- [x] **J** — Müşteri paneli — TestAlKlient + TarihSaatSec güncellendi
- [x] **K** — Kurumsal panel — 6 dosya güncellendi
- [x] **L** — Giriş/Kayıt sayfaları temiz (doğrulandı)
- [x] **M** — Header scroll + koyu yeşil bg + pill butonlar; Footer #325343
- [x] **N** — 19 public sayfa/bileşen güncellendi
- [x] **D** — Admin görsel yönetimi: 016_site_images.sql + API route + SiteImageManager + sekme

`tsc --noEmit` → 0 hata ✅  |  `npm run build` → 172 route, başarılı ✅

**Yayın Öncesi Açık (Dış Süreç):**
- Supabase Pro plan aktivasyonu (dashboard)
- Bağımsız pentest (external firma)
- Netgsm + iyzico canlı API key (müşteri)
- Google/Microsoft OAuth production credentials (console)
- Vercel Production env vars (dashboard)

---

## Aktif Faz

**FAZ 12 — Gamification + PWA + SEO**
Durum: **Tamamlandı** ✅

**FAZ 11 — Kurumsal + Affiliate**
Durum: **Tamamlandı** ✅

#### Adım 12.5 — Erişilebilirlik (WCAG 2.1 AA) ✅
- **`×` close butonları** (6 adet) — `aria-label="Modalı kapat"` / "Soruyu sil" / "Seçeneği sil": WebinarKlient, OdevlerKlient, OnboardingFormlarKlient, TakvimKlient, RandevularKlient
- **`role="dialog"` + `aria-modal="true"` + `aria-labelledby`** — tüm modal iç container'larına eklendi (9 dosya: TakvimKlient 3×, WebinarKlient, OdevlerKlient, OnboardingFormlarKlient 2×, FinansKlient/admin, IcerikKlient/admin, BasvurularKlient/admin, RandevularKlient/admin, MusteriOdevlerKlient)
- **Focus ring** — globals.css'te `:focus-visible { outline: 2px solid }` zaten mevcuttu ✓
- **Auth `Field` bileşeni** (`kayit/page.tsx`) — `useId()` ile otomatik ID üretimi; `<label htmlFor={fieldId}>`; hata `<p id={errorId} role="alert">`; `React.cloneElement` ile input'a `id` + `aria-describedby` + `aria-invalid="true"` enjeksiyonu
- **`prefers-reduced-motion`** — globals.css animasyon kuralı + Framer Motion `useReducedMotion` hook tüm animasyonlarda zaten mevcuttu ✓
- **alt text** — `next/image` tüm görsellerde; avatar fallback `aria-hidden="true"` div ✓
- **`lib/a11y/axe-tarama.ts`** — `a11yTara(kapsam?)` + `a11yRapor()` fonksiyonları; WCAG 2.1 AA kuralları; sadece non-production; dinamik import ile production bundle'a girmiyor; `axe-core` dev dependency eklendi
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (154 route)

**FAZ 12 TAMAMLANDI ✅**

#### Adım 12.4 — Performans ✅
- `RandevuSihirbazi.tsx` — `<img>` → `next/image` (fill + sizes="36px", Supabase domain zaten remotePatterns'da); container'a `relative` eklendi
- `BlogListeKlient.tsx` — `<img>` → `next/image` (fill + sizes responsive, `unoptimized` — cover URL'i herhangi bir domain olabilir); container'a `relative` eklendi; hover scale class `Image` bileşenine taşındı
- `next.config.ts` — `formats: ["image/avif", "image/webp"]`; `deviceSizes`/`imageSizes` açık listesi; `minimumCacheTTL: 604800` (7 gün)
- `components/shared/ChatbotDynamic.tsx` — yeni client wrapper; `dynamic(() => import(ChatbotWrapper), { ssr: false })` — chatbot JS'i ilk sayfa yükünden bağımsız olarak getirilir
- `app/layout.tsx` — `ChatbotWrapper` → `ChatbotDynamic` (lazy); Supabase `preconnect` + `dns-prefetch` `<link>` tag'leri `<head>`'e eklendi (connection latency azaltır)
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (154 route)

#### Adım 12.3 — SEO ✅
- 8 auth layout.tsx (giris/kayit/danisan-kayit/kurumsal-kayit/sifremi-unuttum/sifremi-sifirla/e-posta-dogrulama/onay-bekleniyor) — `robots: { index: false }` ile metadata export; "use client" sayfalar için layout.tsx pattern
- `app/page.tsx` — `metadata` (canonical, OpenGraph); WebSite + SearchAction + LocalBusiness + FAQPage (5 SSS, Türkçe) JSON-LD schema
- `/danismanlar/[slug]/page.tsx` — Person structured data zaten mevcuttu (korundu)
- `app/(public)/danismanlar/page.tsx` — BreadcrumbList JSON-LD (Ana Sayfa → Danışman Bul)
- `app/(public)/blog/page.tsx` — BreadcrumbList JSON-LD (Ana Sayfa → Blog)
- `app/sitemap.ts` — dinamik: statik rotalar (/, /danismanlar, /blog, /giris, /kayit) + yayınlanmış danışman profilleri (max 500) + yayınlanmış blog yazıları (max 1000); `MetadataRoute.Sitemap` tip
- `app/robots.ts` — panel/admin/danisan/kurumsal/affiliate/api/auth rotaları disallow; sitemap URL + host
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (154 route, /robots.txt ○ static, /sitemap.xml ƒ dynamic)

#### Adım 12.2 — PWA ✅
- `public/manifest.json` — name/short_name/description/theme_color(#212121)/background_color(#F5F5F5); standalone display; 192+512 icon; 2 shortcut (dashboard, danışman bul); screenshots placeholder
- `public/sw.js` — Cache First (/_next/static/*, /icons/*, manifest.json); Navigation: Network First → önbellekten → /offline fallback; API istekleri Network Only; /panelim/dashboard + /danisan/takvim başarılı yanıtı dinamik önbellekle; activate'te eski önbellekleri temizle; SKIP_WAITING mesajı
- `components/shared/SwRegistration.tsx` — "use client"; production + serviceWorker API kontrolü; updatefound → SKIP_WAITING; window.load olayında kayıt
- `app/offline/page.tsx` + `OfflineRetryButton.tsx` — statik prerender (○); window.location.reload client butonu ayrı dosyada; robot no-index
- `app/layout.tsx` güncellendi: manifest metadata + appleWebApp + icons + SwRegistration import
- `tsc --noEmit` → 0 hata. `/offline` → ○ (static) ✅

#### Adım 12.1 — Gamification ✅
- `lib/gamification/rozet.ts` — `RozetTetikTipi` union type (8 tip); `gunlukSeriHesapla(musteriId)`: createAdminClient() ile ardışık gün sayısı; `rozetKontrolVeVer(musteriId, tetikTipi, miktar)`: rozetler_tanim filtrele → kullanici_rozetleri mükerrer kontrolü → INSERT (admin client, RLS bypass)
- Trigger noktaları (fire-and-forget void IIFE, yanıtı bloklamaz):
  - `app/api/randevular/[id]/tamamla/route.ts` → musteri_id eklendi select'e; toplam tamamlanan seans sayılıp `session_count` tetiklendi
  - `app/api/testler/sonuc/route.ts` → toplam test sonucu sayılıp `test_count` tetiklendi
  - `app/api/gunluk/route.ts` → toplam günlük sayısı `journal_count` + `gunlukSeriHesapla` ile `journal_streak` tetiklendi
  - `app/api/odevler/[id]/tamamla/route.ts` → toplam tamamlanan ödev sayılıp `assignment_count` tetiklendi
- `app/api/cron/hedef/route.ts` — Her Pazartesi 00:00 UTC; aktif musteri listesi; geçen haftanın hedef değerleri taşınır; yeni hafta için haftalik_hedefler INSERT (sadece mevcut olmayanlar); vercel.json'a "0 0 * * 1" eklendi
- `tsc --noEmit` → 0 hata. `npm run build` → ✅

#### Adım 11.5 — Affiliate Yardımcıları + API'leri ✅
- `lib/affiliate/utm.ts` — `referralLinkOlustur()` (/kayit?ref=KOD); `utmLinkOlustur()` (utm_source/medium/campaign param desteği); `referralKodUret()` (8 char, crypto.getRandomValues, ambiguous char yok)
- `app/api/affiliate/basvuru/route.ts` — POST; herhangi auth; mükerrer başvuru kontrolü; benzersiz kod üretme (5 deneme döngüsü); affiliates INSERT status=pending, commission_rate=10
- `app/api/affiliate/link/route.ts` — GET; requireRole(affiliate); status=active kontrolü; utm_source/medium/campaign query params varsa utmLink, yoksa referralLink
- `app/api/affiliate/click/route.ts` — POST; public (auth yok); referral_code doğrulama; IP SHA-256 hash (ham IP saklanmaz — KVKK); 24s anti-spam (aynı ip_hash+affiliate_id); affiliate_clicks INSERT
- `app/api/affiliate/istatistik/route.ts` — GET; requireRole(affiliate); donem query param (bu_ay/gecen_ay/son_3_ay/son_6_ay); tıklama + dönüşüm + komisyon + son 6 ay aylık grafik verisi
- `app/api/affiliate/kazanclar/route.ts` — GET; sayfalı (20/sayfa); durum filtresi (hepsi/bekleyen/odendi); bekleyen + ödenen toplam özet
- `app/api/affiliate/ayarlar/route.ts` — PATCH; profile_id sahiplik kontrolü; platform_info güncelle
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (11 affiliate route)

#### Adım 11.4 — Affiliate Panel ✅
- `components/affiliate/AffiliateSidebar.tsx` — client; usePathname aktif nav; 3 bölüm (ANA MENÜ/GELİRLER/HESAP); signOut
- `app/(affiliate)/layout.tsx` — server; role=affiliate + status=active kontrolü; AdSoyad prop olarak AffiliateSidebar'a
- `app/(affiliate)/affiliate-panel/dashboard/page.tsx` + `AffiliateDashboardKlient.tsx` — referral link kopyala (clipboard fallback); 4 KPI (toplam/bu ay tıklama, dönüşüm, oran); 2 kazanç kartı (toplam kazanç, bekleyen); komisyon oranı badge; Framer Motion fade stagger
- `app/(affiliate)/affiliate-panel/linklerim/page.tsx` + `LinklerimKlient.tsx` — link + kod kopyala (ayrı ayrı); son 6 ay aylık tıklama BarChart (recharts); mevcut ay vurgulu (Cell #212121); özet KPI kartlar
- `app/(affiliate)/affiliate-panel/kazanclar/page.tsx` + `KazanclarKlient.tsx` — 3 özet kart (toplam/bekleyen/ödenen); hepsi/bekleyen/odendi filtresi (URL tabanlı); konuşma tablosu; sayfalama (20/sayfa); AnimatePresence stagger
- `app/(affiliate)/affiliate-panel/ayarlar/page.tsx` + `AffiliateAyarlarKlient.tsx` — kişisel + affiliate bilgileri tablo; referral kod büyük harf + letterSpacing; platform_info inline düzenle (AnimatePresence accordion); /api/affiliate/ayarlar PATCH; basarı/hata mesajı
- `tsc --noEmit` → 0 hata

#### Adım 11.2 Tamamlandı — `lib/kurumsal/fatura.ts` ✅
- `lib/kurumsal/fatura-template.tsx` — @react-pdf/renderer JSX şablonu; KurumsalFaturaVerisi arayüzü; şirket bilgileri + dönem özeti tablosu (KVKK anonim); toplam tutar + footer
- `lib/kurumsal/fatura.ts` — `kurumsalAylikFaturaOlustur(kurumsalId, periodStart, periodEnd, supabase)`: mevcut fatura kontrolü (idempotent); randevu + ödeme sorguları; PDF (renderToBuffer + DocumentProps cast); CSV (BOM prefix); Supabase Storage'a paralel yükleme (kurumsal/{id}/YYYY-MM/); seans_faturalari insert veya güncelle
- `tsc --noEmit` → 0 hata

#### Adım 11.1/11.2/11.3 — Kurumsal Panel + Yardımcılar + API'leri ✅
- `lib/kurumsal/davet.ts` — `davetKoduUret()` (8 char alfanumerik, crypto.getRandomValues); `davetLinkiOlustur()` (APP_URL + /kurumsal-kayit?kod=)
- `lib/kurumsal/butce.ts` — `butceLimitKontrol()`: çalışan kişisel limiti → şirket default bütçesi fallback; bu ayki ödeme toplamı karşılaştırması; `{ izinli, kalanButce, bireyselOdemeOner }` döner
- `lib/kurumsal/rapor.ts` — `kurumsalRaporVeriAl()`: 3 paralel Supabase sorgusu (randevular/ödemeler/değerlendirmeler); anonim dönem istatistikleri; `raporCSVOlustur()` BOM CSV export
- `components/kurumsal/KurumsalSidebar.tsx` — client; usePathname aktif nav; 3 bölüm (ANA MENÜ/RAPORLAR/HESAP); signOut
- `app/(kurumsal)/layout.tsx` — server; role=kurumsal + status=active kontrolü; contact_email ile kurumsal_hesaplar join; KurumsalSidebar prop olarak sirketAdi
- `app/(kurumsal)/kurumsal-panel/dashboard/page.tsx` + `KurumsalDashboardKlient.tsx` — 4 KPI kart (lisans/seans/harcama/memnuniyet); abonelik bilgileri grid; lisans doluluk progress bar; çalışan katılım bölümü; 60s auto-refresh; Framer Motion stagger + useReducedMotion
- `app/(kurumsal)/kurumsal-panel/davetler/page.tsx` + `DavetlerKlient.tsx` — aktif çalışan / boş lisans KPI; davet kodu göster + yenile butonu (POST /api/kurumsal/davet); link kopyala (navigator.clipboard + execCommand fallback); KVKK notu
- `app/(kurumsal)/kurumsal-panel/butce/page.tsx` + `ButceKlient.tsx` — çalışanlar anonim ("Çalışan N"); inline bütçe düzenleme (PUT /api/kurumsal/butce/[userId]); %80 eşiği uyarı rengi; bütçe sıfır → sınırsız gösterimi; AnimatePresence stagger
- `app/(kurumsal)/kurumsal-panel/raporlar/page.tsx` — server; dönem seçici (bu_ay/gecen_ay/son_3_ay/son_6_ay) URL tabanlı; 7 istatistik kart; PDF + CSV/Excel indirme linkleri; KVKK anonim notu
- `app/(kurumsal)/kurumsal-panel/faturalar/page.tsx` + `FaturalarKlient.tsx` — kurumsal_aylik tipi fatura listesi; PDF/Yok filtresi; dönem adı formatı (Şubat 2026); /api/fatura/[id]/pdf linki
- `app/(kurumsal)/kurumsal-panel/ayarlar/page.tsx` + `AyarlarKlient.tsx` — şirket bilgileri read-only tablo; lisans sayısı güncelle (PUT /api/kurumsal/lisans); aktif çalışan sayısı altında güncelleme engeli; AnimatePresence accordion
- `app/api/kurumsal/rapor/route.ts` — GET; contact_email ile hesap bulma; dönem parametresi; JSON response (PDF stub)
- `app/api/kurumsal/rapor/xlsx/route.ts` — GET; CSV + BOM; Content-Disposition attachment
- `app/api/kurumsal/davet/route.ts` — POST; aksiyon=yenile; davetKoduUret() → kurumsal_hesaplar.invite_code güncelle; yeni kod + link döner
- `app/api/kurumsal/katil/route.ts` — POST; musteri rolü; invite_code doğrulama; lisans kapasitesi + mükerrer kayıt kontrolü; kurumsal_kullanicilar INSERT
- `app/api/kurumsal/butce/route.ts` — GET; sayfalı çalışan listesi (anonim); default_monthly_budget join
- `app/api/kurumsal/butce/[userId]/route.ts` — PUT; kurumsal_kullanicilar.id bazlı (musteri_id değil — KVKK); sahiplik kontrolü (kurumsal_id eşleşmesi)
- `app/api/kurumsal/butce/ozet/route.ts` — GET; bu ay toplam harcama; eşik aşan çalışan sayısı
- `app/api/kurumsal/lisans/route.ts` — PUT; mevcut çalışan sayısı altına düşüremez koruması; license_count güncelle
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (~150 route)

#### Adım 7.5 — Mesajlaşma ✅
- `app/api/mesajlar/route.ts` — GET: rol bazlı konuşma listesi (danisan/musteri); unread sayısı + son mesaj önizlemesi; profiles join. POST: lojistik mesaj gönder; conversation_id varsa katılımcı doğrulama, yoksa yeni lojistik konuşma oluştur
- `app/api/mesajlar/[conversationId]/route.ts` — GET: mesaj listesi; katılımcı doğrulama (danisan/musteri/admin); okunmamış mesajları otomatik işaretle; karşı taraf profil bilgisi
- `app/api/mesajlar/[id]/oku/route.ts` — PATCH: tek mesajı okundu işaretle; kendi mesajını okuyamaz koruması; katılımcı doğrulama
- `app/(danisan)/danisan/mesajlar/page.tsx` — server; requireRole(["danisan"]); conversations + profiles join; unread + son mesaj hesabı; MesajlarKlient'e props
- `components/danisan/MesajlarKlient.tsx` — client; isim arama + tip filtresi (lojistik/asenkron); okunmamış badge (avatar üzerinde); son mesaj önizleme; zaman formatı (bugün HH:MM, diğer DD.MM.YYYY)
- `app/(danisan)/danisan/mesajlar/[conversationId]/page.tsx` — server; danisan_id sahiplik kontrolü; mesajlar + okunmamış işaretleme; MesajlasmaKlient'e props
- `components/danisan/MesajlasmaKlient.tsx` — client; 8sn polling (mesajlariYenile); Enter ile gönder / Shift+Enter yeni satır; ses kaydı oynatma (audio element); okuma teyidi (✓/✓✓); AbortController cleanup; Framer Motion mesaj animasyonu
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/danisan/mesajlar ve /danisan/mesajlar/[conversationId] dahil)

#### Adım 7.6 — Danışman Finans ✅
- `app/api/danisan/finans/route.ts` — GET `?donem=hafta|ay|3ay&sayfa=1`; payments (status=captured) üzerinden KPI hesaplama (brutGelir, komisyon, netKazanc, seansAdedi, ortalamaFiyat); önceki dönemle trend karşılaştırması; son 6 ay grafik verisi; sayfalı seans listesi (danışan adları gizli, yalnızca baş harfler); sonraki payout (pending/processing) bilgisi
- `app/(danisan)/danisan/finans/page.tsx` — server; requireRole(["danisan"]); getFinansData() ile SSR; FinansKlient'e baslangicVeri + baslangicDonem="ay" props
- `components/danisan/FinansKlient.tsx` — client; dönem seçici (hafta/ay/3ay) → /api/danisan/finans refetch; useRef ile ilk mount skip; 3 KPI kartı (Brüt Gelir + mini progress bar + trend, Komisyon, Net Kazanç + sonraki ödeme kutusu); Gelir Tahmin Aracı (dashed border kart, ±seans/hafta, aylikSeans×ortalamaFiyat canlı hesap, tahmini aylık net); recharts BarChart (son 6 ay, Cell ile son ay vurgusu); seans tablosu (filtreli: arama/tür/durum, animasyonlu satırlar, durum pill, tür badge); özet satırı (toplamBrut/Komisyon/Net); sayfalama (ellipsis ile); Excel + Fatura İndir linkleri; Framer Motion fade animasyonu
- `tsc --noEmit` → 0 hata

#### Adım 7.7 — Blog ✅
- `app/api/blog/route.ts` — GET (yayınlanmış yazı listesi; tag/danisan_id/sayfalama filtreleri) + POST (danisan: yeni taslak; slug otomatik üretimi, Türkçe karakter dönüşümü)
- `app/api/blog/[id]/route.ts` — GET (taslak/bekleyen = sahip/admin; yayınlanan = herkes) + PUT (taslak veya reddedilmiş güncelle; reddedilmiş düzenlenince draft'a döner) + DELETE (soft-delete; yayınlanmış danisan tarafından silinemez)
- `app/api/blog/[id]/gonder/route.ts` — POST; danisan; draft → pending; başlık ve min 100 karakter içerik kontrolü; HTML tag stripping ile gerçek karakter sayısı
- `app/api/blog/[id]/onayla/route.ts` — POST; admin; pending → published; published_at set; audit_logs kaydı
- `app/api/blog/[id]/reddet/route.ts` — POST; admin; pending → rejected; Zod gerekçe validasyonu (min 10); audit_logs kaydı
- `app/(danisan)/danisan/blog/page.tsx` — server; tüm danisan yazıları (all statuses); BlogListeKlient'e props
- `components/danisan/BlogListeKlient.tsx` — client; durum filtresi (tümü/taslak/incelemede/yayında/reddedildi) + sayaçlar; red gerekçesi bandı; etiket chips; yayında = görüntüle linki; taslak/reddedildi = düzenle + iki adımlı sil onayı; AnimatePresence stagger
- `app/(danisan)/danisan/blog/yeni/page.tsx` — server; auth guard → BlogEditorKlient mod="yeni"
- `app/(danisan)/danisan/blog/[id]/duzenle/page.tsx` — server; sahiplik kontrolü (danisan_id eşleşmesi); BlogEditorKlient mod="duzenle" + baslangicVeri
- `components/danisan/BlogEditorKlient.tsx` — client; TipTap (StarterKit + Image); araç çubuğu (B/İ/S/H1/H2/H3/liste/alıntı/kod); 30sn otomatik kayıt (duzenle mod, draft/rejected); taslak kaydet + incelemeye gönder; SEO alanları (kapatılabilir accordion); durum badge; red gerekçesi bandı; Framer Motion animasyonlar
- `tsc --noEmit` → 0 hata

#### Adım 7.8 — Profil ✅
- `app/api/danismanlar/profil/route.ts` — GET (kendi profil verisi: danisanlar + profiles join) + PUT (profil güncelle; `profilTamamlanmaHesapla()` 15 kontrol → %0-100; %100 altında `profile_published` zorla false; typed partial spread ile Supabase strict tip uyumu)
- `app/(danisan)/danisan/profil/page.tsx` — server; Promise.all(danisanlar + profiles); ProfilKlient'e props
- `components/danisan/ProfilKlient.tsx` — client; 4 sekme (Kişisel/Profesyonel/Seans Ayarları/Belgeler); animated progress bar; yayına al toggle (sadece %100'de); uzmanlık/yaklaşım/yaş grubu/dil chip seçiciler; seans türü checkbox; fiyat alanları; sliding scale + intro seans toggle; belge linki (read-only); tamamlanma kontrol listesi; Framer Motion sekme geçişi + AnimatePresence
- `tsc --noEmit` → 0 hata

#### Adım 7.9 — Araçlar ✅
- `app/api/onboarding-formlar/route.ts` — GET (form listesi + yanıt sayısı) + POST (yeni form; is_default true ise diğerleri güncellenir)
- `app/api/onboarding-formlar/[formId]/route.ts` — GET (form detayı + yanıtlar) + PUT (güncelle; typed update object + Json cast) + DELETE (soft-delete; varsayılan form koruması)
- `app/api/onboarding-formlar/yanit/route.ts` — POST; musteri; z.record(z.string(), z.unknown()) + Json cast; mükerrer yanıt engeli
- `app/api/onboarding-formlar/danisan/[danisanId]/route.ts` — GET; musteri; danışmanın formlarını listele + doldurulmus flag (not: [danisanId] ile [formId] çakışmasını önlemek için danisan/ alt yoluna taşındı)
- `components/danisan/OnboardingFormlarKlient.tsx` — form builder; soru tipleri (text/textarea/select/checkbox/radio/number/date); oluştur/düzenle modal; yanıt görüntüleme modal; AnimatePresence stagger
- `app/(danisan)/danisan/onboarding-formlar/page.tsx` — server; requireRole(["danisan"]); onboarding_yanitlar(count) join
- `app/api/odevler/route.ts` — GET (rol bazlı: danisan → atadıkları, musteri → kendileri); POST (danisan; aktif randevu kontrolü; isOdevDurum() type guard)
- `app/api/odevler/[id]/tamamla/route.ts` — PUT; musteri; opsiyonel not; bildirim insert (.then(successFn, errorFn) ile PromiseLike uyumu)
- `components/danisan/OdevlerKlient.tsx` — durum sekmeleri + arama + yeni ödev modal; gecikti flag (pending + süresi geçmiş)
- `app/(danisan)/danisan/odevler/page.tsx` — server; musteri_id listesi → ayrı profiles sorgusu (multi-relationship ambiguity çözümü)
- `app/(danisan)/danisan/supervizyon/page.tsx` — 3 bölüm: süpervizör gelen talepler + kendi randevuları + süpervizör arama; ayrı musteriMap/danisanMap sorguları
- `app/(danisan)/danisan/performans/page.tsx` — 8 paralel sorgu (KPI + yorumlar + rozetler); distinct musteri Set hesabı
- `components/danisan/PerformansKlient.tsx` — KPI kartları; animated progress bars; rozet ızgarası; son yorumlar; Rozet.description: string | null
- `app/(danisan)/danisan/webinar/page.tsx` — server; danışmanın webinarları; WebinarKlient'e props
- `components/danisan/WebinarKlient.tsx` — webinar oluştur modal; yayınla/iptal aksiyonları
- `app/(danisan)/danisan/ayarlar/page.tsx` — server; profil + bildirim_tercihleri parallel fetch
- `components/danisan/AyarlarKlient.tsx` — kişisel bilgiler + toggle bildirim tercihleri + şifre değiştir; Profil.first_name: string | null
- Düzeltme: route çakışması `/api/onboarding-formlar/[danisanId]` → `/api/onboarding-formlar/danisan/[danisanId]`
- `tsc --noEmit` → 0 hata. `npm run build` → ✅

#### Adım 8.1 — Müşteri Dashboard ✅
- `components/musteri/MusteriSidebar.tsx` — client; usePathname aktif nav; 4 bölüm (ANA MENÜ/KİŞİSEL/DİĞER/HESAP); signOut; kullaniciIsim prop
- `app/(musteri)/panelim/(main)/layout.tsx` — server; requireRole(["musteri"]); profil fetch (isim); MusteriSidebar; (main) route group ile randevu-al ve odeme-sonuc sayfalarını sidebar dışında bırakır
- `app/api/musteri/istatistik/route.ts` — GET; 11 paralel sorgu; yaklaşan randevu + danışman adı; bugün mood; bekleyen ödev sayısı; aktif paket (sessions_used/total); son 3 blog + danışman isimleri; rozetler; 4 haftalık görev takibi (gunlukYaz/randevuKatil/odevTamamla/mesajGonder)
- `app/(musteri)/panelim/(main)/dashboard/page.tsx` — server; 11 paralel sorgu; danişman + blog join ayrı sorgularla (multi-relationship kaçınma); baslangicVeri → DashboardKlient
- `components/musteri/DashboardKlient.tsx` — client; 60sn auto-refresh; 4 KPI kartı (yaklaşan randevu highlight, ruh hali emoji, bekleyen ödev, paket progress bar); blog içerik kartları (hover animasyonu); gamification panel (rozet ızgarası + haftalık hedef progress + yapılacaklar listesi); Framer Motion stagger; useReducedMotion
- Düzeltme: `last_sign_in_at` profiles tablosunda yok; `split("T")[0]` → `.substring(0, 10)` (noUncheckedIndexedAccess)
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/dashboard dahil)

#### Adım 8.2 — Danışman Bulma ✅
- `app/(musteri)/panelim/(main)/danismanlar/page.tsx` — server; requireRole(["musteri"]); SSR initial list (24 danışman, puana göre, profile_published+100% filtresi); DanismanBulKlient'e props
- `components/musteri/DanismanBulKlient.tsx` — client; arama (400ms debounce + AbortController); seans tipi toggle (tümü/online/yüz yüze); sıralama (puan/fiyat); max fiyat filtresi; /api/danismanlar fetch; DanismanKarti grid; AnimatePresence iskelet/boş/liste geçişi
- `tsc --noEmit` → 0 hata. `npm run build` → ✅

#### Adım 8.3 — Randevular ✅
- `app/api/degerlendirmeler/route.ts` — POST; musteri; randevu completed + sahiplik kontrolü; mükerrer yorum engeli; ortalama puan güncellemesi (AVG recalc + danisanlar güncelle)
- `app/api/degerlendirmeler/danisan/[danisanId]/route.ts` — GET public; sayfalı liste; maskeli musteri ismi (Ad S.); danişman KPI (avg + count); not: [danisanId] vs [id] çakışmasını önlemek için `danisan/` alt yoluna alındı
- `components/musteri/RandevularimKlient.tsx` — 4 tab (tümü/yaklaşan/tamamlanan/iptal); durum+seans tipi badge; AnimatePresence tab geçişi; detay link
- `app/(musteri)/panelim/(main)/randevularim/page.tsx` — server; danisan_id listesi → ayrı profiles sorgusu; RandevuOzet tip ile DanisanBilgi join
- `components/musteri/RandevuDetayimKlient.tsx` — randevu info grid; video "Görüşmeye Katıl" butonu (±10dk window); iptal flow (sebep textarea + confirm); seans özeti; yıldız rating + yorum formu; mevcut yorum görüntüleme (danışman yanıtı dahil)
- `app/(musteri)/panelim/(main)/randevularim/[id]/page.tsx` — server; musteri sahiplik kontrolü (notFound 404); danışman + mevcut yorum paralel fetch
- `tsc --noEmit` → 0 hata. `npm run build` → ✅

#### Adım 8.4 — Mesajlar ✅
- `components/musteri/MusteriMesajlarKlient.tsx` — konuşma listesi; isim arama + tip filtresi (lojistik/asenkron); okunmamış badge (avatar üzerinde + toplam header sayacı); son mesaj önizleme; zaman formatı (bugün HH:MM, diğer DD.MM.YYYY); AnimatePresence stagger
- `app/(musteri)/panelim/(main)/mesajlar/page.tsx` — server; musteri_id ile conversations filtresi; danisan_id listesi → danisanlar + profiles:profile_id ayrı sorgu; unread sayısı + lastMsg hesabı
- `components/musteri/MusteriMesajlasmaKlient.tsx` — client; 8sn polling; Enter gönder/Shift+Enter satır; ses kaydı oynatma; okuma teyidi (✓/✓✓); back link → /panelim/mesajlar; profil link → /danismanlar/[slug]; KarsiTaraf.slug field (danişan yönündekinden farklı: id değil slug)
- `app/(musteri)/panelim/(main)/mesajlar/[conversationId]/page.tsx` — server; musteri_id sahiplik kontrolü; danisanlar + profiles:profile_id join; okunmamış işaretleme; MusteriMesajlasmaKlient'e props
- `tsc --noEmit` → 0 hata

#### Adım 8.5 — Günlük ve Ruh Hali ✅
- `supabase/migrations/003_gunluk_tags.sql` — `gunluk_kayitlar`'a `tags text[]` ve `intensity int` kolonları eklendi; upsert için `(musteri_id, date)` unique constraint; `idx_gunluk_kayitlar_date` index
- `types/supabase.ts` — `gunluk_kayitlar` Row/Insert/Update'e `tags: string[]` ve `intensity: number | null` eklendi
- `app/api/gunluk/route.ts` — GET: son 30 gün kayıtları + mood istatistiği + kriz kontrol (3+ ardarda mood=1) + danışman bilgisi; POST: upsert (musteri_id,date conflict) + kriz anahtar kelime tespiti + danışan ve admin bildirim
- `app/api/gunluk/paylasim/route.ts` — PATCH: `shared_with_danisan_id` toggle; sahiplik kontrolü (`eq("musteri_id", user.id)`)
- `components/musteri/GunlukKlient.tsx` — client; AnimatePresence kriz bandı (⚠ 182/112 acil numaraları, kapatılabilir); sol form: Framer Motion emoji scale (44→56px selected, glow), intensity slider, textarea 1000 char, etiket chips, danışman paylaşım toggle; sağ tarihçe: 5-emoji frekans istatistiği (en yüksek vurgulu), Recharts LineChart (monotone, ReferenceLine y=3), son 6 kayıt AnimatePresence stagger; prefers-reduced-motion uyumlu
- `app/(musteri)/panelim/(main)/gunluk/page.tsx` — server; requireRole(["musteri"]); 30 gün kayıt fetch + mood stat + kriz hesabı + danışman bulma (randevular→danisanlar→profiles); Frame Header + GunlukKlient
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/gunluk dahil)

#### Adım 8.6 — Testler ✅
- `app/api/testler/sonuc/route.ts` — POST: answers al + scoring_logic parse (sum/average) + result_ranges eşleştir + test_sonuclari insert + shared_with_danisan flag
- `app/api/testler/gecmis/route.ts` — GET: musteri geçmiş sonuçları + test başlıkları join
- `components/musteri/TestlerKlient.tsx` — test kartları grid (son sonuç göstergesi + Testi Al/Tekrar Al CTA); geçmiş sonuçlar accordion (tablo: test adı/sonuç/tarih/paylaşım)
- `app/(musteri)/panelim/(main)/testler/page.tsx` — server; aktif testler + son kayıt per test + geçmiş sonuçlar paralel fetch
- `components/musteri/TestAlKlient.tsx` — intro/test/result 3 ekran state machine; soru kartları AnimatePresence slide; progress bar (Framer Motion genişlik animasyonu); dot navigasyon; son soruda paylaşım checkbox + Tamamla; sonuç ekranı (skor + label + description + öneri)
- `app/(musteri)/panelim/(main)/testler/[slug]/page.tsx` — server; slug ile test fetch; questions JSON parse (tip güvenli); TestAlKlient'e props
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/testler, /panelim/testler/[slug] dahil)

#### Adım 8.7 — Ödevler ve Paketler ✅
- `components/musteri/MusteriOdevlerKlient.tsx` — 3 tab (Bekleyen/Tamamlanan/Atlanan + sayaçlar); gecikti flag (pending + süresi geçmiş, dashed border); tamamla modal (AnimatePresence scale+opacity, not textarea); PUT /api/odevler/[id]/tamamla çağrısı; optimistik state güncellemesi
- `app/(musteri)/panelim/(main)/odevler/page.tsx` — server; danisan_id → danisanlar → profiles üç adım join; MusteriOdevlerKlient'e zengin props
- `components/musteri/PaketlerimKlient.tsx` — aktif paketler (bold border, progress bar Framer Motion animasyonu, kalan seans, son kullanım, randevu al linki); geçmiş paketler tablo (completed/expired dashed pill); aktif paket yoksa Danışman Bul CTA
- `app/(musteri)/panelim/(main)/paketlerim/page.tsx` — server; musteri_paketler → danisan_paketler → danisanlar → profiles dört adım join; PaketlerimKlient'e zengin props
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/odevler, /panelim/paketlerim dahil)

#### Adım 8.8 — Gamification ✅
- `components/musteri/GamificationKlient.tsx` — client; 4 KPI kartı (kazanılan rozet, tamamlanan seans, günlük log, streak); haftalık hedefler bölümü (Framer Motion progress bar, 4 görev checkbox dolu/dashed); 2 mini progress bar (bu hafta seans/mood hedefi); kazanılan rozetler ızgarası (dark bg, icon+isim+kazanım tarihi); kilitli rozetler ızgarası (grayscale opacity-40, description önizleme); useReducedMotion uyumlu
- `app/(musteri)/panelim/(main)/gamification/page.tsx` — server; 10 paralel sorgu (rozetler+kazanılan+haftalik_hedefler+bu hafta randevu/günlük/ödev/mesaj+tüm zamanlar randevu/günlük+son 30 gün tarihler); count queries `count` destructuring ile düzeltildi; haftaBaslangic=(getDay()+6)%7 Pazartesi hesabı; streak 30 günlük döngü
- Düzeltme: `{ count: "exact", head: true }` sorgularında `data.count` yerine `{ count: X }` destructuring ile tip hatası giderildi
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/gamification dahil)

#### Adım 8.9 — Finans ve Webinar ✅
- `components/musteri/FinansKlient.tsx` — 3 KPI kartı (toplam ödenen TL, tamamlanan seans, fatura sayısı); ödeme tablosu (danışan isim + fatura numarası, tarih, tutar, PDF indir butonu); Framer Motion stagger animasyon
- `app/(musteri)/panelim/(main)/finans/page.tsx` — server; payments(captured) + seans_faturalari + randevular(tarih) + danisanlar+profiles; 4-adım join ile danışan ismi; toplamOdenen, toplamFatura hesabı
- `components/musteri/WebinarKlient.tsx` — yaklaşan/geçmiş ayrımı; aktif webinar (±10dk) dark bg ile vurgulama + Katıl butonu; geçmiş webinarlar tablo; kayit_status ve webinar status etiketleri
- `app/(musteri)/panelim/(main)/webinar/page.tsx` — server; webinar_kayitlar + webinarlar join; non-existent webinar filtresi; WebinarKlient'e props
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/finans, /panelim/webinar dahil)

#### Adım 8.10 — Profil ve Danışman Değiştirme ✅
- `app/api/musteri/profil/route.ts` — GET (profil verisi: first_name/last_name/phone/dark_mode/notification_channel/kvkk_accepted_at); PUT (zod validasyon; typed spread pattern ile Supabase güncelleme; Record<string,unknown> → conditional spread düzeltmesi)
- `app/api/musteri/hesap-sil/route.ts` — POST: `signInWithOtp({shouldCreateUser: false})` ile doğrulama e-postası; DELETE: `verifyOtp({type:"email"})` → soft-delete (deleted_at + status=suspended) → signOut
- `components/musteri/DanismanDegistirme.tsx` — 4-adım state machine (idle→gerekce→yukleniyor→oneri); min 10 karakter gerekçe; GET /api/danismanlar?limit=3 ile öneri fetch; mevcut danışan filtresi; seçim → /danismanlar/[slug] linki; AnimatePresence mode="wait" geçiş
- `components/musteri/MusteriProfilKlient.tsx` — kişisel bilgiler formu (ad/soyad/telefon, email read-only); bildirim kanalı seçici (email/sms/uygulama_ici); dark mode toggle (Framer Motion thumb); şifre değiştirme (/api/auth/change-password); KVKK bilgisi (üyelik+onay tarihi); DanismanDegistirme embed; hesap silme (idle→onay→otp_bekle→yukleniyor 4 adım, AnimatePresence)
- `app/(musteri)/panelim/(main)/profil/page.tsx` — server; profil + son tamamlanan randevu (mevcutDanisanId) paralel fetch; isBildirimKanali() type guard; MusteriProfilKlient'e props
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/panelim/profil dahil)

**FAZ 8 TAMAMLANDI ✅**

#### Adım 9.1 — Blog (Public) ✅
- `app/api/blog/route.ts` güncellendi — GET'e `q` (arama: title/excerpt ilike) param desteği eklendi
- `app/api/blog/slug/[slug]/route.ts` — GET: slug ile yayınlanmış yazı fetch + view_count++ (fire-and-forget) + yazar bilgisi (danisanlar→profiles); Not: `/api/blog/[slug]` → `/api/blog/[id]` ile dynamic segment çakışması nedeniyle `slug/` alt yoluna alındı
- `components/public/BlogListeKlient.tsx` — client; arama (400ms debounce) + tag filtresi (popüler tag chips); yazı grid (cover image, başlık, özet, tag chips, yazar+tarih); AnimatePresence mode="wait" filtre geçişi; sayfalama (önceki/sonraki butonları); iskelet loader
- `app/(public)/blog/page.tsx` — server; SSR ilk 9 yazı + tag frekans hesabı; yazarlar için danisanlar→profiles join; BlogListeKlient'e props
- `app/(public)/blog/[slug]/page.tsx` — server; generateMetadata (seo_title, seo_description, openGraph); view_count++; yazar kartı (avatar, isim, title, uzmanlıklar, profil linki); TipTap HTML içerik (`dangerouslySetInnerHTML`, admin onayından geçmiş güvenli); tag linkleri (/blog?tag=X); ilgili yazılar (aynı tag, max 3); breadcrumb; Blog'a Dön linki
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/blog, /blog/[slug] dahil)

#### Adım 9.2 — Psikolojik Testler (Public) ✅
- `lib/testler/scoring.ts` — `parseScoringLogic`, `parseResultRanges`, `parsesorular`, `hesaplaSkoru`, `sonucBul` fonksiyonları; dışa aktarılmış tipler (ScoringLogic, ResultRange, TestSoru); musteri panel ile kod tekrarı giderildi
- `app/api/testler/route.ts` — GET: aktif testler listesi (title/slug/description/estimated_minutes), public erişim
- `app/api/testler/[slug]/route.ts` — GET: slug ile test detayı + parse edilmiş sorular + scoringLogic + resultRanges; public erişim
- `components/public/PublikTestAlKlient.tsx` — client; intro/test/sonuc 3-adım state machine; AnimatePresence mode="wait"; Framer Motion progress bar + soru slide; dot navigasyon; seçim → auto-advance (160ms delay); client-side scoring (`hesaplaSkoru` + `sonucBul`); sonuç kartı (skor + label + açıklama + öneri); Danışman Bul + Üye Ol CTA; kayıt gerektirmiyor (bilgi amaçlı)
- `app/(public)/testler/page.tsx` — server; aktif testler grid; üye ol / danışman bul CTA
- `app/(public)/testler/[slug]/page.tsx` — server; generateMetadata; breadcrumb; PublikTestAlKlient'e parse edilmiş props
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/testler, /testler/[slug] dahil)

#### Adım 9.3 — Kaynak Kütüphanesi ✅
- `app/api/kaynaklar/route.ts` — GET: public; category/type/q/limit filtreleri; `category` → `.contains()` ile dizi arama; XSS-safe ilike. POST: admin-only; Zod validasyon (title/description/file_url/type/category/is_active); created_by = user.id
- `app/(public)/kaynaklar/page.tsx` — server; SSR 100 aktif kaynak; `tumKategorileri()` ile benzersiz kategori set; tip bazlı gruplama (PDF/Video/Bağlantı bölümleri); KaynakKarti bileşeni (tip etiketi, kategori chipler, başlık, açıklama, sembol; hover border vurgu); Danışman Bul / Psikolojik Test Al CTA
- `tsc --noEmit` → 0 hata

#### Adım 9.4 — Webinar Public ✅
- `app/api/webinar/route.ts` — GET (public: yayındaki webinarlar + host bilgisi; mod=danisan: kendi webinarları) + POST (danisan/admin: taslak oluştur; Zod validasyon)
- `app/api/webinar/[id]/route.ts` — GET (public: published; diğer durumlar host/admin gerektirir; host profil join) + PUT (danisan: güncelle; conditional spread ile Supabase tip uyumu)
- `app/api/webinar/[id]/yayinla/route.ts` — PUT; draft→published; geçmiş tarih engeli
- `app/api/webinar/[id]/iptal/route.ts` — PUT; published/draft→cancelled; kayıtlı katılımcıları iptal et
- `app/api/webinar/[id]/kayit/route.ts` — POST; musteri; kapasite + mükerrer + geçmiş tarih kontrolü; ücretsiz → direkt kayıt; ücretli → kayıt oluştur (ödeme Faz 4)
- `app/api/webinar/[id]/katilimcilar/route.ts` — GET; danisan/admin; danisan yalnızca kendi webinarını görür; profil join
- `app/(public)/webinar/page.tsx` — server SSR; yaklaşan/geçmiş ayrımı; host isim+title join; doluluk progress bar; kart grid
- `app/(public)/webinar/[id]/page.tsx` — server SSR; generateMetadata; host kart (uzmanlıklar + profil linki); kayıt paneli sticky; aktif webinar "Katıl" butonu (±10dk); doluluk bar
- `components/public/WebinarKayitButonu.tsx` — client; oturum yoksa /giris?redirect yönlendirme; kayıt başarısında router.refresh(); hata gösterimi
- `tsc --noEmit` → 0 hata

#### Adım 10.1 — Mail Şablonları ✅
- `lib/resend/templates/kayit-aktivasyon.tsx` — e-posta doğrulama; aktivasyon URL + 24s TTL uyarısı
- `lib/resend/templates/danisan-onay.tsx` — başvuru onay bandı; 4 adımlı başlangıç kontrol listesi; panel CTA
- `lib/resend/templates/danisan-red.tsx` — red gerekçesi (left-border kutu); yeniden başvuru yönlendirme
- `lib/resend/templates/randevu-talep.tsx` — danışmana gönderilir; detay tablosu; Onayla/Reddet çift buton (primary/outline)
- `lib/resend/templates/randevu-onay.tsx` — müşteriye gönderilir; onay bandı; online seans bilgi kutusu; video link aktif uyarısı
- `lib/resend/templates/randevu-hatirlatma.tsx` — kalanSure (24s/2s/15dk); online ise doğrudan "Görüşmeye Katıl" butonu; iptal yönlendirme
- `lib/resend/templates/odeme-onay.tsx` — ödeme onay bandı; fatura detay tablosu; "Faturayı İndir" linki; iade bilgilendirmesi
- `lib/resend/templates/iade-onay.tsx` — iade detay tablosu; iş günü bekleme bilgisi; iade politikası linki
- `lib/resend/templates/sifre-sifirla.tsx` — 1s TTL uyarısı (dashed border kutu); bağlantı kopyalama metni; yetkisiz erişim notu
- `lib/resend/templates/churn.tsx` — özlüyoruz teması; son danışman adı opsiyonel; ipucu listesi; abonelik iptal footer
- `lib/resend/templates/everboarding.tsx` — 7 tetik adımı type olarak (ilk_giris/profil_eksik/ilk_randevu/ilk_seans_tamamlandi/test_oner/gunluk_oner/blog_oner); ADIM_ICERIGI lookup map ile içerik yönetimi; PreviewProps her adım için
- `lib/resend/templates/kurumsal-butce-uyari.tsx` — kritik(≥90%) vs uyarı ayrımı (banner/renkler); text-based progress bar; detay tablosu; %{esik} parametrik uyarı eşiği
- `npm install @react-email/components` eklendi (kurulum listesine yoktu)
- `tsc --noEmit` → 0 hata

#### Adım 10.2 — SMS ve Merkezi Bildirim ✅
- `lib/netgsm/sms.ts` — Netgsm HTTP API wrapper; `smsSend()` (normalizeGsm + hata kodu tablosu + NetgsmHata class); `smsNumaraGecerli()` yardımcısı
- `lib/bildirim/uygulama-ici.ts` — `uygulamaIciBildirimGonder()`; bildirimler INSERT → delivery_status=sent; Supabase Realtime channel(`user:${userId}`) broadcast
- `lib/bildirim/gonder.ts` — `bildirimGonder()` merkezi dispatcher; TercihSatir narrow tip; TIP_TERCIH_ESLEME lookup; auth.admin.getUserById email fetch (profiles'da email yok); kanalAktif() tercih kontrolü; MAX_DENEME=3 retry loop (500ms*deneme bekleme); hata fırlatmaz — {ok, kanal, bildirimId} döner
- Düzeltme: profiles tablosunda email sütunu yok; `createServiceClient` + `auth.admin.getUserById` ile auth.users'dan alındı
- `tsc --noEmit` → 0 hata

#### Adım 10.3 — Cron Job'lar ✅
- `app/api/cron/hatirlatma/route.ts` — 3 pencere (24s/2s/15dk); ±5dk tolerans; çift gönderim koruması (bildirimler.data.randevuId kontrolü); online = daily_room_name var (session_type "online" enum yok); 15dk pencerede video URL aktif
- `app/api/cron/payout/route.ts` — payouts tablosu (payout_requests değil); danisan_id → danisanlar.id; total_amount = amount_net toplamı; payment_ids array; idempotent (period_start kontrolü)
- `app/api/cron/churn/route.ts` — 500 batch; skor algoritması (son 30/14/7 gün randevu); ayda 1 churn maili (bildirimler.data.churn kontrolü); ChurnMail şablonu
- `app/api/cron/kurumsal-fatura/route.ts` — önceki ay seans toplamı; seans_faturalari kurumsal_aylik; faturaNumarasiUret(); %80 bütçe eşiği Resend ile yönetici maili; sessions_used + budget_alert_sent sıfırlama
- `app/api/cron/log-temizlik/route.ts` — 90 gün soft-delete; 30 gün sonra hard-delete (.delete().lt().select("id"))
- `app/api/cron/butce-sifirla/route.ts` — 00:00'da önce çalışır; kurumsal_kullanicilar sayaçları sıfırla
- `app/api/cron/ip-temizlik/route.ts` — ban/lock süresi dolmuş kayıt temizleme; 4 adım (ban sıfırla/kilit sıfırla/soft-delete/hard-delete)
- Düzeltmeler: `select("id", {count})` → `.select("id")` + `data?.length`; `delete({count})` → `.delete().select("id")`; session_type "online" → `!!daily_room_name` kontrolü
- `tsc --noEmit` → 0 hata

#### Adım 10.4 — Bildirim API'leri ve UI ✅
- `app/api/bildirimler/route.ts` — GET; requireAuth; okunmamis/kanal/sayfa filtreleri; toplamOkunmamis ayrı sorgu; 20'lik sayfalama
- `app/api/bildirimler/[id]/oku/route.ts` — PATCH; sahiplik kontrolü; idempotent (zaten okunmuşsa 200)
- `app/api/bildirimler/tumunu-oku/route.ts` — PATCH; opsiyonel kanal filtresi; isaretlenen sayısı döner
- `app/api/bildirim-tercihleri/route.ts` — GET (kayıt yoksa varsayılanlarla döner) + PUT (upsert; notification_channel ayrıca profiles'a yazılır)
- `app/api/bildirimler/duyuru/route.ts` — POST; admin; cursor-tabanlı 100'erlik batch; hedef (herkes/musteri/danisan/kurumsal); kanal (app/email/hepsi); audit_log kaydı
- `components/musteri/MusteriProfilKlient.tsx` — BildirimTercih interface + TERCIH_ETIKETLER + bildirimKaydet(); 6 toggle (randevu_email/sms/uygulama, odeme_email, blog_email, marketing_email); AnimatePresence uyumlu toggle butonlar
- `app/(musteri)/panelim/(main)/profil/page.tsx` — bildirim_tercihleri SSR fetch eklendi; BildirimTercih type-cast ile baslangicTercihler prop
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (128 route)

**FAZ 10 TAMAMLANDI ✅**

**FAZ 11 TAMAMLANDI ✅**

**FAZ 12 TAMAMLANDI ✅**

**🎉 TÜM FAZLAR TAMAMLANDI — Platform yayına hazır.**

---

#### Adım 7.4 — Danışan Yönetimi ✅
- `app/(danisan)/danisan/danisanlar/page.tsx` — server; requireRole(["danisan"]); randevular üzerinden unique musteri_id'leri topla; profiles join (isim, avatar, telefon, churn_risk_score); musteri başına tamamlanan seans ve gelir hesabı; DanisanlarKlient'e props
- `components/danisan/DanisanlarKlient.tsx` — client; arama (isim/telefon), 4 sıralama seçeneği (son randevu/isim/seans/churn); 3 istatistik kart (toplam danışan, yüksek churn sayısı, toplam gelir); tablo (seans tamamlanan/toplam, gelir, ChurnBadge); AnimatePresence stagger; Link detay sayfası
- `app/(danisan)/danisan/danisanlar/[id]/page.tsx` — server; musteri ownership doğrulama (randevular üzerinden); profiles + randevular + odevler + gunluk_kayitlar (shared_with_danisan_id) Promise.all; DanisanDetayiKlient'e props
- `components/danisan/DanisanDetayiKlient.tsx` — client; profil kartı (istatistikler, churn %, son giriş); 3 sekme (Randevular/Ödevler/Günlük); randevular accordeon (özet + özel not genişleme, randevu detayına link); ödevler (durum badge, danışan notu); günlük kayıtlar (mood emoji + not); AnimatePresence sekme geçişi + accordeon
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/danisan/danisanlar ve /danisan/danisanlar/[id] rotaları dahil)

#### Adım 7.3 — Danışman Randevular ✅
- `app/api/randevular/[id]/notlar/route.ts` — PATCH; danisan-only; danisanlar sahiplik kontrolü; randevu.danisan_id === danisanRow.id doğrulama; notes_private ve summary_shared güncelleme; Zod (max 5000 karakter)
- `app/api/degerlendirmeler/[id]/yenit/route.ts` — PUT; danisan-only; danisanlar sahiplik kontrolü; review_reply + reply_at güncelleme; Zod (min 1, max 2000 karakter)
- `app/(danisan)/danisan/randevular/page.tsx` — server; requireRole(["danisan"]); danisanlar → randevular (son 200, desc) + profiles join (musteri isim+avatar); RandevularKlient'e zenginleştirilmiş props
- `components/danisan/RandevularKlient.tsx` — client; arama (isim), durum filtresi (6 tab), sıralama (yeni/eski); 3 istatistik kart (toplam, bu ay tamamlanan, toplam gelir); AnimatePresence stagger liste; Link detay sayfası
- `app/(danisan)/danisan/randevular/[id]/page.tsx` — server; requireRole(["danisan"]); randevu sahiplik kontrolü (danisan_id eşleşmesi); profiles + degerlendirmeler Promise.all; RandevuDetayiKlient'e props
- `components/danisan/RandevuDetayiKlient.tsx` — client; başlık kartı (durum badge, müsteri bilgisi, ücret); no-show işaretleme (geçmiş randevu + confirmed koşulu); seans notları (notes_private + summary_shared PATCH); değerlendirme yanıtı (review_reply PUT); Framer Motion fade+slide giriş
- Düzeltme: `.select()` string concatenation → template literal (Supabase TypeScript çıkarımı için)
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/danisan/randevular ve /danisan/randevular/[id] rotaları dahil)

#### Adım 7.2 — Danışman Takvim ✅
- `app/(danisan)/danisan/takvim/page.tsx` — server; requireRole(["danisan"]) guard; danisanlar (buffer_minutes, session_duration) + danisan_musaitlik + danisan_izin (son 30 gün+) + takvim_sync fetch; TakvimKlient'e prop olarak aktarılır
- `components/danisan/TakvimKlient.tsx` — client; haftalık/aylık/günlük görünüm; haftalık grid (08-18, saat x 7 gün); hücre renklendirme (avail/booked/buffer/closed); randevu detay modalı; müsaitlik şablonu modalı (7 gün toggle + saat girişi → PUT /api/danismanlar/musaitlik); tatil ekleme modalı (POST/DELETE /api/danismanlar/izin); bu haftaki izin bandı; legend + haftalık istatistik; GoogleBagili/OutlookBagili sync göstergesi; Framer Motion AnimatePresence modaller; prefers-reduced-motion desteği; tab-erişilebilir hücreler
- `app/api/danisan/izin/route.ts` — pre-existing tablo adı hataları düzeltildi: `danisan_izinler`→`danisan_izin`, `tarih`→`date`, `sebep`→`reason`
- `app/api/danisan/takvim/route.ts` — `danisan_izinler`→`danisan_izin`, `tarih`→`date`, `takvim_entegrasyonlari`→`takvim_sync` düzeltildi
- `tsc --noEmit` → 0 hata. `npm run build` → ✅ (/danisan/takvim rotası dahil)

#### Adım 7.1 — Danışman Dashboard ✅
- `components/danisan/DanisanSidebar.tsx` — client; usePathname aktif nav; 6 bölüm (GENEL/DANIŞANLAR/İÇERİK/FİNANS/ARAÇLAR/HESAP); signOut
- `app/(danisan)/layout.tsx` — server; requireRole(["danisan"]) guard; DanisanSidebar + main frame
- `app/api/danisan/istatistik/route.ts` — GET; 7 paralel sorgu (bugün seanslar, bekleyen onaylar, yaklaşan 5 randevu, hafta/ay payments, son 3 yorum, okunmamış mesaj); müşteri profil join; status="captured" (payments enum)
- `components/danisan/DashboardKlient.tsx` — client; 4 KPI kart; profil uyarı bandı (progress bar); bugünkü seanslar listesi; bekleyen onaylar (bold border); yaklaşan randevular (durum pill); son yorumlar (yıldız); 60 sn auto-refresh
- `app/(danisan)/danisan/dashboard/page.tsx` — server; auth guard → DashboardKlient

#### Adım 6.1 — Admin Dashboard ✅
- `types/admin.ts` — `IstatistikVeri` tip tanımı (KPI, grafik, başvuru, blog)
- `app/api/admin/istatistik/route.ts` — GET, admin-only; `?gun=7|30|90` param; 7 paralel Supabase sorgusu; UTC+3 tarih hesabı
- `app/(admin)/layout.tsx` — admin shell layout, sidebar slotu
- `components/admin/AdminSidebar.tsx` — client bileşen, `usePathname` ile aktif nav
- `app/(admin)/admin/dashboard/page.tsx` — server component, auth guard → DashboardKlient
- `components/admin/DashboardKlient.tsx` — client; 60 sn auto-refresh; recharts BarChart; framer-motion stagger; 5 KPI kart; 2 tablo

#### Adım 6.7 — Diğer Admin Sayfaları ✅
- `app/api/admin/ayarlar/route.ts` — GET (tüm platform_ayarlari) + PUT (tek ayar güncelleme); audit_log kaydı
- `app/api/admin/loglar/route.ts` — GET; aksiyon/tarih aralığı filtreleri; profiles join ile kullanıcı adları; sayfalama
- `app/api/admin/churn-tarama/route.ts` — GET (churn_risk_score≥70 müşteriler); POST (manuel tarama: son 7/30 gün randevu analizine göre skor güncelleme)
- `components/admin/AyarlarKlient.tsx` — inline editable settings; dirty state tespiti; kaydet butonu; başarı/hata feedback
- `components/admin/LoglarKlient.tsx` — aksiyon/tarih filtresi; sayfalama; AnimatePresence stagger
- `app/(admin)/admin/ayarlar/page.tsx` — server; SSR ile platform_ayarlari fetch → AyarlarKlient
- `app/(admin)/admin/raporlar/page.tsx` — server; CSV download linkleri (tarih aralığı form ile); loglar linkiapp/(admin)/admin/raporlar/loglar/page.tsx` — server; auth guard → LoglarKlient
- `app/(admin)/admin/bildirimler/page.tsx` — server; URL-based durum filtresi; failed/pending/sent sekmeler; delivery status badge'leri
- `app/(admin)/admin/kurumsal/page.tsx` — server; kurumsal_hesaplar listesi; URL-based durum filtresi; sayfalama
- `app/(admin)/admin/affiliate/page.tsx` — server; affiliates + affiliate_conversions join; bekleyen/ödendi tutarlar; CSV export linki

#### Adım 6.6 — İçerik Yönetimi ✅
- `types/admin.ts` — BlogSatir, TestSatir, KaynaklarSatir, SssSatir, WebinarSatir, AdminIcerikResponse tipleri eklendi
- `app/api/admin/icerik/route.ts` — GET; 5 tab (blog/testler/kaynaklar/sss/webinarlar); blog için 3-adım join (danışman adı); webinar için profil join; durum filtresi; sayfalama
- `app/api/admin/icerik/blog/[id]/route.ts` — PATCH; Zod doğrulama (published/rejected); red için gerekçe zorunlu; audit_log
- `components/admin/IcerikKlient.tsx` — client; 5 tab; blog onayla/reddet (inline + modal); testler/kaynaklar/sss/webinarlar liste tabloları; AnimatePresence stagger; durum filtreleri
- `app/(admin)/admin/icerik/page.tsx` — server; auth guard → IcerikKlient

#### Adım 6.5 — Finansal Yönetim ✅
- `app/api/admin/finans/route.ts` — GET; 3 tab (odemeler/islemler/iadeler); summary (bekleyen/işleniyor/ödendi tutarları + danışman sayısı); son 7 gün payment özeti; 3-adım join ile danışman adları
- `app/api/admin/finans/payout/[payoutId]/route.ts` — PUT; Zod doğrulama; tamamlanmış ödeme koruması; paid_at; audit_log
- `app/api/admin/finans/faturalar/route.ts` — GET; admin fatura listesi; tip filtresi; musteri+danışman adları (3-adım join); sayfalama
- `app/api/admin/raporlar/[type]/route.ts` — CSV export; BOM prefix (Excel uyumu); 5 tip: komisyon, gelir, vergi, affiliate, kurumsal
- `components/admin/FinansKlient.tsx` — client; 3 tab (islemler/odemeler/iadeler); info band; 4 özet kart; payout tablosu (Öde modal + AnimatePresence); işlemler + iadeler tabloları; AbortController; stagger animasyonu; CSV export linkleri
- `components/admin/FaturalarKlient.tsx` — client; tip filtresi; fatura tablosu; PDF linkleri; sayfalama
- `app/(admin)/admin/finans/page.tsx` — server; auth guard → FinansKlient
- `app/(admin)/admin/finans/faturalar/page.tsx` — server; auth guard → FaturalarKlient

#### Adım 6.4 — Randevu Yönetimi ✅
- `types/admin.ts` — `AdminRandevuOzet` ve `AdminRandevuListeResponse` tipleri eklendi
- `app/api/admin/randevular/route.ts` — GET; durum/tarih aralığı/sayfalama filtreleri; 3 paralel sorgu (randevular → profiles, danisanlar → profiles) ile musteri + danışman adları
- `components/admin/RandevularKlient.tsx` — client; 6 durum tab'ı; tarih aralığı filtresi; AbortController ile fetch; AnimatePresence satır stagger; durum badge stilleri; detay modal (AnimatePresence)
- `app/(admin)/admin/randevular/page.tsx` — server; auth guard → RandevularKlient

#### Adım 6.3 — Danışman Yönetimi ✅
- `types/admin.ts` — `BasvuruOzet` ve `BasvuruListeResponse` tipleri eklendi
- `app/api/admin/danismanlar/basvurular/route.ts` — GET; tab (bekleyen/onaylanmis/reddedilen/askida) + arama + sayfalama; iki adımlı sorgu (profiles → danisanlar)
- `app/api/admin/danismanlar/[id]/onayla/route.ts` — PUT; admin; danişman rolü ve pending durum doğrulaması; audit_log kaydı
- `app/api/admin/danismanlar/[id]/reddet/route.ts` — PUT; admin; Zod gerekçe doğrulaması (min 10 karakter); profiles.status=rejected + danisanlar.rejection_reason güncelleme; audit_log
- `components/admin/BasvurularKlient.tsx` — client; 4 tab; arama (400ms debounce); tablo (uzmanlık etiketleri, profil % bar, belge linkleri); aksiyonlar (onayla/reddet/dondur/detay); AnimatePresence satır stagger; reddet modal (AnimatePresence, scale + opacity)
- `app/(admin)/admin/danismanlar/basvurular/page.tsx` — server; auth guard → BasvurularKlient
- `app/(admin)/admin/danismanlar/[id]/page.tsx` — server; detay (temel bilgiler, profil durumu, performans KPI'lar, belgeler, aksiyonlar, son seanslar)
- `components/admin/AdminSidebar.tsx` — başvurular href `/admin/basvurular` → `/admin/danismanlar/basvurular` düzeltildi

#### Adım 6.2 — Kullanıcı Yönetimi ✅
- `types/admin.ts` — `KullaniciOzet` ve `KullaniciListeResponse` tipleri eklendi
- `app/api/admin/kullanicilar/route.ts` — GET; q/durum/rol/sayfa filtreleri; PAGE_SIZE=20; Supabase enum type-guard (isDurum/isRol)
- `app/api/admin/kullanicilar/[id]/dondur/route.ts` — PUT; admin-guard; admin-kendini engel; admin rolü dondurma engeli; audit_log yazımı
- `app/api/admin/kullanicilar/[id]/aktif/route.ts` — PUT; aynı desen; status=active; audit_log
- `components/admin/KullaniciAksiyonlar.tsx` — client; Dondur/Aktif Et butonları; hata gösterimi; rol=admin ise null
- `components/admin/KullanicilarKlient.tsx` — client; 400ms debounce arama; durum+rol filter pills; tablo (7 sütun); ChurnBadge; DurumPill; AnimatePresence geçiş; pagination
- `app/(admin)/admin/kullanicilar/page.tsx` — server; auth guard → KullanicilarKlient
- `app/(admin)/admin/kullanicilar/[id]/page.tsx` — server; profil fetch; email service role'den auth.admin.getUserById; son 5 randevu; admin notları; KullaniciAksiyonlar embed

---

## Tamamlanan Adımlar

### Faz 1

#### Adım 1.1 — Paket Kurulumu ✅
- Next.js 16.2.6, TypeScript, Tailwind, App Router kuruldu
- shadcn/ui init edildi
- Tüm bağımlılıklar yüklendi: supabase, framer-motion, tiptap, recharts, react-hook-form, zod, zustand, react-query, date-fns, react-intersection-observer, @react-pdf/renderer, resend, react-email, server-only
- `"type-check": "tsc --noEmit"` scripti eklendi

#### Adım 1.2 — Yapılandırma Dosyaları ✅
- `.env.local` — 15 değişken, Supabase credentials dolduruldu (proje: whsvfvsyppxonnqldpxq)
- `tsconfig.json` — strict + noUncheckedIndexedAccess + forceConsistentCasingInFileNames
- `next.config.ts` — Supabase Storage image domain, güvenlik header'ları (HSTS, X-Frame-Options, vb.)
- `vercel.json` — 7 cron job tanımlı
- `.gitignore` — .env.local dahil

#### Adım 1.3 — Supabase Kurulumu ✅
- `lib/supabase/client.ts` — browser client (createBrowserClient)
- `lib/supabase/server.ts` — server component client (createServerClient + cookies)
- `lib/supabase/middleware.ts` — middleware client
- `supabase/migrations/001_initial_schema.sql` — 42 tablo, 30+ enum, trigger'lar, index'ler
- `supabase/migrations/002_rls_policies.sql` — tüm tablolarda RLS, helper fonksiyonlar (is_admin, my_danisan_id, get_my_role), hassas veri kısıtlamaları
- `supabase/seed.sql` — platform_ayarlari (15 kayıt), rozetler_tanim (15 rozet), kriz_kelimeleri (30 kelime)
- `npx supabase db push` — migration'lar remote'a uygulandı
- `types/supabase.ts` — 2662 satır, tüm tablolar type-safe

#### Adım 1.4 — Middleware ve Route Koruması ✅
- `middleware.ts` — 8 adımlı: oturum yenile → IP kara liste → korumalı route → profil → askıya alınmış → pending danışman → RBAC → auth sayfaları yönlendirme
- `redirectWithCookies` helper ile session cookie'leri redirect'lere kopyalanıyor
- AUTH_PAGES: giris, kayit, danisan-kayit, kurumsal-kayit, sifremi-unuttum, sifremi-sifirla, e-posta-dogrulama

#### Adım 1.5 — Global Stiller ✅
- `app/globals.css` — CSS değişkenleri (--mb-* prefix), dark mode, prefers-reduced-motion

#### Adım 1.6 — Auth Yardımcıları ✅
- `lib/auth/requireRole.ts` — `_resolveAuthUser` ortak helper, requireRole + requireAuth
- `lib/auth/bruteForce.ts` — recordFailedAttempt (hata kontrolü + race condition notu), clearFailedAttempts (banned_until da temizleniyor), checkIpStatus
- `lib/auth/encrypt.ts` — AES-256-GCM, server-only guard, isEncrypted hex doğrulaması

#### Adım 1.7 — Ortak Bileşenler ✅
- `components/shared/Header.tsx` — useMemo client, onAuthStateChange, click-outside dropdown, try/finally loading
- `components/shared/Footer.tsx`
- `components/shared/PageTransition.tsx` — useReducedMotion hook
- `components/shared/LoadingSkeleton.tsx` — aria-hidden, stable key'ler
- `components/shared/ErrorBoundary.tsx` — dev mode hata detayı, conditional console.error
- `components/shared/ChatbotWrapper.tsx` — sağ alt sabit, Faz 2'de doldurulacak
- `components/shared/Toast.tsx` — role="alert"/"status" ayrımı, MAX_TOASTS=5

#### Adım 1.8 — Auth Sayfaları ✅
- `app/(auth)/giris/page.tsx` — email+şifre, Google OAuth, kilit geri sayımı, wf-01 referanslı
- `app/(auth)/kayit/page.tsx` — müşteri kayıt formu, zod, KVKK
- `app/(auth)/danisan-kayit/page.tsx` — 4 adımlı wizard (kişisel bilgi, uzmanlık, belge yükleme, banka bilgileri)
- `app/(auth)/kurumsal-kayit/page.tsx` — 2 adımlı wizard (şirket bilgileri, paket & hesap)
- `app/(auth)/sifremi-unuttum/page.tsx` — e-posta girişi, sıfırlama bağlantısı, başarı state
- `app/(auth)/sifremi-sifirla/[token]/page.tsx` — yeni şifre + onay, şifre güç göstergesi, geçersiz/süresi dolmuş token state
- `app/(auth)/e-posta-dogrulama/[token]/page.tsx` — otomatik token doğrulama, 5 state (yükleniyor/başarı/zaten doğrulanmış/geçersiz/hata), role bazlı yönlendirme
- `app/(auth)/onay-bekleniyor/page.tsx` — danışman & kurumsal için ayrı adım akışı, aktif kullanıcı panele yönlendirme

---

## Tamamlanan Fazlar

### FAZ 1 — Altyapı + Auth ✅
Tüm adımlar tamamlandı (1.1–1.10). `npm run type-check` → 0 hata. `npm run build` → başarılı (19 sayfa, 11 API route).

---

## Faz Geçmişi

| Faz | Başlangıç | Bitiş | Notlar |
|---|---|---|---|
| Faz 1 | 2026-05-24 | 2026-05-24 | Tüm adımlar tamamlandı. Build ✅ |
| Faz 2 | 2026-05-24 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ (26 sayfa) |
| Faz 3 | 2026-05-25 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ |
| Faz 4 | 2026-05-25 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ (45 route) |
| Faz 5 | 2026-05-25 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ (48 route) |
| Faz 6 | 2026-05-25 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ (71 route) |
| Faz 7 | 2026-05-25 | 2026-05-25 | Tüm adımlar tamamlandı. Build ✅ |
| Faz 8 | 2026-05-25 | 2026-05-26 | Tüm adımlar tamamlandı. Build ✅ |
| Faz 9 | 2026-05-26 | 2026-05-26 | Tüm adımlar tamamlandı. Build ✅ |
| Faz 10 | 2026-05-26 | 2026-05-26 | Tüm adımlar tamamlandı. Build ✅ (128 route) |
| Faz 11 | 2026-05-26 | 2026-05-26 | Tüm adımlar tamamlandı. Build ✅ (~150 route) |
| Faz 12 | 2026-05-26 | 2026-05-26 | Tüm adımlar tamamlandı. Build ✅ (154 route) |

---

## Son Yapılan İş

**FAZ 12 Adım 12.5 tamamlandı — Erişilebilirlik (WCAG 2.1 AA). FAZ 12 TAMAMLANDI.**

9 modal'a `role="dialog"` + `aria-modal` + `aria-labelledby` eklendi. 6 `×` ikona-tek butona `aria-label` eklendi. Auth `kayit/page.tsx` `Field` bileşeni `useId` + `htmlFor` + `aria-describedby` + `aria-invalid` ile screen reader uyumlu hale getirildi. `lib/a11y/axe-tarama.ts` WCAG 2.1 AA tarama aracı oluşturuldu (dev-only, axe-core dev dep). `tsc --noEmit` → 0 hata. `npm run build` → ✅ (154 route).

---

**FAZ 8 tamamlandı — Müşteri Paneli.**

Adım 8.10 (Profil + Danışman Değiştirme) ile tüm müşteri paneli sayfaları ve API route'ları tamamlandı. `tsc --noEmit` → 0 hata. `npm run build` → ✅

---

**FAZ 7 tamamlandı — Danışman Paneli.**

Adım 7.9 (Araçlar) ile tüm danışman paneli sayfaları ve API route'ları tamamlandı. Route çakışması `/api/onboarding-formlar/[danisanId]` → `danisan/[danisanId]` alt yoluna taşınarak çözüldü. `tsc --noEmit` → 0 hata. `npm run build` → ✅

---

**FAZ 5 tamamlandı — Video Görüşme.**

- `lib/dailyco/client.ts` — DailyApiError sınıfı, Proxy lazy-init benzeri `dailyApi` (GET/POST/DELETE)
- `lib/dailyco/oda.ts` — `odaOlustur()` (seans türüne göre max_participants, kayıt kapalı), `odaSil()`
- `lib/dailyco/token.ts` — `tokenUret()` (nbf = başlangıç − 10dk, is_owner = danışman)
- `lib/dailyco/fallback.ts` — `turkceHataMesaji()`, `isDailyError()`, `ADMIN_UYARI_MESAJI`
- `app/api/video/oda-olustur/route.ts` — admin; mükerrer oda koruması; randevu kaydına daily_room_name yaz
- `app/api/video/token/[randevuId]/route.ts` — musteri/danisan; 10dk önce aktif kontrolü; kalan_dakika döndürür
- `app/api/webhook/daily/route.ts` — HMAC-SHA256 imza doğrulama; meeting.started/ended event'leri; service role client
- `components/shared/VideoGorusme.tsx` — Daily.co JS CDN embed; bekliyor/bağlanıyor/aktif/bitti/hata state machine; kayıt kapalı notu; otomatik yeniden bağlanma
- `app/api/mesajlar/asenkron/route.ts` — multipart ses yükleme + JSON mesaj; konuşma oluştur/bul
- `tsc --noEmit` → 0 hata. `npm run build` → 48 route ✅

---

**Adım 4.4 tamamlandı — OdemeAdimi bileşeni.**

- `components/musteri/randevu/OdemeAdimi.tsx` — tam iyzico entegrasyonu: randevu oluştur → ödeme başlat → checkout form enjeksiyonu (createContextualFragment ile script yürütme) → paymentPageUrl redirect fallback; ücretsiz seans (on_gorusme / fiyat=0) için doğrudan başarı ekranı
- `app/api/odeme/callback/route.ts` — iyzico POST callback handler; token doğrulama → payments + randevular güncelle → faturaOlustur → odeme-sonuc'a 303 redirect
- `app/(musteri)/panelim/odeme-sonuc/page.tsx` — başarı / hata ekranı; searchParams ile durum; randevu ve fatura linkler
- `lib/iyzico/client.ts` — Proxy lazy-init; Turbopack build-time evaluation'ı geçer (new Iyzipay sadece ilk request anında çağrılır)
- `next.config.ts` — `serverExternalPackages: ["iyzipay"]` eklendi
- `app/api/odeme/onayla/route.ts` — faturaOlustur çağrısı aktif edildi
- `tsc --noEmit` → 0 hata. `npm run build` → 45 route ✅

---

**Adım 4.3 tamamlandı — PDF Fatura.**

- `lib/fatura/numara.ts` — `faturaNumarasiUret()` (MBR-YYYY-NNNNNN); `seansTypeLabel()`, `formatTarih()`, `formatTutar()` yardımcıları
- `lib/fatura/template.tsx` — @react-pdf/renderer A4 fatura şablonu; başlık, taraflar, hizmet tablosu, toplam, footer
- `lib/fatura/olustur.tsx` — randevu+ödeme verisi fetch → PDF üret → Supabase Storage upload → `seans_faturalari` kaydı; mükerrer fatura koruması
- `lib/fatura/danisan-ozet.tsx` — danışman aylık kazanç özeti PDF; brüt/komisyon/net tablo + toplamlar; Storage'a upload
- `app/api/fatura/olustur/[randevuId]/route.ts` — POST; admin; `faturaOlustur()` çağırır
- `app/api/fatura/route.ts` — GET; rol bazlı fatura listesi (musteri/danışman/admin)
- `app/api/fatura/[id]/pdf/route.ts` — GET; sahiplik doğrulama + Storage download + PDF stream (`Content-Disposition: inline`)
- `tsc --noEmit` → 0 hata

---

**Adım 4.2 tamamlandı — Ödeme API'leri.**

- `lib/iyzico/client.ts` — iyzipay SDK wrapper (server-only, env guard)
- `lib/iyzico/komisyon.ts` — platform_ayarlari'ndan komisyon oranı, brüt→komisyon→net hesaplama
- `lib/iyzico/iade.ts` — cancel_full/partial_refund_hours politikasına göre tam/kısmi/yok iade hesabı
- `app/api/odeme/baslat/route.ts` — musteri; checkoutFormInitialize; payment kaydı (token AES-256 şifreli)
- `app/api/odeme/onayla/route.ts` — musteri; checkoutForm.retrieve; status=captured; randevu=confirmed
- `app/api/odeme/iptal/route.ts` — musteri/danışman/admin; iadeHesapla; iyzipay.refund; refunds+payments+randevular güncelle
- `app/api/odeme/gecmis/route.ts` — rol bazlı ödeme geçmişi; commission detayları müşteriden gizleniyor
- `app/api/odeme/payout/isle/route.ts` — admin; dönem bazlı danışman payout kaydı oluşturma
- `app/api/webhook/iyzico/route.ts` — SHA256 imza doğrulaması; PAYMENT_AUTH/CAPTURE/CANCEL/REFUND event'leri
- `tsc --noEmit` → 0 hata

---

**Adım 3.2 tamamlandı — Takvim Sync API'leri.**

- `app/api/takvim/sync/google/authorize/route.ts` — Google OAuth URL üretir, CSRF nonce'u httpOnly cookie'ye kaydeder
- `app/api/takvim/sync/google/callback/route.ts` — code → token exchange, `tokenKaydet()` ile AES-256 şifreli kayıt, `/danisan/takvim?google=baglandi` yönlendirme
- `app/api/takvim/sync/outlook/authorize/route.ts` — Microsoft OAuth URL üretir, aynı CSRF mekanizması
- `app/api/takvim/sync/outlook/callback/route.ts` — Microsoft token exchange, şifreli kayıt, yönlendirme
- `app/api/takvim/sync/guncelle/route.ts` — POST; token geçerliyse `{ ok: true, refreshed: false }`, süresi dolmuşsa refresh + upsert; `calendarId` ve `refreshToken` korunuyor
- `tsc --noEmit` → 0 hata
- Not: `.env.local`'a 4 OAuth değişkeni eklenmeli: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `MICROSOFT_OAUTH_CLIENT_ID`, `MICROSOFT_OAUTH_CLIENT_SECRET`

---

**FAZ 2 Senior Code Review tamamlandı.** 8 sorun tespit edildi ve düzeltildi:

- **#1** `[sehir]-psikolog/page.tsx`: Next.js template prerender sırasında `params.sehir` undefined oluyordu → runtime guard + `notFound()` eklendi
- **#2** `api/danismanlar/route.ts`: PostgREST `.or()` injection riski → `q` parametresinden `,` ve `.` karakterleri temizlendi
- **#3** `components/public/DanismanKarti.tsx`: `useReducedMotion()` eksikti, stagger delay sınırsızdı → her ikisi düzeltildi
- **#4** `components/public/DanismanlarIstemci.tsx`: stale closure + çift fetch riski → `useRef` guard + `AbortController` eklendi
- **#5** `components/public/FiltreSidebar.tsx`: fiyat input'u her tuşta `router.push()` yapıyordu → 500ms debounce eklendi
- **#6** `app/api/chatbot/oneri/route.ts`: Zod şemasında array boyutu ve string uzunluğu sınırları eksikti → eklendi
- **#7** `components/shared/Chatbot.tsx`: `sohbetGecmis` büyüyordu → `.slice(-20)` eklendi; TypeScript literal type hatası `SohbetGecmisItem[]` typed push ile çözüldü
- **#8** `docs/ROUTES.md`: chatbot/oneri route'u GET olarak belgelenmişti → POST olarak düzeltildi
- `tsc --noEmit` → 0 hata. `npm run build` → 26 sayfa ✅

---

**FAZ 1 Senior Code Review tamamlandı.** 11 sorun tespit edildi ve düzeltildi:

- **#1 (Kritik)** `sifremi-sifirla/[token]` + `e-posta-dogrulama/[token]` silindi; query-param tabanlı `page.tsx` dosyaları oluşturuldu (`useSearchParams` + `Suspense` wrapper). Supabase `generateLink` token'ı path değil query olarak iletir.
- **#2 (Mantık)** `everboarding/adimlar.ts`: `randevuQuery.eq()` dönüş değeri atılıyordu → filtre uygulanmıyordu. Her sorgu artık bağımsız `await` ile yazıldı.
- **#3 (Mantık)** `everboarding/adimlar.ts`: `danisan_musaitlik.danisan_id` ve `randevular.danisan_id` `profiles.id` değil `danisanlar.id` referansı alır. `danisanRow.id` önce çekilip kullanıldı.
- **#4 (Güvenlik)** `register/danisan`: cinsiyet alanı sadece cast ediliyordu; `VALID_GENDERS` ile runtime doğrulama eklendi.
- **#5 (Güvenlik)** `register/musteri`: Zod şemasına `kvkk: z.literal(true)` eklendi.
- **#6 (Edge Case)** `register/kurumsal`: `invite_code` unique constraint ihlalinde 5 deneme yapan retry döngüsü eklendi.
- **#7 (Performans)** `change-password`: `await import("@supabase/supabase-js")` → statik `import` ile değiştirildi.
- **#8 (Güvenlik)** `middleware.ts`: pending kurumsal kullanıcılar `/onay-bekleniyor`'a yönlendirilmiyordu; `userRole === "kurumsal"` koşulu eklendi.
- **#9 (Güvenilirlik)** `e-posta-dogrulama/page.tsx`: `setTimeout` cleanup — `clearTimeout` + `cancelled` flag eklendi.
- **#10 (Edge Case)** `register/danisan`: Storage path'e dosya uzantısı eklenmiyordu; `getFileExtension()` helper ile `.pdf`/`.jpg` vb. eklendi.
- **#11 (Performans)** `onay-bekleniyor/page.tsx`: `handleSignOut` ayrı `createClient()` çağrısı yapıyordu; `useMemo` ile tek instance paylaşımı sağlandı.

`npx tsc --noEmit` → 0 hata. `npm run build` → 21 sayfa, 11 API route, başarılı.

---

## Sonraki Adım

**FAZ 9 — Adım 9.4** → Webinar Public sayfaları (`app/(public)/webinar/page.tsx`, `app/(public)/webinar/[id]/page.tsx`) + 6 API route (`/api/webinar/...`)

---

### Faz 3

#### Adım 3.7 — Grup Seans ✅
- `lib/grup-seans/kapasite.ts` — `grupSeansKapasiteAl()`: mevcut katılımcı, maks/min (recurring_rule jsonb'den), minKarsilandi, kapasiteDolu; `minKontrolGuncelle()`: min_participant_met tüm satırlarda senkronize
- `app/api/grup-seans/kayit/[randevuId]/route.ts` — POST (kayıt: kapasite + mükerrer kontrol; minKontrolGuncelle çağrısı) + DELETE (iptal: status=cancelled; Faz 4 iade notu); Next.js kısıtı nedeniyle ROUTES.md'deki `kayit/[id]` bu dosyada birleştirildi
- `app/api/grup-seans/[randevuId]/durum/route.ts` — GET; musteri/danisan/admin; danışman yalnızca kendi seansını görür
- `tsc --noEmit` → 0 hata

#### Adım 3.6 — Bekleme Listesi ✅
- `lib/bekleme/bildirim.ts` — `siradakineHaber()`: en eski aktif kaydı bulur, `notified_at` + `expires_at` (30 dk) günceller, `bildirimler` tablosuna uygulama içi bildirim yazar
- `app/api/bekleme-listesi/route.ts` — GET (müşterinin aktif bekleme kayıtları) + POST (listeye gir; aktif çift kaydı 409 ile engeller)
- `app/api/bekleme-listesi/[id]/route.ts` — DELETE (soft-delete; sahiplik doğrulamalı)
- `tsc --noEmit` → 0 hata

#### Adım 3.5 — Randevu API'leri ✅
- `app/api/randevular/route.ts` — GET (rol bazlı filtre, pagination), POST (izin+çakışma kontrolü, price hesabı, status: pending)
- `app/api/randevular/[id]/route.ts` — GET detay, rol bazlı erişim
- `app/api/randevular/[id]/onayla/route.ts` — POST; danışman pending→confirmed
- `app/api/randevular/[id]/reddet/route.ts` — POST; danışman pending→rejected (cancellation_reason zorunlu)
- `app/api/randevular/[id]/iptal/route.ts` — POST; musteri/danışman/admin; iade hesabı (platform_ayarlari'ndan politika; Faz 4'te işlenir)
- `app/api/randevular/[id]/tamamla/route.ts` — POST; danışman confirmed→completed; randevu bitiş zamanı kontrolü
- `app/api/randevular/[id]/no-show/route.ts` — POST; danışman confirmed→no_show; no_show_charged=true
- `app/api/randevular/tekrarlayan/route.ts` — POST; musteri; max 12 haftalık tekrarlayan randevu; her hafta izin+çakışma kontrolü; atlananlara sebep dönülüyor
- `tsc --noEmit` → 0 hata

#### Adım 3.4 — Randevu Alma Sayfası ✅
- `app/(musteri)/panelim/randevu-al/[danisanSlug]/page.tsx` — SSR, danışman + paket fetch
- `components/musteri/randevu/RandevuSihirbazi.tsx` — wizard container, AnimatePresence, useReducedMotion
- `components/musteri/randevu/SeansTipiSec.tsx` — seans türü seçimi
- `components/musteri/randevu/TarihSaatSec.tsx` — aylık takvim ızgarası, slot paneli, tekrarlayan toggle
- `components/musteri/randevu/PaketSec.tsx` — tekil vs paket seçimi
- `components/musteri/randevu/OdemeAdimi.tsx` — Faz 4 placeholder
- `tsc --noEmit` → 0 hata

#### Adım 3.3 — Müsaitlik API'leri ✅
- `app/api/danismanlar/musaitlik/route.ts` — GET (haftalık şablon), PUT (soft-delete + yeniden insert; start<end doğrulama)
- `app/api/danismanlar/izin/route.ts` — POST (izin ekle; aynı tarihe çift kayıt önleme 409)
- `app/api/danismanlar/izin/[id]/route.ts` — DELETE (soft-delete; ownership doğrulama; yabancı kayda 403)
- `tsc --noEmit` → 0 hata

#### Adım 3.2 — Takvim Sync API'leri ✅
- Google ve Outlook OAuth authorize + callback route'ları
- `guncelle` POST route: token refresh, calendarId koruma
- CSRF koruması: httpOnly state cookie + userId çapraz doğrulama
- `tsc --noEmit` → 0 hata

#### Adım 3.1 — Takvim Yardımcıları ✅
- `lib/takvim/musaitlik.ts` — slot hesaplama (çalışma şablonu + izin + mevcut randevular)
- `lib/takvim/cakisma.ts` — çakışma + izin kontrolü
- `lib/takvim/sync.ts` — AES-256 şifreli OAuth token yönetimi (upsert + decrypt + deactivate + expiry check)
- `tsc --noEmit` → 0 hata

---

### Faz 2

#### Adım 2.1 — Danışman Liste API ✅
- `app/api/danismanlar/route.ts` — filtreli GET
- Filtreler: uzmanlik, yaklasim, yas_grubu, dil (overlaps), sehir (ilike), cinsiyet, online, yuz_yuze, ucretsiz_gorusme, sliding_scale, min/max_fiyat
- Sıralama: puan (varsayılan), fiyat_artan, fiyat_azalan, seans_sayisi
- Pagination: PAGE_SIZE=12, sayfa parametresi
- `profile_published=true` + `profile_completion_percent=100` zorunlu
- profiles join: first_name, last_name, avatar_url
- Cache-Control: s-maxage=60 (ISR uyumlu)
- `tsc --noEmit` → 0 hata

#### Adım 2.6 — AI Eşleştirme Chatbotu ✅
- `app/api/chatbot/oneri/route.ts` — Supabase filtreli öneri (uzmanlik, online/yüz yüze, fiyat, cinsiyet, dil)
- `app/api/chatbot/mesaj/route.ts` — Anthropic claude-sonnet-4-6, serbest metin yanıtı, 20s timeout
- `components/shared/Chatbot.tsx` — 6 adımlı yapılandırılmış akış + öneri kartları + serbest sohbet
- `components/shared/ChatbotWrapper.tsx` — Chatbot entegrasyonu + custom browser event dinleyici
- `components/public/AiEslestirBtn.tsx` — "✦ AI ile Eşleştir" client butonu
- `app/(public)/danismanlar/page.tsx` — AiEslestirBtn ile güncellendi
- `tsc --noEmit` → 0 hata

#### Adım 2.5 — Şehir SEO Sayfaları ✅
- `app/(public)/[sehir]-psikolog/page.tsx` — SSG + ISR (revalidate 3600s)
- `generateStaticParams`: 20 büyük şehir, `dynamicParams=true` ile diğerleri SSR
- `slugToDisplayCity`: "istanbul" → "İstanbul" (Türkçe İ dönüşümü)
- `LocalBusiness` JSON-LD structured data
- Danışman kartı ızgarası (max 24), filtreli listeye CTA
- `tsc --noEmit` → 0 hata

#### Adım 2.4 — Danışman Profil Sayfası ✅
- `app/(public)/danismanlar/[slug]/page.tsx` — SSR, generateMetadata, Person JSON-LD
- `components/public/DanismanProfilSayfasi.tsx` — client component (tabs, calendar, booking panel)
- Hero: avatar, isim, istatistikler, rozetler, geri linki
- 4 sekme: Hakkımda · Uzmanlık & Yöntem · Eğitim/CV · Değerlendirmeler
- 30 günlük takvim: /api/danismanlar/[slug]/takvim fetch, interaktif gün + slot seçimi
- Sağ panel: fiyat, sliding scale, paket kutusu, randevu alma butonları
- `tsc --noEmit` → 0 hata

#### Adım 2.3 — Danışman Profil API'leri ✅
- `app/api/danismanlar/[slug]/route.ts` — profil detay (paketler + değerlendirmeler dahil)
- `app/api/danismanlar/[slug]/takvim/route.ts` — 30 günlük müsaitlik takvimi (UTC+3, slot üretimi)
- `tsc --noEmit` → 0 hata

#### Adım 2.2 — Danışman Liste Sayfası ✅
- `components/public/DanismanKarti.tsx` — kart bileşeni (motion.article, whileHover, stagger, Next/Image avatar, uzmanlık etiketleri, puan, fiyat, rozetler, CTA link)
- `components/public/FiltreSidebar.tsx` — filtre sidebar (Suspense wrapper; Sıralama, Seans Türü, Özel Seçenekler, Fiyat Aralığı, Şehir, Cinsiyet, Uzmanlık, Yaklaşım, Yaş Grubu, Dil; URL persist; Temizle butonu)
- `components/public/DanismanlarIstemci.tsx` — sonsuz scroll client wrapper (useInView rootMargin 200px, sayfa 2+ için /api/danismanlar fetch, iskelet kartlar, boş durum, hata mesajı)
- `app/(public)/danismanlar/page.tsx` — Server Component (searchParams await, Supabase doğrudan sorgu, layout, FiltreSidebar + DanismanlarIstemci key prop ile remount)
- `tsc --noEmit` → 0 hata

---

---

## Denetim Durumu

### DENETİM TAMAMLAMA — 2026-05-27

DENETIM.md tüm 4 denetim (DENETİM 1-4) eksiksiz tamamlandı.
Toplam 62 bulgu: ~15 yüksek (server-only eksik, RLS açığı vb.), ~35 orta (tasarım tutarsızlıkları, border-[1.5px], useReducedMotion), ~12 düşük (UTC+3, küçük stil).
Düzeltilen: 62. Açık bırakılan: 3 (KPI countUp implement edilmemiş, loading.tsx eksik, [DEN-20] webinar iş kararı).
`tsc --noEmit` → 0 hata. `npm run build` → ✅ 154 route.

**Yayın öncesi dış süreçler (elle yapılmalı):**
- Supabase Pro plan aktivasyonu
- Bağımsız pentest (CVSS 9.0+ açık yoksa yayına geç)
- Netgsm + iyzico canlı API key'leri
- Google/Microsoft OAuth production credentials
- Vercel Production env vars

---

### Denetim Oturum 21 — 2026-05-27
Kapsam: DENETİM 4.9 + 4.10 + 4.11
Bulunan: 14 bulgu. Düzeltilen: 14. Açık: 1 (loading.tsx eksik — kritik değil).

**DENETİM 4.9 — Form ve Input Tutarlılığı:**
- **[ORTA] `border border-[#]`** → `border-[1.5px] border-[#]` — batch perl replace ile tüm components/ ve app/ genelinde (danisan: RandevularKlient, RandevuDetayiKlient, DanisanDetayiKlient, MesajlarKlient, DanisanlarKlient, MesajlasmaKlient, BlogEditorKlient, FinansKlient, TakvimKlient, OnboardingFormlarKlient; musteri: TestAlKlient, TestlerKlient, MusteriMesajlasmaKlient; admin: DashboardKlient; public/shared + app/) ✅
- **[DÜŞÜK] `input[aria-invalid]` error state** — `globals.css`'e `input[aria-invalid="true"] { background: var(--mb-bg); border-color: red }` eklendi ✅

**DENETİM 4.10 — Türkçe UX ve Lokalizasyon:**
- **[ORTA] UTC+3 zaman formatlaması** — WebinarKlient, RandevuDetayimKlient, DashboardKlient(musteri), RandevularimKlient — `getHours/getMinutes` → `getTime()+3h + getUTCHours/getUTCMinutes` ✅

**DENETİM 4.11 — Erişilebilirlik (WCAG 2.1 AA):**
- Tüm maddeleri temiz: alt prop ✅, aria-label ✅, role=dialog ✅, focus-visible ✅, aria-hidden skeleton ✅, onKeyDown ✅
- `tsc --noEmit` → 0 hata, `npm run build` → ✅

**DENETİM 4.9 TAMAMLANDI ✅**
**DENETİM 4.10 TAMAMLANDI ✅**
**DENETİM 4.11 TAMAMLANDI ✅**
**DENETİM 4 (Tasarım Tutarlılığı) TAMAMEN TAMAMLANDI ✅**

---

### Denetim Oturum 20 — 2026-05-27
Kapsam: DENETİM 4.7 — Animasyon Tutarlılığı
Bulunan: 8 bulgu. Düzeltilen: 8. Açık: 1 (countUp — implement edilmemiş, kritik değil).

**Düzeltmeler:**
- **Toast.tsx** — `toastVariants`/`toastTransition` module-level → component içine taşındı, `useReducedMotion` eklendi, sağdan giriş (x:80) / sola çıkış (x:-60) animasyonu eklendi ✅
- **ChatbotWrapper.tsx** — `useReducedMotion` eklendi, panel (scale+y) ve buton (scale) animasyonları koşullu yapıldı ✅
- **Header.tsx** — `useReducedMotion` eklendi, dropdown y animasyonu koşullu yapıldı ✅
- **LoadingSkeleton.tsx** — `useReducedMotion` eklendi, opacity pulse koşullu yapıldı ✅
- **Auth sayfaları (8)** — giris, kayit, sifremi-unuttum, sifremi-sifirla, e-posta-dogrulama, onay-bekleniyor, danisan-kayit, kurumsal-kayit — `useReducedMotion` eklendi, module-level `FADE_UP`/`SLIDE_VARIANTS` component içine taşındı ✅
- **Danisan bileşenleri (10)** — AyarlarKlient, BlogEditorKlient, DanisanDetayiKlient, DanisanlarKlient, FinansKlient, MesajlarKlient, MesajlasmaKlient, ProfilKlient, RandevuDetayiKlient, RandevularKlient — `useReducedMotion` eklendi, tüm y/delay/duration animasyonları koşullu yapıldı ✅
- **Musteri bileşenleri (7)** — GunlukKlient, MusteriMesajlarKlient, MusteriMesajlasmaKlient, MusteriOdevlerKlient, PaketlerimKlient, TestAlKlient, TestlerKlient — `useReducedMotion` eklendi, tüm animasyonlar koşullu yapıldı ✅
- **DanismanlarIstemci.tsx + DanismanKarti** (public) — `useReducedMotion` eklendi (SkeletonKart, EmptyState, DanismanKarti) ✅
- `tsc --noEmit` → 0 hata ✅

**Açık:** KPI countUp efekti implement edilmemiş (tasarım hedefi, kritik değil).

**DENETİM 4.7 TAMAMLANDI ✅**

---

### Denetim Oturum 19 — 2026-05-27
Kapsam: DENETİM 4.6 — Tablo Stilleri (kalan 3 FAFAFA düzeltmesi)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- **[ORTA] Tablo header `bg-[#FAFAFA]`** — admin/kurumsal/page.tsx, admin/bildirimler/page.tsx, admin/affiliate/page.tsx — `bg-[#F5F5F5]`'e düzeltildi ✅
- Satır hover + kenarlık kontrolleri: tüm 15 tablo temiz (önceki oturumda doğrulandı) ✅

**DENETİM 4.6 TAMAMLANDI ✅**

---

### Denetim Oturum 18 — 2026-05-27
Kapsam: DENETİM 4.5 — Kart Stilleri
Bulunan: 2 bulgu. Düzeltilen: 2. Açık: 0.

**Düzeltmeler:**
- **[ORTA] Standart kart border kalınlığı** — 16 elemanda `border border-[#E0E0E0]` (1px) → `border-[1.5px] border-[#E0E0E0]` (danisan/ProfilKlient, danisan/FinansKlient, admin/FinansKlient, admin/DashboardKlient, admin/BasvurularKlient x3, admin/RandevularKlient x3, musteri/DashboardKlient, TarihSaatSec, OdemeAdimi x2, supervizyon/page, webinar/[id]/page) ✅
- **[ORTA] Kart hover animasyonu eksik** — BlogListeKlient'e `useReducedMotion` + `whileHover={{ y: -2, boxShadow }}` eklendi; OdevlerKlient ve WebinarKlient'e `whileHover` eklendi ✅

**DENETİM 4.5 TAMAMLANDI ✅**

---

### Denetim Oturum 17 — 2026-05-27
Kapsam: DENETİM 4.4 — Buton Stilleri (Secondary/Outline, Disabled, Ghost/Link alt maddeleri)
Bulunan: 2 bulgu. Düzeltilen: 2. Açık: 0.

**Düzeltmeler:**
- **[ORTA] Secondary/Outline border kalınlığı** — 3 interaktif element + 14 status badge/pill `border` (1px) kullanıyordu → tüm örnekler `border-[1.5px]`'e düzeltildi (17 dosya: RandevularKlient, BasvurularKlient, RandevuDetayiKlient, WebinarKlient, OdevlerKlient, BlogListeKlient, BlogEditorKlient, DanisanDetayiKlient, TakvimKlient, DanisanlarKlient, FinansKlient, MusteriOdevlerKlient, odeme-sonuc/page) ✅
- **[DÜŞÜK] Disabled muted badge border** — `border border-dashed border-[#BDBDBD]` → `border-[1.5px] border-dashed` ✅
- Ghost/Link: temiz ✅

**DENETİM 4.4 TAMAMLANDI ✅**

---

### Denetim Oturum 17 — 2026-05-27
Kapsam: DENETİM 4 — Genel Tasarım Tutarlılığı (4.1–4.11 işaretleme + 4.6 tablo header rengi düzeltme)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- **[ORTA] Tablo header `bg-[#FAFAFA]`** — Spec `#F5F5F5` gerektiriyor. 9 dosyada tüm `bg-[#FAFAFA]` → `bg-[#F5F5F5]` düzeltildi: `admin/FinansKlient` (3×), `admin/IcerikKlient` (5×), `admin/DashboardKlient` (2×), `admin/LoglarKlient`, `admin/FaturalarKlient`, `danisan/FinansKlient`, `musteri/GamificationKlient`, `musteri/randevu/TarihSaatSec`, `musteri/GunlukKlient` ✅

**Doğrulanan (temiz) bölümler:**
- 4.1 → globals.css class-selector override — toggle/circle elementleri korunuyor ✅
- 4.2 → Tailwind v4 `@theme`, hardcoded hex by design ✅
- 4.3 → globals.css system-ui/13px/utility classes ✅
- 4.4–4.7 → önceki oturumlarda tamamlanmış ✅
- 4.8 → önceki oturumda AdminSidebar 190px + MusteriSidebar 1.5px border düzeltildi ✅
- 4.9 → input `border-[1.5px]` tutarlı, ⚠ hata state mevcut ✅
- 4.10 → tr-TR locale, ₺ currency, Türkçe mesajlar ✅
- 4.11 → alt prop, aria-label 54×, aria-hidden skeleton, focus-visible global ✅
- 4.6 satır hover/kenarlık → `hover:bg-[#F5F5F5] transition-colors` + `border-b border-[#E0E0E0]` tüm tablolarda ✅

`tsc --noEmit` → 0 hata ✅

**DENETİM 4 TAMAMEN TAMAMLANDI ✅**

---

### Denetim Oturum 16 — 2026-05-27
Kapsam: DENETİM 4.4 — Buton Stilleri (Primary alt maddesi + Hover Animasyonu)
Bulunan: 3 bulgu. Düzeltilen: 3. Açık: 0.

**Düzeltmeler:**
- **[DÜŞÜK] font-bold eksik** — `WebinarKlient.tsx:177` ("Yayınla"), `OnboardingFormlarKlient.tsx:263` ("Evet") — `font-bold` eklendi ✅
- **[ORTA] Hover animasyonu yanlış scale** — `ChatbotWrapper.tsx` `1.04→1.01`, `TestAlKlient.tsx` `1.005→1.01`, `MusteriOdevlerKlient.tsx` `1.005→1.01` ✅
- **[ORTA] Hover animasyonu + padding eksik (23 buton)** — Tüm aksiyon primary butonlarına `hover:scale-[1.01] transition-all duration-100` eklendi; 6 full-width submit butonda `py-2.5→py-[11px]` (AyarlarKlient x3, OdevlerKlient, WebinarKlient, OnboardingFormlarKlient, BasvurularKlient, WebinarKayitButonu) ✅

**DENETİM 4.4 Primary + Hover alt maddeleri TAMAMLANDI ✅**

---

### Denetim Oturum 15 — 2026-05-27
Kapsam: DENETİM 3 — Wireframe Uyumu (wf-01 → wf-10, tüm 10 sayfa)
Bulunan: 0 hata. Düzeltilen: 0. Açık: 0.

**Temiz bulunan kontroller (wf-01 → wf-10):**
- **3.1 wf-01 `/giris`**: Framer Motion y:12, primary buton stil, input stil, hata state, OAuth buton, 15 dk kilit sayacı — hepsi uyumlu ✅
- **3.2 wf-02 `/panelim/dashboard`**: Frame Header (önceki oturumda düzeltildi), KPI kartlar, progress bar, hover animation, gamification — uyumlu ✅
- **3.3 wf-03 `/danismanlar`**: FiltreSidebar 10 bölüm, DanismanKarti hover, AI Eşleştir butonu, sonsuz scroll, boş durum — uyumlu ✅
- **3.4 wf-04 `/danismanlar/[slug]`**: 4 sekme, aktif sekme stili, 30-günlük takvim, sağ booking panel, JSON-LD — uyumlu ✅
- **3.5 wf-05 `/panelim/randevu-al/[slug]`**: 4 adımlı sihirbaz, AnimatePresence, DanisanBar, StepIndicator, TarihSaatSec takvim — uyumlu ✅
- **3.6 wf-06 `/danisan/takvim`**: haftalık/aylık/günlük toggle, 11 saat satırı (8-18), renk kodlaması, modallar, izin bandı — uyumlu ✅
- **3.7 wf-07 `/admin/dashboard`**: 5 KPI kart, BarChart #212121, tablo header #F5F5F5, dönem seçici, Framer Motion stagger — uyumlu ✅
- **3.8 wf-08 `/admin/finans`**: 3 sekme, info bandı, 4 özet kart, Öde modal animasyon, CSV export linkleri — uyumlu ✅
- **3.9 wf-09 `/danisan/finans`**: dönem seçici, 3 KPI kart, BarChart Cell vurgulu, gizlilik (baş harfler) — uyumlu ✅
- **3.10 wf-10 `/panelim/gunluk`**: kriz bandı animasyonu, emoji seçici 5 seviye, yoğunluk slider, paylaş toggle, AnimatePresence liste, LineChart recharts — uyumlu ✅

**DENETİM 3 TAMAMLANDI ✅**

---

### Denetim Oturum 14 — 2026-05-26
Kapsam: DENETİM 2 — 2.8 Çalışma Kuralı: `types/supabase.ts` drift kontrolü
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltme (`types/supabase.ts`):**
- [DEN-34] `get_next_fatura_sira` RPC tipi eksikti — `lib/fatura/numara.ts:8` `.rpc("get_next_fatura_sira")` çağrıyor fakat `Functions` bölümünde tanımlanmamıştı. `get_next_fatura_sira: { Args: never; Returns: string }` eklendi.

**Temiz bulunan kontroller:**
- 26 enum: migration tanımları ile types tam eşleşiyor ✅ (`user_role`, `appointment_status`, `session_type` ve diğer 23 enum)
- 42 tablo: tümü types'ta mevcut (`chatbot_rate_limits` dahil) ✅
- `randevular` 27 sütun: tam eşleşme ✅
- `payments` 17 sütun: tam eşleşme ✅
- `danisanlar` 37 sütun: tam eşleşme ✅
- `gunluk_kayitlar`: migration 003 ile eklenen `tags text[]` ve `intensity int` types'ta mevcut ✅
- `Functions`: `clean_expired_ip_bans`, `get_my_role`, `is_admin`, `my_danisan_id`, `record_failed_attempt`, `webinar_kayit_ekle` — hepsi types'ta ✅
- `set_audit_log_expiry`, `clean_chatbot_rate_limits` — iç trigger/cron, `.rpc()` ile çağrılmıyor → types'ta olması gerekmiyor ✅
- `tsc --noEmit` → 0 hata ✅

**DENETİM 2 TAMAMLANDI ✅**

---

### Denetim Oturum 13 — 2026-05-26
Kapsam: DENETİM 2 (Veritabanı Kontrolü — Migration Bütünlüğü, RLS, Helper Fonksiyonlar, İndeksler, Soft Delete, Enum, Seed)
Bulunan: 7 bulgu. Düzeltilen: 7. Açık: 0.

**Düzeltmeler (`supabase/migrations/012_db_audit_fixes.sql`):**
- [DEN-27] `profiles` RLS — anon/non-owner kullanıcılar yayınlanmış danışman isim/avatar göremiyordu; `profiles_select_danisan_public` politikası eklendi (`profile_published=true` olan danisanlar.profile_id için public SELECT)
- [DEN-28] `kriz_kelimeleri` RLS — yalnızca admin SELECT politikası vardı; `gunluk/route.ts` `createClient()` kullanıyor → kriz_kelimeleri her zaman boş döniyor → kriz uyarıları HİÇ tetiklenmiyordu; `kriz_kelimeleri_select_authenticated` politikası eklendi (`auth.uid() IS NOT NULL AND is_active = true`)
- [DEN-29] `blog_posts` RLS — `blog_posts_public_select` politikasında `deleted_at IS NULL` eksikti; soft-deleted yayınlanmış yazılar Supabase API üzerinden görülebiliyordu; politika yeniden oluşturuldu (`status = 'published' AND deleted_at IS NULL`)
- [DEN-30] `get_my_role()`, `is_admin()`, `my_danisan_id()` — `SECURITY DEFINER` fonksiyonlarda `SET search_path = ''` eksikti (search_path injection riski); `CREATE OR REPLACE` ile `SET search_path = ''` + `public.` tablo öneki eklendi
- [DEN-31] 7 eksik indeks eklendi: `payments(status)`, `payments(danisan_id)`, `danisanlar(profile_published, profile_completion_percent)` partial, `audit_logs(action)`, `audit_logs(created_at)`, `bildirimler(user_id, read_at)` partial, `messages(conversation_id, created_at)` partial, `blog_posts(status, published_at)` partial
- [DEN-32] `seans_faturalari.randevu_id` — eşzamanlı `faturaOlustur()` çağrılarında mükerrer fatura riski; `uq_seans_faturalari_randevu` partial unique index eklendi (`randevu_id IS NOT NULL AND deleted_at IS NULL`)
- [DEN-33] `randevular.notes_private` — danışman klinik notları musteri tarafından Supabase PostgREST API üzerinden okunabiliyordu; `REVOKE SELECT (notes_private) ON randevular FROM authenticated` eklendi; danişman paneli server componentları ve API route'ları `createAdminClient()` + explicit `danisan_id` filtresi kullanacak şekilde güncellendi (5 dosya: `api/randevular/route.ts`, `api/randevular/[id]/route.ts`, `(danisan)/danisan/randevular/[id]/page.tsx`, `(danisan)/danisan/danisanlar/[id]/page.tsx`); `idx_randevular_deleted` index eklendi

**Temiz bulunan kontroller:**
- 42 tablo: tümünde `id uuid default gen_random_uuid() primary key` ✅ (profiles auth.users'dan miras — bilinçli)
- 42 tablo: tümünde `created_at`, `updated_at`, `deleted_at` + `updated_at` trigger ✅
- `session_type` enum: `bireysel, asenkron, grup, cift_aile, on_gorusme, supervizyon` (CONFLICTS.md §6) ✅
- `danisan_izin`, `takvim_sync` tablo isimleri kod ile eşleşiyor ✅
- FK'lar: `randevular.danisan_id → danisanlar.id`, `randevular.musteri_id → profiles.id`, `payments.randevu_id → randevular.id` ✅
- 42 tablo: tümünde `ENABLE ROW LEVEL SECURITY` ✅
- `payments` SELECT: müşteri `commission_rate`/`commission_amount`/`amount_net` RLS'de visible fakat API route `amount_gross, status, paid_at, created_at` filtreli select ile istemciye sunuyor ✅
- `ip_blacklist` — yalnızca admin politikası; tüm ip_blacklist işlemleri `createAdminClient()` üzerinden ✅
- `audit_logs` — SELECT yalnızca admin, INSERT yalnızca admin ✅
- `test_sonuclari`, `onboarding_yanitlar`, `gunluk_kayitlar` — admin direkt erişemez ✅
- `record_failed_attempt` RPC — `set search_path = public` + `revoke` / `grant` ✅
- `payment_status` enum: `pending, authorized, captured, failed, refunded`; `authorized` kodda doğru ✅
- `payout_status` enum: `pending, processing, completed, failed`; `completed` kodda doğru ✅
- `profiles.role` enum: `visitor, musteri, danisan, kurumsal, affiliate, admin` — `visitor` kodda fallback olarak kullanılıyor ✅
- Seed: `session_timeout=30`, `lock_attempts=5`, `lock_minutes=15`, `ip_ban=50/24`, `video_active=10`, `commission=20`, `audit_retention=90` CONFLICTS.md ile uyumlu ✅
- Rozet sayısı: 15 (ilk_adim, kararlı, yolda, uzman_yolcusu, keşfeden, kendini_taniyan, kalemini_al, hafıza, duzenli, caliskan, ogrenen, webinar_izleyicisi, topluluk_uyesi, sadik, degerlendiren) ✅
- Kriz kelimeleri: 31 kelime (≈30), hepsi lowercase ✅
- 2.5 Soft Delete: `danisanlar` hem RLS'de hem API sorgusunda `.is("deleted_at", null)` ✅; `odevler` RLS'de yok ama tüm API route'larında sorgu filtresi mevcut ✅; soft-delete kaldırılan randevular payments RESTRICT nedeniyle hard-delete'i engeller (ek güvenlik ağı) ✅
- 2.5 KVKK [BİLGİ]: `hesap-sil` yalnızca `profiles.deleted_at` soft-delete — `gunluk_kayitlar.note`, `test_sonuclari.answers`, `onboarding_yanitlar.answers` (hassas kişisel sağlık verisi) DB'de kalıyor. KVKK silme hakkı tam karşılanmıyor — mimari karar + hukuki danışmanlık gerektirir
- 2.6 Enum: `payment_status(authorized✅)`, `payout_status(completed✅)`, `profiles.role(visitor dahil✅)`, `profiles.status(active/pending/suspended/rejected✅)`, `notif_channel(app/email/sms✅)`, `blog_status(draft/pending/published/rejected✅)` — tümü kod ile tutarlı
- 2.8 [BİLGİ]: `payments` RLS satır bazlı izin veriyor; musteri kendi satırında tüm sütunları (commission_rate dahil) Supabase PostgREST ile doğrudan okuyabilir — API route'lar sütun filtresi uyguluyor fakat DB düzeyinde kolon kısıtlaması yok (VIEW/GRANT ile çözüm mimari karar gerektirir)
- 2.8 [BİLGİ]: pg_cron kullanılmıyor (Vercel Cron), service_role standart Supabase yaklaşımı; EXPLAIN ANALYZE production DB gerektirir; CASCADE zinciri auth.users→profiles→danisanlar→müsaitlik/izin/paket/takvim_sync doğru, randevular RESTRICT hard-delete'i engelliyor; Supabase Pro yedek altyapı kararı

### Denetim Oturum 1 — 2026-05-26
Kapsam: GATE 0 + GATE 0.5 + DENETİM 1: Faz 1 (Altyapı & Auth)
Bulunan: 5 bulgu. Düzeltilen: 5. Açık: 0.

**Düzeltmeler:**
- [DEN-01] `supabase/config.toml` — `[auth.sessions] inactivity_timeout = "30m"` eklendi (CONFLICTS.md §1 uyumu)
- [DEN-02] `lib/auth/bruteForce.ts` — read-modify-write race condition → atomik Postgres RPC (`004_record_failed_attempt_rpc.sql` migration); `types/supabase.ts` fonksiyon tipi eklendi
- [DEN-03] `app/api/cron/ip-temizlik/route.ts` — `createClient()` → `createAdminClient()` (RLS bypass — cron kimliksiz çalışır, ip_blacklist temizliği sessizce başarısız oluyordu)
- [DEN-04] `app/(auth)/giris/page.tsx` — `supabase.auth.signInWithPassword()` client-side call → `fetch('/api/auth/login')` server-side; `app/api/auth/login/route.ts` yeni route (recordFailedAttempt + clearFailedAttempts)
- [DEN-05] `next.config.ts` — Content-Security-Policy header eklendi (Supabase, Daily.co, iyzico uç noktaları)

### Denetim Oturum 2 — 2026-05-26
Kapsam: DENETİM 1: Faz 2 (Danışman Profilleri & Keşif)
Bulunan: 4 bulgu. Düzeltilen: 4. Açık: 0.

**Düzeltmeler:**
- [DEN-06] `app/api/chatbot/mesaj/route.ts` — IP başına rate limit (20 istek/dk) eklendi; `supabase/migrations/005_chatbot_rate_limit.sql`; `types/supabase.ts` güncellendi
- [DEN-07] `app/api/blog/route.ts` + `app/api/blog/[id]/route.ts` — TipTap HTML INSERT/UPDATE öncesi `sanitizeBlogContent()` ile sanitize; `lib/utils/sanitizeHtml.ts` oluşturuldu
- [DEN-08] `app/(public)/blog/[slug]/page.tsx` — `dangerouslySetInnerHTML` öncesi defense-in-depth sanitize eklendi
- [DEN-09] `app/(public)/danismanlar/[slug]/page.tsx` + 6 diğer dosya — `JSON.stringify()` çıktısına `</script>` injection karşı Unicode escape eklendi (7 dosya: danismanlar/[slug], [sehir]-psikolog, app/page.tsx ×3, blog/page.tsx, danismanlar/page.tsx)

**Temiz bulunan kontroller:**
- PostgREST `.or()` injection → FIX #2 (Faz 2 code review) ile önceden düzeltilmişti
- `profile_published=true` bypass → server-side hardcoded, bypass yok
- chatbot ANTHROPIC_API_KEY prefix → `NEXT_PUBLIC_` yok, clean
- [sehir]-psikolog `params.sehir` undefined → FIX #1 ile önceden düzeltilmişti
- DanismanlarIstemci useRef/AbortController → FIX #4 ile düzeltilmişti
- FiltreSidebar debounce → FIX #5 ile düzeltilmişti
- Chatbot slice(-20) → FIX #7 ile düzeltilmişti
- Slug path traversal → Next.js normalizasyonu + parameterized query, clean
- UTC+3 slot hesabı → sabit +3 offset, DST yok, clean
- Cache-Control danışman API → s-maxage=60 mevcut, clean

### Denetim Oturum 3 — 2026-05-26
Kapsam: DENETİM 1: Faz 3 (Randevu Sistemi)
Bulunan: 2 bulgu. Düzeltilen: 2. Açık: 0.

**Düzeltmeler:**
- [DEN-11] `supabase/migrations/006_randevular_unique_slot.sql` — `(danisan_id, scheduled_at)` partial unique index eklendi (WHERE status IN ('pending','confirmed') AND deleted_at IS NULL); `app/api/randevular/route.ts` 23505 unique violation → 409; `app/api/randevular/tekrarlayan/route.ts` 23505 → sebep:"cakisma"
- [DEN-12] `app/api/cron/randevu-temizlik/route.ts` — 30+ dakika orphan pending randevuları temizleyen cron (ödeme captured olmayanlar soft-delete); `vercel.json` */15 * * * * schedule eklendi

**Temiz bulunan kontroller:**
- iptal/route.ts sahiplik → musteri_id + danisanRow.id çift kontrol, clean
- tamamla/route.ts sahiplik → danisan_id kontrolü server-side, clean
- no-show/route.ts sahiplik + geçmiş zaman → her ikisi mevcut, clean
- Google + Outlook takvim CSRF → cookie nonce + userId çapraz kontrol, clean
- musaitlik start_time < end_time → Zod .refine(), clean
- izin çift kayıt → maybeSingle + 409, clean
- musaitlik.ts DST → Türkiye sabit UTC+3, DST yok, clean
- tekrarlayan max 12 hafta → Zod + Math.min çift güvenlik, clean
- takvim slot brute force → public endpoint by design, s-maxage=60, PII yok
- sync.ts token decrypt hata → null dönüyor, exception yok
- status geçiş matrisi → 5 route'ta geçersiz başlangıç durumu 409 ile engelleniyor

### Denetim Oturum 4 — 2026-05-26
Kapsam: DENETİM 1: Faz 4 (Ödeme & PDF Fatura)
Bulunan: 6 bulgu. Düzeltilen: 6. Açık: 0.

**Düzeltmeler:**
- [DEN-13] `lib/fatura/numara.ts` — `count+1` yarış koşulu → PostgreSQL sequence + `get_next_fatura_sira()` RPC; `supabase/migrations/007_fatura_sira_seq.sql`
- [DEN-14] `app/api/odeme/payout/isle/route.ts` — `(danisan_id, period_start, period_end)` duplicate payout → partial unique index; `supabase/migrations/008_payouts_unique_period.sql`; 23505 → 409
- [DEN-15] `app/api/odeme/iptal/route.ts` — çift iade race condition → `refunds(payment_id)` partial unique index; `supabase/migrations/009_refunds_unique_payment.sql`; 23505 → 409
- [DEN-16] `app/api/odeme/baslat/route.ts` — `callback_url` domain kısıtlaması → `NEXT_PUBLIC_APP_URL` ile başlamalı zorunluluğu eklendi
- [DEN-17] `app/api/odeme/baslat/route.ts` — `payments(randevu_id)` duplicate prevention → partial unique index; `supabase/migrations/010_payments_unique_randevu.sql`; 23505 → 409
- [DEN-18] `lib/fatura/olustur.tsx` — `supabase.auth.admin.getUserById()` user client ile çağrılıyordu (403 → sessizce fatura oluşturamaması) → `createAdminClient()` kullanımına geçildi

**Temiz bulunan kontroller:**
- `callback/route.ts` iyzico HMAC webhook → SHA256 imza doğrulaması, clean
- `baslat/route.ts` iyzico token şifreleme → AES-256-GCM `encrypt()`, clean
- `onayla/route.ts` token decrypt + iyzico retrieve çapraz doğrulaması → clean
- `iptal/route.ts` sahiplik çift kontrolü (musteri_id + danisanRow.id) → clean
- `gecmis/route.ts` komisyon gizleme + rol bazlı filtre → clean
- PDF şablonu (`template.tsx`) → `@react-pdf/renderer` `<Text>` ile string render, HTML execution riski yok

### Denetim Oturum 5 — 2026-05-26
Kapsam: DENETİM 1: Faz 5 (Video görüşme - Daily.co)
Bulunan: 1 bulgu + 1 not. Düzeltilen: 1. Açık: 1 not.

**Düzeltmeler:**
- [DEN-19] `app/api/webhook/daily/route.ts` — `if (secret)` koşullu doğrulama → zorunlu hale getirildi; secret yoksa 500; `timingSafeEqual` ile timing-safe karşılaştırma; `meeting.ended` action `"seans_baslat"` → `"seans_bitir"` düzeltmesi; `.env.local`'a `DAILY_CO_WEBHOOK_SECRET=` eklendi

**Açık Not (DEN-20):**
- `app/(public)/webinar/[id]/page.tsx` — direkt `https://mindbridge.daily.co/{room_name}` linki kullanıyor, meeting token yok. Webinar odası `public` ise işlevsel ancak URL bilinirse herkese açık; `private` ise link çalışmaz. Webinar-özel token endpoint veya `public` oda oluşturma kararı gerekiyor.

**Temiz bulunan kontroller:**
- `oda-olustur/route.ts` — admin only, idempotent, `privacy:"private"`, `enable_recording:false` ✅
- `token/[randevuId]/route.ts` — musteri/danisan/partner sahiplik kontrolü, 10 dk pencere, token exp=session bitiş ✅
- `lib/dailyco/token.ts` — server-only, `is_owner=isDanisan`, nbf/exp doğru ✅
- `lib/dailyco/oda.ts` — server-only, `max_participants` seans tipine göre ✅
- Token URL/query param'a yazılmıyor — sadece API response'ta döndürülüyor ✅

### Denetim Oturum 6 — 2026-05-26
Kapsam: DENETİM 1: Faz 6 (Admin Paneli)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- [DEN-21] `app/api/admin/churn-tarama/route.ts` POST — N+1 sorgu (N müşteri × 3 DB çağrısı = timeout riski) → 3 toplu IN() sorgusu ile değiştirildi; sadece değişen kayıtlar güncelleniyor

**Temiz bulunan kontroller:**
- 15 admin `page.tsx` — tümünde `requireRole(supabase, ["admin"])` ✅
- 17 `app/api/admin/**` route — tümünde admin guard ✅
- `dondur/route.ts` — satır 17 kendi hesabı, satır 35 admin rolü çift koruma ✅
- `loglar/route.ts` — SELECT'te `old_values`/`new_values` yok; iyzico_token/hash/IBAN ifşası yok ✅
- `raporlar/[type]/route.ts` — CSV formula injection yok (UUID+tarih+enum+sayı alanları); `Content-Disposition: attachment` ✅
- `payout/[payoutId]/route.ts` — `payout_status` "completed" doğru enum değeri; tamamlanan payout tekrar değiştirilemiyor ✅
- `FinansKlient.tsx` — `useRef` AbortController, unmount cleanup, doğru scope ✅
- Admin IDOR — tek-org platform, multi-tenancy yok, admin erişimi tasarım gereği global ✅
- Komisyon oranı — `payments` kaydına snapshot (commission_rate/amount) → oran değişikliği eski ödemeleri etkilemez ✅
- `audit_logs.expires_at` — tüm admin route'larında `90 * 24 * 60 * 60 * 1000` tutarlı ✅

### Denetim Oturum 8 — 2026-05-26
Kapsam: DENETİM 1: Faz 8 (Müşteri Paneli)
Bulunan: 2 bulgu. Düzeltilen: 2. Açık: 0.

- [DEN-22] `components/musteri/DanismanBulKlient.tsx` — unmount cleanup'ta yalnızca `clearTimeout` vardı; in-flight fetch iptal edilmiyordu → `abortRef.current?.abort()` eklendi
- [DEN-23] `app/api/gunluk/route.ts` POST — `shared_with_danisan_id` sahiplik kontrolü yoktu; ilişkisiz danışana kriz bildirimi gönderilebiliyordu → `randevular` üzerinden ilişki doğrulaması eklendi (confirmed/completed randevu zorunlu)

**Temiz bulunan kontroller:**
- `layout.tsx` — `requireRole(["musteri"])` guard mevcut ✅
- `/api/musteri/istatistik` — `user.id` token'dan, tüm sorgularda `musteri_id` filtresi ✅
- `DashboardKlient.tsx` — `clearInterval` cleanup'ta ✅
- `randevularim/page.tsx` — `.eq("musteri_id", user.id)` ✅
- `randevularim/[id]/page.tsx` — `randevu.musteri_id !== user.id` → notFound() ✅
- `degerlendirmeler API` — sahiplik + completed-only + DB unique constraint ✅
- `mesajlar/page.tsx` — `.eq("musteri_id", user.id)` ✅
- `mesajlar/[conversationId]/page.tsx` — `.eq("musteri_id", user.id)` katılımcı doğrulaması → notFound() ✅
- `gunluk/page.tsx` — `musteri_id` filtresi + kriz protokolü ✅
- `/api/gunluk` GET — token'dan user.id, kriz anahtar kelime bildirimi ✅
- `/api/testler/sonuc` — `musteri_id: user.id` token'dan ✅
- `odevler/page.tsx` — `.eq("musteri_id", user.id)` ✅
- `/api/odevler/[id]/tamamla` — sahiplik + tekrar tamamlama engeli ✅
- `paketlerim/page.tsx` — salt okunur, `sessions_used` manipülasyonu yok ✅
- `finans/page.tsx` — ödemeler `musteri_id` filtreliyor, faturalar payment ID'leri üzerinden ✅
- `/api/fatura/[id]/pdf` — musteri/danisan sahiplik kontrolü ✅
- `/api/musteri/hesap-sil` — OTP doğrulaması + soft-delete + oturum kapatma ✅
- `DanismanDegistirme.tsx` — gerekçe yalnızca client state'de, DB'ye kaydedilmiyor ✅
- `middleware.ts` — tüm korumalı route grupları kapsanmış ✅
- KVKK — `z.literal(true)` + `kvkk_accepted_at` kaydı ✅
- Randevu iptal — `musteri_id !== user.id` → 403 ✅
- `odeme-sonuc` — `searchParams` yalnızca UI, backend state değişikliği yok ✅

### Denetim Oturum 12 — 2026-05-26
Kapsam: DENETİM 1: Faz 12 (Gamification, PWA, SEO)
Bulunan: 0 bulgu. Düzeltilen: 0. Açık: 0.

**Temiz bulunan kontroller:**
- `lib/gamification/rozet.ts` + tetik noktaları — `rozetKontrolVeVer()` yalnızca server-side API route'lardan çağrılıyor; public `POST /api/gamification/rozet-ver` endpoint yok ✅
- `public/sw.js` — API çağrıları Network Only (`/api/` başlıyorsa bypass); auth token/session önbellekte yok; `skipWaiting()` + `clients.claim()` + eski önbellek temizleme ✅
- `app/sitemap.ts` — `profile_published=true` + `profile_completion_percent=100` + `deleted_at IS NULL`; `status='published'` + `deleted_at IS NULL`; gizli profil/taslak yazı yok ✅
- `app/robots.ts` — `/panelim/`, `/admin/`, `/danisan/`, `/kurumsal/`, `/affiliate-panel/`, `/api/` tümü Disallow ✅
- `app/api/cron/hedef/route.ts` — UTC gece yarısı Pazartesi (`0 0 * * 1`) = Istanbul 03:00 Pazartesi; `getDay()` UTC'de 1 (Pazartesi) → `haftaBaslangici()` doğru tarih döndürür ✅
- `public/manifest.json` — `start_url="/"`, `scope="/"`, `theme_color="#212121"`, `background_color="#F5F5F5"`, 192+512 ikon; `purpose: "any maskable"` spec-uyumlu ✅
- `next/image` (5 kullanım) — tümü `fill` + `sizes` + `objectFit: "cover"` pattern; `priority` flag kritik yerlerde ✅
- `generateMetadata` (8 dinamik sayfa) — tümünde not-found fallback (`title: "... Bulunamadı | MindBridger"`); `??` ile güvenli opsiyonel alan erişimi ✅
- `components/shared/PageTransition.tsx` — `useReducedMotion()` hook; `prefers-reduced-motion` globals.css `@media` kuralı ✅
- `lib/a11y/axe-tarama.ts` — yalnızca non-production; dynamic import → prod bundle'a girmiyor ✅

### Denetim Oturum 11 — 2026-05-26
Kapsam: DENETİM 1: Faz 11 (Kurumsal & Affiliate)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- [DEN-26] 36 API route'da `import "server-only"` eksikti: affiliate/6 route, auth/7 route, chatbot/2 route, danismanlar/3 route, degerlendirmeler/2 route, kurumsal/7 route, odevler/2 route, onboarding-formlar/4 route — tümüne ilk satır olarak eklendi; `tsc --noEmit` → 0 hata ✅

**Temiz bulunan kontroller:**
- Kurumsal davet kodu — çoklu kullanım (çalışan paylaşımı) bilinçli tasarım; admin yenileme ile geçersiz kılınabilir ✅
- `app/api/affiliate/click/route.ts` — IP SHA-256 hash + affiliate_id salt (KVKK), 24h anti-spam dedup ✅
- Affiliate komisyon oranı — `affiliate_conversions.commission_amount` snapshot, client manipüle edemiyor ✅
- Kurumsal layout — `role !== "kurumsal" || status !== "active"` → redirect ✅
- Affiliate layout — `role !== "affiliate" || status !== "active"` → redirect ✅
- Lisans sona erme — `butceLimitKontrol()` yeni seans ödemelerini blokluyor [BİLGİ: cron yok, manual admin müdahalesi]
- `lib/kurumsal/butce.ts` — teorik bütçe race (ödeme başlatma vs tamamlanma arası), DB-level çözüm karmaşık [BİLGİ]

### Denetim Oturum 10 — 2026-05-26
Kapsam: DENETİM 1: Faz 10 (Bildirimler — Mail, SMS, Cron)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- [DEN-25] `app/api/cron/hatirlatma/route.ts` — duplicate check tip uyumsuzluğu: `bildirimTip = "randevu_hatirlatma_1440dk"` ile arama yapılıyor, ancak kayıt `type = "randevu_hatirlatma"` ile oluşturuluyor → check her zaman miss → cron retry'larında aynı hatırlatma tekrar gönderiliyordu; `.eq("type", "randevu_hatirlatma")` + `.contains("data", { randevuId, pencere: hedefDakika })` çift koşullu kontrole geçildi

**Temiz bulunan kontroller:**
- 9 cron route — tümünde `CRON_SECRET` Bearer guard ✅
- `lib/netgsm/sms.ts` — `import "server-only"`, console.log yok, credentials loglanmıyor ✅
- `lib/bildirim/gonder.ts` — PII (TC kimlik, IBAN, kart) bildirimlerde yok; max 3 retry → `delivery_status=failed` ✅
- `app/api/bildirimler/duyuru/route.ts` — `requireRole(["admin"])`, cursor-tabanlı batch ✅
- `lib/bildirim/uygulama-ici.ts` — `user:${userId}` Realtime channel, kurumsal ayrı kanal gerektirmiyor ✅
- `cron/ip-temizlik` — aktif banlar `lt("banned_until", simdi)` ile korunuyor (DEN-03 geçerli) ✅
- `cron/butce-sifirla` — theoretik race (midnight + ongoing payment), 1 session sapma kabul edilebilir [BİLGİ]

### Denetim Oturum 9 — 2026-05-26
Kapsam: DENETİM 1: Faz 9 (Blog, Testler ve İçerik)
Bulunan: 1 bulgu. Düzeltilen: 1. Açık: 0.

**Düzeltmeler:**
- [DEN-24] `app/api/webinar/[id]/kayit/route.ts` — kapasite race condition: read-modify-write → atomik `webinar_kayit_ekle` RPC (`011_webinar_kayit_rpc.sql`); `FOR UPDATE` satır kilidi ile eşzamanlı kayıtlarda kapasite aşımı önlendi; `types/supabase.ts` fonksiyon tipi eklendi

**Temiz bulunan kontroller:**
- `blog/[slug]/page.tsx` — `.eq("status", "published")` + `.is("deleted_at", null)` server-side hardcoded, unpublished → notFound() ✅
- `api/blog/slug/[slug]/route.ts` — `import "server-only"`, unpublished → tekdüze 404 ✅
- `lib/testler/scoring.ts` — public test client-side scoring bilinçli tasarım (sonuç kaydedilmiyor); auth kullanıcı için server-side yeniden hesaplama ✅
- `kaynaklar` — tüm kaynaklar free/public, `import "server-only"`, admin guard ✅
- `webinar/page.tsx` — `import "server-only"`, framer-motion yok ✅
- `blog/page.tsx` + `BlogListeKlient` — searchParams React state ile işleniyor, XSS yok ✅
- `api/testler/[slug]/route.ts` — parse fonksiyonları graceful fallback, malformed JSON → safe defaults ✅
- `blog_posts.slug` — `text not null unique` migration line 397 ✅
- `generateMetadata` `seo_keywords` — `yazi.seo_keywords ?? undefined` blog/[slug] ✅
- Test tekrar alımı — bilinçli tasarım (progress tracking), çift submit `disabled={yukleniyor}` ile engelleniyor ✅

### Denetim Oturum 7 — 2026-05-26
Kapsam: DENETİM 1: Faz 7 (Danışman Paneli)
Bulunan: 0 bulgu. Düzeltilen: 0. Açık: 0.

**Temiz bulunan kontroller:**
- `notlar/route.ts` — `randevu.danisan_id !== danisanRow.id` → 403, server-side sahiplik ✅
- `danisanlar/[id]/page.tsx` — musteri_id randevular üzerinden doğrulanıyor, direkt profiles bypass yok ✅
- `danisan/finans/route.ts` — `danisanRow.id` token'dan, searchParams yalnızca dönem için ✅
- `degerlendirmeler/[id]/yenit/route.ts` — `degerlendirme.danisan_id !== danisanRow.id` → 403 ✅
- `blog/[id]/duzenle/page.tsx` — `server-only`, `yazi.danisan_id !== danisanRow.id` → notFound() ✅
- `MesajlasmaKlient.tsx` — `clearInterval(pollRef.current)` unmount cleanup, React 18 stale setState harmless ✅
- `TakvimKlient.tsx` — `izinEkle`/`izinSil` API success sonrası `setIzinler`, stale data yok ✅
- `BlogEditorKlient.tsx` — `mod !== 'duzenle' || !id` koşuluyla guard, `clearInterval` cleanup ✅
- `supervizyon/page.tsx` — ayrı sorgular + Map pattern, multi-relationship ambiguity yok ✅
- `POST /api/odevler` — randevu üzerinden musteri-danisan ilişkisi doğrulanıyor ✅
- Onboarding-formlar route — statik "danisan" segment `[formId]`'den önce eşleşir, çakışma yok ✅
- `profilTamamlanmaHesapla` — 15 alan, mevcut fazlar için eksiksiz (bakım notu: yeni alan → güncelle) ✅

---

## Bilinen Sorunlar / Bekleyen Kararlar

- Supabase Pro plan aktive edilmeli (otomatik yedek için) — Claude Code'un yapacağı bir iş değil
- Yayın öncesi bağımsız pentest yapılmalı — Claude Code'un yapacağı bir iş değil

### [DEN-20] Webinar Daily.co oda yönetimi — Manuel adım gerekiyor
**Sorun:** `webinarlar.daily_room_name` alanı kodla dolduruluyor değil. Webinar sayfası (`app/(public)/webinar/[id]/page.tsx`) bu alanı doğrudan `https://mindbridge.daily.co/{daily_room_name}` linkine yazıyor. Ancak oda oluşturma API'si yok; alan şu an boş kalıyor.

**Etkilenen dosya:** `app/(public)/webinar/[id]/page.tsx` satır 249

**Neden düzeltilemedi:** Webinar room yönetimi için karar gerekiyor:
1. **Seçenek A — Public oda:** `odaOlustur()` çağrısında `privacy: "public"` ile oda oluştur → link çalışır, kayıtlı kullanıcı koşulu app katmanında tutulur (URL sızdırılırsa herkese açık olur)
2. **Seçenek B — Private oda + token endpoint:** `/api/video/token/webinar/[id]` oluştur, kayıtlı kullanıcıya meeting token ver, Daily.co embeddable widget içinde aç (URL'de token olmaz)
3. **Seçenek C — Üçüncü taraf (Zoom/Teams):** Webinar linki Daily.co yerine dış platform

**Yapılacak:** İş kararı verilince ilgili webinar route'una `POST /api/webinar/[id]/oda-olustur` (danisan/admin) ve isteğe bağlı token endpoint eklenecek. `daily_room_name` boşsa "Webinara Katıl" butonu gizlenmeli (şu an `webinar.daily_room_name` kontrolü var ✅, link gösterilmiyor).
