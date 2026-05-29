import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

const Schema = z.object({
  platformInfo: z.string().min(1).max(500),
})

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["affiliate"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(
      { error: "Platform bilgisi gereklidir (maks. 500 karakter)." },
      { status: 400 }
    )
  }

  // Affiliate kaydı sahiplik kontrolü (profile_id = user.id)
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) {
    return Response.json({ error: "Affiliate kaydı bulunamadı" }, { status: 404 })
  }

  try {
    const { error } = await supabase
      .from("affiliates")
      .update({
        platform_info: parsed.data.platformInfo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", affiliate.id)

    if (error) throw error

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Ayarlar güncellenemedi" }, { status: 500 })
  }
}
