import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

const GovdeSchema = z.object({
  monthlyBudgetLimit: z.number().min(0).nullable(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { userId } = await params

  const parsed = GovdeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz bütçe değeri" }, { status: 400 })
  }

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  // userId = kurumsal_kullanicilar.id (row id, not musteri_id — KVKK)
  const { data: kayit } = await supabase
    .from("kurumsal_kullanicilar")
    .select("id, kurumsal_id")
    .eq("id", userId)
    .eq("kurumsal_id", hesap.id) // sahiplik kontrolü
    .is("deleted_at", null)
    .single()

  if (!kayit) {
    return Response.json({ error: "Çalışan kaydı bulunamadı" }, { status: 404 })
  }

  try {
    const { error } = await supabase
      .from("kurumsal_kullanicilar")
      .update({
        monthly_budget_limit: parsed.data.monthlyBudgetLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Bütçe güncellenemedi" }, { status: 500 })
  }
}
