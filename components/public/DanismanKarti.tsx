"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ─── Tip ─────────────────────────────────────────────────────────
export interface DanismanKartiVeri {
  id: string;
  slug: string;
  title: string | null;
  specialties: string[] | null;
  city: string | null;
  is_online: boolean;
  is_in_person: boolean;
  intro_session_enabled: boolean;
  price_individual: number | null;
  sliding_scale: boolean;
  sliding_scale_price: number | null;
  average_rating: number;
  total_reviews: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  danisan: DanismanKartiVeri;
  /** Cascade animasyonu için sıra indeksi */
  index?: number;
}

// ─── Bileşen ─────────────────────────────────────────────────────
export function DanismanKarti({ danisan, index = 0 }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const adSoyad =
    [danisan.profiles?.first_name, danisan.profiles?.last_name]
      .filter(Boolean)
      .join(" ") || "—";

  const baslikSehir =
    [danisan.title, danisan.city].filter(Boolean).join(" · ");

  const uzmanliklar = danisan.specialties ?? [];
  const gosterilen  = uzmanliklar.slice(0, 3);
  const kalan       = Math.max(0, uzmanliklar.length - 3);

  // Stagger delay max 8 karta kadar sınırlanır; daha fazlası UX'i bozar
  const delay = shouldReduceMotion ? 0 : Math.min(index, 8) * 0.05;

  return (
    <motion.article
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2, ease: "easeOut" }}
      whileHover={shouldReduceMotion ? {} : {
        y: -2,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: { duration: 0.15 },
      }}
      style={{ height: "100%" }}
    >
      <div
        style={{
          backgroundColor: "var(--mb-surface)",
          border: "1.5px solid var(--mb-border)",
          padding: "12px 12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* ── Üst: Avatar + İsim + Lokasyon ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Avatar */}
          <div
            style={{
              width: 46,
              height: 46,
              flexShrink: 0,
              border: "1.5px solid var(--mb-border)",
              overflow: "hidden",
              position: "relative",
              backgroundColor: "var(--mb-bg)",
            }}
          >
            {danisan.profiles?.avatar_url ? (
              <Image
                src={danisan.profiles.avatar_url}
                alt={adSoyad}
                fill
                sizes="46px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--mb-muted)",
                }}
              >
                {(danisan.profiles?.first_name?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>

          {/* İsim + Unvan + Lokasyon */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--mb-text)",
                marginBottom: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {adSoyad}
            </div>

            {baslikSehir && (
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--mb-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {baslikSehir}
              </div>
            )}
          </div>
        </div>

        {/* ── Uzmanlık etiketleri ── */}
        {gosterilen.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {gosterilen.map((u) => (
              <span
                key={u}
                style={{
                  fontSize: 10,
                  border: "1px solid var(--mb-border)",
                  padding: "2px 7px",
                  color: "var(--mb-text)",
                  backgroundColor: "var(--mb-bg)",
                }}
              >
                {u}
              </span>
            ))}
            {kalan > 0 && (
              <span
                style={{
                  fontSize: 10,
                  border: "1px dashed var(--mb-border)",
                  padding: "2px 7px",
                  color: "var(--mb-muted)",
                }}
              >
                +{kalan} daha
              </span>
            )}
          </div>
        )}

        {/* ── Puan + Fiyat ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid var(--mb-border)",
          }}
        >
          {/* Puan */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              aria-label={`${danisan.average_rating.toFixed(1)} üzerinden 5 puan`}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)" }}
            >
              ★ {danisan.average_rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: "var(--mb-muted)" }}>
              ({danisan.total_reviews})
            </span>
          </div>

          {/* Fiyat */}
          <div>
            {danisan.price_individual !== null ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>
                {danisan.price_individual.toLocaleString("tr-TR")} ₺
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--mb-muted)",
                    fontWeight: 400,
                    marginLeft: 2,
                  }}
                >
                  / seans
                </span>
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--mb-muted)" }}>
                Fiyat belirtilmemiş
              </span>
            )}
          </div>
        </div>

        {/* ── Esnek fiyat ── */}
        {danisan.sliding_scale && (
          <span
            style={{
              fontSize: 9,
              border: "1px dashed var(--mb-border)",
              padding: "2px 6px",
              color: "var(--mb-muted)",
              alignSelf: "flex-start",
            }}
          >
            {`Esnek fiyat${danisan.sliding_scale_price ? `: ${danisan.sliding_scale_price.toLocaleString("tr-TR")}₺` : ""}`}
          </span>
        )}

        {/* ── CTA — wireframe btn-profile: outline stil (beyaz zemin, siyah kenarlık) ── */}
        <Link
          href={`/danismanlar/${danisan.slug}`}
          style={{
            display: "block",
            textAlign: "center",
            backgroundColor: "var(--mb-surface)",
            color: "var(--mb-text)",
            border: "1.5px solid var(--mb-border-strong)",
            padding: "7px",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Profil İncele
        </Link>
      </div>
    </motion.article>
  );
}
