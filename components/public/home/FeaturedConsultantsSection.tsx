"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { DanismanKarti, DanismanKartiVeri } from "@/components/public/DanismanKarti";

interface FeaturedConsultantsSectionProps {
  settings: Record<string, string>;
}

export function FeaturedConsultantsSection({ settings }: FeaturedConsultantsSectionProps) {
  const [consultants, setConsultants] = useState<DanismanKartiVeri[]>([]);
  const [loaded, setLoaded] = useState(false);
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const title = settings.consultants_title ?? "Öne Çıkan Danışmanlar";

  useEffect(() => {
    fetch("/api/danismanlar?limit=4&profile_published=true")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { danismanlar: DanismanKartiVeri[] }) => {
        setConsultants(data.danismanlar ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (loaded && consultants.length === 0) return null;

  const itemTransition: Transition = { duration: 0.28, ease: "easeOut" };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.07 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: itemTransition },
  };

  return (
    <section ref={ref} style={{ backgroundColor: "#FFFCF6" }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "#397A4A",
                marginBottom: 8,
              }}
            >
              {title}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-overpass)",
                fontSize: "clamp(22px, 3vw, 36px)",
                fontWeight: 300,
                color: "#252625",
                lineHeight: 1.2,
              }}
            >
              Uzmanlarımızla{" "}
              <strong style={{ fontWeight: 700 }}>tanışın</strong>
            </h2>
          </div>
          <Link
            href="/danismanlar"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 600,
              color: "#397A4A",
              textDecoration: "underline",
            }}
          >
            Tüm danışmanları gör →
          </Link>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: 260,
                  borderRadius: 12,
                  backgroundColor: "#EDF7ED",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {consultants.map((c) => (
              <motion.div key={c.id} variants={itemVariants}>
                <DanismanKarti danisan={c} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
