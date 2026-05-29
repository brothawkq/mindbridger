"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface TestimonialsSectionProps {
  settings: Record<string, string>;
}

const TESTIMONIALS = [
  {
    stars: 5,
    quote: "MindBridger sayesinde kısa sürede güvendiğim bir terapist buldum. Seans süreci son derece pürüzsüz geçti. Artık haftalık seanslarımı sabırsızlıkla bekliyorum.",
    name: "Elif K.",
    role: "Bireysel Kullanıcı",
  },
  {
    stars: 5,
    quote: "Çift terapisine adım atmak zor geliyordu. Platform bunu çok kolaylaştırdı. Video kalitesi mükemmeldi, danışmanımız çok profesyoneldi.",
    name: "Mert & Zeynep A.",
    role: "Çift Terapisi",
  },
  {
    stars: 5,
    quote: "80 çalışanımız için kurumsal paketi kullandık. İK süreçlerimizi doğrudan destekledi, kullanım raporları çok detaylıydı.",
    name: "Selin D.",
    role: "İK Direktörü — Fortune 500",
  },
];

export function TestimonialsSection({ settings }: TestimonialsSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const title = settings.testimonials_title ?? "Kullanıcılar Ne Diyor?";

  const itemTransition: Transition = { duration: 0.32, ease: "easeOut" };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: itemTransition },
  };

  return (
    <section ref={ref} style={{ backgroundColor: "#325343" }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "#A6DE9B",
              marginBottom: 12,
            }}
          >
            {title}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-overpass)",
              fontSize: "clamp(24px, 3.5vw, 42px)",
              fontWeight: 300,
              color: "#F5F7F5",
              lineHeight: 1.2,
            }}
          >
            Binlerce kullanıcı{" "}
            <strong style={{ fontWeight: 700 }}>güveniyor</strong>
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex flex-col gap-4 p-7"
              style={{
                backgroundColor: "rgba(245,247,245,0.06)",
                border: "1px solid rgba(245,247,245,0.12)",
                borderRadius: 12,
              }}
            >
              {/* Yıldızlar */}
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <span key={j} style={{ color: "#F5C518", fontSize: 15 }}>★</span>
                ))}
              </div>

              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 14,
                  color: "rgba(245,247,245,0.82)",
                  lineHeight: 1.7,
                  flex: 1,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#F5F7F5",
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    color: "rgba(245,247,245,0.55)",
                    marginTop: 2,
                  }}
                >
                  {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dalga: dark → krem */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 54" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,27 C480,54 960,0 1440,27 L1440,54 L0,54 Z" fill="#FFFCF6" />
        </svg>
      </div>
    </section>
  );
}
