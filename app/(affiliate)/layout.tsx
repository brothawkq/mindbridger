import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AffiliateSidebar from "@/components/affiliate/AffiliateSidebar"

export default async function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/giris")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "affiliate" || profile.status !== "active") {
    redirect("/giris")
  }

  const adSoyad =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "Affiliate"

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F5F5" }}>
      <AffiliateSidebar adSoyad={adSoyad} />
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  )
}
