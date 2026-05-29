import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"
import { davetKoduUret, davetLinkiOlustur } from "@/lib/kurumsal/davet"

const GovdeSchema = z.object({
  aksiyon: z.enum(["yenile"]),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const parsed = GovdeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  try {
    const yeniKod = davetKoduUret()

    const { error } = await supabase
      .from("kurumsal_hesaplar")
      .update({ invite_code: yeniKod, updated_at: new Date().toISOString() })
      .eq("id", hesap.id)

    if (error) throw error

    return Response.json({
      kod: yeniKod,
      link: davetLinkiOlustur(yeniKod),
    })
  } catch {
    return Response.json({ error: "Kod yenilenemedi" }, { status: 500 })
  }
}
