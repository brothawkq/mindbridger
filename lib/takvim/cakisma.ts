import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const MS_PER_MIN = 60_000;
const DEFAULT_SESSION_MIN = 50;

/**
 * Önerilen randevu dilimi için çakışma kontrolü yapar.
 *
 * Overlap koşulu: slot.bas < existing.bitis AND slot.bitis > existing.bas
 *
 * @param danisanId    danisanlar.id
 * @param baslangic    Önerilen başlangıç zamanı (UTC Date)
 * @param sureDakika   Seans süresi (dakika)
 * @param supabase     Supabase server client
 * @param excludeId    Güncelleme sırasında hariç tutulacak randevu ID'si
 * @returns            true → çakışma var, false → müsait
 */
export async function cakismaVarMi(
  danisanId: string,
  baslangic: Date,
  sureDakika: number,
  supabase: SupabaseClient<Database>,
  excludeId?: string,
): Promise<boolean> {
  const bitis = new Date(baslangic.getTime() + sureDakika * MS_PER_MIN);

  // Potansiyel çakışan randevuları çek: scheduled_at < önerilen bitis
  // (Tam overlap filtrelemesi client-side yapılır çünkü PostgREST
  // "scheduled_at + duration > baslangic" ifadesini desteklemez)
  let query = supabase
    .from("randevular")
    .select("id, scheduled_at, duration_minutes")
    .eq("danisan_id", danisanId)
    .in("status", ["pending", "confirmed"])
    .lt("scheduled_at", bitis.toISOString())
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;

  return (data ?? []).some((r) => {
    const rBitis = new Date(
      new Date(r.scheduled_at).getTime() +
        (r.duration_minutes ?? DEFAULT_SESSION_MIN) * MS_PER_MIN,
    );
    return rBitis > baslangic;
  });
}

/**
 * Danışmanın verilen tarihte izin kaydı olup olmadığını kontrol eder.
 *
 * @param danisanId  danisanlar.id
 * @param tarih      "YYYY-MM-DD" — UTC+3 yerel tarih
 * @param supabase   Supabase server client
 */
export async function izinliMi(
  danisanId: string,
  tarih: string,
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  const { data } = await supabase
    .from("danisan_izin")
    .select("id")
    .eq("danisan_id", danisanId)
    .eq("date", tarih)
    .is("deleted_at", null)
    .maybeSingle();

  return data !== null;
}
