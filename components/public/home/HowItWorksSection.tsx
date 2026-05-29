"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface HowItWorksSectionProps {
  settings: Record<string, string>;
}

const STEPS = [
  {
    num: "1",
    title: "Birkaç soruyu yanıtlayın",
    desc: "İhtiyaçlarınızı, tercihlerinizi ve bütçenizi belirtin. Yapay zeka destekli eşleştirme size en uygun danışmanları listeler.",
    side: "right",
    visual: (
      <div
        style={{
          backgroundColor: "#EDF7ED",
          borderRadius: 16,
          padding: 28,
          minHeight: 200,
        }}
        className="flex items-center justify-center"
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "20px 24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            width: "90%",
          }}
        >
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#4A4D4A", marginBottom: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Danışman tercihlerim
          </p>
          {["Anksiyete / Stres", "İlişki sorunları", "Kariyer & İş hayatı"].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #EEE",
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#252625",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: "#A6DE9B",
                  flexShrink: 0,
                }}
              />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: "2",
    title: "Danışmanınızı seçin",
    desc: "Profilleri, uzmanlık alanlarını ve değerlendirmeleri inceleyin. İlk 15 dakikalık ücretsiz tanışma seansı ayarlayın.",
    side: "left",
    visual: (
      <div
        style={{
          backgroundColor: "#EDF7ED",
          borderRadius: 16,
          padding: 20,
          minHeight: 200,
        }}
        className="flex flex-col gap-3 justify-center"
      >
        {[
          { name: "Uzm. Psk. A.K.", spec: "Anksiyete · Depresyon", rating: "4.9" },
          { name: "Dr. M.Y.", spec: "Çift Terapisi · Aile", rating: "4.8" },
          { name: "Psk. Z.Ç.", spec: "Travma · Kayıp", rating: "4.9" },
        ].map((c) => (
          <div
            key={c.name}
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#325343",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#A6DE9B",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {c.name[5]}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "#252625" }}>{c.name}</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#4A4D4A" }}>{c.spec}</p>
            </div>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#397A4A" }}>
              ★ {c.rating}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "3",
    title: "Seansa başlayın",
    desc: "Video, ses veya mesaj ile dilediğiniz zaman, dilediğiniz yerden danışmanınızla iletişim kurun.",
    side: "right",
    visual: (
      <div
        style={{
          backgroundColor: "#325343",
          borderRadius: 16,
          padding: 24,
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {[
          { icon: "🎥", label: "Video" },
          { icon: "🎙️", label: "Ses" },
          { icon: "💬", label: "Mesaj" },
        ].map((m) => (
          <div key={m.label} className="flex flex-col items-center gap-2">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "rgba(166,222,155,0.15)",
                border: "1px solid rgba(166,222,155,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              {m.icon}
            </div>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 500, color: "#F5F7F5" }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

export function HowItWorksSection({ settings }: HowItWorksSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const itemTransition: Transition = { duration: 0.3, ease: "easeOut" };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: itemTransition },
  };

  const title = settings.how_title ?? "Nasıl Çalışır?";

  return (
    <>
      {/* Krem → açık yeşil-beyaz geçiş */}
      <div style={{ lineHeight: 0, backgroundColor: "#FFFCF6" }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,20 C720,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#F5F7F5" />
        </svg>
      </div>

      <section ref={ref} style={{ backgroundColor: "#F5F7F5" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="text-center mb-16"
            style={{
              fontFamily: "var(--font-overpass)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 300,
              color: "#252625",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="flex flex-col gap-20"
          >
            {STEPS.map((step) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                  step.side === "left" ? "md:[direction:rtl]" : ""
                }`}
              >
                {/* Metin */}
                <div style={{ direction: "ltr" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#A6DE9B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-overpass)",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#325343",
                      }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-overpass)",
                      fontSize: "clamp(20px, 2.5vw, 26px)",
                      fontWeight: 600,
                      color: "#252625",
                      marginBottom: 12,
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 16,
                      color: "#4A4D4A",
                      lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>

                {/* Görsel */}
                <div style={{ direction: "ltr" }}>{step.visual}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Açık → Koyu geçiş */}
      <div style={{ lineHeight: 0, backgroundColor: "#F5F7F5" }}>
        <svg viewBox="0 0 1440 50" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,25 C480,50 960,0 1440,30 L1440,50 L0,50 Z" fill="#325343" />
        </svg>
      </div>
    </>
  );
}
