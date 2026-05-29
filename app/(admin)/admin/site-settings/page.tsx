import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"
import { SiteSettingsKlient } from "@/components/admin/SiteSettingsKlient"

export const metadata = { title: "Site İçerik Yönetimi — Admin | MindBridger" }

export default async function AdminSiteSettingsPage() {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["admin"])
  if (!user) redirect("/giris")

  const { data } = await supabase
    .from("site_settings")
    .select("key, value, description")
    .order("key", { ascending: true })

  return <SiteSettingsKlient settings={data ?? []} />
}
