import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AffiliateAyarlarKlient from "@/components/affiliate/AffiliateAyarlarKlient"

export const metadata = { title: "Ayarlar — Affiliate Paneli | MindBridger" }

export default async function AffiliateAyarlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const [profileRes, affiliateRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("affiliates")
      .select("id, referral_code, commission_rate, status, platform_info")
      .eq("profile_id", user.id)
      .single(),
  ])

  if (!affiliateRes.data) redirect("/giris")

  return (
    <AffiliateAyarlarKlient
      ad={String(profileRes.data?.first_name ?? "")}
      soyad={String(profileRes.data?.last_name ?? "")}
      email={user.email ?? ""}
      referralKod={String(affiliateRes.data.referral_code ?? "")}
      komisyonOrani={Number(affiliateRes.data.commission_rate ?? 10)}
      durum={String(affiliateRes.data.status ?? "pending")}
      platformBilgi={String(affiliateRes.data.platform_info ?? "")}
      affiliateId={String(affiliateRes.data.id)}
    />
  )
}
