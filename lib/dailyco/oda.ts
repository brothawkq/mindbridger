import "server-only";
import { dailyApi } from "./client";
import type { Database } from "@/types/supabase";

type SessionType = Database["public"]["Enums"]["session_type"];

// Seans türüne göre maksimum katılımcı sayısı
const MAX_KATILIMCI: Record<SessionType, number> = {
  bireysel:    2,  // müşteri + danışman
  asenkron:    2,
  on_gorusme:  2,
  cift_aile:   3,  // müşteri + partner + danışman
  supervizyon: 2,
  grup:        2,  // grup/webinar için odaOlustur çağrısında maxKatilimci verilir
};

export interface DailyRoom {
  id:      string;
  name:    string;
  url:     string;
  privacy: string;
}

/**
 * Daily.co oda oluşturur. Oda adı = randevuId (UUID — tahmin edilemez).
 * Video görüşme hiçbir koşulda kaydedilmez; arayüzde de belirtilmelidir.
 *
 * @param randevuId     Randevu UUID'si — oda adı olarak kullanılır
 * @param seansTipi     Seans enum değeri — max_participants hesabı için
 * @param bitisTimestamp Randevu bitiş zamanı (Unix timestamp, saniye)
 * @param maxKatilimci  Grup/webinar için toplam kapasite (override)
 */
export async function odaOlustur(
  randevuId: string,
  seansTipi: SessionType,
  bitisTimestamp: number,
  maxKatilimci?: number,
): Promise<DailyRoom> {
  const max = maxKatilimci ?? MAX_KATILIMCI[seansTipi] ?? 2;

  return dailyApi.post<DailyRoom>("/rooms", {
    name:    randevuId,
    privacy: "private",
    properties: {
      exp:               bitisTimestamp,
      enable_recording:  false,   // kayıt hiçbir koşulda açılmaz
      max_participants:  max,
      enable_chat:       false,
      enable_screenshare: false,
    },
  });
}

/**
 * Daily.co odasını siler. Randevu iptal veya tamamlanma sonrası çağrılır.
 */
export async function odaSil(odaAdi: string): Promise<void> {
  await dailyApi.delete(`/rooms/${odaAdi}`);
}
