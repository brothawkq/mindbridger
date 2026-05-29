"use client";

// ─── FIX #1 ──────────────────────────────────────────────────────
// Supabase generateLink e-postası kullanıcıyı şuna yönlendirir:
//   ${redirectTo}?token_hash=xxx&type=email
// [token] path-param ile eşleşmez → doğrulama 404 veriyordu.
// Sayfa artık query param tabanlı; token_hash useSearchParams ile okunur.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type VerifyState = "loading" | "success" | "already_verified" | "invalid" | "error";

// ─── İçerik bileşeni (useSearchParams gerektirir) ─────────────────
function EPostaDogrulamaIci() {
  const prefersReduced = useReducedMotion();
  const FADE_UP = {
    hidden:  prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0.01 : 0.22, ease: "easeOut" as const } },
    exit:    prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
  };
  const searchParams = useSearchParams();
  const router = useRouter();

  // Supabase redirectTo URL'sine ?token_hash=xxx&type=email ekler
  const tokenHash = searchParams.get("token_hash") ?? "";
  const tokenType = searchParams.get("type") ?? "email";

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectRole, setRedirectRole] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenHash || tokenHash.length < 6) {
      setState("invalid");
      return;
    }

    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // API route token_hash + type'ı kabul ediyor
          body: JSON.stringify({ token: tokenHash, type: tokenType }),
        });

        if (cancelled) return;

        const body = (await res.json()) as {
          error?: string;
          already_verified?: boolean;
          role?: string;
        };

        if (!res.ok) {
          if (body.already_verified) {
            setState("already_verified");
            return;
          }
          if (res.status === 400 || res.status === 410) {
            setState("invalid");
            return;
          }
          setErrorMessage(body.error ?? "Doğrulama sırasında bir hata oluştu.");
          setState("error");
          return;
        }

        if (body.role) setRedirectRole(body.role);
        setState("success");

        // FIX #9: setTimeout ID kaydediliyor → cleanup mümkün
        const target =
          body.role === "danisan" || body.role === "kurumsal"
            ? "/onay-bekleniyor"
            : "/giris";

        redirectTimer = setTimeout(() => {
          if (!cancelled) router.replace(target);
        }, 3500);
      } catch {
        if (!cancelled) {
          setErrorMessage("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
          setState("error");
        }
      }
    };

    void verify();

    // FIX #9: Cleanup — unmount'ta timer iptal
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [tokenHash, tokenType, router]);

  const successRedirectLabel =
    redirectRole === "danisan" || redirectRole === "kurumsal"
      ? "onay bekleniyor sayfasına"
      : "giriş sayfasına";

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--mb-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--mb-text)",
              letterSpacing: "-0.5px",
              textDecoration: "none",
            }}
          >
            MindBridger
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Yükleniyor ── */}
          {state === "loading" && (
            <motion.div
              key="loading"
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div
                style={{
                  backgroundColor: "var(--mb-surface)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "36px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    border: "2px solid var(--mb-border)",
                    borderTopColor: "var(--mb-border-strong)",
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p
                  style={{ fontSize: 13, color: "var(--mb-muted)", margin: 0 }}
                  aria-live="polite"
                  aria-busy="true"
                >
                  E-posta adresiniz doğrulanıyor…
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Başarı ── */}
          {state === "success" && (
            <motion.div key="success" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <div
                style={{
                  backgroundColor: "var(--mb-surface)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "36px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    border: "1.5px solid var(--mb-border-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    fontSize: 22,
                  }}
                >
                  ✓
                </div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 10px" }}>
                  E-posta Doğrulandı
                </h1>
                <p style={{ fontSize: 12, color: "var(--mb-muted)", lineHeight: 1.7, margin: "0 0 20px" }}>
                  E-posta adresiniz başarıyla doğrulandı.
                  <br />
                  Birkaç saniye içinde{" "}
                  <strong>{successRedirectLabel}</strong> yönlendirileceksiniz.
                </p>
                <Link
                  href={
                    redirectRole === "danisan" || redirectRole === "kurumsal"
                      ? "/onay-bekleniyor"
                      : "/giris"
                  }
                  style={{
                    display: "inline-block",
                    backgroundColor: "var(--mb-primary)",
                    color: "var(--mb-primary-text)",
                    padding: "11px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Devam Et
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Zaten doğrulanmış ── */}
          {state === "already_verified" && (
            <motion.div key="already" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <div
                style={{
                  backgroundColor: "var(--mb-surface)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "36px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    border: "1.5px solid var(--mb-border-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    fontSize: 22,
                  }}
                >
                  ✓
                </div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 10px" }}>
                  E-posta Zaten Doğrulanmış
                </h1>
                <p style={{ fontSize: 12, color: "var(--mb-muted)", lineHeight: 1.7, margin: "0 0 20px" }}>
                  Bu e-posta adresi daha önce doğrulanmış.
                  <br />
                  Hesabınıza giriş yapabilirsiniz.
                </p>
                <Link
                  href="/giris"
                  style={{
                    display: "inline-block",
                    backgroundColor: "var(--mb-primary)",
                    color: "var(--mb-primary-text)",
                    padding: "11px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Giriş Yap
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Geçersiz bağlantı ── */}
          {state === "invalid" && (
            <motion.div key="invalid" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <div
                style={{
                  backgroundColor: "var(--mb-surface)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "36px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    border: "1.5px dashed var(--mb-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    fontSize: 22,
                    color: "var(--mb-muted)",
                  }}
                >
                  ✕
                </div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 10px" }}>
                  Bağlantı Geçersiz
                </h1>
                <p style={{ fontSize: 12, color: "var(--mb-muted)", lineHeight: 1.7, margin: "0 0 8px" }}>
                  Bu doğrulama bağlantısı geçersiz veya süresi dolmuş.
                </p>
                <p style={{ fontSize: 11, color: "var(--mb-muted)", lineHeight: 1.6, margin: "0 0 24px" }}>
                  Doğrulama bağlantıları 24 saat geçerlidir.
                  Kayıt sırasında kullandığınız e-posta adresini kontrol edin
                  veya yeniden kayıt olun.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link
                    href="/giris"
                    style={{
                      display: "block",
                      backgroundColor: "var(--mb-primary)",
                      color: "var(--mb-primary-text)",
                      padding: "11px",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    style={{
                      display: "block",
                      backgroundColor: "var(--mb-surface)",
                      color: "var(--mb-text)",
                      border: "1.5px solid var(--mb-border-strong)",
                      padding: "11px",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    Yeniden Kayıt Ol
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Sunucu hatası ── */}
          {state === "error" && (
            <motion.div key="error" variants={FADE_UP} initial="hidden" animate="visible" exit="exit">
              <div
                style={{
                  backgroundColor: "var(--mb-surface)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "36px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 52,
                    border: "1.5px dashed #C62828",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    fontSize: 22,
                    color: "#C62828",
                  }}
                >
                  ⚠
                </div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 10px" }}>
                  Doğrulama Başarısız
                </h1>
                {errorMessage && (
                  <p style={{ fontSize: 12, color: "#C62828", lineHeight: 1.7, margin: "0 0 20px" }}>
                    {errorMessage}
                  </p>
                )}
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    backgroundColor: "var(--mb-primary)",
                    color: "var(--mb-primary-text)",
                    border: "none",
                    padding: "11px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Tekrar Dene
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ─── Dışa aktarılan sayfa — Suspense zorunlu (useSearchParams) ────
export default function EPostaDogrulamaPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--mb-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--mb-muted)" }}>Yükleniyor…</p>
        </main>
      }
    >
      <EPostaDogrulamaIci />
    </Suspense>
  );
}
