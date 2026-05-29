import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { referralKodUret } from "@/lib/affiliate/utm"

const Schema = z.object({
  platformInfo: z.string().min(1).max(500),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 })
  }

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(
      { error: "Platform bilgisi gereklidir (maks. 500 karakter)." },
      { status: 400 }
    )
  }

  // Zaten başvuru var mı?
  const { data: mevcutAffiliate } = await supabase
    .from("affiliates")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (mevcutAffiliate) {
    return Response.json(
      {
        error:
          mevcutAffiliate.status === "pending"
            ? "Başvurunuz inceleniyor."
            : "Zaten affiliate hesabınız var.",
      },
      { status: 409 }
    )
  }

  // Benzersiz referral kodu üret (çakışma olursa yenile)
  let referralKod = referralKodUret()
  let deneme = 0
  while (deneme < 5) {
    const { data: cakisan } = await supabase
      .from("affiliates")
      .select("id")
      .eq("referral_code", referralKod)
      .maybeSingle()

    if (!cakisan) break
    referralKod = referralKodUret()
    deneme++
  }

  try {
    const { error } = await supabase.from("affiliates").insert({
      profile_id: user.id,
      platform_info: parsed.data.platformInfo,
      referral_code: referralKod,
      commission_rate: 10, // Varsayılan %10; admin değiştirebilir
      status: "pending",
      total_earned: 0,
    })

    if (error) throw error

    return Response.json({ ok: true, referralKod })
  } catch {
    return Response.json({ error: "Başvuru oluşturulamadı." }, { status: 500 })
  }
}
