"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface FaqItem {
  name: string;
  acceptedAnswer: { text: string };
}

interface FaqSectionProps {
  faqs: FaqItem[];
}

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <div style={{ borderBottom: "1px solid #D4E4D8" }}>
      <button
        className="w-full text-left flex items-center justify-between gap-4 py-5"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 15,
            fontWeight: open ? 600 : 400,
            color: "#252625",
          }}
        >
          {item.name}
        </span>
        <span
          style={{
            fontSize: 22,
            color: "#397A4A",
            flexShrink: 0,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: prefersReduced ? "none" : "transform 0.2s ease",
            display: "inline-block",
            lineHeight: 1,
          }}
        >
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReduced ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="pb-5"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "#4A4D4A",
                lineHeight: 1.7,
              }}
            >
              {item.acceptedAnswer.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection({ faqs }: FaqSectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const itemTransition: Transition = { duration: 0.22, ease: "easeOut" };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReduced ? 0 : 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: itemTransition },
  };

  return (
    <>
      {/* İllüstrasyon şeridi — bg ve SVG fill hardcoded */}
      <div
        style={{
          backgroundColor: "#FFFCF6",
          position: "relative",
          overflow: "hidden",
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "10%",
        }}
      >
        <svg viewBox="0 0 120 120" fill="none" width="130" height="130" opacity={0.5}>
          {/* Oturan meditasyon figürü */}
          <ellipse cx="60" cy="90" rx="30" ry="12" fill="#D4E4D8" />
          <circle cx="60" cy="45" r="18" fill="rgba(50,83,67,0.15)" />
          <path d="M45 70 Q60 60 75 70 L78 90 Q60 95 42 90 Z" fill="rgba(50,83,67,0.1)" />
          {/* Bitki */}
          <path d="M90 80 C90 60 100 50 105 40" stroke="#397A4A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="108" cy="36" rx="8" ry="12" fill="#397A4A" opacity="0.4" transform="rotate(-20 108 36)" />
          <ellipse cx="100" cy="50" rx="7" ry="10" fill="#397A4A" opacity="0.3" transform="rotate(15 100 50)" />
        </svg>
        {/* Dekoratif daire */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: "15%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(166,222,155,0.25)",
          }}
        />
      </div>

      {/* FAQ accordion */}
      <section ref={ref} style={{ backgroundColor: "#FFFCF6" }}>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2
            className="text-center mb-10"
            style={{
              fontFamily: "var(--font-overpass)",
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 300,
              color: "#252625",
              lineHeight: 1.2,
            }}
          >
            Sık Sorulan Sorular
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={itemVariants}>
                <FaqAccordionItem item={faq} />
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Link
              href="/sss"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: 600,
                color: "#397A4A",
                textDecoration: "underline",
              }}
            >
              Daha fazla soru için tıklayın
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
