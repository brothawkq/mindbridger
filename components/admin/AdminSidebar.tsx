"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    bolum: "Genel",
    items: [
      { href: "/admin/dashboard",  label: "Dashboard"  },
      { href: "/admin/randevular", label: "Randevular" },
      { href: "/admin/kullanicilar", label: "Kullanıcılar" },
    ],
  },
  {
    bolum: "Danışmanlar",
    items: [
      { href: "/admin/danismanlar/basvurular", label: "Başvurular" },
      { href: "/admin/danismanlar",            label: "Danışman Listesi" },
    ],
  },
  {
    bolum: "Finans",
    items: [
      { href: "/admin/finans",    label: "Ödemeler & İadeler" },
      { href: "/admin/affiliate", label: "Affiliate" },
    ],
  },
  {
    bolum: "İçerik",
    items: [
      { href: "/admin/icerik",        label: "Blog & Testler" },
      { href: "/admin/site-settings", label: "Site İçeriği"  },
    ],
  },
  {
    bolum: "Sistem",
    items: [
      { href: "/admin/ayarlar",       label: "Ayarlar" },
      { href: "/admin/raporlar/loglar", label: "Loglar" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function cikisYap() {
    await supabase.auth.signOut();
    router.push("/giris");
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        backgroundColor: "#325343",
        borderRight: "1px solid rgba(245,247,245,0.1)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div
          style={{
            fontFamily: "var(--font-overpass)",
            fontSize: 18,
            fontWeight: 700,
            color: "#A6DE9B",
            letterSpacing: 0.5,
          }}
        >
          MindBridger
        </div>
        <div
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            color: "rgba(245,247,245,0.4)",
            marginTop: 2,
          }}
        >
          Admin Paneli
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "rgba(245,247,245,0.08)", margin: "0 16px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((sec) => (
          <div key={sec.bolum} style={{ marginBottom: 4 }}>
            {/* Bölüm başlığı */}
            <div
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(245,247,245,0.35)",
                padding: "10px 16px 4px",
              }}
            >
              {sec.bolum}
            </div>

            {/* Nav items */}
            {sec.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 16px",
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#A6DE9B" : "rgba(245,247,245,0.75)",
                    backgroundColor: active
                      ? "rgba(166,222,155,0.12)"
                      : "transparent",
                    borderLeft: active
                      ? "3px solid #A6DE9B"
                      : "3px solid transparent",
                    textDecoration: "none",
                    transition: "background-color 0.1s ease, color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "#F5F7F5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,247,245,0.75)";
                    }
                  }}
                >
                  {/* Aktif gösterge nokta */}
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: active
                        ? "#A6DE9B"
                        : "rgba(245,247,245,0.2)",
                      flexShrink: 0,
                    }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "rgba(245,247,245,0.08)", margin: "0 16px" }} />

      {/* Logout */}
      <div style={{ padding: "12px 16px" }}>
        <button
          onClick={cikisYap}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            color: "rgba(245,247,245,0.45)",
            padding: "6px 0",
            transition: "color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#F5F7F5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(245,247,245,0.45)";
          }}
        >
          <span style={{ fontSize: 14 }}>→</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
