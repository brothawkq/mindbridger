import "server-only";
import { dailyApi } from "./client";

// Video linki randevu saatinden kaç saniye önce aktif olur (PRD: 10 dakika)
const VIDEO_AKTIF_SURE_SANIYE = 10 * 60;

interface DailyTokenResponse {
  token: string;
}

export interface TokenOptions {
  odaAdi:             string;
  kullaniciId:        string;
  kullaniciAdi:       string;
  isDanisan:          boolean;  // true → is_owner; danışman odayı kontrol eder
  randevuBaslangicTs: number;   // Unix timestamp (saniye) — nbf bu değerden 10 dk önce
  bitisTs:            number;   // Unix timestamp (saniye) — token exp
}

/**
 * Daily.co meeting token üretir.
 * nbf = randevuBaslangicTs − 10 dk → token randevudan 10 dk önce geçerli olur.
 * Token URL'e koyulmaz; sunucuda saklanır ve sadece randevu sahibine verilir.
 */
export async function tokenUret(opts: TokenOptions): Promise<string> {
  const {
    odaAdi,
    kullaniciId,
    kullaniciAdi,
    isDanisan,
    randevuBaslangicTs,
    bitisTs,
  } = opts;

  const nbf = randevuBaslangicTs - VIDEO_AKTIF_SURE_SANIYE;

  const res = await dailyApi.post<DailyTokenResponse>("/meeting-tokens", {
    properties: {
      room_name:        odaAdi,
      user_id:          kullaniciId,
      user_name:        kullaniciAdi,
      is_owner:         isDanisan,
      enable_recording: false,
      exp:              bitisTs,
      nbf,
    },
  });

  return res.token;
}
