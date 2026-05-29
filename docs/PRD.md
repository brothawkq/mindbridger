# PRD.md — Ürün Gereksinimleri Dokümanı

> Bu bir DOKÜMAN dosyasıdır. Kod yazma, sadece oku ve uygula.
> Kaynak: docs/ klasörü. Kod klasörleri: app/, components/, lib/

---

## Platform Adı ve Amacı

**MindBridger** — Türkiye'de psikolog ve PDR danışmanlarını bireysel ve kurumsal müşterilerle buluşturan, randevu + ödeme + görüntülü görüşme + içerik yönetimini tek çatıda sunan online terapi marketplace. Platform %20 komisyon alır (admin panelinden ayarlanabilir), danışmanlar kendi fiyatlarını belirler.

## Başarı Kriterleri

- Ziyaretçi → randevu tamamlama: 3 dakikanın altında
- No-show oranı: %20 altında (çok katmanlı bildirim ile)
- Danışman paneli: tüm işlemler max 2 tıkla
- Lighthouse SEO: tüm sayfalar 90+
- Mobil: tüm sayfalar sorunsuz
- SUS (Sistem Kullanılabilirlik Ölçeği) skoru: minimum 72.5 (yayın öncesi test zorunlu)
- Eşzamanlı kullanıcı kapasitesi: 200 aktif oturum

---

## Kullanıcı Rolleri

| Rol | Açıklama |
|---|---|
| `visitor` | Giriş yapmamış ziyaretçi |
| `musteri` | Kayıtlı danışan |
| `danisan` | Onaylı psikolog / PDR danışmanı |
| `kurumsal` | Şirket İK yöneticisi |
| `affiliate` | Referans programı üyesi |
| `admin` | Platform yöneticisi |

---

## FAZ 1 — Altyapı ve Auth

### Hedef
Proje iskeleti, veritabanı ve kimlik doğrulama.

### Yapılacaklar
- Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui
- Supabase bağlantısı (browser + server + middleware)
- `middleware.ts`: rol bazlı route koruması
- Tüm tabloları `SCHEMA.md`'den migration olarak oluştur
- RLS politikaları her tabloda — hassas veri alanları için ayrı RLS politikası
- Seed: `platform_ayarlari` (SCHEMA.md'deki tüm seed kayıtları dahil), `rozet_tanim`, `kriz_kelimeleri`
- Supabase type üret: `types/supabase.ts`
- `ip_blacklist` tablosu için otomatik temizlik fonksiyonu (süresi geçmiş ban'ları sil)

### Auth Sayfaları
- `/giris` — email+şifre, Google OAuth; 5 başarısız giriş → 15 dk kilit + kalan süre gösterimi; 50 başarısız → 24 saat IP ban
- `/kayit` — müşteri formu (ad, soyad, email, şifre, telefon, KVKK onayı + timestamp + IP log)
- `/danisan-kayit` — 4 adımlı wizard:
  - Adım 1: Kişisel bilgiler + kabul ettiği yaş grupları (çocuk/ergen/yetişkin/yaşlı)
  - Adım 2: Uzmanlık + çalışma yöntemi
  - Adım 3: Belge yükleme (Supabase Storage, max 10 MB)
  - Adım 4: Banka bilgileri (AES-256 şifreli saklanır, loga yazılmaz)
- `/kurumsal-kayit` — şirket bilgileri + paket seçimi + varsayılan çalışan bütçesi
- `/sifremi-unuttum` + `/sifremi-sifirla/[token]`
- `/e-posta-dogrulama/[token]`
- Onay bekleyenlere "beklemede" ekranı
- Kritik hesap işlemlerinde (şifre değiştir, e-posta değiştir) ek doğrulama: mevcut şifre veya e-posta OTP

### Everboarding
Kayıt onaylandıktan sonra ilk 30 gün boyunca kullanıcıya kademeli görev bildirimleri gönderilir.

**Müşteri everboarding adımları:** Profilini tamamla → İlk testi doldur → Danışman keşfet → İlk randevunu al → Ruh hali girişi yap

**Danışman everboarding adımları:** Profili %100 tamamla → İlk müsaitlik şablonunu oluştur → Ön görüşmeyi aktif et → İlk blog yazısını gönder

Her adım tamamlanınca bildirim zinciri durur; tamamlanmayan adımlar için 3, 7, 14. günlerde hatırlatma maili gider.
Admin panelinden everboarding adım içerikleri düzenlenebilir (`platform_ayarlari` üzerinden).

### Ortak Bileşenler
- Header (sabit, giriş/kayıt, dark mode toggle)
- Footer
- Toast sistemi
- Chatbot kapsayıcı (sağ alt, Faz 2'de doldurulur)
- Loading skeleton
- Error boundary

---

## FAZ 2 — Danışman Profilleri ve Keşif

### `/danismanlar` (SSR + client filtre)
Filtreler: uzmanlık (çoklu), fiyat aralığı, dil, cinsiyet, yaş grubu, seans türü, müsaitlik, sliding scale, puan. Filtre state URL'de persist (searchParams). Sonsuz scroll. SSR + ISR (60 sn).

Danışman kartı: fotoğraf, isim, uzmanlık etiketleri (3), puan, fiyat, müsaitlik, sliding scale rozeti, "Profil İncele" butonu.

"AI ile Eşleştir" butonu → chatbot akışı.

### `/danismanlar/[slug]` (SSR, SEO)
Biyografi, uzmanlık, çalışma yöntemi, kabul edilen yaş grupları, eğitim/CV bölümleri. 30 günlük takvim (müsait/dolu). Yorumlar + puan ortalaması + danışman yanıtları. Rozetler. Paket seçenekleri. Sliding scale bilgisi.

Butonlar: "Ön Görüşme Talep Et" (ücretsiz, 15dk), "Randevu Al", "Bekleme Listesine Gir" (takvim doluysa).

Dynamic `generateMetadata`. Structured data (Person schema).

> Not: `profile_completion_percent = 100` olmayan danışman profili `profile_published = false` kalır ve listede görünmez.

### `/[sehir]-psikolog` (SSG)
İstanbul, Ankara, İzmir, Bursa, Antalya başlangıç. `generateStaticParams`. O şehirdeki online danışmanlar.

### AI Eşleştirme Chatbotu
Sağ alt sabit. 6 soruluk akış. Anthropic API (claude-sonnet-4-6). Sonuçta 3 danışman önerisi.

---

## FAZ 3 — Randevu Sistemi

### Takvim Altyapısı
- Danışman haftalık müsaitlik şablonu
- Özel gün / tatil / izin sistemi
- Google Calendar OAuth + Outlook OAuth senkronizasyonu
- Çakışma kontrolü server-side
- Buffer süresi hesabı
- Tekrarlayan randevu (her Pazartesi 14:00, max 12 hafta ileriye)

### Randevu Alma Akışı `/panelim/randevu-al/[danisanSlug]`
1. Seans türü seç: görüntülü / asenkron / grup / çift-aile / ön görüşme / süpervizyon
2. Tarih + saat seç (takvim)
3. Tekil mi paket mi seç
4. Ödeme (Faz 4'te)
5. `status: pending` oluşturulur
6. Danışmana bildirim

### Danışman Yanıt Akışı
Onayla / Reddet (gerekçe) / Alternatif öner. Onaylanınca müşteriye bildirim.

### İptal Politikası (admin panelinden ayarlanabilir)
- 24 saat öncesi: %100 iade
- 2-24 saat arası: %50 iade
- 2 saatten az: iade yok

### Bekleme Listesi
Listeye gir. İptal olunca sıradakine bildirim + 30 dk kabul süresi.

### No-Show Koruması
Randevu oluştururken kart pre-authorization. Danışman no-show işaretlerse politikaya göre ücret kesilir.

### Grup Seans Akışı
Danışman grup seansı oluşturur: konu, kapasite (max katılımcı), tarih, fiyat, minimum katılımcı sayısı.
Müşteriler profil veya liste sayfasından kayıt olur, ödeme pre-authorization ile alınır.
Seans tarihinden 24 saat önce minimum katılımcıya ulaşılmadıysa seans iptal edilir, tüm katılımcılara tam iade yapılır.
Minimum karşılandıysa ödeme capture edilir, Daily.co çok katılımcılı oda oluşturulur.

---

## FAZ 4 — Ödeme Entegrasyonu + PDF Fatura

- iyzico SDK sadece server-side; kart verisi platform sunucularında saklanmaz (PCI-DSS uyumlu)
- Sandbox test → production
- Pre-authorization → capture (seans başlayınca); ödeme onaylanana kadar slot geçici tutulmaz
- Komisyon: `platform_ayarlari`'ndan oku, brüt → komisyon → net hesabı
- `payments`, `payouts`, `refunds`, `seans_faturalari` tablolarına kayıt
- Haftalık otomatik danışman ödemesi (Cuma, cron job)
- İade: iptal politikasına göre otomatik
- Webhook handler: `/api/webhook/iyzico`
- Admin: manuel iade onayı, payout yönetimi

### PDF Fatura Üretimi
- Seans tamamlanıp ödeme capture edildiğinde otomatik PDF fatura oluşturulur
- Fatura numarası formatı: `MBR-YYYY-NNNNNN`
- Fatura Supabase Storage'a kaydedilir; link `seans_faturalari.pdf_url`'de tutulur
- Müşteriye ve danışmana otomatik mail ile gönderilir
- Müşteri paneli `/panelim/finans` sayfasında indirilebilir ve tarayıcıda önizlenebilir
- Danışman paneli `/danisan/finans` sayfasında aylık kazanç özeti PDF olarak indirilebilir

### Kurumsal Fatura
- Kurumsal müşterilere ay sonunda toplu fatura oluşturulur (`invoice_type: kurumsal_aylik`)
- Hem PDF hem XLSX formatında üretilir
- İK yöneticisi panelinden indirilir ve tarayıcıda önizlenir

---

## FAZ 5 — Video Görüşme

- Randevu onaylandığında Daily.co oda oluştur (server-side)
- Oda bitiş = randevu bitiş saati, otomatik kapanır
- Oda adı = `randevu_id` (tahmin edilemez)
- Ayrı token: musteri + danisan; token client URL'ine koyulmaz
- "Görüşmeye Katıl" butonu **randevu saatinden 10 dakika önce** aktif
- Bağlantı kurulumu randevu saatinden itibaren en geç 30 saniye içinde tamamlanmalı
- Bağlantı kesilirse otomatik yeniden bağlanma denemesi
- Video görüşme hiçbir koşulda kaydedilmez; arayüzde açıkça belirtilir
- Daily.co webhook: seans başladı / bitti
- **Daily.co erişilemez durumda ise:** kullanıcıya anlamlı Türkçe hata mesajı gösterilir, admin'e otomatik uyarı iletilir, alternatif iletişim (e-posta) önerilir
- Asenkron seans: müşteri mesaj yazar, danışman 24 saat içinde yazılı veya sesli yanıt (Supabase Storage, max 10 MB)
- Webhook handler: `/api/webhook/daily`

---

## FAZ 6 — Admin Paneli

### `/admin/dashboard`
Özet kartlar: bugünkü randevular, bekleyen onaylar, haftanın geliri, komisyon toplamı, aktif danışman, aktif müşteri, bekleyen transferler, churn riski yüksek kullanıcı sayısı. Son 30 gün seans grafiği (recharts). Bekleyen onaylar tablosu. En aktif danışmanlar.

### `/admin/kullanicilar`
Tablo: arama, filtre (aktif/bekleyen/dondurulmuş). Aksiyonlar: görüntüle, dondur, aktifleştir, soft sil. Drawer: seans geçmişi, admin notları, churn skoru. "Sizi özledik" maili tetikle.

### `/admin/danismanlar`
Tab: pending / onaylı / reddedilen. Her başvuru: belge görüntüle, onayla, reddet + gerekçe. Aktif danışman: düzenle, dondur, performans skoru görüntüle.

### `/admin/randevular`
Takvim + liste görünümü. Filtre: bekleyen / onaylı / tamamlanan / iptal / no-show. Anlaşmazlık yönetimi.

### `/admin/finans`
İşlem listesi (tarih, danışman, brüt, komisyon, net, durum). Danışman ödeme havuzu: haftalık ödenecekler, transfer işaretle. İade yönetimi. **PDF + XLSX export**: komisyon raporu, gelir raporu, vergi raporu. Affiliate komisyon ödemeleri. Fatura listesi (bireysel + kurumsal).

### `/admin/icerik`
Blog kuyruğu (bekleyen / onaylı / reddedilen). Red gerekçesi. Psikolojik test yönetimi (ekle/düzenle/aktif-pasif). Kaynak kütüphanesi. SSS. Sayfa içerikleri (hakkımızda, KVKK). Webinar yönetimi.

### `/admin/bildirimler`
Toplu duyuru (tüm / danışmanlar / müşteriler / kurumsal). Mail şablonları düzenle. SMS ayarları.

### `/admin/raporlar`
Kayıt büyümesi, seans tamamlanma, no-show, iptal, churn, affiliate dönüşüm, kurumsal kullanım, webinar katılım. **PDF + XLSX export**. Log kayıtları sayfası: tarih ve kullanıcı bazlı filtreleme, son 90 gün.

### `/admin/ayarlar`
Komisyon oranı. İptal politikası parametreleri. No-show politikası. Ödeme günleri. API key yönetimi. Kriz kelimeleri listesi. Güvenlik parametreleri: oturum zaman aşımı, hesap kilit süresi, IP ban eşiği. Dosya yükleme limiti.

### `/admin/kurumsal`
Şirket listesi, lisans, kullanım raporu (anonim).

### `/admin/affiliate`
Başvuru listesi, onay/red, komisyon oranı, ödeme.

---

## FAZ 7 — Danışman Paneli

### `/danisan/dashboard`
Bugünkü randevular, takvim özeti, bekleyen talepler (onayla/reddet/alternatif), bekleme listesi sayısı, bu ay kazanç, son yorumlar.

### `/danisan/takvim`
Aylık/haftalık/günlük. Müsaitlik şablonu. Özel gün. Tatil/izin. Seans süresi + tampon ayarı. Google/Outlook sync toggle. Tekrarlayan randevu.

### `/danisan/randevular`
Upcoming + geçmiş. Her seans: katıl butonu (zamanında aktif), özel not (danışana görünmez, hassas veri), paylaşılabilir özet, no-show işaretle. Tamamlanan seansa ait müşteri yorumuna yanıt yazma alanı.

### `/danisan/danisanlar`
Danışan listesi. Detay: seans geçmişi, özel notlar, ruh hali grafiği (paylaşıldıysa), ödev durumu, onboarding formu yanıtları.

### `/danisan/mesajlar`
Lojistik chat. Asenkron seans yanıtı (yazılı + ses kaydı yükle).

### `/danisan/finans`
Kazanç grafiği. Seans bazlı detay (brüt/komisyon/net). Ödeme geçmişi. Gelir tahmin aracı (haftada X seans → aylık net Y TL). Banka bilgileri güncelle. Aylık kazanç özeti **PDF olarak indir**. Fatura listesi (önizleme + indirme).

### `/danisan/blog`
Tiptap rich text editor. Taslak kaydet. Yayına gönder. Reddedilen → düzenle → tekrar gönder. Yayınlananlar.

### `/danisan/profil`
Fotoğraf, biyografi, uzmanlık (çoklu seçim), çalışma yöntemi (BDT/EMDR/Psikoanaliz vb.), kabul edilen yaş grupları, eğitim/CV, dil, cinsiyet, fiyat, sliding scale, paket oluştur, ön görüşme toggle, profil yayın durumu. Profil tamamlanma yüzdesi göstergesi — %100 olmadan yayınlanamaz.

### `/danisan/onboarding-formlar`
Şablon oluştur/düzenle (serbest alan tipleri). Danışana gönder. Yanıtları görüntüle.

### `/danisan/odevler`
Ödev/egzersiz gönder (hazır kütüphane veya özel). Tamamlanma durumu.

### `/danisan/supervizyon`
Süpervizör modda: talepleri görüntüle, seans yönet. Alan modda: süpervizör ara, randevu al.

### `/danisan/performans`
Seans tamamlanma oranı, müşteri tekrar oranı, ortalama puan, iptal oranı. Rozetler.

---

## FAZ 8 — Müşteri Paneli

### `/panelim/dashboard`
Yaklaşan randevular. Son danışmanlar. Ruh hali widget (bugünkü). Bekleyen ödevler. Paket ilerleme. Kişiselleştirilmiş içerik önerileri.

### `/panelim/danismanlar`
Filtreli liste + AI eşleştirme chatbotu.

### `/panelim/randevularim`
Bekleyen / yaklaşan / tamamlanan / iptal / no-show. Değerlendirme yap (seans bittikten 24 saat içinde). Görüşmeye katıl butonu. Seans özeti görüntüle.

### `/panelim/mesajlar`
Lojistik chat. Asenkron seans talebi gönder.

### `/panelim/gunluk`
Ruh hali kaydet (emoji 1-5 + kısa not). Kişisel günlük. Ruh hali geçmişi grafiği. Danışmanla paylaş toggle. **Kriz protokolü: risk ifadesi tespit edilince 182 kaynakları + danışmana + admin'e bildirim.**

### `/panelim/testler`
Test listesi. Akış: soru soru, progress bar. Sonuç: puan analizi + danışman önerisi. Kaydet. Geçmiş sonuçlar grafiği.

### `/panelim/odevler`
Bekleyen ödevler. Tamamla → danışmana bildirim. Geçmiş.

### `/panelim/paketlerim`
Paket adı, kullanılan/kalan seans, bitiş tarihi.

### `/panelim/gamification`
Rozetler. Haftalık hedef. İlerleme çubuğu. Teşvik edici, zorlamayan ton.

### `/panelim/finans`
Ödeme geçmişi, faturalar (PDF önizleme + indirme), iadeler.

### `/panelim/webinar`
Yayındaki webinarlar listesi + kayıt ol. Kayıtlı olduğum webinarlar: tarih, durum, katıl butonu (zamanında aktif).

### `/panelim/profil`
Kişisel bilgiler, şifre, bildirim tercihleri, dark mode, hesap sil (KVKK silme talebi akışı).

### Danışman Değiştirme Akışı
Mevcut danışmandan memnun değilse → gerekçe → sistem 3 alternatif öner → seç → geçmiş korunur.

---

## FAZ 9 — Blog + Testler + İçerik

### Blog
- `/blog` — SSR liste, kategori filtresi, arama
- `/blog/[slug]` — SSR, dynamic meta (title + description + keywords), yazar profil kartı, danışman yoruma yanıtları görünür

### Psikolojik Testler
- `/testler` — test listesi, tahmini süre
- `/testler/[slug]` — soru akışı, progress bar, sonuç + danışman önerisi
- Scoring logic: `psikolojik_testler.scoring_logic` jsonb'den hesapla

### Kaynak Kütüphanesi
- `/kaynaklar` — PDF, video, link listesi, ücretsiz erişim

### Şehir SEO Sayfaları
- SSG, `generateStaticParams`, her şehir için ayrı sayfa

---

## FAZ 10 — Bildirimler

### Mail Şablonları (React Email + Resend)
Kayıt aktivasyon, danışman onay/red, randevu talep/onay/red, randevu hatırlatma (24h + 2h + 15dk), seans değerlendirme daveti, ödeme onay + fatura PDF eki, iade onay, blog onay/red, şifre sıfırlama, bekleme listesi uyarısı, ödev tamamlama, churn yeniden kazanma, kurumsal bütçe limit uyarısı.

### SMS (Netgsm)
Randevu onay (tarih + saat + video link), randevu hatırlatma (2h öncesi), iptal, no-show uyarısı.

### Uygulama İçi Bildirim
Anlık panel bildirimleri (randevu talebi, mesaj, ödev, yorum). `bildirimler` tablosuna kaydedilir.

### Cron Job
Çok katmanlı hatırlatma: 24h + 2h + 15dk öncesi otomatik tetikleme.
Churn: 14 gün giriş yapmayan → "sizi özledik" maili.
Haftalık payout: Cuma günü otomatik tetik.
Kurumsal aylık fatura: ay sonu otomatik oluştur ve gönder.
Audit log temizliği: 90 günden eski logları sil.
`sessions_used_this_month` sıfırlama: her ay 1'inde.

### Başarısız Teslimat
- `bildirimler.delivery_status` takip edilir
- Başarısız teslimat otomatik yeniden denenir (max 3 deneme)
- Tüm teslimat loglanır

### Bildirim Tercihleri
Her kullanıcı e-posta / SMS / uygulama içi kanalları ayrı ayrı açıp kapatabilir.

---

## FAZ 11 — Kurumsal + Affiliate

### Kurumsal Panel
- Dashboard: toplam lisans, kullanılan seans, anonim memnuniyet skoru, bu ay harcanan bütçe
- Çalışan davet kodu oluştur + gönder (kişisel veri görünmez — KVKK)
- Çalışan bazlı aylık seans bütçesi tanımlama (0 = sınırsız)
- Bütçe %80 dolunca otomatik uyarı gönderilir
- Bakiye yetersizliğinde çalışana bireysel ödeme seçeneği sunulur
- Anonim dönemsel rapor (PDF + XLSX)
- Fatura yönetimi: aylık toplu fatura indirme + önizleme
- Lisans sayısı güncelleme talebi

### Affiliate Panel
- UTM bazlı özel referans linki + QR
- Tıklama, kayıt, dönüşüm istatistikleri
- Kazanç + ödeme geçmişi
- Promosyon materyalleri

---

## FAZ 12 — Gamification + PWA + SEO

### Gamification
- Rozet sistemi: ilk seans, 5. seans, 10. seans, 7 gün serisi, test tamamlama
- Haftalık hedef: "Bu hafta 2 seans yap"
- İlerleme göstergesi dashboard'da

### PWA
- `manifest.json`, `service-worker.ts`
- Offline temel sayfalar (dashboard, takvim)
- Push notification altyapısı

### SEO
- Tüm sayfalarda `generateMetadata`
- Structured data: Person, LocalBusiness, FAQPage, BreadcrumbList
- `sitemap.xml` otomatik (danışman profilleri + blog + testler)
- `robots.txt`
- Core Web Vitals: image opt, lazy load, code split
- Lighthouse audit: tüm sayfalar 90+

### Erişilebilirlik (WCAG 2.1 AA)
- Ekran okuyucu uyumu (`aria-label`, `role`, semantik HTML)
- Klavye navigasyonu (tab sırası, focus ring)
- Yüksek kontrast modu
- Tüm görsellerde `alt` metin
- Form hata mesajları ekran okuyucuya iletilmeli (`aria-describedby`)
- Animasyonlar `prefers-reduced-motion` ile devre dışı bırakılabilmeli

---

## Kriz Protokolü (Tüm Fazlarda Aktif)

`kriz_kelimeleri` tablosundaki kelimeler günlük veya chatbot girişinde tespit edilirse:
1. Ekranda: "182 ALO Psikiyatri Hattı" + "182 İntihar Önleme Hattı"
2. Danışmana otomatik acil mesaj
3. Admin bildirim
4. Kullanıcıya: "Platform kriz desteği sunamaz, hemen profesyonel yardım alın"

---

## KVKK ve Güvenlik Gereksinimleri

- Kayıt formlarında açık rıza checkbox → `kvkk_accepted_at` + `kvkk_ip` kaydedilir
- "Hesabımı sil" → 30 gün içinde silme + onay maili; veriler anonimleştirilebilir
- Banka bilgileri AES-256 şifreli saklanır, loga yazılmaz
- Video görüşme kaydedilmez; arayüzde açıkça belirtilir
- Veri işleme şeffaflığı: her adımda görünür bildirim
- Tüm kişisel veriler yalnızca Türkiye sınırlarındaki Supabase sunucularında saklanır
- Seans notları, psikolojik geçmiş, test sonuçları, onboarding yanıtları = hassas veri; yalnızca ilgili danışman ve müşteriye RLS ile açılır
- Tüm kullanıcı eylemleri loglanır; loglar 90 gün saklanır, admin panelinden filtrelenebilir
- **Yayın öncesi bağımsız güvenlik denetimi (pentest) zorunludur.** CVSS skoru 9.0 ve üzeri kritik açıklar canlıya geçiş öncesinde kapatılmış olmalıdır.
