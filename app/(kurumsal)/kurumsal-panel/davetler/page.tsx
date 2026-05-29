import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DavetlerKlient from "@/components/kurumsal/DavetlerKlient"
import { davetLinkiOlustur } from "@/lib/kurumsal/davet"

export const metadata = { title: "Davetler — MindBridger Kurumsal" }

export default async function DavetlerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, invite_code, license_count")
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  const { count: calisanSayisi } = await supabase
    .from("kurumsal_kullanicilar")
    .select("id", { count: "exact", head: true })
    .eq("kurumsal_id", hesap.id)
    .is("deleted_at", null)

  const kod = hesap.invite_code ?? ""

  return (
    <DavetlerKlient
      davetKodu={kod}
      davetLinki={davetLinkiOlustur(kod)}
      calisanSayisi={calisanSayisi ?? 0}
      lisansSayisi={hesap.license_count ?? 0}
    />
  )
}
