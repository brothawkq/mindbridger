import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface ButceDurumu {
  izinli: boolean
  kalanButce: number | null // null = sınırsız
  bireyselOdemeOner: boolean
}

export async function butceLimitKontrol(
  kurumsalId: string,
  musteriId: string,
  tutar: number
): Promise<ButceDurumu> {
  const supabase = await createClient()

  const [calisanRes, hesapRes] = await Promise.all([
    supabase
      .from("kurumsal_kullanicilar")
      .select("monthly_budget_limit")
      .eq("kurumsal_id", kurumsalId)
      .eq("musteri_id", musteriId)
      .single(),
    supabase
      .from("kurumsal_hesaplar")
      .select("default_monthly_budget")
      .eq("id", kurumsalId)
      .single(),
  ])

  if (!calisanRes.data) {
    return { izinli: false, kalanButce: null, bireyselOdemeOner: false }
  }

  const limit =
    calisanRes.data.monthly_budget_limit ??
    hesapRes.data?.default_monthly_budget ??
    null

  if (!limit || limit === 0) {
    return { izinli: true, kalanButce: null, bireyselOdemeOner: false }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: payments } = await supabase
    .from("payments")
    .select("amount_gross")
    .eq("musteri_id", musteriId)
    .in("status", ["captured", "authorized"])
    .gte("paid_at", monthStart)

  const harcanan = payments?.reduce((s, p) => s + (p.amount_gross ?? 0), 0) ?? 0
  const kalan = limit - harcanan

  if (kalan < tutar) {
    return { izinli: false, kalanButce: Math.max(0, kalan), bireyselOdemeOner: true }
  }

  return { izinli: true, kalanButce: kalan, bireyselOdemeOner: false }
}
