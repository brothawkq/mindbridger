/**
 * Netgsm SMS Wrapper
 *
 * Türkiye'ye SMS gönderimi için Netgsm HTTP API entegrasyonu.
 * Sadece server-side kullanılır; client'a key sızdırılmaz.
 *
 * Referans: https://www.netgsm.com.tr/dokuman/
 * Endpoint: https://api.netgsm.com.tr/sms/send/get
 */
import "server-only";

const NETGSM_API_URL = "https://api.netgsm.com.tr/sms/send/get";

// Netgsm yanıt kodları
const NETGSM_HATA_KODLARI: Record<string, string> = {
  "00": "Mesaj gönderildi",
  "01": "Mesaj gönderilemedi",
  "02": "Geçersiz mesaj başlığı",
  "20": "Mesaj metni boş",
  "29": "IP kısıtlaması",
  "30": "Geçersiz kullanıcı adı/şifre",
  "40": "Mesaj karakter sınırı aşıldı",
  "41": "Geçersiz parametre",
  "42": "Alıcı GSM numarası hatalı",
  "43": "Gönderim başarılı sayısı 0",
};

export class NetgsmHata extends Error {
  constructor(
    message: string,
    public readonly kod: string,
  ) {
    super(message);
    this.name = "NetgsmHata";
  }
}

interface SmsPaylasim {
  /** Alıcı GSM numarası — "5XXXXXXXXX" veya "+905XXXXXXXXX" */
  telefon: string;
  /** SMS içeriği — maks 160 karakter (Türkçe karakterlerde 70) */
  mesaj: string;
}

/**
 * Tek alıcıya SMS gönderir.
 * Başarılı ise Netgsm job ID döner.
 * Hata durumunda NetgsmHata fırlatır.
 */
export async function smsSend({ telefon, mesaj }: SmsPaylasim): Promise<string> {
  const usercode = process.env.NETGSM_USER;
  const password = process.env.NETGSM_PASSWORD;

  if (!usercode || !password) {
    throw new NetgsmHata("NETGSM_USER veya NETGSM_PASSWORD tanımlı değil", "ENV");
  }

  // Numarayı normalize et: +90 veya 0 ön eki kaldır, sadece 10 haneli GSM
  const normalGsm = telefon
    .replace(/^\+90/, "")
    .replace(/^0/, "")
    .replace(/\s/g, "");

  if (!/^\d{10}$/.test(normalGsm)) {
    throw new NetgsmHata(`Geçersiz GSM numarası: ${telefon}`, "42");
  }

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno: normalGsm,
    message: mesaj,
    msgheader: "MindBridger",
    dil: "TR",
  });

  const url = `${NETGSM_API_URL}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { method: "GET" });
  } catch (err) {
    throw new NetgsmHata(
      `Netgsm API bağlantı hatası: ${err instanceof Error ? err.message : "bilinmeyen"}`,
      "NETWORK",
    );
  }

  if (!response.ok) {
    throw new NetgsmHata(`Netgsm HTTP ${response.status}`, "HTTP");
  }

  const yanit = (await response.text()).trim();

  // Başarılı yanıt: "00 <jobID>" formatında başlar
  if (yanit.startsWith("00 ")) {
    const jobId = yanit.substring(3);
    return jobId;
  }

  // Hata kodu — yanıt sadece kod veya "kod metin" formatında
  const kod = yanit.split(" ")[0] ?? yanit;
  const aciklama = NETGSM_HATA_KODLARI[kod] ?? "Bilinmeyen hata";
  throw new NetgsmHata(`Netgsm hatası [${kod}]: ${aciklama}`, kod);
}

/**
 * Telefon numarasının SMS için geçerli olup olmadığını kontrol eder.
 */
export function smsNumaraGecerli(telefon: string): boolean {
  const normal = telefon
    .replace(/^\+90/, "")
    .replace(/^0/, "")
    .replace(/\s/g, "");
  return /^\d{10}$/.test(normal);
}
