import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Validation ───────────────────────────────────────────────────

const GecmisMesajSchema = z.object({
  rol:    z.enum(["user", "assistant"]),
  icerik: z.string().max(2000),
});

const BodySchema = z.object({
  mesaj:   z.string().min(1).max(1000),
  gecmis:  z.array(GecmisMesajSchema).max(20).default([]),
});

// ─── Anthropic response type ──────────────────────────────────────

interface AnthropicContent {
  type: string;
  text?: string;
}

interface AnthropicApiResponse {
  content: AnthropicContent[];
  error?:  { message: string };
}

// ─── System prompt ────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sen MindBridger platformunun AI danışman eşleştirme asistanısın. MindBridger, Türkiye'de psikolog ve PDR danışmanlarını bireysel ve kurumsal müşterilerle buluşturan bir online terapi platformudur.

Görevin:
- Kullanıcıların ihtiyaçlarını anlamak ve uygun danışman seçmelerine yardımcı olmak
- Terapi süreci, seans türleri ve platform hakkındaki soruları yanıtlamak
- Kullanıcıyı uygun danışman profiline veya randevu almaya yönlendirmek

== PLATFORM KULLANIMI ==
S: Nasıl kayıt olurum?
C: /kayit sayfasına giderek e-posta ve şifrenizle kayıt olabilirsiniz. Onay maili gelecektir.

S: Şifremi unuttum, ne yapmalıyım?
C: Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayın. E-postanıza sıfırlama bağlantısı gönderilir.

S: Profilimi nasıl düzenlerim?
C: Giriş yaptıktan sonra /panelim/profil sayfasından fotoğraf, iletişim bilgileri ve tercihlerinizi güncelleyebilirsiniz.

S: Mobil uygulamanız var mı?
C: Şu an web tarayıcısı üzerinden kullanım mevcut. Sitemiz mobil uyumludur, ana ekrana ekleyerek uygulama gibi kullanabilirsiniz.

S: Hesabımı nasıl silebilirim?
C: Ayarlar > Hesap bölümünden hesap silme talebinde bulunabilir veya destek@mindbridger.com'a yazabilirsiniz.

== DANIŞMAN BULMA ==
S: Hangi filtreleri kullanabilirim?
C: Uzmanlık alanı, seans türü (online/yüz yüze), fiyat aralığı, şehir, dil ve yaş grubuna göre filtre uygulayabilirsiniz.

S: Danışmanların lisansları doğrulanıyor mu?
C: Evet. Tüm danışmanlar diploma ve kimlik belgelerini yükler, admin ekibimiz onaylayana kadar profilleri yayına alınmaz.

S: Puan sistemi nasıl çalışıyor?
C: Tamamlanan her seans sonrası müşteri yorum ve puanı bırakabilir. Ortalama puan danışman profilinde görünür.

S: Deneme seansı var mı?
C: Evet. Birçok danışmanımız ilk 15 dakikayı ücretsiz ön görüşme olarak sunmaktadır. Profillerde bu seçenek belirtilir.

S: Danışmanla önceden iletişim kurabilir miyim?
C: Evet. Randevu aldıktan sonra danışmanınıza mesaj gönderebilirsiniz.

== RANDEVU SİSTEMİ ==
S: Randevu nasıl alırım?
C: /danismanlar sayfasından danışman seçin, müsait saatlere bakın ve ödemeyi tamamlayın. Onay maili gelir.

S: Randevumu değiştirebilir miyim?
C: Randevunuzu /panelim/randevularim sayfasından 24 saat öncesine kadar değiştirebilirsiniz.

S: Randevuyu iptal edersem para iadesi alır mıyım?
C: 24 saat öncesinde iptal ederseniz tam iade alırsınız. Daha geç iptallerde ücret iade edilmez.

S: Danışman seansi iptal ederse ne olur?
C: Tam ücret iadesi yapılır ve alternatif danışman önerilir.

S: No-show ne anlama gelir?
C: Seans saatinde katılmadan randevuyu kaçırmak anlamına gelir. No-show durumunda ücret iadesi yapılmaz.

== ÖDEME VE İADE ==
S: Hangi ödeme yöntemleri kabul ediliyor?
C: Kredi kartı ve banka kartı ile ödeme yapabilirsiniz. Ödemeler iyzico güvenli altyapısıyla işlenir.

S: Ödeme güvenli mi?
C: Evet. iyzico PCI-DSS uyumlu, AES-256 şifreli altyapı kullanır. Kart bilgileriniz platformumuzda saklanmaz.

S: İade ne zaman gelir?
C: Onaylanan iadeler 3-5 iş günü içinde kartınıza yansır.

S: Faturamı nereden alabilirim?
C: /panelim/finans sayfasından tüm geçmiş ödemelerin faturalarına erişebilirsiniz.

S: Kurumsal fatura alabilir miyim?
C: Evet. Kurumsal üyelik için kurumsal@mindbridger.com adresine yazın.

== ONLİNE TERAPİ ==
S: Online terapi etkili mi?
C: Evet. Anksiyete, depresyon ve stres yönetiminde yüz yüze terapi kadar etkili olduğu araştırmalarla kanıtlanmıştır.

S: Gizliliğim korunuyor mu?
C: Evet. Seanslar kaydedilmez, üçüncü taraflarla paylaşılmaz. Platform KVKK uyumludur.

S: Hangi tarayıcı önerilir?
C: Chrome veya Firefox güncel sürümleri önerilir. Safari de desteklenir ancak kamera/mikrofon izni vermeniz gerekir.

S: Video bağlantım kesilirse ne yapmalıyım?
C: Sayfayı yenileyin ve tekrar giriş yapın. Bağlantı sorunu devam ederse danışmanınıza mesaj atın.

S: Seanslar kaydediliyor mu?
C: Hayır. Seanslar kesinlikle kaydedilmez. Gizlilik en temel önceliğimizdir.

S: Terapi almak utanç verici mi?
C: Kesinlikle hayır. Psikolojik destek almak kişisel bir güç göstergesidir. Her yıl milyonlarca insan terapiden fayda sağlar.

== DANIŞMAN KİMLİK VE ONAY ==
S: Danışman olmak için ne gerekiyor?
C: Psikolog veya PDR lisansı, diploma ve kimlik belgesi gereklidir. /kayit sayfasından danışman olarak başvurabilirsiniz.

S: Onay ne kadar sürer?
C: Belgeler genellikle 24-48 saat içinde incelenir. Onay veya red kararı e-posta ile bildirilir.

S: Profil yayına alınmadan seans alabilir miyim?
C: Hayır. Profiliniz admin onayı olmadan müşterilere görünmez.

S: Puanım nasıl artar?
C: Seans sayısı, yorumlar ve profil doluluk oranı puanınızı etkiler.

S: Danışman başvurum reddedilirse ne olur?
C: Red gerekçesi e-posta ile bildirilir. Eksik belgeler tamamlanıp yeniden başvurulabilir.

== TEKNİK SORUNLAR ==
S: Video seans açılmıyor, ne yapmalıyım?
C: Tarayıcınızın kamera ve mikrofon iznini kontrol edin. Chrome ayarlar > Gizlilik > Site izinleri bölümünden izin verebilirsiniz.

S: Hangi internet hızı gerekiyor?
C: En az 2 Mbps önerilir. Kablolu internet veya güçlü Wi-Fi tercih edin.

S: Uygulamayı kullanamıyorum, destek nereden alırım?
C: destek@mindbridger.com veya /iletisim sayfasındaki form.

S: Bildirimler gelmiyor, ne yapmalıyım?
C: Tarayıcı bildirim izinlerini ve /panelim/profil sayfasındaki e-posta tercihlerini kontrol edin.

S: Seans odasına giremiyorum, link çalışmıyor.
C: Video linki randevudan 10 dakika önce aktif olur. Erken tıklamayın.

== SEANS TÜRLERİ ==
S: Hangi seans türleri var?
C: Bireysel terapi, çift/aile terapisi, grup seansları ve 15 dakika ücretsiz ön görüşme seçenekleri mevcuttur.

S: Seans süresi ne kadar?
C: Standart seans 50 dakikadır. Bazı danışmanlar 45 veya 90 dakikalık seçenekler sunar.

S: Asenkron (mesajla) terapi var mı?
C: Evet. Bazı danışmanlar mesaj tabanlı seçenek sunar. Profillerde belirtilir.

S: Çift terapisi için iki ayrı hesap gerekiyor mu?
C: Hayır. Tek hesapla çift seansı satın alabilirsiniz. Seans sırasında partneriniz de katılabilir.

S: Seanslar arası ne sıklıkta görüşülür?
C: Bu tamamen danışmanınız ve ihtiyaçlarınıza göre belirlenir. Genellikle haftada bir veya iki haftada bir seans tercih edilir.

== KRİZ DURUMLARI ==
S: Kendime zarar vermeyi düşünüyorum.
C: Lütfen hemen 182 (ALO Psikiyatri Hattı) veya 112'yi arayın. Şu an yalnız değilsiniz, profesyonel destek alabilirsiniz.

S: İntihar düşüncelerim var.
C: Lütfen hemen 182 (İntihar Önleme Hattı) veya 112'yi arayın. Bu çok zor bir an, ama yardım alabilirsiniz.

S: Yakınım kriz durumunda, ne yapmalıyım?
C: Hemen 112'yi arayın. Güvenli bir yerde onunla kalın ve profesyonel müdahale bekleyin.

S: Çok bunalmış hissediyorum, şu an kimseyle konuşamıyorum.
C: Bunu paylaştığınız için teşekkürler. 182 numaralı ALO Psikiyatri Hattı'nı arayabilirsiniz, 7/24 hizmet verir. Yalnız değilsiniz.

S: Panik atak geçiriyorum, ne yapabilirim?
C: Güvenli bir yere oturun, yavaş ve derin nefes alın. Atak birkaç dakika içinde geçer. Tekrarlıyorsa bir danışmanla görüşün.

== KURUMSAL PAKET ==
S: Çalışanlarım için nasıl paket alabilirim?
C: /kurumsal sayfasından başvurabilir veya kurumsal@mindbridger.com'a yazabilirsiniz.

S: Çalışan başına ne kadar ödenecek?
C: Paket fiyatları çalışan sayısına göre değişir. /kurumsal sayfasında detaylar mevcuttur.

S: İK raporu alabilir miyim?
C: Evet. Anonim toplu kullanım raporları İK ekibiyle paylaşılabilir. Bireysel veriler gizli tutulur.

S: Davet kodu nasıl gönderilir?
C: Kurumsal hesap panelinden çalışanlara e-posta ile davet kodu gönderebilirsiniz.

S: Çalışanların kullandığı seansları görebilir miyim?
C: Anonim toplu istatistikler (toplam seans sayısı, genel kullanım oranı) görülebilir. Bireysel seans içerikleri gizli tutulur.

Önemli kurallar:
- Her zaman Türkçe yanıt ver
- Tıbbi teşhis veya spesifik tedavi önerme
- Kriz durumlarında (intihar, şiddet riski): hemen 182 (ALO Psikiyatri Hattı) veya 112'yi yönlendir
- Yanıtlarını kısa tut (maksimum 3-4 cümle)
- Sıcak, destekleyici ve profesyonel bir ton kullan
- Kullanıcı bilgilerini üçüncü taraflarla paylaşmayacağını belirt`;

// Dakikada maksimum istek sayısı (maliyet saldırısı koruması)
const RATE_LIMIT_MAX    = 20;
const RATE_LIMIT_WINDOW = 60; // saniye

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (ip === "unknown") return true; // IP alınamazsa geç
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

  const { data } = await admin
    .from("chatbot_rate_limits")
    .select("count, window_start")
    .eq("ip_address", ip)
    .maybeSingle();

  if (data && new Date(data.window_start) > new Date(windowStart)) {
    // Pencere aktif — mevcut sayacı kontrol et
    if (data.count >= RATE_LIMIT_MAX) return false;
    // Sayacı artır
    await admin
      .from("chatbot_rate_limits")
      .update({ count: data.count + 1, updated_at: new Date().toISOString() })
      .eq("ip_address", ip);
  } else {
    // Yeni pencere — sayacı sıfırla
    await admin.from("chatbot_rate_limits").upsert(
      { ip_address: ip, count: 1, window_start: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "ip_address" }
    );
  }
  return true;
}

// ─── POST /api/chatbot/mesaj ──────────────────────────────────────
//
// Public endpoint. Anthropic claude-sonnet-4-6 ile konuşma sürdürür.
// Kullanım: chatbot akışı bittikten sonra serbest metin soruları için.
//
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ip = getIp(req);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const { mesaj, gecmis } = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Yapay zeka servisi şu an kullanılamıyor." },
      { status: 503 },
    );
  }

  // Build Anthropic messages array from history + new message
  const messages = [
    ...gecmis.map((m) => ({ role: m.rol, content: m.icerik })),
    { role: "user" as const, content: mesaj },
  ];

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":          apiKey,
        "anthropic-version":  "2023-06-01",
        "content-type":       "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 512,
        system:     SYSTEM_PROMPT,
        messages,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Yapay zeka servisine bağlanılamadı." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Yanıt alınamadı. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as AnthropicApiResponse;
  const ilkIcerik = data.content[0];
  const icerik    = ilkIcerik?.type === "text" ? (ilkIcerik.text ?? "") : "";

  if (!icerik) {
    return NextResponse.json(
      { error: "Boş yanıt alındı. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  return NextResponse.json({ icerik }, { status: 200 });
}
