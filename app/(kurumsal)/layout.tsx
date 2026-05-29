import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import KurumsalSidebar from "@/components/kurumsal/KurumsalSidebar"

export default async function KurumsalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FFFCF6",
        fontFamily: "var(--font-inter)",
      }}
    >
      <KurumsalSidebar sirketAdi={hesap?.company_name ?? "Şirket"} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Panel üst bar */}
        <header
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #D4E4D8",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-overpass)",
                fontSize: 15,
                fontWeight: 600,
                color: "#252625",
              }}
            >
              MindBridger
            </span>
            <span
              style={{
                backgroundColor: "rgba(50,83,67,0.08)",
                color: "#325343",
                borderRadius: 100,
                padding: "2px 10px",
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Kurumsal
            </span>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "hidden" }}>{children}</main>
      </div>
    </div>
  )
}
