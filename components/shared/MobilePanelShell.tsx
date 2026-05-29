"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface MobilePanelShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  rolLabel: string;
}

export default function MobilePanelShell({ children, sidebar, rolLabel }: MobilePanelShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  // Sayfa değişince kapat
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#FFFCF6", fontFamily: "var(--font-inter)" }}>

      {/* Desktop sidebar — md ve üstünde her zaman görünür */}
      <div className="hidden md:flex">
        {sidebar}
      </div>

      {/* Mobil sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Karartma */}
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 48,
              }}
            />
            {/* Sidebar drawer */}
            <motion.div
              className="md:hidden"
              initial={prefersReduced ? { opacity: 0 } : { x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: "easeOut" }}
              style={{
                position: "fixed", top: 0, left: 0, bottom: 0,
                zIndex: 49,
                display: "flex",
              }}
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* İçerik */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Panel üst bar */}
        <header
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #D4E4D8",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mobil hamburger */}
            <button
              className="flex md:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Menüyü aç"
              style={{
                width: 34, height: 34,
                alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: "1px solid #D4E4D8",
                color: "#325343",
                cursor: "pointer",
                borderRadius: 8,
                fontSize: 16,
                marginRight: 4,
              }}
            >
              ☰
            </button>
            <span style={{ fontFamily: "var(--font-overpass)", fontSize: 15, fontWeight: 600, color: "#252625" }}>
              MindBridger
            </span>
            <span style={{ backgroundColor: "rgba(50,83,67,0.08)", color: "#325343", borderRadius: 100, padding: "2px 10px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600 }}>
              {rolLabel}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, overflow: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
