import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";

export interface IadeSonucu {
  iadeTutar: number;
  iadeOrani: number;
  politika: "tam" | "kismi" | "yok";
}

interface PlatformAyarlari {
  cancel_full_refund_hours: number | null;
  cancel_partial_refund_hours: number | null;
  cancel_partial_refund_percent: number | null;
}

export async function iadeHesapla(
  brutTutar: number,
  scheduledAt: string,
  supabase: SupabaseClient,
): Promise<IadeSonucu> {
  const { data } = await supabase
    .from("platform_ayarlari")
    .select("cancel_full_refund_hours, cancel_partial_refund_hours, cancel_partial_refund_percent")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  const ayarlar: PlatformAyarlari = {
    cancel_full_refund_hours:    typeof data?.cancel_full_refund_hours === "number"    ? data.cancel_full_refund_hours    : 24,
    cancel_partial_refund_hours: typeof data?.cancel_partial_refund_hours === "number" ? data.cancel_partial_refund_hours : 2,
    cancel_partial_refund_percent: typeof data?.cancel_partial_refund_percent === "number" ? data.cancel_partial_refund_percent : 50,
  };

  const simdi = Date.now();
  const seansZamani = new Date(scheduledAt).getTime();
  const kalanSaat = (seansZamani - simdi) / (1000 * 60 * 60);

  if (kalanSaat >= (ayarlar.cancel_full_refund_hours ?? 24)) {
    return { iadeTutar: brutTutar, iadeOrani: 100, politika: "tam" };
  }

  if (kalanSaat >= (ayarlar.cancel_partial_refund_hours ?? 2)) {
    const oran = ayarlar.cancel_partial_refund_percent ?? 50;
    const tutar = Math.round(brutTutar * (oran / 100) * 100) / 100;
    return { iadeTutar: tutar, iadeOrani: oran, politika: "kismi" };
  }

  return { iadeTutar: 0, iadeOrani: 0, politika: "yok" };
}
