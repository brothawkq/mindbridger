"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  {
    bolum: "Ana Menü",
    items: [
      { href: "/kurumsal-panel/dashboard", label: "Dashboard"      },
      { href: "/kurumsal-panel/davetler",  label: "Davetler"       },
      { href: "/kurumsal-panel/butce",     label: "Bütçe Yönetimi" },
    ],
  },
  {
    bolum: "Raporlar",
    items: [
      { href: "/kurumsal-panel/raporlar",  label: "Raporlar"  },
      { href: "/kurumsal-panel/faturalar", label: "Faturalar" },
    ],
  },
  {
    bolum: "Hesap",
    items: [
      { href: "/kurumsal-panel/ayarlar", label: "Ayarlar"           },
      { href: "/iletisim",               label: "Destek & İletişim" },
    ],
  },
]

interface Props {
  sirketAdi: string
}

export default function KurumsalSidebar({ sirketAdi }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push("/giris")
    router.refresh()
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
          Kurumsal Panel
        </div>
      </div>

      {/* Şirket bilgisi */}
      <div style={{ padding: "0 16px 12px" }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: "var(--font-inter)",
            fontWeight: 600,
            color: "rgba(245,247,245,0.85)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sirketAdi}
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: "rgba(245,247,245,0.08)", margin: "0 16px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((grup) => (
          <div key={grup.bolum} style={{ marginBottom: 4 }}>
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
              {grup.bolum}
            </div>

            {grup.items.map((item) => {
              const aktif =
                pathname === item.href || pathname.startsWith(item.href + "/")
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
                    fontWeight: aktif ? 600 : 400,
                    color: aktif ? "#A6DE9B" : "rgba(245,247,245,0.75)",
                    backgroundColor: aktif
                      ? "rgba(166,222,155,0.12)"
                      : "transparent",
                    borderLeft: aktif
                      ? "3px solid #A6DE9B"
                      : "3px solid transparent",
                    textDecoration: "none",
                    transition: "background-color 0.1s ease, color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!aktif) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "#F5F7F5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!aktif) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(245,247,245,0.75)";
                    }
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: aktif
                        ? "#A6DE9B"
                        : "rgba(245,247,245,0.2)",
                      flexShrink: 0,
                    }}
                  />
                  {item.label}
                </Link>
              )
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
            (e.currentTarget as HTMLElement).style.color = "#F5F7F5"
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(245,247,245,0.45)"
          }}
        >
          <span style={{ fontSize: 14 }}>→</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
