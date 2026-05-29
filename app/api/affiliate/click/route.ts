import "server-only"
import { z } from "zod"
import { headers } from "next/headers"
import { createHash } from "crypto"
import { createClient } from "@/lib/supabase/server"

const Schema = z.object({
  ref: z.string().min(1).max(20),
  userAgent: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const { ref, userAgent } = parsed.data
  const supabase = await createClient()

  // Referral kodu doğrula
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, status")
    .eq("referral_code", ref)
    .eq("status", "active")
    .maybeSingle()

  if (!affiliate) {
    // Geçersiz kod — sessizce 200 döner (botların info almasını engelle)
    return Response.json({ ok: true, kayitlandi: false })
  }

  // IP hash'i (KVKK uyumu — ham IP saklanmaz)
  const headersList = await headers()
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  const ipHash = createHash("sha256")
    .update(rawIp + affiliate.id)
    .digest("hex")

  // Anti-spam: aynı IP + aynı affiliate için 24 saat içinde tekrar sayma
  const saat24Once = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from("affiliate_clicks")
    .select("id")
    .eq("ip_hash", ipHash)
    .eq("affiliate_id", affiliate.id)
    .gte("clicked_at", saat24Once)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return Response.json({ ok: true, kayitlandi: false })
  }

  try {
    const { error } = await supabase.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
      clicked_at: new Date().toISOString(),
    })

    if (error) throw error

    return Response.json({ ok: true, kayitlandi: true })
  } catch {
    return Response.json({ error: "Tıklama kaydedilemedi" }, { status: 500 })
  }
}
