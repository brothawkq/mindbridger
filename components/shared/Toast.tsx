"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useToastStore, type ToastType } from "@/hooks/useToast";

// [FIX #14] Toast tipi → ikon, vurgu rengi ve ekran okuyucu önceliği
// error/warning → role="alert" (assertive), success/info → role="status" (polite)
const TOAST_CONFIG: Record<
  ToastType,
  { icon: string; accentColor: string; label: string; isAssertive: boolean }
> = {
  success: { icon: "✓", accentColor: "#2E7D32", label: "Başarılı", isAssertive: false },
  error:   { icon: "✕", accentColor: "#C62828", label: "Hata",     isAssertive: true  },
  warning: { icon: "△", accentColor: "#E65100", label: "Uyarı",    isAssertive: true  },
  info:    { icon: "i", accentColor: "#1565C0", label: "Bilgi",     isAssertive: false },
};

/**
 * Toast bildirim kapsayıcısı.
 * `app/layout.tsx` içinde bir kez render edilir.
 * Toast tetiklemek için: `useToast()` hook'u kullanılır.
 *
 * Kullanım:
 *   const toast = useToast()
 *   toast.success("Randevu oluşturuldu")
 *   toast.error("Bir hata oluştu", "Lütfen tekrar deneyin")
 */
export default function Toaster() {
  const { toasts, removeToast } = useToastStore();
  const prefersReduced = useReducedMotion();

  const toastVariants = {
    initial: prefersReduced ? { opacity: 0 } : { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0 },
    exit:    prefersReduced ? { opacity: 0 } : { opacity: 0, x: -60 },
  };
  const toastTransition = { duration: prefersReduced ? 0.01 : 0.2, ease: "easeOut" as const };

  return (
    // [FIX #14] Container'dan aria-live kaldırıldı; her toast kendi önceliğini taşıyor
    <div
      role="region"
      aria-label="Bildirimler"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
        width: "calc(100vw - 48px)",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type];

          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={toastTransition}
              layout
              // [FIX #14] Kritik bildirimler assertive, diğerleri polite
              role={config.isAssertive ? "alert" : "status"}
              aria-live={config.isAssertive ? "assertive" : "polite"}
              style={{
                backgroundColor: "var(--mb-surface)",
                border: "1.5px solid var(--mb-border-strong)",
                borderLeft: `4px solid ${config.accentColor}`,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                pointerEvents: "auto",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              {/* İkon */}
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 0,
                  backgroundColor: config.accentColor,
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {config.icon}
              </span>

              {/* İçerik */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    lineHeight: 1.4,
                  }}
                >
                  {toast.title}
                </div>
                {toast.description && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--mb-muted)",
                      marginTop: 3,
                      lineHeight: 1.5,
                    }}
                  >
                    {toast.description}
                  </div>
                )}
              </div>

              {/* Kapat butonu */}
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Bildirimi kapat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--mb-muted)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 2,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
