import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AyarlarKlient from "@/components/kurumsal/AyarlarKlient"

export const metadata = { title: "Ayarlar — MindBridger Kurumsal" }

export default async function AyarlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select(
      "company_name, contact_name, contact_email, contact_phone, license_count, status"
    )
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  return (
    <AyarlarKlient
      hesap={{
        companyName: hesap.company_name ?? "",
        contactName: hesap.contact_name ?? "",
        contactEmail: hesap.contact_email ?? "",
        contactPhone: hesap.contact_phone ?? null,
        licenseCount: hesap.license_count ?? null,
        status: hesap.status ?? null,
      }}
    />
  )
}
