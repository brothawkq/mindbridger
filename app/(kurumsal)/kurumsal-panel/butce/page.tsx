import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ButceKlient from "@/components/kurumsal/ButceKlient"

export const metadata = { title: "Bütçe Yönetimi — MindBridger Kurumsal" }

export default async function ButcePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, default_monthly_budget")
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  const { data: kullanicilar } = await supabase
    .from("kurumsal_kullanicilar")
    .select("id, monthly_budget_limit, sessions_used_this_month, joined_at")
    .eq("kurumsal_id", hesap.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: true })

  const calisanlar = (kullanicilar ?? []).map((k, i) => ({
    satirNo: i + 1,
    satirId: k.id,
    monthlyBudgetLimit: k.monthly_budget_limit,
    sessionsUsedThisMonth: k.sessions_used_this_month ?? 0,
    defaultBudget: hesap.default_monthly_budget,
  }))

  return (
    <ButceKlient
      calisanlar={calisanlar}
      defaultBudget={hesap.default_monthly_budget}
    />
  )
}
