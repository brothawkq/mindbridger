import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const MS_PER_MIN = 60_000;

export interface ZamanAraligi {
  baslangic: Date; // UTC
  bitis: Date;     // UTC
}

/** "YYYY-MM-DD" → UTC+3 gece yarısı (UTC olarak) */
function gunBaslangiciUTC(tarih: string): Date {
  return new Date(`${tarih}T00:00:00+03:00`);
}

/** "YYYY-MM-DD" → haftanın günü (0=Pazar ... 6=Cumartesi) UTC+3'te */
function haftaninGunu(tarih: string): number {
  // Öğlen UTC, UTC+3'te de aynı gün — gece yarısı sınır geçişini önler
  return new Date(`${tarih}T12:00:00Z`).getUTCDay();
}

/** "HH:MM:SS" zaman string'ini dakika cinsinden verir */
function zamanDakika(zaman: string): number {
  const parts = zaman.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

/**
 * Verilen tarih için danışmanın müsait zaman dilimlerini hesaplar.
 *
 * @param danisanId  danisanlar.id
 * @param tarih      "YYYY-MM-DD" — UTC+3 yerel tarih
 * @param supabase   Supabase server client
 * @returns          UTC zaman aralıkları — her biri bir seans slotu
 */
export async function hesaplaMusaitSlotlar(
  danisanId: string,
  tarih: string,
  supabase: SupabaseClient<Database>,
): Promise<ZamanAraligi[]> {
  // 1. Danışman seans süresi + tampon
  const { data: danisan } = await supabase
    .from("danisanlar")
    .select("session_duration, buffer_minutes")
    .eq("id", danisanId)
    .is("deleted_at", null)
    .single();

  if (!danisan) return [];

  const seansDakika  = danisan.session_duration ?? 50;
  const tamponDakika = danisan.buffer_minutes ?? 0;
  const adimDakika   = seansDakika + tamponDakika;

  // 2. İzin günü kontrolü
  const { data: izin } = await supabase
    .from("danisan_izin")
    .select("id")
    .eq("danisan_id", danisanId)
    .eq("date", tarih)
    .is("deleted_at", null)
    .maybeSingle();

  if (izin) return [];

  // 3. O günün çalışma şablonu
  const dayOfWeek = haftaninGunu(tarih);

  const { data: calismaBloklar } = await supabase
    .from("danisan_musaitlik")
    .select("start_time, end_time")
    .eq("danisan_id", danisanId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (!calismaBloklar || calismaBloklar.length === 0) return [];

  // 4. O güne ait mevcut onaylı/bekleyen randevular
  const gunBaslangici = gunBaslangiciUTC(tarih);
  const gunBitisi     = new Date(gunBaslangici.getTime() + 24 * 60 * MS_PER_MIN);

  const { data: mevcutlar } = await supabase
    .from("randevular")
    .select("scheduled_at, duration_minutes")
    .eq("danisan_id", danisanId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", gunBaslangici.toISOString())
    .lt("scheduled_at", gunBitisi.toISOString())
    .is("deleted_at", null);

  const mevcutAraliklar: ZamanAraligi[] = (mevcutlar ?? []).map((r) => ({
    baslangic: new Date(r.scheduled_at),
    bitis: new Date(
      new Date(r.scheduled_at).getTime() + (r.duration_minutes ?? seansDakika) * MS_PER_MIN,
    ),
  }));

  // 5. Her çalışma bloğu için slot üret
  const slotlar: ZamanAraligi[] = [];

  for (const blok of calismaBloklar) {
    const blokBasDak = zamanDakika(blok.start_time);
    const blokBitDak = zamanDakika(blok.end_time);

    let suankiDak = blokBasDak;

    while (suankiDak + seansDakika <= blokBitDak) {
      // gunBaslangici zaten UTC+3 gece yarısını UTC olarak temsil eder;
      // üzerine yerel dakika eklenerek doğru UTC timestamp elde edilir
      const slotBas   = new Date(gunBaslangici.getTime() + suankiDak * MS_PER_MIN);
      const slotBitis = new Date(slotBas.getTime() + seansDakika * MS_PER_MIN);

      const cakisiyor = mevcutAraliklar.some(
        (m) => slotBas < m.bitis && slotBitis > m.baslangic,
      );

      if (!cakisiyor) {
        slotlar.push({ baslangic: slotBas, bitis: slotBitis });
      }

      suankiDak += adimDakika;
    }
  }

  slotlar.sort((a, b) => a.baslangic.getTime() - b.baslangic.getTime());

  return slotlar;
}
