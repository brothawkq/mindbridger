"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/admin",
  "/danisan",
  "/panelim",
  "/kurumsal-panel",
  "/affiliate-panel",
];

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { href: "/danismanlar",    label: "Danışmanlar"         },
      { href: "/testler",        label: "Psikolojik Testler"  },
      { href: "/blog",           label: "Blog"                },
      { href: "/kaynaklar",      label: "Kaynak Kütüphanesi"  },
      { href: "/webinar",        label: "Webinarlar"          },
      { href: "/fiyatlandirma",  label: "Fiyatlar"            },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/kurumsal",       label: "Kurumsal Çözümler"   },
      { href: "/affiliate",      label: "Affiliate Programı"  },
      { href: "/hakkimizda",     label: "Hakkımızda"          },
      { href: "/iletisim",       label: "İletişim"            },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
      { href: "/kvkk",                label: "KVKK Aydınlatma"     },
      { href: "/sss",                 label: "Sık Sorulan Sorular" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer style={{ backgroundColor: "#325343" }}>
      {/* Ana içerik */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px 36px",
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, auto)",
          gap: 48,
        }}
      >
        {/* Marka */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-overpass), Overpass, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "#F5F7F5",
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            MindBridger
          </div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(245,247,245,0.65)",
              lineHeight: 1.7,
              maxWidth: 220,
            }}
          >
            Türkiye&apos;nin online terapi platformu. Psikolog ve PDR
            danışmanlarına kolayca ulaşın.
          </p>

          <Link
            href="/danisan-kayit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: 20,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#F5F7F5",
              border: "1px solid rgba(245,247,245,0.4)",
              textDecoration: "none",
              borderRadius: 100,
              transition: "border-color 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(245,247,245,0.08)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,247,245,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,247,245,0.4)";
            }}
          >
            Danışman Ol →
          </Link>
        </div>

        {/* Link grupları */}
        {FOOTER_LINKS.map((group) => (
          <div key={group.title}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(245,247,245,0.4)",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(245,247,245,0.1)",
              }}
            >
              {group.title}
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 13,
                    color: "rgba(245,247,245,0.65)",
                    textDecoration: "none",
                    transition: "color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "#A6DE9B")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(245,247,245,0.65)")
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Alt bar */}
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.15)",
          borderTop: "1px solid rgba(245,247,245,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(245,247,245,0.45)" }}>
            © {year} MindBridger. Tüm hakları saklıdır.
          </span>
          <span style={{ fontSize: 12, color: "rgba(245,247,245,0.45)" }}>
            Türkiye · UTC+3 · TL
          </span>
        </div>
      </div>
    </footer>
  );
}
