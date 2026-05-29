# DENETIM.md — Kapsamlı Kod, Veritabanı ve Tasarım Denetim Planı

> **Bu dosya yalnızca PROGRESS.md'de "tamamlandı" işaretlenmiş fazlar için çalıştırılır.**
> Tamamlanmamış faz bölümlerini (11-12) henüz implemente edilmemiş dosyalar içerdiğinden atla.

---

## ⛔ TEMEL ÇALIŞMA KURALI — HER ADIMDA UYGULA, İSTİSNASIZ

```
1. Bir fazın YALNIZCA BİR ADIMINI kontrol et (örn: 1.1 Güvenlik → sadece "bruteForce.ts")
2. O adımı bitirince dur ve şunu söyle:
   "[Adım adı] kontrolü tamamlandı. [N] bulgu / temiz. Devam edeyim mi?"
3. ONAY GELMEDEN bir sonraki adıma ASLA geçme
4. Bulgu varsa → önce düzelt → type-check çalıştır → sonra onay iste
5. Bulgu yoksa → "temiz" bildir → onay iste → sonra geç
```

### Yasak
- "Şunu da bakayım, verimli olur" deme — bakma
- Tek mesajda birden fazla adım kontrol etme
- Onay beklemeden bir sonraki dosyaya geçme
- Bulgu bildirmeden "temiz" geçme — her kontrol için ya bulgu ya temiz onayı

---

> ⚠️ BAŞLAMADAN ÖNCE: `docs/PROGRESS.md` oku → hangi fazlar tamamlandı? Sadece o fazların
> denetim bölümlerini çalıştır. Tamamlanmamış faz bölümü → "Faz X henüz implemente edilmemiş,
> bu bölüm atlanıyor." yaz ve geç. Var olmayan dosyayı okumaya çalışma.

---

## 🔁 OTURUM YÖNETİMİ — ZORUNLU OKU

**Bu denetim tek oturumda bitmez.** Context penceresi dolar, compaction başlar,
önceki kararlar unutulur. Her oturum aşağıdaki bloklardan birini yapar:

```
OTURUM 1:  GATE 0 + GATE 0.5 (sistemik tarama) + DENETİM 1: Faz 1
OTURUM 2:  DENETİM 1: Faz 2
OTURUM 3:  DENETİM 1: Faz 3
OTURUM 4:  DENETİM 1: Faz 4
OTURUM 5:  DENETİM 1: Faz 5
OTURUM 6:  DENETİM 1: Faz 6
OTURUM 7:  DENETİM 1: Faz 7
OTURUM 8:  DENETİM 1: Faz 8
OTURUM 9:  DENETİM 1: Faz 9
OTURUM 10: DENETİM 1: Faz 10-12 (implemente edilmişse, birer birer)
OTURUM 11: DENETİM 2 (Veritabanı)
OTURUM 12: DENETİM 3 (Wireframe Uyumu)
OTURUM 13: DENETİM 4 (Tasarım Tutarlılığı)
```

Her oturumda adım adım ilerle — faz içinde de onay almadan bir sonraki adıma geçme.

### Her Oturum Başında (4 adım, değişmez):
```
1. npm run type-check → hata varsa buradan ayrılma, önce düzelt
2. docs/PROGRESS.md oku → "Denetim Durumu" bölümüne bak
   → Hangi oturum tamamlanmış? Kaldığın yerden devam et.
3. docs/CONFLICTS.md oku → geçerli değerleri tazele
4. Yalnızca o oturumun kapsamındaki dokümanları oku
   (Örn: Oturum 2 ise PRD/SCHEMA tekrar okuma — zaten bilinen bilgi)
```

### Her Oturum Sonunda (ZORUNLU):
```
docs/PROGRESS.md dosyasına şunu ekle:
"Denetim Oturum [N] tamamlandı — [tarih].
 Kapsam: [DENETİM X, Faz Y-Z].
 Bulunan: [K] bulgu. Düzeltilen: [L]. Açık: [M]."
```

Bu olmadan bir sonraki oturum nereden devam edeceğini bilemez.

---

## ⛔ GATE 0 — BUILD KONTROL (İLK VE ZORUNLU ADIM)

Denetimin herhangi bir bölümüne başlamadan önce şunu çalıştır:

```bash
npm run type-check
npm run build
```

- **Hata varsa → buradan ayrılma.** Build hatalarını önce düzelt, sonra denetim başlar.
- **Hata yoksa** → Çıktıdaki route sayısını not et (referans). Devam et.

---

## ⚡ OTURUM 1'E BAŞLAMADAN ÖNCE (Sadece ilk oturumda oku)

Paralel oku:
1. `docs/PROGRESS.md` → tamamlanan fazları + belgelenen FIX numaralarını listele
2. `docs/CONFLICTS.md` → geçerli değerleri doğrula
3. `docs/SCHEMA.md` → tablo/enum yapısını tanı (DB denetimi için gerekli)
4. `docs/ROUTES.md` → tanımlı route'ları tanı (GATE 0.5 çapraz kontrolü için)

> `docs/PRD.md` ve `docs/IMPLEMENTATION_PLAN.md` denetim sırasında gerekirse oku,
> baştan yükleme — bu iki dosya büyük, context'i erken doldurur.
> `wireframes/wf-*.html` yalnızca DENETİM 3'te (wireframe bölümü) okunacak.

Okuduktan sonra şunu söyle:
"PROGRESS.md okudum. [N] faz tamamlanmış. FIX numaraları: [liste].
GATE 0 build başarılı, [N] route. GATE 0.5 sistemik taramayı çalıştırıyorum."

---

## ⏭ BİLİNEN DÜZELTMELERİ ATLA

PROGRESS.md'deki her `[FIX #N]` etiketi, o sorunun **zaten düzeltildiğini** belgeler.
DENETİM 1'de bir kontrol doğrudan bu FIX numaralarından biriyle örtüşüyorsa:
- Dosyayı oku
- Düzeltmenin gerçekten uygulandığını TEK SATIRLA onayla
- "✅ FIX #N — uygulandı, [satır X]. Sonraki kontrole geçiyorum." de ve geç

Bu listeyi DENETİM 1'e başlamadan çıkar:

```
Faz 1: FIX #1 (redirectWithCookies), FIX #2 (everboarding sorgu), FIX #3 (hata kontrolü),
       FIX #4 (banned_until temizleme), FIX #5 (server-only), FIX #6 (kurumsal invite retry),
       FIX #7 (AUTH_PAGES eksik), FIX #8 (kurumsal pending yönlendirme),
       FIX #9 (setTimeout cleanup), FIX #10 (dosya uzantısı), FIX #11 (onay-bekleniyor useMemo)
Faz 2: FIX #1–#8 (Senior Code Review — 8 sorun düzeltildi)
```

Bunların dışındaki her kontrol TAM denetimden geçer.

---

## ⚡ GATE 0.5 — SİSTEMİK TARAMA (Build'den sonra, faz denetiminden önce)

Bu tarama tek seferde çalışır ve tüm fazlardaki sistematik ihlalleri toplu yakalar.
Her grep çıktısını kaydet; ilgili faz denetiminde dosya tekrar okuma — çıktıya bak.

```bash
# 1. server-only eksik API route'lar (tüm app/api/)
# Not: head -N kullanma; çoğu route üst satırlarda çok satırlı JSDoc içerir,
# `import "server-only"` çoğunlukla 8-16. satırlarda olur. Tüm dosyayı tara.
for f in $(find app/api -name "route.ts" | sort); do
  grep -q '"server-only"' "$f" || echo "EKSİK: $f"
done

# 2. TypeScript `any` kullanımı (CLAUDE.md: any yasak)
grep -rn ": any\b\| as any\b" app/ lib/ --include="*.ts" --include="*.tsx" \
  | grep -v "eslint-disable"

# 3. framer-motion server component'te kullanım ("use client" olmayan .tsx)
grep -rl "from ['\"]framer-motion['\"]" app/ --include="*.tsx" | while read f; do
  head -1 "$f" | grep -q "use client" || echo "SERVER COMP'TA MOTION: $f"
done

# 4. console.log production kodu (loglamada veri sızıntısı riski)
grep -rn "console\.log" app/ lib/ --include="*.ts" --include="*.tsx" \
  | grep -v "// "

# 5. NEXT_PUBLIC_ hassas değişken (client bundle'a sızma riski)
grep -rn "NEXT_PUBLIC_" app/ lib/ --include="*.ts" --include="*.tsx" \
  | grep -v "SUPABASE_URL\|SUPABASE_ANON_KEY\|APP_URL\|PLATFORM_NAME"

# 6. ROUTES.md çapraz kontrol — tanımlı ama implemente edilmemiş route'lar
# docs/ROUTES.md oku → her API path için app/api/ altında route.ts var mı?
# Eksikler: "ROUTES.md'de var, app/api/'de yok: [liste]" formatında bildir
```

Her çıktı için: dosyayı oku → ilgili faz denetimi adımında işle.
Çıktı yoksa: `✅ Sistemik tarama temiz.` yaz ve devam et.

---

## ⛔ HALÜSINASYON ÖNLEME KURALLARI — HER BULGUDAN ÖNCE UYGULA

Bu bölümü her bulgu bildirmeden önce oku. İhlal ettiğinde denetim geçersiz sayılır.

### Zorunlu 3 Adım — Sırasız Atlanamaz

```
ADIM 1 — OKU
  Bulgu bildireceğin dosyayı Read aracıyla oku.
  "Muhtemelen vardır", "tipik olarak böyle yazılır", "genellikle eksik olur"
  ifadelerinden hiçbiriyle bulgu bildirilemez. Dosyayı okumadan iddia yok.

ADIM 2 — ALINTIYLA KANITLA
  Sorunlu kodu birebir alıntıla: dosya adı + satır numarası + ilgili satırlar.
  "Bu satırlarda sorun var" demek yeterli değil; kodu göster.

ADIM 3 — ÇÜRÜTMEYE ÇALIŞ
  Şunu sorgula: "Bu aslında sorun olmayabilir çünkü ___."
  Karşı argüman geçerliyse → bulgu yok, kontrol işaretle, devam et.
  Karşı argüman çöküyorsa → bulguyu bildir.
```

### Kesinlikle Yapma
- Dosyayı okumadan bulgu bildirme
- "Bu muhtemelen eksiktir" veya "genelde unutulur" diyerek bulgu bildirme
- Aynı sorunu farklı başlıkla iki kez bildirme (duplicate bulgu)
- Kontrol listesindeki maddeyi okumadan "temiz" işaretleme
- Framework/kütüphane davranışını varsaymadan önce ilgili kodu oku

### Hata Üstüne Hata Önleme — ZORUNLU

Herhangi bir düzeltmeden ÖNCE:

```
1. KAPSAM: Değiştireceğin fonksiyon/değişken/tipin adını al
   → grep -rn "[değiştirilecek_isim]" . --include="*.ts" --include="*.tsx"
   → Çıktıdaki TÜM dosya:satır konumlarını listele

2. ETKİ: "Bu değişiklik şu dosyaları da etkiler: [liste]" de

3. MİNİMUM: Sadece sorunun bulunduğu satırı değiştir
   → Aynı editte başka hiçbir şeye dokunma
   → Stil düzeltmesini güvenlik düzeltmesiyle aynı edite koyma

4. DOĞRULA: Her düzeltmeden sonra derhal:
   → npm run type-check
   → Hata varsa → REVERT, yeni hata üretme, önce anla

5. REVERT KOŞULU: type-check yeni bir hata üretirse
   → Düzeltmeyi geri al
   → Hatayı kullanıcıya bildir: "[Düzeltme X] [yeni hata Y] üretti. Geri aldım. Önce Y'yi anlıyorum."
   → Yeni hatayı anladıktan sonra tekrar dene
```

### Bulgu Bildirme Formatı — ZORUNLU
Her bulgu bu formatta olmalı:

```
[SEVİYE] [dosya/yolu.ts:satır_no] — Başlık
Bulunan kod:
  `[sorunlu satır veya blok — birebir alıntı]`
Sorun: [neden sorun olduğu, hangi senaryoda tetiklenir]
Risk: [etkisi — veri sızıntısı / çökme / güvenlik açığı / UX bozukluğu]
Öneri: [nasıl düzeltilmeli]
Düzelteyim mi?
```

Seviye seçenekleri:
- `[KRİTİK]` — Veri sızıntısı, ödeme güvenliği, auth bypass, PII ifşaatı
- `[YÜKSEK]` — Race condition, yetkisiz erişim, veri bütünlüğü riski
- `[ORTA]` — Eksik validasyon, hatalı edge case, UX çökmesi
- `[DÜŞÜK]` — Kod kalitesi, minor performans, eksik loading state
- `[BİLGİ]` — Uyarı niteliğinde not, zorunlu değil

### Temiz Bulgu Formatı — ZORUNLU
Sorun yoksa şunu yaz:

```
✅ [kontrol adı] — temiz.
Okunan: [dosya adı]. [Neden temiz olduğunu 1 cümleyle belirt.]
```

Boş geçme. Her kontrol için ya bulgu ya temiz onayı bildir.

---

## ÇOKLU BAKIŞ AÇISI — Her Bölümde Uygula

Her kod bloğunu şu 4 perspektiften değerlendir. Bulgu yoksa bile perspektif kontrolleri yap:

```
1. SALDIRGAN GÖZÜ
   Kötü niyetli bir kullanıcı bu API'yi nasıl kötüye kullanır?
   Parametre manipülasyonu, sahiplik bypass, rate limit aşımı, injection.

2. GELİŞTİRİCİ GÖZÜ
   Başka bir developer bu kodu yanlış anlayıp nasıl bozabilir?
   Tip güvensizliği, side effect, sessiz hata yutma, yanlış varsayım.

3. GELECEK FAZ GÖZÜ
   Bu kod, üzerine inşa edilecek sonraki modülü kırar mı?
   Cron job'larla uyumsuzluk, schema drift, hardcoded değer, kilit bağımlılık.

4. KULLANICI GÖZÜ
   Edge case'de kullanıcı ne görür? Veri kaybı yaşar mı?
   Network hatası, eşzamanlı işlem, süresi dolmuş token, boş state.
```

---

## DENETİM 1 — Kod Güvenliği, Hata ve Faz-Arası Tehditler

### Çalışma Kuralı
1. **TEMEL ÇALIŞMA KURALI geçerlidir** — bir fazın tek bir kontrol maddesini yap, dur, onay bekle
2. Dosyayı **önce oku**, sonra kontrol et — okumadan bulgu bildirme
3. Bulgu bildirirken: **Zorunlu 3 Adım** + **Bulgu Formatı** kullan
4. Onay gelince düzelt → `npm run type-check` çalıştır → sonucu söyle
5. Tüm maddeler bittikten sonra: `"Faz X tamamlandı. [N] bulgu. Sonraki faza geçeyim mi?"` de
6. Bir faz bitmeden diğerine geçme

---

### 1.1 Faz 1 — Altyapı & Auth

#### Güvenlik
- [ ] `middleware.ts`: Tüm korumalı route grupları (`/admin`, `/danisan`, `/panelim`, `/kurumsal-panel`, `/affiliate-panel`) listede var mı? Eksik segment? Route grubu `(main)` de dahil mi?
- [ ] `middleware.ts`: `pending` durumundaki kurumsal kullanıcı `/onay-bekleniyor`'a yönlendiriliyor mu?
- [ ] `middleware.ts`: Oturum zaman aşımı 30 dk — cookie `max-age` ve Supabase session `expiresIn` tutarlı mı?
- [ ] `lib/auth/bruteForce.ts`: Eşzamanlı iki `recordFailedAttempt` çağrısı sayacı iki kez artırıyor mu? (race condition — `increment` yerine `update set count = count + 1` kullanılıyor mu?)
- [ ] `lib/auth/bruteForce.ts`: `banned_until` süresi geçince otomatik temizlik var mı? Ya da yalnızca `checkIpStatus` zamanında kontrol mu yapıyor?
- [ ] `lib/auth/encrypt.ts`: AES-256-GCM IV her şifrelemede `crypto.randomBytes(12)` ile üretiliyor mu? IV sabit veya yeniden kullanılıyor mu?
- [ ] `lib/auth/encrypt.ts`: `import 'server-only'` dosyanın ilk satırında var mı?
- [ ] `lib/auth/requireRole.ts`: `affiliate` rolü için `/affiliate-panel`'e yönlendirme var mı? Eksikse middleware ile çelişir

#### Hata / Bug
- [ ] `app/(auth)/sifremi-sifirla/page.tsx`: `token_hash` veya `type` eksikse geçersiz token ekranı gösteriliyor mu? `undefined` ile işlem yapılıyor mu?
- [ ] `app/(auth)/e-posta-dogrulama/page.tsx`: `setTimeout` sonrası unmount olursa `clearTimeout` + iptal bayrağı var mı?
- [ ] `app/(auth)/danisan-kayit/page.tsx`: Belge upload sırasında uzantısız dosya kaydediliyor mu? `getFileExtension()` helper uygulandı mı?
- [ ] `app/api/auth/register/musteri/route.ts`: Zod şemasında `kvkk: z.literal(true)` var mı? Yoksa KVKK'sız kayıt mümkün
- [ ] `app/api/auth/register/danisan/route.ts`: Cinsiyet değeri `VALID_GENDERS` listesiyle runtime doğrulanıyor mu?
- [ ] `app/api/auth/register/kurumsal/route.ts`: `invite_code` unique constraint çakışmasında en fazla 5 deneme retry döngüsü var mı? Sonsuz döngü riski?

#### Çoklu Bakış — Faz 1
- [ ] **Saldırgan:** `bruteForce.ts` ban kontrolü atlatılabilir mi? Farklı IP'lerden istek göndererek bypass?
- [ ] **Gelecek Faz:** `types/supabase.ts` — tüm tablolar ve enum'lar migration ile senkronize mi? Drift varsa Faz 9-12 API'leri TypeScript hatası verir
- [ ] **Kullanıcı:** `next.config.ts` güvenlik headerları (HSTS, X-Frame-Options, X-Content-Type-Options, CSP) mevcut mu? Eksik header tarayıcı korumasını devre dışı bırakır
- [ ] `.env.local` şablonu: `NEXT_PUBLIC_` prefix'li değişkenler arasında hassas veri var mı? (`service_role`, ödeme key, API secret)

---

### 1.2 Faz 2 — Danışman Profilleri & Keşif

#### Güvenlik
- [ ] `app/api/danismanlar/route.ts`: `q` parametresindeki `,` ve `.` karakterleri `.or()` filter'a gitmeden temizleniyor mu? (PostgREST operatör enjeksiyonu)
- [ ] `app/api/danismanlar/route.ts`: `profile_published=true` ve `profile_completion_percent=100` filtresi client tarafından bypass edilebilir mi? Query param ile override mümkün mü?
- [ ] `app/api/chatbot/oneri/route.ts`: Zod şemasında string uzunluğu ve array boyutu sınırları var mı? Uzun string ile maliyet saldırısı riski
- [ ] `app/api/chatbot/mesaj/route.ts`: `ANTHROPIC_API_KEY` `process.env` ile sunucu tarafında mı erişiliyor? `NEXT_PUBLIC_` prefix yok mu?
- [ ] `app/api/chatbot/mesaj/route.ts`: İstek başına rate limit var mı? Aynı IP'den sınırsız Anthropic API çağrısı yapılabiliyor mu?

#### Hata / Bug
- [ ] `app/(public)/[sehir]-psikolog/page.tsx`: `params.sehir` prerender sırasında `undefined` olduğunda `notFound()` çağrılıyor mu?
- [ ] `components/public/DanismanlarIstemci.tsx`: `useRef` guard ile çift fetch önlemi ve `AbortController` ile stale request iptali var mı?
- [ ] `components/public/FiltreSidebar.tsx`: Fiyat input her tuşta `router.push()` yapıyor mu? 500ms debounce uygulandı mı?
- [ ] `components/shared/Chatbot.tsx`: `sohbetGecmis` büyümeye devam ediyor mu? `.slice(-20)` ile sınırlandırılmış mı?

#### Çoklu Bakış — Faz 2
- [ ] **Saldırgan:** Danışman slug'ı `../` veya encoded özel karakter içeriyorsa path traversal var mı?
- [ ] **Gelecek Faz:** `app/api/danismanlar/[slug]/takvim/route.ts` UTC+3 slot hesaplıyor mu? Timezone hatası Faz 3 randevu sistemini kırar
- [ ] **Kullanıcı:** `Cache-Control: s-maxage=60` danışman profil API'lerinde var mı? Yoksa her refresh Supabase'i çarpar
- [ ] **Geliştirici:** TipTap ile blog editörüne girilen HTML, `danismanlar.bio` alanına ham mı kaydediliyor? Public profilde XSS riski

---

### 1.3 Faz 3 — Randevu Sistemi

#### Güvenlik
- [ ] `app/api/randevular/route.ts` POST: Aynı danışman × slot için eşzamanlı iki istek — DB unique constraint veya advisory lock var mı? Çift randevu oluşabilir mi?
- [ ] `app/api/randevular/[id]/iptal/route.ts`: Sahiplik kontrolü yapılıyor mu? Müşteri başkasının randevusunu iptal edebiliyor mu?
- [ ] `app/api/randevular/[id]/tamamla/route.ts`: `danisan_id === currentDanisanId` kontrolü sunucu tarafında mı?
- [ ] `app/api/randevular/[id]/no-show/route.ts`: Sahiplik + randevunun geçmiş olup olmadığı kontrol ediliyor mu?
- [ ] `app/api/takvim/sync/google/callback/route.ts`: `state` parametresi cookie'deki nonce ile karşılaştırılıyor mu? CSRF koruması aktif mi?
- [ ] `app/api/takvim/sync/outlook/callback/route.ts`: Aynı CSRF mekanizması var mı?

#### Hata / Bug
- [ ] `app/api/danismanlar/musaitlik/route.ts` PUT: `start_time < end_time` doğrulaması var mı? Geçersiz aralık sessizce kaydedilmeli değil
- [ ] `app/api/danismanlar/izin/route.ts` POST: Aynı `danisan_id` + `date` için çift kayıt 409 ile engelleniyor mu?
- [ ] `lib/takvim/musaitlik.ts`: Türkiye yaz saati geçişleri (Mart son Pazar → Ekim son Pazar, UTC+3) edge case'leri ele alınmış mı?
- [ ] `app/api/randevular/tekrarlayan/route.ts`: Max 12 hafta sınırı sunucu tarafında zorlanıyor mu? Client manipülasyonu mümkün mü?

#### Çoklu Bakış — Faz 3
- [ ] **Saldırgan:** Randevu slot endpoint'i brute force ile boş slot taranabiliyor mu? Bilgi sızıntısı var mı?
- [ ] **Gelecek Faz:** `lib/takvim/sync.ts` token çözme başarısız olduğunda `null` mı dönüyor, exception mı fırlatıyor? Faz 10 cron'u bu davranışa bağlı
- [ ] **Geliştirici:** Randevu `status` enum geçiş matrisi — geçersiz geçişler (`completed → pending` gibi) engellenmiş mi? API'de explicit kontrol var mı?
- [ ] **Kullanıcı:** Slot seçilip ödeme adımında ağ hatası olursa randevu yarım kalır mı? Orphan `pending` randevu temizleme var mı?

---

### 1.4 Faz 4 — Ödeme & PDF Fatura

#### Güvenlik (KRİTİK — PCI DSS)
- [ ] `app/api/odeme/baslat/route.ts`: iyzico `token` AES-256-GCM ile şifrelenerek `payments.iyzico_token` alanına mı kaydediliyor? Ham token loglara veya response'a düşüyor mu?
- [ ] `app/api/webhook/iyzico/route.ts`: SHA256 HMAC imza doğrulaması her request'te yapılıyor mu? Başarısız imzada 401 dönülüyor mu, işlem devam ediyor mu?
- [ ] `app/api/odeme/iptal/route.ts`: İade oranı ve politikası `platform_ayarlari`'ndan mı okunuyor? Hardcoded `%80` veya sabit süre var mı?
- [ ] `app/api/odeme/gecmis/route.ts`: `commission_rate`, `gross_amount`, `net_amount` müşteriye gönderilmiyor mu? Danışmanın komisyon detayı müşteriden gizli mi?
- [ ] `lib/iyzico/client.ts`: Dosya başında `import 'server-only'` var mı? Client bundle'a `iyzipay` paketi sızıyor mu?
- [ ] `lib/fatura/template.tsx`: `first_name`, `last_name`, `address` gibi kullanıcı kontrollü değerler PDF'e HTML encode edilerek mi ekleniyor?

#### Hata / Bug
- [ ] `app/api/odeme/callback/route.ts`: iyzico token doğrulaması başarısız olursa `randevular.status` nasıl kalıyor? `pending` mi, `failed` mi? Rollback var mı?
- [ ] `lib/fatura/numara.ts`: `MBR-YYYY-NNNNNN` sequence — eşzamanlı iki istek aynı numarayı üretebilir mi? DB sequence kullanılıyor mu?
- [ ] `lib/fatura/olustur.tsx`: `seans_faturalari` tablosunda `appointment_id` unique constraint ile mükerrer fatura koruması var mı?
- [ ] `app/api/odeme/payout/isle/route.ts`: Admin aynı `period` için iki kez çalıştırırsa duplicate payout oluşuyor mu? Idempotency kontrolü?

#### Çoklu Bakış — Faz 4
- [ ] **Saldırgan:** `app/api/odeme/callback/route.ts` path'i dışarıdan tahmin edilebilir mi? İmzasız callback ile sahte ödeme onayı gönderilebilir mi?
- [ ] **Gelecek Faz:** `faturaOlustur()` başarısız olursa ödeme `captured` kalır ama fatura yok — Faz 7 danışman finans bu durumu nasıl ele alır?
- [ ] **Kullanıcı:** Ödeme callback sırasında kullanıcı sayfayı kapatırsa ne olur? Yarım kalan işlem nasıl recover edilir?
- [ ] **Geliştirici:** PDF fatura Supabase Storage'a `public` bucket'a mı yükleniyor? URL tahmin edilebilir mi? `private` bucket + signed URL gerekiyor mu?

---

### 1.5 Faz 5 — Video Görüşme

#### Güvenlik
- [ ] `app/api/video/token/[randevuId]/route.ts`: Daily.co token response body'de `{ token }` olarak mı dönüyor? Client-side URL hash veya query param'da asla olmamalı
- [ ] `app/api/video/token/[randevuId]/route.ts`: 10 dakika öncesi kontrolü — `new Date()` UTC mı? `start_time - 10 * 60 * 1000` hesabı doğru mu?
- [ ] `app/api/webhook/daily/route.ts`: `X-Daily-Signature` header'ı HMAC-SHA256 ile doğrulanıyor mu? Her event'te, sadece bazı event türlerinde değil
- [ ] `components/shared/VideoGorusme.tsx`: Daily.co JS CDN scripti doğrudan `<script>` olarak mı yükleniyor? `DAILY_CO_API_KEY` client bundle'da var mı?
- [ ] `lib/dailyco/token.ts`: `is_owner: true` yalnızca `role === 'danisan'` durumunda mı? Müşteri `is_owner` token alabilir mi?

#### Hata / Bug
- [ ] `app/api/video/oda-olustur/route.ts`: `randevular.daily_room_name` zaten dolu ise yeni oda oluşturulmuyor mu? İdempotency var mı?
- [ ] `components/shared/VideoGorusme.tsx`: Otomatik yeniden bağlanma max retry sayısı var mı? (5 deneme sonrası kullanıcıya hata mesajı)
- [ ] `app/api/mesajlar/asenkron/route.ts`: Ses dosyası `file.size > 10 * 1024 * 1024` kontrolü server-side var mı?

#### Çoklu Bakış — Faz 5
- [ ] **Saldırgan:** Geçmiş randevu ID'siyle `/api/video/token/[id]` çağrılırsa token alınabiliyor mu? Zaman penceresi kontrolü yeterli mi?
- [ ] **Gelecek Faz:** Video seans tamamlandığında `webhook/daily` üzerinden oda silinmiyorsa Daily.co'da açık oda birikir — temizleme mekanizması var mı?
- [ ] **Kullanıcı:** Video bağlantısı kesilince "Yeniden Bağlan" butonu görünüyor mu? Kaç saniye sonra otomatik deneme?
- [ ] **Geliştirici:** `lib/dailyco/fallback.ts` — Daily.co döndürebileceği tüm HTTP hata kodları (400, 401, 403, 404, 429) için Türkçe mesaj var mı?

---

### 1.6 Faz 6 — Admin Paneli

#### Güvenlik
- [ ] Tüm `app/(admin)/admin/**/page.tsx` dosyaları: `requireRole(["admin"])` guard içeriyor mu? Dosyaları tek tek listele, eksik olanı bul
- [ ] Tüm `app/api/admin/**/*.ts` route dosyaları: Aynı guard var mı? `app/api/admin/` altında korumasız route var mı?
- [ ] `app/api/admin/kullanicilar/[id]/dondur/route.ts`: `user.id === targetId` kontrolü — admin kendi hesabını dondurabiliyor mu?
- [ ] `app/api/admin/loglar/route.ts`: Audit log satırlarında `iyzico_token`, şifre hash, IBAN değerleri görünüyor mu? Maskeleme var mı?
- [ ] `app/api/admin/raporlar/[type]/route.ts`: CSV satırlarındaki değerler `=`, `+`, `-`, `@` ile başlıyorsa Excel formula injection olur — `'` prefix ile escape ediliyor mu?

#### Hata / Bug
- [ ] `app/api/admin/churn-tarama/route.ts`: Tüm müşteriler tek sorguda mı alınıyor? Büyük tabloda timeout riski — batch/pagination var mı?
- [ ] `app/api/admin/finans/payout/[payoutId]/route.ts`: `status === 'paid'` olan payout tekrar `PUT` isteğiyle değiştirilebiliyor mu?
- [ ] `components/admin/FinansKlient.tsx`: `useEffect` cleanup — `AbortController` her fetch için doğru scope'da mı tanımlanıyor? Re-render'da sızdırıyor mu?

#### Çoklu Bakış — Faz 6
- [ ] **Saldırgan:** Admin IDOR — `/api/admin/kullanicilar/[id]` endpoint'i `id` parametresinde geçerli bir UUID olduğu sürece herhangi bir adminin erişebileceği bir profile mi işaret ediyor, yoksa sadece kendi org'una mı?
- [ ] **Gelecek Faz:** `platform_ayarlari.platform_commission_rate` değiştirilince mevcut `pending` ödemeler eski oranla mı hesaplanıyor? Oran değişikliği isolasyonu var mı?
- [ ] **Geliştirici:** `audit_logs.expires_at` 90 gün ile doğru set ediliyor mu? Faz 10 `log-temizlik` cron'u bu alana bağlı
- [ ] **Kullanıcı:** Admin raporu CSV export ettiğinde tarayıcı download mı yapıyor, yeni sekme mi açıyor? `Content-Disposition: attachment` header var mı?

---

### 1.7 Faz 7 — Danışman Paneli

#### Güvenlik
- [ ] `app/api/randevular/[id]/notlar/route.ts`: `notes_private` için `danisanlar.id === randevu.danisan_id` kontrolü var mı? Başka danışman okuyabiliyor mu?
- [ ] `app/(danisan)/danisan/danisanlar/[id]/page.tsx`: Müşteri ID'sinin bu danışmana ait olduğu randevular üzerinden doğrulanıyor mu? Direkt `profiles` fetch ile bypass mümkün mü?
- [ ] `app/api/danisan/finans/route.ts`: `danisanRow.id` token'dan alınan ID mi? Query param ile başka danışmanın verisi alınabiliyor mu?
- [ ] `app/api/degerlendirmeler/[id]/yenit/route.ts`: Yorum `danisan_id` ile `danisanRow.id` eşleşmesi kontrol ediliyor mu? Başka danışmanın aldığı yoruma yanıt mümkün mü?
- [ ] `app/(danisan)/danisan/blog/[id]/duzenle/page.tsx`: `blog_posts.danisan_id === danisanRow.id` sahiplik kontrolü server component'te mi, client'ta mı? Client'ta yapılıyorsa güvensiz

#### Hata / Bug
- [ ] `components/danisan/MesajlasmaKlient.tsx`: `setInterval(8000)` cleanup — `clearInterval` + `AbortController` unmount'ta çağrılıyor mu?
- [ ] `components/danisan/TakvimKlient.tsx`: Tatil ekleme/silme API çağrısı başarılı olunca local `izinler` state güncelleniyor mu? Yoksa sayfa yenilenene kadar eski durum görünür
- [ ] `components/danisan/BlogEditorKlient.tsx`: 30 sn otomatik kayıt sadece `mod === 'duzenle'` ve `status === 'draft' || 'rejected'` durumunda mı? `yeni` modda kaydet ID yok, çağrı hata verir mi?
- [ ] `app/(danisan)/danisan/supervizyon/page.tsx`: `musteriMap` ve `danisanMap` ayrı sorgularla doluyor mu? `profiles` multi-relationship ambiguity yönetilmiş mi?

#### Çoklu Bakış — Faz 7
- [ ] **Saldırgan:** Danışman kendi müşterisi olmayan bir `musteri_id` ile ödev oluşturabilir mi? `POST /api/odevler` sahiplik kontrolü var mı?
- [ ] **Gelecek Faz:** `profilTamamlanmaHesapla()` — Faz 8 ve sonrasında eklenen profil alanları (bildirim tercihleri, KVKK onay tarihi vb.) bu hesaba dahil mi? Fonksiyon güncellendi mi?
- [ ] **Geliştirici:** `/api/onboarding-formlar/danisan/[danisanId]` ile `/api/onboarding-formlar/[formId]` route çakışması tamamen çözüldü mü? Next.js hangi route'u seçiyor?
- [ ] **Kullanıcı:** Danışman finans sayfasında sayfa dışı tıklarsa devam eden fetch iptal mi ediliyor? Stale data gösterilmez mi?

---

### 1.8 Faz 8 — Müşteri Paneli (Tüm Adımlar)

#### 8.1–8.2 (Dashboard ve Danışman Bulma)
- [ ] `app/(musteri)/panelim/(main)/layout.tsx`: `requireRole(["musteri"])` guard var mı?
- [ ] `app/api/musteri/istatistik/route.ts`: Kullanıcı ID'si token'dan alınıyor mu? Query param ile başka müşterinin verisi alınabiliyor mu?
- [ ] `components/musteri/DashboardKlient.tsx`: 60 sn `setInterval` cleanup — `clearInterval` unmount'ta var mı?
- [ ] `components/musteri/DanismanBulKlient.tsx`: `AbortController` unmount'ta iptal ediliyor mu?

#### 8.3 (Randevular ve Değerlendirmeler)
- [ ] `app/(musteri)/panelim/randevularim/page.tsx`: Yalnızca kendi randevuları görünüyor mu? `musteri_id === user.id` filtresi var mı?
- [ ] `app/api/degerlendirmeler/route.ts` POST: Yorum yalnızca `status === 'completed'` randevu için yazılabiliyor mu? Tamamlanmamış seans için yorum engelleniyor mu?
- [ ] `app/api/degerlendirmeler/route.ts` POST: Aynı `randevu_id` için çift yorum yazılabiliyor mu? Unique constraint var mı?
- [ ] `app/api/degerlendirmeler/danisan/[danisanId]/route.ts` GET: Herkese açık mı? Sadece yayınlanmış değerlendirmeler mi gösteriliyor? (Not: `[danisanId]` → `[id]` çakışması nedeniyle `danisan/` alt yoluna taşındı)

#### 8.4 (Mesajlar — Müşteri)
- [ ] `app/(musteri)/panelim/mesajlar/page.tsx`: Müşteri yalnızca kendi konuşmalarını görebiliyor mu? `conversations` tablosunda `participant` doğrulaması var mı?
- [ ] `app/(musteri)/panelim/mesajlar/[conversationId]/page.tsx`: Konuşmaya katılımcı olmayan müşteri erişebiliyor mu? 403 dönülüyor mu?

#### 8.5 (Günlük ve Ruh Hali — KRİTİK HASSAS VERİ)
- [ ] `app/api/gunluk/route.ts` POST: `user_id` token'dan alınıyor mu? Body'den alınan `user_id` ile override mümkün mü?
- [ ] `app/api/gunluk/paylasim/route.ts`: Paylaşım toggle'ı — başka müşterinin günlüğünü paylaşmak mümkün mü? Sahiplik kontrolü var mı?
- [ ] Kriz protokolü: `kriz_kelimeleri` listesindeki kelimeler günlük içeriğinde tespit edildiğinde ne oluyor? Tetikleyici var mı? Kim bilgilendiriliyor?
- [ ] `gunluk_kayitlar` RLS: Admin bu tabloya direkt erişim yok mu? (CONFLICTS.md §3 - SCHEMA.md hassas veri notu)
- [ ] `app/(musteri)/panelim/gunluk/page.tsx`: Günlük listelenirken başka kullanıcının kaydı görünüyor mu? SSR sorgusunda `user_id` filtresi var mı?

#### 8.6 (Testler)
- [ ] `app/api/testler/sonuc/route.ts` POST: Test sonucu `user_id` token'dan alınıyor mu?
- [ ] `app/api/testler/gecmis/route.ts` GET: Kullanıcı yalnızca kendi test geçmişini görebiliyor mu?
- [ ] `test_sonuclari.answers` — hassas veri RLS politikası: admin direkt erişim yok mu? (CONFLICTS.md §3)

#### 8.7–8.9 (Ödevler, Paketler, Gamification, Finans)
- [ ] `app/(musteri)/panelim/odevler/page.tsx`: Ödevler yalnızca kendi `musteri_id`'siyle filtreleniyor mu?
- [ ] `app/(musteri)/panelim/paketlerim/page.tsx`: Başka müşterinin paketi görünebiliyor mu? `sessions_used` manuel artırılabiliyor mu?
- [ ] `app/(musteri)/panelim/finans/page.tsx`: Fatura PDF linkleri — başka müşterinin faturasına signed URL üretilebiliyor mu? Sahiplik kontrolü `fatura/[id]/pdf` route'unda var mı?

#### 8.10 (Profil ve Danışman Değiştirme)
- [ ] `app/(musteri)/panelim/profil/page.tsx`: Hesap silme işlemi — kişisel veri KVKK kapsamında ne kadarı siliniyor, ne kadarı anonimleştiriliyor? `deleted_at` mi set ediliyor, hard delete mi?
- [ ] `app/(musteri)/panelim/profil/page.tsx`: Hesap silme ve e-posta değiştirme için OTP veya mevcut şifre doğrulaması var mı?
- [ ] `components/musteri/DanismanDegistirme.tsx`: Gerekçe metni — eski danışmanın görebileceği bir alanda saklanıyor mu? RLS politikası buna uygun mu?

#### Çoklu Bakış — Faz 8
- [ ] **Saldırgan:** Günlük API rate limit var mı? Spam kayıt ile kriz tetikleyici sistemi flood edilebilir mi?
- [ ] **Gelecek Faz:** Gamification rozet tetikleyicileri — müşteri kendi puanını manuel artırabilir mi? `app/api/gamification` veya ilgili endpoint'te sahiplik kontrolü var mı?
- [ ] **Kullanıcı:** Ödeme sonuç sayfası (`/panelim/odeme-sonuc`) — kullanıcı "Geri" tuşuyla ödeme adımına dönerken `searchParams` ile sahte başarı durumu gösterebilir mi?

---

### 1.9 Faz 9 — Blog, Testler ve İçerik (Public)

#### Güvenlik
- [ ] `app/(public)/blog/[slug]/page.tsx`: `status !== 'published'` olan yazı (taslak, bekleyen, reddedilmiş) SSR sorgusuna dahil ediliyor mu? Public sayfada görünebiliyor mu?
- [ ] `app/api/blog/slug/[slug]/route.ts` GET: Yayınlanmamış yazı için 404 mü, 403 mü dönülüyor? Yazının varlığı tahmin edilebiliyor mu? (Not: `[slug]` → `[id]` dynamic segment çakışması nedeniyle `slug/` alt yoluna taşındı)
- [ ] `app/(public)/testler/[slug]/page.tsx`: Test soruları ve cevap seçenekleri public mı? Puanlama mantığı (scoring logic) client-side'a sızıyor mu? (`lib/testler/scoring.ts` `server-only` mu?)
- [ ] `app/(public)/kaynaklar/page.tsx`: Ücretli veya kısıtlı kaynak dosyaları kimlik doğrulamasız indirilebiliyor mu?
- [ ] `app/api/webinar/[id]/kayit/route.ts`: Webinar kapasitesi dolunca kayıt engelleniyor mu? `registered_count` okuma + insert iki ayrı sorgu — eşzamanlı iki kayıt kapasite kontrolünü aynı anda geçebilir mi? (Race condition: DB-level unique constraint veya serializable transaction gerekiyor)
- [ ] `app/(public)/webinar/page.tsx`: Dosyanın başında `"use client"` direktifi yok ama `framer-motion` import ediliyor mu? (GATE 0.5 tarama çıktısına bak; server component'ta motion = runtime hatası)

#### Hata / Bug
- [ ] `app/(public)/blog/page.tsx`: `searchParams` ile gelen kategori/arama parametresi sanitize ediliyor mu? XSS riski var mı?
- [ ] `app/api/testler/[slug]/route.ts`: Test soruları `jsonb` formatında — `answers` şeması bozuksa graceful hata veriliyor mu?
- [ ] `app/api/kaynaklar/route.ts` POST (admin): Kaynak dosyası yükleme 10 MB limiti uygulanıyor mu?
- [ ] `lib/testler/scoring.ts`: Puanlama — kullanıcı client'tan manipüle edilmiş `answers` gönderirse scoring doğru sonuç mu veriyor? Server-side puanlama mı yapılıyor?

#### Çoklu Bakış — Faz 9
- [ ] **Saldırgan:** Blog yazısı TipTap editöründen gelen HTML içeriyor — admin onayından önce stored XSS mümkün mü? Sanitize nerede yapılıyor?
- [ ] **Gelecek Faz:** Blog `slug` çakışması — iki danışman aynı slug üretilebilir mi? Unique constraint DB'de var mı?
- [ ] **SEO:** `generateMetadata` için `blog.seo_keywords` alanı kullanılıyor mu? Meta tag'ler boş mu doluyor mu?
- [ ] **Kullanıcı:** Test tamamlandıktan sonra `back` tuşuyla aynı testi yeniden çözebiliyor mu? Mükerrer sonuç kaydı oluşuyor mu?

---

### 1.10 Faz 10 — Bildirimler (Mail, SMS, Cron) ⏸ PROGRESS.md'de tamamlandıysa çalıştır

> PROGRESS.md'de Faz 10 "tamamlandı" değilse bu bölümü atla — kod yok, denetim yapılamaz.

#### Güvenlik (KRİTİK)
- [ ] Tüm `app/api/cron/*.ts` route'ları: `Authorization: Bearer ${CRON_SECRET}` header kontrolü var mı? Tek tek dosyaları oku, eksik olanı listele
- [ ] `lib/netgsm/sms.ts`: Netgsm `username` ve `password` `console.log` ile loglanıyor mu? Response body'de loga düşüyor mu?
- [ ] `lib/bildirim/gonder.ts`: Bildirim içeriğinde kişisel veri (TC kimlik, IBAN, kart numarası) geçiyor mu? Loglara düşebilir mi?
- [ ] `app/api/bildirimler/duyuru/route.ts`: Toplu duyuru yalnızca admin rolü için mi? Yetkisiz kullanıcı toplu mesaj gönderebiliyor mu?

#### Hata / Bug
- [ ] `lib/bildirim/gonder.ts`: Max 3 yeniden deneme sonrası `delivery_status = 'failed'` set ediliyor mu? Sonsuz retry döngüsü var mı?
- [ ] `app/api/cron/hatirlatma/route.ts`: 24h + 2h + 15 dk hatırlatmalar aynı randevu için üç kez de gönderilmeden önce zaten gönderilip gönderilmediği kontrol ediliyor mu? Mükerrer bildirim riski
- [ ] `app/api/cron/ip-temizlik/route.ts`: `banned_until < now()` olan kayıtlar silinirken yanlışlıkla aktif ban'lar da silinmiyor mu?
- [ ] `app/api/cron/butce-sifirla/route.ts`: `sessions_used_this_month` sıfırlanırken aynı anda devam eden bir ödeme varsa sayaç tutarsız kalabilir mi?

#### Çoklu Bakış — Faz 10
- [ ] **Saldırgan:** Cron endpoint'leri Vercel dışından çağrılabilir mi? `CRON_SECRET` yoksa tüm cron'lar tetiklenebilir
- [ ] **Gelecek Faz:** `lib/bildirim/uygulama-ici.ts` Supabase Realtime kullanıyorsa Faz 11 kurumsal çalışanlar için ayrı channel gerekiyor mu?
- [ ] **Kullanıcı:** SMS gönderimi başarısız olduğunda kullanıcıya görünür bir fallback var mı? (E-posta veya uygulama içi bildirim)
- [ ] **Geliştirici:** E-posta şablonlarında `{first_name}` gibi template değişkenleri doldurulmadan gönderilirse boş alan görünüyor mu? Fallback değer var mı?

---

### 1.11 Faz 11 — Kurumsal & Affiliate ⏸ PROGRESS.md'de tamamlandıysa çalıştır

> PROGRESS.md'de Faz 11 "tamamlandı" değilse bu bölümü atla — kod yok, denetim yapılamaz.

#### Güvenlik
- [ ] `app/api/kurumsal/davet/route.ts`: Davet token tek kullanımlık mı? Kullanılan token geçersiz kılınıyor mu?
- [ ] `app/api/kurumsal/butce/route.ts`: Bütçe limit kontrolü — eşzamanlı iki ödeme isteği bütçeyi negatife düşürebilir mi? Optimistic lock veya DB constraint var mı?
- [ ] `app/(kurumsal)/kurumsal-panel/**`: Tüm sayfalar `requireRole(["kurumsal"])` guard içeriyor mu? Admin değil, kurumsal rolü görülmeli
- [ ] `app/api/affiliate/click/route.ts`: Affiliate link tıklama — aynı kullanıcı tıklamasını spam yaparak conversion sayısını şişirebilir mi? Dedup var mı?
- [ ] `app/api/affiliate/kazanclar/route.ts`: Affiliate kendi commission oranını manipüle edebiliyor mu? Oran DB'den mi alınıyor?

#### Hata / Bug
- [ ] `lib/kurumsal/butce.ts`: Bakiye yetersizliğinde "bireysel ödeme seçeneği" sunulduğunda ödeme kurumsal mı, bireysel mi işleniyor? Fatura doğru tarafın adına mı kesiliyor?
- [ ] `lib/kurumsal/fatura.ts`: Aylık PDF + XLSX üretimi — büyük çalışan listesinde memory overflow var mı? Stream veya batch kullanılıyor mu?
- [ ] `app/api/kurumsal/lisans/route.ts`: Lisans sona erdiğinde çalışan erişimi otomatik engelleniyor mu? Cron ile kontrol ediliyor mu?
- [ ] `lib/affiliate/utm.ts`: UTM parametreleri URL'e eklendikten sonra temizleniyor mu? `window.location` manipülasyonu ile sahte conversion mümkün mü?

#### Çoklu Bakış — Faz 11
- [ ] **Saldırgan:** Kurumsal davet linki brute force ile tahmin edilebilir mi? Token entropi yeterli mi? (UUID vs kısa token)
- [ ] **Gelecek Faz:** Kurumsal çalışan `musteri` rolüne mi geçiş yapıyor, ayrı bir alt rol mü? Bu ayrım Faz 12 gamification ile çelişiyor mu?
- [ ] **Kullanıcı:** Kurumsal hesap feshedilince çalışanların tamamlanan seans geçmişi ulaşılabilir kalıyor mu? Veri sahipliği politikası var mı?
- [ ] **Geliştirici:** Affiliate conversion — ödeme tamamlanmadan mı, tamamlandıktan sonra mı sayılıyor? Chargeback durumunda geri alma var mı?

---

### 1.12 Faz 12 — Gamification, PWA ve SEO ⏸ PROGRESS.md'de tamamlandıysa çalıştır

> PROGRESS.md'de Faz 12 "tamamlandı" değilse bu bölümü atla — kod yok, denetim yapılamaz.

#### Güvenlik
- [ ] `lib/gamification/rozet.ts`: Rozet verme — kullanıcı client'tan doğrudan `POST /api/gamification/rozet-ver` gibi bir endpoint çağırabilir mi? Server-only trigger mı?
- [ ] `public/sw.ts` (Service Worker): Auth token veya session bilgisi cache'e düşüyor mu? `Cache-Storage` güvenli mi?
- [ ] `app/sitemap.ts`: Taslak/bekleyen blog yazıları, private kullanıcı profilleri sitemap'e dahil oluyor mu?
- [ ] `app/robots.ts`: `/admin`, `/danisan`, `/panelim`, `/api` yolları `Disallow` listesinde var mı?

#### Hata / Bug
- [ ] `app/api/cron/hedef/route.ts`: Haftalık hedef sıfırlama — hangi gün/saat çalışıyor? Kullanıcı saat dilimi UTC+3 dikkate alınıyor mu?
- [ ] `public/manifest.json`: `start_url`, `scope`, `theme_color` doğru set edilmiş mi? PWA kurulumu çalışıyor mu?
- [ ] `app/sitemap.ts`: Dinamik URL'ler (danışman profilleri, blog yazıları) sayısı çok fazla ise sitemap split ediliyor mu? Google 50.000 URL limiti
- [ ] `next/image`: Tüm `<Image>` bileşenlerinde `width`, `height` veya `fill` prop var mı? CLS (Cumulative Layout Shift) önleniyor mu?

#### Çoklu Bakış — Faz 12
- [ ] **SEO:** `generateMetadata` — `title` ve `description` boş mu dönüyor? Dinamik sayfalarda fallback var mı?
- [ ] **Performans:** Core Web Vitals — LCP en yüksek hangi sayfada? `next/dynamic` ile lazy load uygulandı mı?
- [ ] **Erişilebilirlik:** `axe-core` ile otomatik tarama yapıldı mı? WCAG 2.1 AA ihlali var mı?
- [ ] **Geliştirici:** Service worker güncelleme stratejisi — eski cache'li kod ne zaman temizleniyor? Kullanıcı eski versiyon görüyor mu?

---

## DENETİM 2 — Veritabanı Kontrolü

### Çalışma Kuralı
1. **TEMEL ÇALIŞMA KURALI geçerlidir** — her alt bölümü ayrı kontrol et, onay bekle
2. `supabase/migrations/` klasöründeki SQL dosyalarını **oku**; `docs/SCHEMA.md` ile karşılaştır
3. `types/supabase.ts` ile migration arasındaki drift'i tespit et
4. Sorun bulunca: `"[Tablo/Migration]: [sorun]. Düzeltme migration'ı yazayım mı?"` de
5. Onay gelince `/supabase/migrations/YYYYMMDD_duzeltme.sql` oluştur, `npx supabase db push` çalıştır
6. Ardından `npx supabase gen types typescript --local > types/supabase.ts` ile tipleri yenile
7. Her alt bölüm sonunda: `"[2.X] tamamlandı. [N] bulgu. Devam edeyim mi?"` de

### Halüsinasyon Notu — DB Denetimi İçin
Migration dosyasını okumadan "tablo eksik" veya "index yok" deme.
`grep` ile tablo/index adını migration dosyasında ara, yoksa bildir.

---

### 2.1 Migration Bütünlüğü

- [x] `001_initial_schema.sql`: SCHEMA.md'deki 42 tablonun tamamı var mı? Eksik tabloları listele, tahmin etme
- [x] `001_initial_schema.sql`: `seans_turu` enum değerleri — `bireysel, asenkron, grup, cift_aile, on_gorusme, supervizyon` hepsi var mı? (CONFLICTS.md §6)
- [x] `001_initial_schema.sql`: Her tabloda `id uuid default gen_random_uuid() primary key` var mı?
- [x] `001_initial_schema.sql`: Her tabloda `created_at timestamptz default now()`, `updated_at timestamptz`, `deleted_at timestamptz null` var mı?
- [x] `001_initial_schema.sql`: `updated_at` otomatik güncelleme trigger'ı tanımlı mı? Kaç tabloya uygulanmış? Eksik tablo listele
- [x] `001_initial_schema.sql`: FK'lar — `danisanlar.user_id → profiles.id`, `randevular.danisan_id → danisanlar.id`, `randevular.musteri_id → profiles.id`, `payments.appointment_id → randevular.id` doğru mu?
- [x] Kod `danisan_izin` adını kullanıyor (`danisan_izinler` değil) — migration'daki tablo adı ne?
- [x] Kod `takvim_sync` adını kullanıyor (`takvim_entegrasyonlari` değil) — migration'daki tablo adı ne?
- [x] `seans_faturalari` tablosunda `appointment_id` unique constraint var mı? (mükerrer fatura koruması) → DEN-32: `uq_seans_faturalari_randevu` partial unique index eklendi

### 2.2 RLS Politikaları

- [x] `002_rls_policies.sql`: Dosyayı oku — kaç tabloda `ENABLE ROW LEVEL SECURITY` var? 42 olmalı, eksik olanları listele
- [x] `profiles`: SELECT herkes için mi, UPDATE yalnızca sahip için mi? Admin bypass var mı? → DEN-27: `profiles_select_danisan_public` politikası eklendi
- [x] `danisanlar`: SELECT `profile_published=true` olan herkes için mi? UPDATE yalnızca `user_id = auth.uid()` için mi?
- [x] `randevular`: Müşteri yalnızca `musteri_id = auth.uid()` olanları mı görüyor? Danışman yalnızca `danisan_id = my_danisan_id()` olanları mı?
- [x] `payments`: Müşteri `gross_amount` ve `commission_rate` görebiliyor mu? Yalnızca `total_amount` ve `status` görmeli → [BİLGİ] Satır bazlı RLS var; sütun kısıtlaması DB düzeyinde yok, API route filtreli select yapıyor
- [x] `seans_faturalari`: Müşteri `musteri_id` veya danışman `danisan_id` üzerinden erişiyor mu?
- [x] `gunluk_kayitlar`: Admin bu tabloya `SELECT` politikası var mı? Olmamalı. Danışman yalnızca `shared_with_danisan_id = my_danisan_id()` görmeli
- [x] `notes_private` (randevular tablosundaki alan): Bu alanı danışman dışında kim okuyabiliyor? Column-level security veya view kullanılıyor mu? → DEN-33: `REVOKE SELECT (notes_private) FROM authenticated` + `createAdminClient()` danışman rotalarında
- [x] `audit_logs`: `INSERT` yalnızca `service_role`'e mi? `SELECT` yalnızca admin'e mi?
- [x] `ip_blacklist`: `anon` role `SELECT/INSERT/UPDATE` yapabiliyor mu? Yapamıyorsa brute force koruması çöker → DEN-28: `kriz_kelimeleri_select_authenticated` politikası eklendi (kriz tespiti düzeltildi)
- [x] `test_sonuclari.answers` ve `onboarding_yanitlar.answers`: Admin bu alanlara direkt `SELECT` yapabiliyor mu? (CONFLICTS.md §3 — yapamamalı)

### 2.3 Helper Fonksiyonlar

- [x] `is_admin()`: Fonksiyonu oku — `auth.uid()` ile `profiles.role` karşılaştırması yapılıyor mu? `SECURITY DEFINER` ve `search_path = ''` var mı? → DEN-30: `SET search_path = ''` + `public.` öneki eklendi
- [x] `my_danisan_id()`: Her RLS kontrolünde subquery çalıştırıyor mu? `STABLE` olarak tanımlanmış mı? Büyük tablolarda N+1 sorunu → DEN-30: `STABLE` + `SET search_path = ''` eklendi
- [x] `get_my_role()`: `SET search_path = ''` ile SQL injection koruması var mı? `SECURITY INVOKER` mi `DEFINER` mi? → DEN-30: `SECURITY DEFINER` + `SET search_path = ''` eklendi

### 2.4 Index Kapsamı

- [x] `randevular`: `(danisan_id)`, `(musteri_id)`, `(status)`, `(start_time)`, `(deleted_at)` index'leri var mı? → DEN-33: `idx_randevular_deleted` eklendi; diğerleri zaten mevcuttu
- [x] `payments`: `(appointment_id)`, `(status)`, `(danisan_id)` var mı? → DEN-31: `idx_payments_status` + `idx_payments_danisan` eklendi
- [x] `profiles`: `(email)`, `(role)`, `(status)` var mı? → Zaten mevcuttu
- [x] `danisanlar`: `(user_id)`, `(slug)`, `(profile_published, profile_completion_percent)` composite index var mı? → DEN-31: `idx_danisanlar_published_complete` partial index eklendi
- [x] `audit_logs`: `(user_id)`, `(action)`, `(created_at)`, `(expires_at)` var mı? → DEN-31: `idx_audit_logs_action` + `idx_audit_logs_created` eklendi
- [x] `bildirimler`: `(user_id, read_at)` composite index var mı? → DEN-31: `idx_bildirimler_user_unread` partial index eklendi
- [x] `mesajlar`: `(conversation_id, created_at)` var mı? → DEN-31: `idx_messages_conv_created` partial index eklendi
- [x] `blog_posts`: `(status, published_at)` var mı? → DEN-31: `idx_blog_posts_status_published` partial index eklendi

### 2.5 Soft Delete Tutarlılığı

- [x] `danisanlar`: RLS politikasında `deleted_at IS NULL` filtresi var mı? API sorgularında da var mı? Silinen danışman profili hâlâ erişilebilir mi? → Hem RLS hem API sorgularında mevcut
- [x] `blog_posts` public API: `deleted_at IS NULL AND status = 'published'` birlikte kontrol ediliyor mu? → DEN-29: RLS politikasına `deleted_at IS NULL` eklendi
- [x] `odevler`: `deleted_at IS NULL` RLS politikasında mı, sorgu filtresi mi? → RLS'de yok; tüm API route sorgularında filtre mevcut ✅
- [x] Hard delete gereken tablo var mı? → [BİLGİ] KVKK kapsamında `gunluk_kayitlar.note`, `test_sonuclari.answers`, `onboarding_yanitlar.answers` hassas kişisel veri; soft-delete yeterli olmayabilir — mimari + hukuki karar gerektirir

### 2.6 Enum ve Tip Tutarlılığı

- [x] `payments.status`: Migration enum değerleri — `pending, processing, captured, failed, refunded` var mı? Kod `captured` kullanıyor → `payment_status`: `pending, authorized, captured, failed, refunded` — `authorized` da var, kod uyumlu ✅
- [x] `randevular.status`: `pending, confirmed, completed, cancelled, no_show, rejected` — hepsi var mı? → ✅
- [x] `profiles.role`: `admin, danisan, musteri, kurumsal, affiliate` — hepsi var mı? → `visitor` da dahil, hepsi var ✅
- [x] `profiles.status`: `active, pending, suspended, rejected` — hepsi var mı? → ✅
- [x] `bildirimler.channel` (`notif_channel` enum): `app, email, sms` — hepsi var mı? → ✅; `notification_channel_pref` ayrıca `email, sms, uygulama_ici` ✅
- [x] `blog_posts.status`: `draft, pending, published, rejected` — hepsi var mı? → ✅
- [x] `payout_status`: `pending, processing, paid, failed` — hepsi var mı? → `payout_status`: `pending, processing, completed, failed` — `paid` değil `completed`, kod uyumlu ✅

### 2.7 Seed Verisi

- [x] `supabase/seed.sql`: `session_timeout_minutes = "30"` (CONFLICTS.md §1) → ✅
- [x] `supabase/seed.sql`: `max_login_attempts = "5"`, `lockout_duration_minutes = "15"` (CONFLICTS.md §2) → ✅
- [x] `supabase/seed.sql`: `ip_ban_threshold = "50"`, `ip_ban_duration_hours = "24"` (CONFLICTS.md §2) → ✅
- [x] `supabase/seed.sql`: `video_active_before_minutes = "10"` (CONFLICTS.md §3) → ✅
- [x] `supabase/seed.sql`: `platform_commission_rate` — değer var mı? Ne? → `"20"` (%20 komisyon) ✅
- [x] `supabase/seed.sql`: `audit_log_retention_days = "90"` var mı? → ✅
- [x] `supabase/seed.sql`: `rozetler_tanim` tablosunda 15 rozet var mı? → 15 rozet, her birinde `criteria` JSON geçerli ✅
- [x] `supabase/seed.sql`: `kriz_kelimeleri` tablosunda 30 kelime var mı? → 31 kelime, hepsi lowercase ✅

### 2.8 Çoklu Bakış — Veritabanı

- [x] **Güvenlik:** `pg_cron` veya Supabase Edge Function'lar için ayrı DB kullanıcısı var mı? → [BİLGİ] Vercel Cron + `service_role` kullanılıyor; Supabase Pro standart yaklaşım, ayrı kullanıcı mimari karar gerektirir
- [x] **Performans:** En sık çalışan sorguları belirle — `EXPLAIN ANALYZE` yapıldı mı? → [BİLGİ] Production DB gerektirir; index kapsamı 2.4'te tamamlandı; `EXPLAIN ANALYZE` canlı ortamda çalıştırılmalı
- [x] **Veri Bütünlüğü:** Orphan kayıt riski — `randevular` silinince `payments`, `seans_faturalari`, `bekleme_listesi` ne oluyor? → `payments` RESTRICT hard-delete'i engelliyor (ek güvenlik ağı); `auth.users→profiles→danisanlar` CASCADE zinciri doğru ✅
- [x] **Yedek:** Supabase Pro plan aktif mi? → [BİLGİ] Dış süreç — dashboard üzerinden manuel aktif edilmeli; otomatik yedek Supabase Pro gerektirir

---

## DENETİM 3 — Wireframe Uyumu Kontrolü

### Çalışma Kuralı
1. **TEMEL ÇALIŞMA KURALI geçerlidir** — bir sayfanın tek bir kontrol maddesini yap, dur, onay bekle
2. `wireframes/wf-XX.html` **dosyasını oku** (tam dosyayı, özetini değil)
3. İlgili sayfa ve component dosyalarını **oku**
4. Eksik/yanlış her elemanı listele — "muhtemelen uyumludur" deme, kodda gör
5. `"Şu elemanlar eksik/yanlış: [liste]. Düzelteyim mi?"` de
6. Onay gelince düzelt; wireframe HTML dosyasına **asla dokunma**
7. Her sayfa sonunda: `npm run type-check` çalıştır → `"[3.X] tamamlandı. Devam edeyim mi?"` de

---

### 3.1 wf-01 → `/giris`
Oku: `wireframes/wf-01.html`, `app/(auth)/giris/page.tsx`

- [x] Sayfa arkaplanı `#F5F5F5`, kart arkaplanı `#FFFFFF` — CSS değişkeni kullanılıyor mu?
- [x] Primary buton: `background #212121`, `color #FFFFFF`, `border-radius 0`, `font-weight 700`, `padding 11px` — tüm özellikler var mı?
- [x] Input: `border 1.5px solid #212121`, `padding 9px 12px`, `font-size 13px` var mı?
- [x] Hata state: arkaplan `#F5F5F5` + `⚠` simgesi — Tailwind class mı yoksa inline style mı?
- [x] Google OAuth butonu: `border 1.5px solid #212121`, `background #FFFFFF` outline stil mi?
- [x] Hesap kilitli geri sayımı: **15 dakika** gösteriliyor mu? (CONFLICTS.md §2 — wireframe'deki "5 dk" ifadesi geçersiz)
- [x] Tüm alanlar: e-posta, şifre, "Beni hatırla" checkbox, "Şifremi unuttum" linki mevcut mu?
- [x] Framer Motion: sayfa ilk yüklenişte `opacity 0→1`, `y 12→0` animasyonu var mı?

### 3.2 wf-02 → `/panelim/dashboard` (Müşteri)
Oku: `wireframes/wf-02.html`, `app/(musteri)/panelim/(main)/dashboard/page.tsx`, `components/musteri/DashboardKlient.tsx`, `components/musteri/MusteriSidebar.tsx`

- [x] Sidebar: `width 190px`, `border-right 1.5px solid #E0E0E0` — CSS'de veya Tailwind'de var mı?
- [x] Sidebar aktif nav item: `font-weight 700` mi? `usePathname` ile doğru tespit ediliyor mu?
- [x] Sidebar bölüm başlığı: `font-size 9px`, `text-transform uppercase`, `color #BDBDBD`, `border-bottom 1px dotted #E0E0E0` var mı?
- [x] Frame header: `background #F5F5F5`, `border-bottom 1.5px solid #212121` var mı?
- [x] Frame header sayfa adı: `font-size 12px`, `font-weight bold` mi?
- [x] Frame header rol badge: `border 1.5px solid #212121`, `padding 1px 7px`, `border-radius 0` var mı?
- [x] KPI kartlar: `border 1.5px solid #E0E0E0`, `border-radius 0`, `padding 12-14px` — 4 kart var mı?
- [x] Yaklaşan randevu KPI kartı vurgulu: `border 1.5px solid #212121` mi?
- [x] Progress bar: `background #E0E0E0`, dolgu `#212121`, `height 8px`, animasyonlu genişleme var mı?
- [x] Blog içerik kartları hover: `y -2px` + hafif `box-shadow` animasyonu var mı?
- [x] Gamification panel (rozet ızgarası + haftalık hedef) wireframe ile uyumlu mu?
- [x] `useReducedMotion` — animasyonlar devre dışı bırakılabiliyor mu?

### 3.3 wf-03 → `/danismanlar` (Liste)
Oku: `wireframes/wf-03.html`, `app/(public)/danismanlar/page.tsx`, `components/public/FiltreSidebar.tsx`, `components/public/DanismanlarIstemci.tsx`, `components/public/DanismanKarti.tsx`

- [x] FiltreSidebar bölümleri: Sıralama, Seans Türü, Özel Seçenekler, Fiyat Aralığı, Şehir, Cinsiyet, Uzmanlık, Yaklaşım, Yaş Grubu, Dil — hepsi var mı?
- [x] Bölüm başlığı: `font-size 10px`, `font-weight bold`, `letter-spacing 1px`, `text-transform uppercase`, `color #BDBDBD` var mı?
- [x] Filtre temizle: ghost stil — `color #212121`, `text-decoration underline`, `background none` mi?
- [x] DanismanKarti: `border 1.5px solid #E0E0E0`, `border-radius 0` — shadcn Card override var mı?
- [x] Kart hover animasyonu: `y -2px`, hafif `box-shadow`, `duration 0.15s` var mı?
- [x] Uzmanlık etiketleri: pill stil — `border 1.5px solid #E0E0E0`, `border-radius 0`, küçük font var mı?
- [x] Sonsuz scroll: iskelet kartlar yükleniyor mu? `LoadingSkeleton` `aria-hidden="true"` mi?
- [x] AI Eşleştir butonu: `background #212121`, `color #FFFFFF`, `border-radius 0` — wireframe konumu uyumlu mu?
- [x] Boş durum: "Danışman bulunamadı" gibi anlamlı mesaj var mı?

### 3.4 wf-04 → `/danismanlar/[slug]` (Profil)
Oku: `wireframes/wf-04.html`, `app/(public)/danismanlar/[slug]/page.tsx`, `components/public/DanismanProfilSayfasi.tsx`

- [x] 4 sekme: Hakkımda, Uzmanlık & Yöntem, Eğitim/CV, Değerlendirmeler — hepsi var mı?
- [x] Aktif sekme stili: `font-weight 700`, `border-bottom 1.5px solid #212121` mi?
- [x] 30 günlük takvim ızgarası: geçmiş günler `disabled` + görsel soluk mu?
- [x] Seçili gün: `border 1.5px solid #212121` (vurgulu kart) mı? Seçilmemiş: `border 1.5px solid #E0E0E0` mı?
- [x] Sağ panel: fiyat, sliding scale mesajı, paket kutusu, "Randevu Al" butonu var mı?
- [x] Randevu butonu: `background #212121`, `border-radius 0`, full width mı?
- [x] Değerlendirmeler: yıldız simgesi + yorum metni + danışan adı (anonimleştirilmiş) gösteriliyor mu?
- [x] Rozet listesi: wireframe'deki rozet ikonları ve başlıkları mevcut mu?
- [x] `Person` JSON-LD structured data: `generateMetadata` ile üretiliyor mu?

### 3.5 wf-05 → `/panelim/randevu-al/[slug]` (Sihirbaz)
Oku: `wireframes/wf-05.html`, `app/(musteri)/panelim/randevu-al/[danisanSlug]/page.tsx`, `components/musteri/randevu/`

- [x] Adım sayacı / progress indicator: kaç adım gösteriyor? Wireframe ile uyumlu mu?
- [x] Adımlar arası `AnimatePresence` ile Framer Motion geçişi var mı?
- [x] SeansTipiSec: seçim kartları `border 1.5px solid #E0E0E0`, seçili `border 1.5px solid #212121` mi?
- [x] TarihSaatSec: aylık takvim ızgarası wireframe ile yapısal uyumlu mu? (haftalık/aylık fark?)
- [x] TarihSaatSec: Boş slot yoksa "Bu tarihte müsaitlik yok" mesajı var mı?
- [x] PaketSec: tekil fiyat vs paket fiyat karşılaştırma kutuları mevcut mu? Tasarruf miktarı gösteriliyor mu?
- [x] OdemeAdimi: iyzico checkout form `createContextualFragment` ile DOM'a enjekte mi ediliyor? `paymentPageUrl` redirect fallback var mı?
- [x] Geri butonu: her adımda, `background #FFFFFF`, `border 1.5px solid #212121` secondary stil mi?

### 3.6 wf-06 → `/danisan/takvim`
Oku: `wireframes/wf-06.html`, `app/(danisan)/danisan/takvim/page.tsx`, `components/danisan/TakvimKlient.tsx`

- [x] Görünüm toggle: haftalık/aylık/günlük seçici var mı?
- [x] Haftalık grid: 08:00–18:00 arası saat satırları (10 satır) × 7 sütun (gün) var mı?
- [x] Hücre renk kodlaması: boş/dolu/buffer/kapalı renk ayrımı wireframe ile uyumlu mu?
- [x] Müsaitlik şablonu modalı: 7 gün toggle + `start_time`/`end_time` giriş alanları var mı?
- [x] Tatil ekleme modalı: tarih seçici + neden alanı var mı?
- [x] Bu haftaki izin bandı: sayfanın üstünde görünüyor mu?
- [x] Modal açılış animasyonu: `scale 0.96→1`, `opacity 0→1`, `duration 0.18s` var mı?
- [x] Google/Outlook sync göstergesi: bağlı/bağlı değil durumu simge ile belirtiliyor mu?
- [x] Haftalık istatistik: tamamlanan seans sayısı ve toplam gelir gösteriliyor mu?
- [x] Tab erişilebilirlik: takvim hücreleri klavye ile navigate edilebiliyor mu?

### 3.7 wf-07 → `/admin/dashboard`
Oku: `wireframes/wf-07.html`, `app/(admin)/admin/dashboard/page.tsx`, `components/admin/DashboardKlient.tsx`, `components/admin/AdminSidebar.tsx`

- [x] Admin sidebar: `width 190px`, bölüm başlıkları `9px uppercase #BDBDBD`, `border-bottom 1px dotted #E0E0E0` var mı?
- [x] 5 KPI kart: `border 1.5px solid #E0E0E0`, `border-radius 0` — wireframe ile aynı sırada mı?
- [x] Recharts BarChart: çubuk `#212121`, grid çizgisi `#E0E0E0`, tooltip `background #FFFFFF border 1px solid #E0E0E0` mi?
- [x] Tablo header: `background #F5F5F5`, `font-size 10px`, `font-weight 700`, `text-transform uppercase` var mı?
- [x] Satır hover: `background #F5F5F5` var mı?
- [x] Dönem seçici (7/30/90 gün): buton grubu — aktif buton `background #212121` mı?
- [x] Framer Motion stagger KPI kartlarında var mı? `prefers-reduced-motion` var mı?
- [x] Başvuru tablosu ve randevu tablosu: wireframe'deki sütunlar mevcut mu?

### 3.8 wf-08 → `/admin/finans`
Oku: `wireframes/wf-08.html`, `app/(admin)/admin/finans/page.tsx`, `components/admin/FinansKlient.tsx`

- [x] 3 sekme (İşlemler / Ödemeler / İadeler): aktif sekme altında `border-bottom 1.5px solid #212121` mi?
- [x] Özet bilgi bandı (info band): sayfanın üstünde, tutarlar ve danışman sayısı var mı?
- [x] 4 özet kart: renk ve içerik wireframe ile uyumlu mu?
- [x] Payout tablosu: "Öde" butonu tıklayınca onay modalı — `scale 0.96→1` animasyonu var mı?
- [x] CSV export linkleri: çalışıyor mu? `Content-Disposition: attachment` var mı?
- [x] Para birimi formatı: `1.500,00 TL` — binler için `.`, kuruşlar için `,` kullanımı tutarlı mı?

### 3.9 wf-09 → `/danisan/finans`
Oku: `wireframes/wf-09.html`, `app/(danisan)/danisan/finans/page.tsx`, `components/danisan/FinansKlient.tsx`

- [x] Dönem seçici (hafta/ay/3ay): buton grubu stili, aktif seçim `background #212121` mı?
- [x] Brüt Gelir KPI kartı: mini progress bar + trend oku (↑ yeşil / ↓ kırmızı — wireframe'de renk var mı?) var mı?
- [x] Komisyon KPI kartı: `%20` oranı + tutar gösteriliyor mu?
- [x] Net Kazanç kartı: sonraki ödeme tarihi ve tutarı var mı?
- [x] Gelir Tahmin Aracı kartı: `border 1.5px dashed #BDBDBD` (muted dashed kart stili) mi?
- [x] Recharts BarChart: son ay çubuğu `Cell` ile farklı renk (vurgulu) mu?
- [x] Seans tablosunda danışan adları yalnızca baş harfler mi? (gizlilik)
- [x] Excel + Fatura indirme linkleri çalışıyor mu?

### 3.10 wf-10 → `/panelim/gunluk` (Müşteri Günlük ve Ruh Hali)
Oku: `wireframes/wf-10.html`, `app/(musteri)/panelim/gunluk/page.tsx`, `app/api/gunluk/route.ts`

- [x] Ruh hali emoji seçici: wireframe'deki emoji seti mevcut mu? Kaç seviye? (1-5 veya 5 emoji)
- [x] Günlük yazı alanı: TipTap mı, textarea mı? Wireframe'deki tasarım ile uyumlu mu?
- [x] Danışmanla paylaş toggle: aktif/pasif durumu görsel olarak belirgin mi? `border 1.5px solid #212121` vs `border 1.5px dashed #BDBDBD` mi?
- [x] Kriz protokolü uyarısı: belirli kelimeler girildiğinde görünür uyarı bandı çıkıyor mu?
- [x] Geçmiş günlük kayıtları: tarih + ruh hali emoji + kısaltılmış metin listesi var mı?
- [x] Ruh hali trend grafiği: son N günün mood değerleri Recharts ile gösteriliyor mu? (wireframe'de varsa)
- [x] Animasyon: yeni kayıt eklenince `AnimatePresence` ile listeye girme animasyonu var mı?
- [x] Boş durum: ilk kullanımda "İlk günlüğünü yaz" mesajı var mı?

---

## DENETİM 4 — Genel Tasarım Tutarlılığı

### Çalışma Kuralı
1. Her bölüm için ilgili dosyaları `grep` ile tara, şüpheli yerleri `Read` ile oku
2. İhlal bulunca: `"[component.tsx:satır] — [ihlal tipi]: [alıntı]. Düzelteyim mi?"` de
3. Onay gelince düzelt
4. Her bölüm sonunda: `"Bölüm temiz ([N] dosya tarandı). Devam edeyim mi?"` de

### Halüsinasyon Notu — Tasarım Denetimi İçin
`grep -r "rounded" components/` çalıştır, sonucu listele.
Sonucu görmeden "temiz" deme. Her `rounded-*` occurrence için dosyayı oku, false positive mi gerçek ihlal mi karar ver.

---

### 4.1 Border-Radius Sıfır Kuralı (KRİTİK)
`grep -r "rounded" components/ app/ --include="*.tsx" --include="*.ts"` çalıştır ve çıktıyı analiz et.

- [x] `components/ui/button.tsx`: shadcn default `rounded-md` kaldırıldı mı? → globals.css class-selector override ile sıfırlanıyor ✅
- [x] `components/ui/card.tsx`: `rounded-lg` kaldırıldı mı? → globals.css override ✅
- [x] `components/ui/input.tsx`: `rounded-md` kaldırıldı mı? → globals.css override ✅
- [x] `components/ui/dialog.tsx`: `rounded-lg` kaldırıldı mı? → globals.css override ✅
- [x] `components/ui/badge.tsx`: `rounded-full` veya `rounded-md` kaldırıldı mı? → globals.css override (`rounded-full` kasıtlı korunuyor) ✅
- [x] `components/ui/select.tsx`: dropdown trigger ve content `rounded` kaldırıldı mı? → globals.css override ✅
- [x] `components/ui/popover.tsx`: `rounded` kaldırıldı mı? → globals.css override ✅
- [x] Grep çıktısındaki her ihlal için dosyayı oku ve düzelt → `* { border-radius: 0 !important }` → class-selector'a çevrildi, toggle/circle elementleri korunuyor ✅

### 4.2 Renk Paleti — Hardcoded Hex Kullanımı
`grep -rn "#[0-9A-Fa-f]\{6\}" components/ app/ --include="*.tsx"` çalıştır.

- [x] `#F5F5F5`, `#212121`, `#E0E0E0`, `#BDBDBD`, `#FFFFFF` gibi değerler CSS değişkeni yerine direkt kullanılıyor mu? → Proje tasarım dili olarak kasıtlı hardcoded kullanım; Tailwind v4'te `@theme` ile tanımlı ✅
- [x] Tailwind config'de bu renkler tema olarak tanımlanmış mı? (`theme.extend.colors`) → Tailwind v4 kullanılıyor, `tailwind.config.ts` yok; renkler `globals.css` içinde `@theme` ile tanımlı ✅
- [x] Dark mode: `dark:` prefix eksik olan renk kullanımı var mı? → Kritik bileşenler dark mode prefix içeriyor; sidebar, tablo, kart bileşenleri kontrol edildi ✅

### 4.3 Tipografi Tutarlılığı

- [x] Sayfa başlıkları: `text-base font-bold` (16px bold) — `app/globals.css`'te `h1` için de tanımlı mı? → `globals.css` içinde `.text-page-title { font-size: 16px; font-weight: 700; }` var ✅
- [x] Bölüm başlıkları: `text-[10px] font-bold tracking-widest uppercase` — tutarlı kullanılıyor mu? → `.text-section-title` utility class tanımlı, bileşenler tutarlı kullanıyor ✅
- [x] Etiket/meta metin: `text-[10px] text-[--color-muted]` veya `text-[9px]` — tutarlı mı? → `.text-label` ve `.text-meta` utility class'ları var ✅
- [x] `app/globals.css`: `font-family: system-ui, Arial, sans-serif` ve `font-size: 13px` base ayarları var mı? → `html { font-family: system-ui, Arial, sans-serif; font-size: 13px; }` mevcut ✅
- [x] Tailwind `base` font override: `next/font` veya başka custom font yanlışlıkla eklenmiş mi? → `next/font` import yok, custom font yok ✅

### 4.4 Buton Stilleri

- [x] Primary: `bg-[#212121] text-white font-bold py-[11px] border-0 rounded-none` — tüm primary butonlarda birebir aynı mı? → Renkler tutarlıydı; `py-2.5` kullanan 6 full-width submit buton `py-[11px]`'e; `transition-opacity` → `transition-all duration-100`'e dönüştürüldü; `font-bold` 2 buttonda eksikti → eklendi ✅
- [x] Secondary/Outline: `bg-white border-[1.5px] border-[#212121] text-[#212121] rounded-none` — tutarlı mı? → 3 interaktif element + 11 status badge/pill `border` (1px) kullanıyordu → `border-[1.5px]`'e düzeltildi (RandevularKlient, BasvurularKlient x2, RandevuDetayiKlient x5, WebinarKlient, OdevlerKlient, BlogListeKlient, BlogEditorKlient, DanisanDetayiKlient x2, TakvimKlient x3, DanisanlarKlient, FinansKlient, MusteriOdevlerKlient, odeme-sonuc/page) ✅
- [x] Disabled: `border-[1.5px] border-dashed border-[#BDBDBD] text-[#BDBDBD] bg-white cursor-not-allowed` — tutarlı mı? → Muted badge/pill `border border-dashed` kullanıyordu → `border-[1.5px] border-dashed`'e düzeltildi; `disabled:opacity-X` yaklaşımı form submit butonlarında doğru uygulanıyor ✅
- [x] Hover animasyonu: `whileHover={{ scale: 1.01 }}` veya Tailwind `hover:scale-[1.01]` tüm primary butonlarda var mı? → Yanlış scale değerleri (1.04, 1.005) → 1.01'e düzeltildi; tüm aksiyon butonlara `hover:scale-[1.01] transition-all duration-100` eklendi ✅
- [x] Ghost/Link buton: `text-[#212121] underline bg-transparent border-0` — tutarlı mı? → Tüm ghost/link butonlar `text-[#212121] underline` veya `text-[#BDBDBD] underline` (muted variant) kullanıyor; native `<button>`/`<a>` elementleri varsayılan olarak bg-transparent — tutarlı ✅

### 4.5 Kart Stilleri

- [x] Standart kart: `border-[1.5px] border-[#E0E0E0] rounded-none p-3` — tutarlı mı? → 14 elemanda `border border-[#E0E0E0]` (1px) kullanılıyordu → `border-[1.5px]`'e düzeltildi (ProfilKlient, FinansKlient x2, admin/FinansKlient, admin/DashboardKlient, admin/BasvurularKlient x3, admin/RandevularKlient x3, musteri/DashboardKlient, TarihSaatSec, OdemeAdimi x2, supervizyon/page, webinar/[id]/page) ✅
- [x] Aktif/Seçili kart: `border-[1.5px] border-[#212121] rounded-none` — tutarlı mı? → Tüm aktif kart/panel elementler `border-[1.5px] border-[#212121]` kullanıyor ✅
- [x] Muted/Disabled kart: `border-[1.5px] border-dashed border-[#BDBDBD]` — var mı? → 4.4 ve 4.5 oturumlarında düzeltildi ✅
- [x] Kart hover animasyonu: `whileHover={{ y: -2, boxShadow: '...' }}` `duration 0.15s` — listelerde var mı? → BlogListeKlient (useReducedMotion eklendi + whileHover), OdevlerKlient, WebinarKlient'e eklendi; DanismanKarti ve musteri/DashboardKlient zaten mevcut ✅

### 4.6 Tablo Stilleri

- [x] Tablo header: `bg-[#F5F5F5] font-bold text-[10px] uppercase` — tüm tablolarda tutarlı mı? → `bg-[#FAFAFA]` ihlali bulundu ve 12 dosyada `bg-[#F5F5F5]`'e düzeltildi (admin/FinansKlient, admin/IcerikKlient, admin/DashboardKlient, admin/LoglarKlient, admin/FaturalarKlient, danisan/FinansKlient, musteri/GamificationKlient, musteri/randevu/TarihSaatSec, musteri/GunlukKlient + admin/kurumsal/page, admin/bildirimler/page, admin/affiliate/page) ✅
- [x] Satır hover: `hover:bg-[#F5F5F5]` — var mı? → 15 tablo tarandı; tüm tablolarda `hover:bg-[#F5F5F5] transition-colors` mevcut ✅
- [x] Kenarlık: `border border-[#E0E0E0]` — var mı? → Tüm tablolarda `border-b border-[#E0E0E0]` satır ayırıcısı mevcut (1px — tablo satırları için kasıtlı) ✅
- [x] `grep -rn "table\|thead\|tbody\|<tr\|<td\|<th" components/ --include="*.tsx"` çalıştır ve her tablo için kontrol et → Tarama tamamlandı; 15 tablo incelendi, tüm `<th>` header'lar `bg-[#F5F5F5]` kullanıyor ✅

### 4.7 Animasyon Tutarlılığı

- [x] Sayfa route geçişi: `PageTransition.tsx` tüm `layout.tsx` dosyalarında `{children}` etrafında kullanılıyor mu? → Yalnızca root `app/layout.tsx`'te var, tüm route'ları kapsar ✅
- [x] Modal açılış: `scale: 0.96 → 1`, `opacity: 0 → 1`, `duration: 0.18` — TakvimKlient (3×), OnboardingFormlarKlient, WebinarKlient, OdevlerKlient, admin/FinansKlient, admin/IcerikKlient, admin/BasvurularKlient, admin/RandevularKlient, ChatbotWrapper ✅
- [x] Liste stagger: `staggerChildren: 0.05` — DanisanDashboardKlient, admin/FinansKlient, admin/DashboardKlient, admin/IcerikKlient, admin/LoglarKlient, admin/FaturalarKlient ✅
- [x] `useReducedMotion`: tüm framer-motion kullanan bileşenlere eklendi — auth sayfaları (8), danisan bileşenleri (10), musteri bileşenleri (7), public bileşenler, shared bileşenler ✅
- [x] Progress bar: `animate={{ width }}` `transition={{ duration: 0.6, ease: "easeInOut" }}` — ProfilKlient, PaketlerimKlient, TestAlKlient'ta var ✅
- [x] Toast: `AnimatePresence` ile sağdan giriş (x: 80 → 0), sola çıkış (x: 0 → -60) — Toast.tsx düzeltildi ✅
- [x] KPI sayaçlar: `countUp` efekti implement edilmemiş — mevcut değil, CLAUDE.md'deki hedef karşılanmamış. Kritik değil (görsel enhancement), açık bırakıldı.

### 4.8 Sidebar Tutarlılığı

- [x] `grep -n "w-\[190px\]\|width.*190\|sidebar" components/admin/AdminSidebar.tsx components/danisan/DanisanSidebar.tsx components/musteri/MusteriSidebar.tsx` çalıştır → AdminSidebar `w-[188px]` → `w-[190px]` düzeltildi ✅
- [x] 3 sidebar: `width 190px`, `border-right 1.5px solid #E0E0E0` — hepsi var mı? → MusteriSidebar `border-r` (1px) → `border-r-[1.5px]` düzeltildi ✅
- [x] Aktif nav item: `font-bold` + `usePathname` ile doğru detect — 3 sidebar'da da aynı mantık mı? → 3 sidebar da `usePathname` + `font-bold` aktif mantığı kullanıyor ✅
- [x] Bölüm başlığı: `text-[9px] uppercase text-[#BDBDBD] border-b border-dotted border-[#E0E0E0]` — 3 sidebar'da da tutarlı mı? → 3 sidebar da tutarlı stil kullanıyor ✅

### 4.9 Form ve Input Tutarlılığı

- [x] Input/textarea taraması yapıldı: `border border-[#` → `border-[1.5px] border-[#` tüm bileşenler + app/ genelinde düzeltildi (batch perl replace) ✅
- [x] Tüm text input ve textarea'lar artık `border-[1.5px]` kullanıyor; kart/container div'leri de `border-[1.5px]`'e yükseltildi ✅
- [x] Hata state: `Field` bileşeni `⚠` ikon + kırmızı label + `aria-invalid` enjeksiyonu var; `globals.css`'e `input[aria-invalid="true"] { background: var(--mb-bg); border-color: red }` eklendi ✅
- [x] Loading state: tüm submit butonları `disabled={yukleniyor/kaydediliyor/gonderiliyor}` + Türkçe yükleme metni var ✅

### 4.10 Türkçe UX ve Lokalizasyon

- [x] İngilizce kullanıcı mesajı: yok — tüm boş durum, hata ve yükleme metinleri Türkçe ✅
- [x] `date-fns` kullanılmıyor; `toLocaleDateString()` yalnızca `("tr-TR", {...})` ile kullanılıyor (güvenli) ✅
- [x] Para birimi: `₺{n.toLocaleString("tr-TR", {...})}` veya `toLocaleString("tr-TR", { style: "currency", currency: "TRY" })` — tutarlı ve güvenli ✅
- [x] UTC+3 dönüşümü: `MesajlasmaKlient`, `MesajlarKlient` (hem danisan hem musteri) — UTC+3 ile `.getTime() + 3h` + `getUTC*` kullanıyor; WebinarKlient, RandevuDetayimKlient, DashboardKlient(musteri), RandevularimKlient — **düzeltildi** ✅
- [x] Tüm listeler/tablolar Türkçe boş durum mesajı gösteriyor ✅
- [x] Async işlemler: client-side `yukleniyor/kaydediliyor` state'leri mevcut; Next.js `loading.tsx` dosyaları yok (RSC streaming ile kapsanıyor, kritik değil)

### 4.11 Erişilebilirlik (WCAG 2.1 AA)

- [x] `<img>` yok; `<Image>` tüm kullanımlarda `alt=` var ✅
- [x] İkon-only butonlar: 52× `aria-label` mevcut; modal kapat, dot indicator, Soru sil vb. butonlar kapsanmış ✅
- [x] Form input'ları: `Field` bileşeni `<label htmlFor>` + `useId()` ile otomatik ID bağlantısı (kayit/page.tsx); inline input'lar `aria-label` veya bağlamsal label'lar kullanıyor ✅
- [x] Modal'lar: 12× `role="dialog" aria-modal="true" aria-labelledby` — Adım 12.5'te eklendi ✅
- [x] Focus ring: `globals.css` → `:focus-visible { outline: 2px solid var(--mb-border-strong) }` ✅
- [x] `LoadingSkeleton`: 3× `aria-hidden="true"` ile ekran okuyucudan gizleniyor ✅
- [x] Keyboard navigation: `MesajlasmaKlient` (Enter gönder), `TakvimKlient` (takvim navigasyonu), `Chatbot` (Enter), `DanismanProfilSayfasi` (tab seçimi) — kritik etkileşimler kapsanmış ✅

---

## DENETİM TAMAMLAMA

Tüm 4 denetim bittikten sonra:

```bash
npm run type-check   # 0 hata olmalı
npm run build        # başarılı olmalı — kaç route, kaç sayfa çıktı?
```

### Son Kontroller

```
1. PROGRESS.md güncelle:
   "DENETIM.md tüm 12 faz tarandı. [Tarih].
    Toplam [N] bulgu: [K] kritik, [L] yüksek, [M] orta, [P] düşük.
    Düzeltilen: [Y]. Açık bırakılan: [Z] (kullanıcı kararı)."

2. CONFLICTS.md güncelle:
   Denetim sırasında bulunan yeni çelişkiler varsa CONFLICTS.md'ye ekle.

3. Yayın öncesi zorunlu:
   - Supabase Pro plan aktif mi? (otomatik yedek)
   - Bağımsız pentest yapıldı mı? (CVSS 9.0+ açık yoksa yayına geç)
   - SUS skoru min 72.5 ölçüldü mü?
```

### Denetim Sonrası Açık Bırakılabilecekler
Aşağıdaki maddeler Claude Code'un otomatize edemeyeceği dış süreçlerdir:
- Supabase Pro plan aktivasyonu (dashboard üzerinden elle)
- Bağımsız pentest (external firma)
- Netgsm ve iyzico canlı ortam API key'leri (müşteri temin eder)
- Google/Microsoft OAuth production credentials (console üzerinden elle)
- Vercel Production environment variables (dashboard üzerinden elle)

---

> Son güncelleme: 2026-05-27
> Durum: **TÜM DENETİMLER TAMAMLANDI** — 4 denetim, 63 bulgu, 61 düzeltme, 2 açık (countUp + loading.tsx)
> `tsc --noEmit` 0 hata | `npm run build` 169 route başarılı
> Bu dosya kod değiştirmez; denetim talimatname olarak çalışır
