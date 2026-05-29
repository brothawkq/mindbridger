import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

const GovdeSchema = z.object({
  kod: z.string().min(1).max(20),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["musteri"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const parsed = GovdeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz davet kodu" }, { status: 400 })
  }

  const { kod } = parsed.data

  try {
    const { data: hesap } = await supabase
      .from("kurumsal_hesaplar")
      .select("id, license_count, status")
      .eq("invite_code", kod)
      .eq("status", "active")
      .single()

    if (!hesap) {
      return Response.json({ error: "Geçersiz veya süresi dolmuş davet kodu" }, { status: 404 })
    }

    // Lisans doluluk kontrolü
    const { count: mevcutSayi } = await supabase
      .from("kurumsal_kullanicilar")
      .select("id", { count: "exact", head: true })
      .eq("kurumsal_id", hesap.id)
      .is("deleted_at", null)

    if (hesap.license_count !== null && (mevcutSayi ?? 0) >= hesap.license_count) {
      return Response.json({ error: "Bu şirketin lisans kapasitesi dolmuş" }, { status: 409 })
    }

    // Mükerrer kayıt kontrolü
    const { data: mevcutKayit } = await supabase
      .from("kurumsal_kullanicilar")
      .select("id")
      .eq("kurumsal_id", hesap.id)
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .single()

    if (mevcutKayit) {
      return Response.json({ error: "Zaten bu şirkete kayıtlısınız" }, { status: 409 })
    }

    const { error } = await supabase.from("kurumsal_kullanicilar").insert({
      kurumsal_id: hesap.id,
      musteri_id: user.id,
      joined_at: new Date().toISOString(),
      sessions_used_this_month: 0,
      budget_alert_sent: false,
    })

    if (error) throw error

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Katılım işlemi başarısız" }, { status: 500 })
  }
}
