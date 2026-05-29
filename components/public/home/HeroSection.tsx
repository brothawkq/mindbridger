"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";

interface HeroSectionProps {
  settings: Record<string, string>;
}

const CATEGORIES = [
  {
    href: "/danismanlar?tur=bireysel",
    label: "Bireysel",
    sub: "Kendim için",
    bg: "#397A4A",
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-14 h-14 mx-auto">
        <circle cx="40" cy="28" r="14" fill="rgba(255,255,255,0.25)" />
        <circle cx="40" cy="28" r="10" fill="rgba(255,255,255,0.55)" />
        <ellipse cx="40" cy="58" rx="20" ry="10" fill="rgba(255,255,255,0.2)" />
        <line x1="40" y1="42" x2="40" y2="56" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="50" x2="40" y2="44" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
        <line x1="52" y1="50" x2="40" y2="44" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/danismanlar?tur=cift",
    label: "Çift",
    sub: "Partnerimle birlikte",
    bg: "#457777",
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-14 h-14 mx-auto">
        <circle cx="29" cy="27" r="10" fill="rgba(255,255,255,0.55)" />
        <circle cx="51" cy="27" r="10" fill="rgba(255,255,255,0.55)" />
        <ellipse cx="29" cy="54" rx="13" ry="9" fill="rgba(255,255,255,0.2)" />
        <ellipse cx="51" cy="54" rx="13" ry="9" fill="rgba(255,255,255,0.2)" />
        <path d="M35 47 Q40 42 45 47" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/kurumsal",
    label: "Kurumsal",
    sub: "Şirketim için",
    bg: "#243d30",
    illustration: (
      <svg viewBox="0 0 80 80" fill="none" className="w-14 h-14 mx-auto">
        <rect x="18" y="18" width="44" height="44" rx="6" fill="rgba(255,255,255,0.15)" />
        <rect x="25" y="28" width="11" height="11" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="44" y="28" width="11" height="11" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="25" y="46" width="30" height="7" rx="2" fill="rgba(255,255,255,0.35)" />
      </svg>
    ),
  },
];

const cardTransition: Transition = { duration: 0.22, ease: "easeOut" };

export function HeroSection({ settings }: HeroSectionProps) {
  const prefersReduced = useReducedMotion();

  return (
    <section
      style={{ backgroundColor: "#325343", overflow: "hidden", paddingBottom: 0 }}
    >
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-0 text-center">
        {/* Üst etiket */}
        <motion.p
          initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "#A6DE9B",
            marginBottom: 20,
          }}
        >
          Türkiye&apos;nin Online Terapi Platformu
        </motion.p>

        {/* Ana başlık */}
        <motion.h1
          initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            fontFamily: "var(--font-overpass)",
            fontSize: "clamp(36px, 5.5vw, 56px)",
            fontWeight: 300,
            color: "#F5F7F5",
            lineHeight: 1.18,
            marginBottom: 14,
          }}
        >
          {settings.hero_title_1 ?? "Mutlu hissetmeyi"}
          <br />
          <span style={{ fontWeight: 700, color: "#A6DE9B" }}>
            {settings.hero_title_2 ?? "hak ediyorsunuz."}
          </span>
        </motion.h1>

        {/* Alt başlık */}
        <motion.p
          initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 18,
            fontWeight: 400,
            color: "rgba(245,247,245,0.72)",
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          {settings.hero_subtitle ?? "Hangi terapi türünü arıyorsunuz?"}
        </motion.p>

        {/* CTA Butonlar */}
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/danismanlar"
            style={{
              fontFamily: "var(--font-inter)",
              backgroundColor: "#A6DE9B",
              color: "#325343",
              borderRadius: 100,
              padding: "15px 36px",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#8ED485";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#A6DE9B";
            }}
          >
            Danışman Bul →
          </Link>
          <Link
            href="/kayit"
            style={{
              fontFamily: "var(--font-inter)",
              backgroundColor: "transparent",
              color: "#F5F7F5",
              border: "1px solid rgba(245,247,245,0.6)",
              borderRadius: 100,
              padding: "15px 36px",
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-block",
              transition: "border-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#F5F7F5";
              (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,247,245,0.6)";
              (e.currentTarget as HTMLElement).style.color = "#F5F7F5";
            }}
          >
            Ücretsiz Başla
          </Link>
        </motion.div>

        {/* 3 Kategori kartı */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...cardTransition, delay: 0.3 + i * 0.07 }}
            >
              <Link
                href={cat.href}
                className="flex flex-col items-center gap-3 p-6 text-white group"
                style={{
                  backgroundColor: cat.bg,
                  borderRadius: 12,
                  textDecoration: "none",
                  display: "flex",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (!prefersReduced) {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                {cat.illustration}
                <div>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 700, marginBottom: 2, color: "#fff" }}>
                    {cat.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                    {cat.sub} →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Alt not */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            color: "rgba(245,247,245,0.5)",
            marginTop: 24,
            marginBottom: 0,
          }}
        >
          İlk 15 dakika ücretsiz tanışma · Lisanslı uzmanlar · KVKK uyumlu
        </motion.p>
      </div>

      {/* Organik dalga — kreme geçiş. fill hardcoded! */}
      <div style={{ lineHeight: 0, marginTop: 48 }}>
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill="#FFFCF6" />
        </svg>
      </div>
    </section>
  );
}
