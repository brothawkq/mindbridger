import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"
import { referralLinkOlustur, utmLinkOlustur } from "@/lib/affiliate/utm"

export async function GET(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["affiliate"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("referral_code, commission_rate, status")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) {
    return Response.json({ error: "Affiliate kaydı bulunamadı" }, { status: 404 })
  }

  if (affiliate.status !== "active") {
    return Response.json(
      { error: "Hesabınız henüz aktif değil." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const source = searchParams.get("source") ?? undefined
  const medium = searchParams.get("medium") ?? undefined
  const campaign = searchParams.get("campaign") ?? undefined

  const referralKod = String(affiliate.referral_code)
  const link =
    source || medium || campaign
      ? utmLinkOlustur(referralKod, { source, medium, campaign })
      : referralLinkOlustur(referralKod)

  return Response.json({
    referralKod,
    link,
    komisyonOrani: Number(affiliate.commission_rate),
  })
}
