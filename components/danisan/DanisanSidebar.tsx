"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    bolum: "Genel",
    items: [
      { href: "/danisan/dashboard",  label: "Dashboard"     },
      { href: "/danisan/randevular", label: "Randevular"    },
      { href: "/danisan/takvim",     label: "Takvim"        },
    ],
  },
  {
    bolum: "Danışanlar",
    items: [
      { href: "/danisan/danisanlar", label: "Danışanlarım" },
      { href: "/danisan/mesajlar",   label: "Mesajlar"     },
    ],
  },
  {
    bolum: "İçerik",
    items: [
      { href: "/danisan/blog",    label: "Blog Yazıları" },
      { href: "/danisan/webinar", label: "Webinarlarım"  },
    ],
  },
  {
    bolum: "Finans",
    items: [{ href: "/danisan/finans", label: "Gelirlerim" }],
  },
  {
    bolum: "Araçlar",
    items: [
      { href: "/danisan/onboarding-formlar", label: "Formlar"       },
      { href: "/danisan/odevler",            label: "Ödevler"       },
      { href: "/danisan/supervizyon",        label: "Süpervizyon"   },
      { href: "/danisan/performans",         label: "Performans"    },
    ],
  },
  {
    bolum: "Hesap",
    items: [
      { href: "/danisan/profil",   label: "Profilim" },
      { href: "/danisan/ayarlar",  label: "Ayarlar"  },
    ],
  },
];

interface Props {
  adSoyad?: string;
}

export default function DanisanSidebar({ adSoyad = "Danışman" }: Props) {
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
          Danışman Paneli
        </div>
      </div>

      {/* User info */}
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
          {adSoyad}
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
