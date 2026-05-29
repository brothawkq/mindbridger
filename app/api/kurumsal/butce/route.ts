import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

export async function GET(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sayfa = Math.max(1, Number(searchParams.get("sayfa") ?? "1"))
  const limit = 50
  const offset = (sayfa - 1) * limit

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, default_monthly_budget")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  try {
    const { data: kullanicilar, count } = await supabase
      .from("kurumsal_kullanicilar")
      .select("id, monthly_budget_limit, sessions_used_this_month, joined_at", {
        count: "exact",
      })
      .eq("kurumsal_id", hesap.id)
      .is("deleted_at", null)
      .order("joined_at", { ascending: true })
      .range(offset, offset + limit - 1)

    const liste = (kullanicilar ?? []).map((k, i) => ({
      satirNo: offset + i + 1,
      satirId: k.id,
      monthlyBudgetLimit: k.monthly_budget_limit,
      sessionsUsedThisMonth: k.sessions_used_this_month ?? 0,
      defaultBudget: hesap.default_monthly_budget,
    }))

    return Response.json({
      calisanlar: liste,
      toplamSayfa: Math.ceil((count ?? 0) / limit),
      defaultBudget: hesap.default_monthly_budget,
    })
  } catch {
    return Response.json({ error: "Bütçe listesi alınamadı" }, { status: 500 })
  }
}
