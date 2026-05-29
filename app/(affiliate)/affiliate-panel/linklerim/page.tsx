import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LinklerimKlient from "@/components/affiliate/LinklerimKlient"

export const metadata = { title: "Linklerim — Affiliate Paneli | MindBridger" }

export interface AylikTiklama {
  ay: string   // "YYYY-MM"
  adet: number
}

export default async function LinklerimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, referral_code, commission_rate, status")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) redirect("/giris")

  // Son 6 aylık tıklama verileri
  const altiAyOnce = new Date()
  altiAyOnce.setMonth(altiAyOnce.getMonth() - 6)

  const { data: tiklamalar } = await supabase
    .from("affiliate_clicks")
    .select("clicked_at")
    .eq("affiliate_id", affiliate.id)
    .gte("clicked_at", altiAyOnce.toISOString())
    .order("clicked_at", { ascending: true })

  // Aya göre grupla
  const aylikMap: Record<string, number> = {}
  for (const t of tiklamalar ?? []) {
    const d = new Date(t.clicked_at as string)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    aylikMap[key] = (aylikMap[key] ?? 0) + 1
  }

  // Son 6 ayı doldurup sırala (boş aylar = 0)
  const aylikTiklamalar: AylikTiklama[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    aylikTiklamalar.push({ ay: key, adet: aylikMap[key] ?? 0 })
  }

  const toplamTiklama = (tiklamalar ?? []).length
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/kayit?ref=${affiliate.referral_code}`

  return (
    <LinklerimKlient
      referralKod={String(affiliate.referral_code ?? "")}
      referralLink={referralLink}
      komisyonOrani={Number(affiliate.commission_rate ?? 10)}
      toplamTiklama={toplamTiklama}
      aylikTiklamalar={aylikTiklamalar}
    />
  )
}
