import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import KazanclarKlient from "@/components/affiliate/KazanclarKlient"

export const metadata = { title: "Kazançlar — Affiliate Paneli | MindBridger" }

export interface AffiliateKazanc {
  id: string
  commissionAmount: number
  status: "pending" | "paid"
  createdAt: string
}

export default async function KazanclarPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; sayfa?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { durum = "hepsi", sayfa = "1" } = await searchParams
  const sayfaNo = Math.max(1, parseInt(sayfa, 10) || 1)
  const LIMIT = 20

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, total_earned")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) redirect("/giris")

  // Özet: pending + paid toplamları
  const [bekleyenRes, odenenRes] = await Promise.all([
    supabase
      .from("affiliate_conversions")
      .select("commission_amount")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "pending"),
    supabase
      .from("affiliate_conversions")
      .select("commission_amount")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "paid"),
  ])

  const bekleyenToplam = Math.round(
    (bekleyenRes.data ?? []).reduce(
      (s, c) => s + (Number(c.commission_amount) ?? 0),
      0
    )
  )
  const odenenToplam = Math.round(
    (odenenRes.data ?? []).reduce(
      (s, c) => s + (Number(c.commission_amount) ?? 0),
      0
    )
  )

  // Sayfalı liste
  let sorgu = supabase
    .from("affiliate_conversions")
    .select("id, commission_amount, status, created_at", { count: "exact" })
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .range((sayfaNo - 1) * LIMIT, sayfaNo * LIMIT - 1)

  if (durum === "bekleyen") sorgu = sorgu.eq("status", "pending")
  else if (durum === "odendi") sorgu = sorgu.eq("status", "paid")

  const { data: donusumlar, count } = await sorgu

  const kazanclar: AffiliateKazanc[] = (donusumlar ?? []).map((d) => ({
    id: String(d.id),
    commissionAmount: Number(d.commission_amount ?? 0),
    status: d.status as "pending" | "paid",
    createdAt: String(d.created_at ?? ""),
  }))

  return (
    <KazanclarKlient
      kazanclar={kazanclar}
      toplamKazanc={Math.round(Number(affiliate.total_earned ?? 0))}
      bekleyenToplam={bekleyenToplam}
      odenenToplam={odenenToplam}
      aktifDurum={durum}
      sayfaNo={sayfaNo}
      toplamSayfa={Math.ceil((count ?? 0) / LIMIT)}
    />
  )
}
