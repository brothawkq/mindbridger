"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export function KurumsalCtaSection() {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      ref={ref}
      style={{ backgroundColor: "#FFFCF6", position: "relative", overflow: "hidden" }}
    >
      {/* Dekoratif daireler */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: "50%",
          backgroundColor: "rgba(50,83,67,0.06)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: "50%",
          backgroundColor: "rgba(166,222,155,0.2)",
          pointerEvents: "none",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          {/* Sol */}
          <div className="flex flex-col gap-4">
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "#397A4A",
                marginBottom: 4,
              }}
            >
              Kurumsal Çözümler
            </p>
            <h2
              style={{
                fontFamily: "var(--font-overpass)",
                fontSize: "clamp(24px, 3.5vw, 40px)",
                fontWeight: 300,
                color: "#252625",
                lineHeight: 1.25,
              }}
            >
              Çalışanlarınıza
              <br />
              <strong style={{ fontWeight: 700, color: "#325343" }}>
                psikolojik destek sunun
              </strong>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                color: "#4A4D4A",
                lineHeight: 1.7,
              }}
            >
              Toplu terapi paketleri, anonim kullanım raporları ve kurumsal
              panelle çalışan refahını ölçün. 10+ sektörde 200+ şirketin tercihi.
            </p>
          </div>

          {/* Sağ */}
          <div className="flex md:justify-end">
            <Link
              href="/kurumsal"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#A6DE9B",
                color: "#325343",
                borderRadius: 100,
                padding: "15px 32px",
                fontFamily: "var(--font-inter)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#8ED485";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#A6DE9B";
              }}
            >
              Demo talep edin →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
