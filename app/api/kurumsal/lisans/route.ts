import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

const GovdeSchema = z.object({
  lisansSayisi: z.number().int().min(1).max(10000),
})

export async function PUT(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const parsed = GovdeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz lisans sayısı (min 1, max 10.000)" }, { status: 400 })
  }

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, license_count")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  // Mevcut aktif çalışan sayısından az olamaz
  const { count: calisanSayisi } = await supabase
    .from("kurumsal_kullanicilar")
    .select("id", { count: "exact", head: true })
    .eq("kurumsal_id", hesap.id)
    .is("deleted_at", null)

  if ((calisanSayisi ?? 0) > parsed.data.lisansSayisi) {
    return Response.json(
      {
        error: `Mevcut ${calisanSayisi} aktif çalışanınız var; lisans sayısı bundan az olamaz`,
      },
      { status: 409 }
    )
  }

  try {
    const { error } = await supabase
      .from("kurumsal_hesaplar")
      .update({
        license_count: parsed.data.lisansSayisi,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hesap.id)

    if (error) throw error

    return Response.json({ ok: true, lisansSayisi: parsed.data.lisansSayisi })
  } catch {
    return Response.json({ error: "Lisans güncellenemedi" }, { status: 500 })
  }
}
