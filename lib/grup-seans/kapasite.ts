import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";

export interface GrupSeansKapasite {
  mevcutKatilimci: number;
  maksKapasite: number | null;
  minKatilimci: number | null;
  minKarsilandi: boolean;
  kapasiteDolu: boolean;
}

// Grup seans kapasite/min bilgisi randevular.recurring_rule jsonb'de saklanır:
// { "capacity": 10, "min_participants": 3 }
function jsonSayi(kural: Json | null, alan: string): number | null {
  if (kural && typeof kural === "object" && !Array.isArray(kural)) {
    const v = (kural as Record<string, Json | undefined>)[alan];
    return typeof v === "number" ? v : null;
  }
  return null;
}

export async function grupSeansKapasiteAl(
  randevuId: string,
  supabase: SupabaseClient<Database>,
): Promise<GrupSeansKapasite> {
  const [{ count }, { data: randevu }] = await Promise.all([
    supabase
      .from("grup_seans_katilimcilar")
      .select("*", { count: "exact", head: true })
      .eq("randevu_id", randevuId)
      .neq("status", "cancelled")
      .is("deleted_at", null),
    supabase
      .from("randevular")
      .select("recurring_rule")
      .eq("id", randevuId)
      .is("deleted_at", null)
      .single(),
  ]);

  const mevcut = count ?? 0;
  const kural = randevu?.recurring_rule ?? null;
  const maks = jsonSayi(kural, "capacity");
  const min = jsonSayi(kural, "min_participants");

  return {
    mevcutKatilimci: mevcut,
    maksKapasite: maks,
    minKatilimci: min,
    minKarsilandi: min !== null ? mevcut >= min : true,
    kapasiteDolu: maks !== null ? mevcut >= maks : false,
  };
}

/**
 * Aktif katılımcı sayısı değişince tüm satırların min_participant_met
 * alanını senkronize eder. Gerçek ödeme capture/iade Faz 4'te eklenir.
 */
export async function minKontrolGuncelle(
  randevuId: string,
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  const kapasite = await grupSeansKapasiteAl(randevuId, supabase);

  await supabase
    .from("grup_seans_katilimcilar")
    .update({ min_participant_met: kapasite.minKarsilandi })
    .eq("randevu_id", randevuId)
    .neq("status", "cancelled")
    .is("deleted_at", null);

  return kapasite.minKarsilandi;
}
