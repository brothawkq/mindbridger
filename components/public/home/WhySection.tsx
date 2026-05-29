"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface WhySectionProps {
  settings: Record<string, string>;
}

const PLACEHOLDER_CONSULTANTS = [
  { initials: "AK", bg: "#397A4A", title: "Klinik Psikolog" },
  { initials: "MD", bg: "#457777", title: "PDR Uzmanı" },
  { initials: "ZA", bg: "#325343", title: "Psikoterapist" },
  { initials: "CY", bg: "#A75D00", title: "Psikolog" },
];

const FEATURES = [
  "Onaylı & lisanslı danışmanlar",
  "Güvenli online ödeme (iyzico)",
  "KVKK & gizlilik uyumlu",
  "Video + mesaj seçeneği",
  "24 saat iptal garantisi",
  "Kurumsal paketler mevcut",
];

export function WhySection({ settings }: WhySectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  const title = settings.why_title ?? "Neden MindBridger?";

  const itemTransition: Transition = { duration: 0.3, ease: "easeOut" };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.07 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: prefersReduced ? 0 : -14 },
    visible: { opacity: 1, x: 0, transition: itemTransition },
  };

  const photoVariants: Variants = {
    hidden: { opacity: 0, scale: prefersReduced ? 1 : 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <section ref={ref} style={{ backgroundColor: "#325343" }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Sol */}
          <div className="flex flex-col gap-6">
            <div>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#A6DE9B",
                  marginBottom: 14,
                }}
              >
                {title}
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-overpass)",
                  fontSize: "clamp(26px, 3.5vw, 40px)",
                  fontWeight: 300,
                  color: "#F5F7F5",
                  lineHeight: 1.25,
                }}
              >
                Onaylı, lisanslı uzmanlarla
                <br />
                <strong style={{ fontWeight: 700, color: "#A6DE9B" }}>
                  güvenle çalışın
                </strong>
              </h2>
            </div>

            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                color: "rgba(245,247,245,0.7)",
                lineHeight: 1.7,
              }}
            >
              Tüm danışmanlarımız diploma ve lisans doğrulamasından geçmiştir.
              Uyumsuzluk durumunda ücretsiz değişim garantisi sunuyoruz.
            </p>

            <motion.ul
              className="flex flex-col gap-3"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              {FEATURES.map((feat) => (
                <motion.li
                  key={feat}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "#A6DE9B",
                      color: "#325343",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 15,
                      color: "rgba(245,247,245,0.85)",
                    }}
                  >
                    {feat}
                  </span>
                </motion.li>
              ))}
            </motion.ul>

            <Link
              href="/danismanlar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#A6DE9B",
                color: "#325343",
                borderRadius: 100,
                padding: "13px 28px",
                fontFamily: "var(--font-inter)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                alignSelf: "flex-start",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#8ED485";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#A6DE9B";
              }}
            >
              Danışmanla eşleş →
            </Link>
          </div>

          {/* Sağ: Danışman grid */}
          <motion.div
            variants={photoVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {PLACEHOLDER_CONSULTANTS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: c.bg,
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    minHeight: i === 0 ? 260 : 130,
                    ...(i === 0 ? { gridRow: "1 / 3" } : {}),
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-overpass)",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {c.initials}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {c.title}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dalga: koyu → krem */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,28 C720,56 1080,0 1440,28 L1440,56 L0,56 Z" fill="#FFFCF6" />
        </svg>
      </div>
    </section>
  );
}
