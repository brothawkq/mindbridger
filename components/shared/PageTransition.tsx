"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Sayfa geçişlerini Framer Motion ile sarar.
 * `app/layout.tsx` içinde kullanılır; her route değişiminde tetiklenir.
 *
 * [FIX #17] prefers-reduced-motion: CSS workaround yerine Framer Motion'ın
 * yerleşik useReducedMotion() hook'u kullanıldı. CSS'ye bağımlılık yok;
 * hareket hassasiyeti olan kullanıcılar için yalnızca opacity geçişi yapılır.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname           = usePathname();
  const prefersReduced     = useReducedMotion(); // [FIX #17]

  // Hareket azaltılmışsa yalnızca opacity; aksi hâlde tam geçiş
  const variants = prefersReduced
    ? {
        hidden:  { opacity: 0 },
        visible: { opacity: 1 },
        exit:    { opacity: 0 },
      }
    : {
        hidden:  { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0  },
        exit:    { opacity: 0, y: -6 },
      };

  const transition = {
    duration: prefersReduced ? 0.01 : 0.2,
    ease: "easeOut" as const,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={transition}
        id="page-transition-wrapper"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
