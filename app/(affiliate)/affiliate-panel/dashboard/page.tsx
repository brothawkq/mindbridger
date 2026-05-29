import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AffiliateDashboardKlient from "@/components/affiliate/AffiliateDashboardKlient"

export const metadata = { title: "Dashboard — Affiliate Paneli | MindBridger" }

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, referral_code, commission_rate, status, total_earned")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) redirect("/giris")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [toplamTiklamaRes, buAyTiklamaRes, toplamDonusumRes, bekleyenRes] =
    await Promise.all([
      supabase
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id),
      supabase
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id)
        .gte("clicked_at", monthStart),
      supabase
        .from("affiliate_conversions")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id),
      supabase
        .from("affiliate_conversions")
        .select("commission_amount")
        .eq("affiliate_id", affiliate.id)
        .eq("status", "pending"),
    ])

  const toplamTiklama = toplamTiklamaRes.count ?? 0
  const buAyTiklama = buAyTiklamaRes.count ?? 0
  const toplamDonusum = toplamDonusumRes.count ?? 0
  const bekleyenOdeme = Math.round(
    (bekleyenRes.data ?? []).reduce(
      (s, c) => s + (Number(c.commission_amount) ?? 0),
      0
    )
  )
  const donusumOrani =
    toplamTiklama > 0
      ? Math.round((toplamDonusum / toplamTiklama) * 1000) / 10
      : 0

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/kayit?ref=${affiliate.referral_code}`

  return (
    <AffiliateDashboardKlient
      referralKod={String(affiliate.referral_code ?? "")}
      referralLink={referralLink}
      komisyonOrani={Number(affiliate.commission_rate ?? 10)}
      toplamKazanc={Math.round(Number(affiliate.total_earned ?? 0))}
      bekleyenOdeme={bekleyenOdeme}
      toplamTiklama={toplamTiklama}
      buAyTiklama={buAyTiklama}
      toplamDonusum={toplamDonusum}
      donusumOrani={donusumOrani}
    />
  )
}
