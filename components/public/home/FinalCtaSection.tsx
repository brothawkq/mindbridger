"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface FinalCtaSectionProps {
  settings: Record<string, string>;
}

export function FinalCtaSection({ settings }: FinalCtaSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const title = settings.cta_final_title ?? "Bugün başlayın";
  const sub =
    settings.cta_final_sub ??
    "İlk tanışma seansınız ücretsiz. Hemen danışman seçin.";

  return (
    <section ref={ref} style={{ backgroundColor: "#FFFCF6" }}>
      {/* Üst dalga — krem üzerinde krem geçiş gizle, sadece hafif sınır */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,20 C480,40 960,0 1440,20 L1440,0 L0,0 Z" fill="#F5F7F5" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: prefersReduced ? 0 : 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-2xl px-6 py-16 text-center flex flex-col items-center gap-6"
      >
        <h2
          style={{
            fontFamily: "var(--font-overpass)",
            fontSize: "clamp(28px, 4.5vw, 48px)",
            fontWeight: 300,
            color: "#252625",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 16,
            color: "#4A4D4A",
            lineHeight: 1.6,
          }}
        >
          {sub}
        </p>

        <Link
          href="/kayit"
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#A6DE9B",
            color: "#325343",
            borderRadius: 100,
            padding: "15px 40px",
            fontFamily: "var(--font-inter)",
            fontWeight: 600,
            fontSize: 16,
            textDecoration: "none",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#8ED485";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#A6DE9B";
          }}
        >
          Ücretsiz Başlayın →
        </Link>

        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            color: "rgba(74,77,74,0.6)",
          }}
        >
          Kredi kartı gerekmez · İstediğiniz zaman iptal edin
        </p>
      </motion.div>
    </section>
  );
}
