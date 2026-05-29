import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

export async function GET() {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, default_monthly_budget, license_count")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  try {
    const { data: kullanicilar } = await supabase
      .from("kurumsal_kullanicilar")
      .select("musteri_id, monthly_budget_limit, sessions_used_this_month")
      .eq("kurumsal_id", hesap.id)
      .is("deleted_at", null)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const musteriIdler = (kullanicilar ?? []).map((k) => k.musteri_id)

    let toplamHarcama = 0
    if (musteriIdler.length > 0) {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount_gross")
        .in("musteri_id", musteriIdler)
        .eq("status", "captured")
        .gte("paid_at", monthStart)

      toplamHarcama = payments?.reduce((s, p) => s + (p.amount_gross ?? 0), 0) ?? 0
    }

    const toplamBudget = (kullanicilar ?? []).reduce((s, k) => {
      const b = k.monthly_budget_limit ?? hesap.default_monthly_budget ?? 0
      return s + b
    }, 0)

    const esikAsanlar = (kullanicilar ?? []).filter((k) => {
      const b = k.monthly_budget_limit ?? hesap.default_monthly_budget ?? 0
      if (!b || b === 0) return false
      return (k.sessions_used_this_month ?? 0) / b >= 0.8
    }).length

    return Response.json({
      toplamHarcama: Math.round(toplamHarcama),
      toplamBudget,
      esikAsanCalisanSayisi: esikAsanlar,
      aktifCalisanSayisi: musteriIdler.length,
    })
  } catch {
    return Response.json({ error: "Özet alınamadı" }, { status: 500 })
  }
}
