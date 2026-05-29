import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DanisanSidebar from "@/components/danisan/DanisanSidebar";

export default async function DanisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const adSoyad =
    `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim() ||
    "Danışman";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FFFCF6",
        fontFamily: "var(--font-inter)",
      }}
    >
      <DanisanSidebar adSoyad={adSoyad} />
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
              Danışman
            </span>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "hidden" }}>{children}</main>
      </div>
    </div>
  );
}
