"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Filtre = "tumu" | "aktif" | "pasif" | "bekleyen";

interface DanismanSatir {
  id: string;
  title: string | null;
  city: string | null;
  average_rating: number;
  total_sessions: number;
  profile_published: boolean;
  updated_at: string;
  slug: string;
  specialties: string[] | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
  } | null;
}

interface Props {
  danismanlar: DanismanSatir[];
  toplamSayfa: number;
  toplamKayit: number;
  mevcutSayfa: number;
  mevcutFiltre: Filtre;
  mevcutQ: string;
}

const FILTRELER: { key: Filtre; label: string }[] = [
  { key: "tumu", label: "Tümü" },
  { key: "aktif", label: "Aktif" },
  { key: "pasif", label: "Pasif" },
  { key: "bekleyen", label: "Onay Bekleyen" },
];

const DURUM_RENK: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "#F5F7F5", text: "#252625", label: "Aktif" },
  pending: { bg: "#FFF9E6", text: "#856404", label: "Bekleyen" },
  suspended: { bg: "#FFF0F0", text: "#C62828", label: "Askıda" },
  rejected: { bg: "#F5F7F5", text: "#4A4D4A", label: "Reddedildi" },
};

export default function DanismanlarListeKlient({
  danismanlar,
  toplamSayfa,
  toplamKayit,
  mevcutSayfa,
  mevcutFiltre,
  mevcutQ,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(overrides: Partial<{ filtre: Filtre; sayfa: number; q: string }>) {
    const p = new URLSearchParams();
    const filtre = overrides.filtre ?? mevcutFiltre;
    const sayfa = overrides.sayfa ?? 1;
    const q = overrides.q !== undefined ? overrides.q : mevcutQ;
    if (filtre !== "tumu") p.set("filtre", filtre);
    if (sayfa > 1) p.set("sayfa", String(sayfa));
    if (q) p.set("q", q);
    const qs = p.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  function handleArama(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get("q") as string).trim();
    router.push(buildUrl({ q, sayfa: 1 }));
  }

  const formatTarih = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "var(--mb-bg)",
        minHeight: "100%",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      {/* Başlık */}
      <div
        style={{
          borderBottom: "1.5px solid #325343",
          paddingBottom: 16,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--mb-muted)",
              marginBottom: 4,
            }}
          >
            Danışmanlar
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", margin: 0 }}>
            Danışman Listesi
          </h1>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--mb-muted)",
          }}
        >
          {toplamKayit} kayıt
        </span>
      </div>

      {/* Filtre Sekmeleri + Arama */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 0, border: "1.5px solid var(--mb-border)" }}>
          {FILTRELER.map((f, i) => (
            <Link
              key={f.key}
              href={buildUrl({ filtre: f.key, sayfa: 1 })}
              style={{
                display: "inline-block",
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: mevcutFiltre === f.key ? 700 : 400,
                color: mevcutFiltre === f.key ? "#FFFFFF" : "var(--mb-text)",
                backgroundColor: mevcutFiltre === f.key ? "#252625" : "var(--mb-surface)",
                borderLeft: i > 0 ? "1px solid var(--mb-border)" : "none",
                textDecoration: "none",
              }}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleArama} style={{ display: "flex", gap: 8 }}>
          <input
            name="q"
            defaultValue={mevcutQ}
            placeholder="Soyad ile ara..."
            style={{
              padding: "7px 12px",
              fontSize: 12,
              border: "1.5px solid #325343",
              backgroundColor: "var(--mb-surface)",
              color: "var(--mb-text)",
              outline: "none",
              width: 180,
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "7px 14px",
              backgroundColor: "var(--mb-primary)",
              color: "var(--mb-primary-text)",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Ara
          </button>
        </form>
      </div>

      {/* Tablo */}
      <div
        style={{
          border: "1.5px solid var(--mb-border)",
          backgroundColor: "var(--mb-surface)",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#F5F7F5" }}>
              {["Ad Soyad", "Unvan", "Uzmanlık", "Şehir", "Puan", "Seans", "Durum", "Güncelleme", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      color: "var(--mb-muted)",
                      borderBottom: "1px solid var(--mb-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {danismanlar.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--mb-muted)",
                    fontSize: 13,
                  }}
                >
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              danismanlar.map((d, i) => {
                const adSoyad =
                  [d.profiles?.first_name, d.profiles?.last_name]
                    .filter(Boolean)
                    .join(" ") || "—";
                const durum = d.profiles?.status ?? "unknown";
                const durumBilgi = DURUM_RENK[durum] ?? {
                  bg: "#F5F7F5",
                  text: "#4A4D4A",
                  label: durum,
                };
                return (
                  <tr
                    key={d.id}
                    style={{
                      borderTop: i > 0 ? "1px solid var(--mb-border)" : "none",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--mb-text)" }}>
                      {adSoyad}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--mb-muted)" }}>
                      {d.title ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--mb-muted)",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.specialties?.slice(0, 2).join(", ") ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--mb-muted)" }}>
                      {d.city ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--mb-text)", fontWeight: 600 }}>
                      {d.average_rating.toFixed(1)}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--mb-muted)" }}>
                      {d.total_sessions}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: durumBilgi.bg,
                          color: durumBilgi.text,
                          border: "1px solid currentColor",
                          letterSpacing: "0.4px",
                          textTransform: "uppercase",
                        }}
                      >
                        {durumBilgi.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--mb-muted)", whiteSpace: "nowrap" }}>
                      {formatTarih(d.updated_at)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Link
                        href={`/admin/danismanlar/${d.id}`}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--mb-text)",
                          textDecoration: "underline",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Profili Gör →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {toplamSayfa > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--mb-muted)" }}>
            Sayfa {mevcutSayfa} / {toplamSayfa}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {mevcutSayfa > 1 && (
              <Link
                href={buildUrl({ sayfa: mevcutSayfa - 1 })}
                style={{
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1.5px solid #325343",
                  color: "var(--mb-text)",
                  textDecoration: "none",
                  backgroundColor: "var(--mb-surface)",
                }}
              >
                ← Önceki
              </Link>
            )}
            {mevcutSayfa < toplamSayfa && (
              <Link
                href={buildUrl({ sayfa: mevcutSayfa + 1 })}
                style={{
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: "#325343",
                  color: "#F5F7F5",
                  textDecoration: "none",
                  border: "1.5px solid #325343",
                }}
              >
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
