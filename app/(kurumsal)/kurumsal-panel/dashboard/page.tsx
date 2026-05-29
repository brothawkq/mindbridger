import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import KurumsalDashboardKlient from "@/components/kurumsal/KurumsalDashboardKlient"
import { kurumsalRaporVeriAl } from "@/lib/kurumsal/rapor"

export const metadata = { title: "Dashboard — MindBridger Kurumsal" }

export default async function KurumsalDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("*")
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  const raporVeri = await kurumsalRaporVeriAl(hesap.id, "bu_ay")

  return <KurumsalDashboardKlient hesap={hesap} raporVeri={raporVeri} />
}
