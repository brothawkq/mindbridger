"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Chatbot } from "@/components/shared/Chatbot";
import PanelChatbot from "@/components/shared/PanelChatbot";

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const PANEL_W = 320;
const PANEL_H_FULL = 480;
const PANEL_H_MIN = 48;

// Admin, kurumsal, affiliate rollerde chatbot görünmez
const HIDDEN_ROLES = new Set(["admin", "kurumsal", "affiliate"]);

// Public sayfalarda visitor chatbot göster
const PUBLIC_PREFIXES = [
  "/danismanlar", "/blog", "/testler", "/kaynaklar",
  "/fiyatlandirma", "/hakkimizda", "/iletisim", "/webinar",
  "/sss", "/kurumsal", "/affiliate",
];

// Panel sayfaları
const PANEL_PREFIXES = ["/panelim", "/danisan"];

interface Props {
  userRole: string | null;
}

export default function ChatbotWrapper({ userRole }: Props) {
  const prefersReduced = useReducedMotion();
  const currentPath = usePathname();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // ── localStorage: minimize restore ────────────────────────────────────────
  useEffect(() => {
    try {
      if (localStorage.getItem("mb_chatbot_minimized") === "1") {
        setMinimized(true);
      }
    } catch { /* ignore */ }
  }, []);

  // ── "mindbridger:open-chatbot" event ──────────────────────────────────────
  const handleOpenEvent = useCallback(() => {
    setSessionKey((k) => k + 1);
    setOpen(true);
    setMinimized(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mindbridger:open-chatbot", handleOpenEvent);
    return () => window.removeEventListener("mindbridger:open-chatbot", handleOpenEvent);
  }, [handleOpenEvent]);

  // ── Görünürlük kontrolü ────────────────────────────────────────────────────
  const isHiddenRole = userRole !== null && HIDDEN_ROLES.has(userRole);
  const isPanelRole = userRole === "musteri" || userRole === "danisan";
  const isPublicPage =
    currentPath === "/" ||
    PUBLIC_PREFIXES.some((p) => currentPath.startsWith(p)) ||
    PANEL_PREFIXES.some((p) => currentPath.startsWith(p));

  // Rol gizli ise gösterme
  if (isHiddenRole) return null;
  // Giriş yok ise sadece public sayfalarda göster
  if (!userRole && !isPublicPage) return null;
  // Panel rolü (musteri/danisan) ise panel + public
  if (isPanelRole && !isPublicPage) return null;

  // ── History temizle ───────────────────────────────────────────────────────
  function clearHistory() {
    try {
      const key = isPanelRole ? `mb_chatbot_history_${userRole}` : "mb_chatbot_history";
      localStorage.removeItem(key);
      setSessionKey((k) => k + 1);
    } catch { /* ignore */ }
  }

  // ── Minimize toggle ───────────────────────────────────────────────────────
  function toggleMinimize() {
    setMinimized((v) => {
      const next = !v;
      try {
        localStorage.setItem("mb_chatbot_minimized", next ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  }

  // ── İçerik bileşeni ──────────────────────────────────────────────────────
  const ChatbotContent = isPanelRole ? (
    <PanelChatbot
      key={sessionKey}
      userRole={userRole as "musteri" | "danisan"}
    />
  ) : (
    <Chatbot key={sessionKey} />
  );

  const panelTitle = isPanelRole
    ? userRole === "musteri" ? "✦ Yardım Asistanı" : "✦ Danışman Asistanı"
    : "✦ AI Danışman Eşleştirme";

  const panelSubtitle = isPanelRole
    ? "Sorularınızı yanıtlıyorum"
    : "Size uygun danışmanı bulalım";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {/* Chatbot paneli */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: "easeOut" }}
            style={{
              width: PANEL_W,
              height: minimized ? PANEL_H_MIN : PANEL_H_FULL,
              backgroundColor: "var(--mb-surface)",
              border: "1.5px solid var(--mb-border-strong)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "height 0.2s ease",
            }}
          >
            {/* Panel başlığı */}
            <div
              style={{
                backgroundColor: "var(--mb-bg)",
                borderBottom: minimized ? "none" : "1.5px solid var(--mb-border-strong)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                height: minimized ? PANEL_H_MIN : undefined,
              }}
            >
              <div
                style={{ flex: 1, cursor: "pointer" }}
                onClick={toggleMinimize}
                title={minimized ? "Genişlet" : "Küçült"}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)" }}>
                  {panelTitle}
                </div>
                {!minimized && (
                  <div style={{ fontSize: 10, color: "var(--mb-muted)" }}>
                    {panelSubtitle}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {!minimized && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                    aria-label="Geçmişi temizle"
                    title="Sohbet geçmişini temizle"
                    style={iconBtnStyle}
                  >
                    🗑
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
                  aria-label={minimized ? "Genişlet" : "Küçült"}
                  style={iconBtnStyle}
                >
                  {minimized ? "▲" : "▼"}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  aria-label="Kapat"
                  style={{ ...iconBtnStyle, fontSize: 16 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* İçerik */}
            {!minimized && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {ChatbotContent}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tetikleyici buton */}
      <motion.button
        type="button"
        onClick={() => {
          if (!open) {
            setSessionKey((k) => k + 1);
            setMinimized(false);
          }
          setOpen((v) => !v);
        }}
        whileHover={prefersReduced ? {} : { scale: 1.01 }}
        whileTap={prefersReduced ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        aria-label={open ? "Chatbotu kapat" : "Asistanla konuş"}
        style={{
          width: 52,
          height: 52,
          backgroundColor: "var(--mb-primary)",
          border: "1.5px solid var(--mb-border-strong)",
          color: "var(--mb-primary-text)",
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        💬
      </motion.button>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--mb-muted)",
  fontSize: 14,
  cursor: "pointer",
  lineHeight: 1,
  padding: 4,
};
