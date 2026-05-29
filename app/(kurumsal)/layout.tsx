import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import KurumsalSidebar from "@/components/kurumsal/KurumsalSidebar"
import MobilePanelShell from "@/components/shared/MobilePanelShell"

export default async function KurumsalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/giris")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "kurumsal" || profile.status !== "active") {
    redirect("/giris")
  }

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("company_name")
    .eq("contact_email", user.email ?? "")
    .single()

  return (
    <MobilePanelShell
      sidebar={<KurumsalSidebar sirketAdi={hesap?.company_name ?? "Şirket"} />}
      rolLabel="Kurumsal"
    >
      {children}
    </MobilePanelShell>
  )
}
