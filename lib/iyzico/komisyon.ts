import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";

export interface KomisyonSonucu {
  brutTutar: number;
  komisyonOrani: number;
  komisyonTutar: number;
  netTutar: number;
}

export async function komisyonHesapla(
  brutTutar: number,
  supabase: SupabaseClient,
): Promise<KomisyonSonucu> {
  const { data } = await supabase
    .from("platform_ayarlari")
    .select("commission_rate")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const komisyonOrani: number =
    typeof data?.commission_rate === "number" ? data.commission_rate : 20;

  const komisyonTutar = Math.round(brutTutar * (komisyonOrani / 100) * 100) / 100;
  const netTutar = Math.round((brutTutar - komisyonTutar) * 100) / 100;

  return { brutTutar, komisyonOrani, komisyonTutar, netTutar };
}
