import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriSidebar from "@/components/musteri/MusteriSidebar";

export default async function PanelimMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const isim =
    `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim() ||
    "Müşteri";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FFFCF6",
        fontFamily: "var(--font-inter)",
      }}
    >
      <MusteriSidebar kullaniciIsim={isim} />
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
              Müşteri
            </span>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "hidden" }}>{children}</main>
      </div>
    </div>
  );
}
