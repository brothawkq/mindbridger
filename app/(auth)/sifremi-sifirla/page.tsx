"use client";

// ─── FIX #1 ──────────────────────────────────────────────────────
// Supabase generateLink (recovery) e-postası kullanıcıyı şuna yönlendirir:
//   ${redirectTo}?token_hash=xxx&type=recovery
// [token] path-param ile eşleşmez → 404 veriyordu.
// Sayfa artık query param tabanlı; token_hash useSearchParams ile okunur.
// ─────────────────────────────────────────────────────────────────
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type ResetState = "form" | "loading" | "success" | "invalid" | "error";

// ─── Şifre gücü hesaplayıcı ───────────────────────────────────────
function getPasswordStrength(pw: string): {
  level: 0 | 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (!pw) return { level: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Zayıf",  color: "#C62828" };
  if (score <= 3) return { level: 2, label: "Orta",   color: "#F57F17" };
  return              { level: 3, label: "Güçlü",  color: "#2E7D32" };
}

// ─── İçerik bileşeni (useSearchParams gerektirir) ─────────────────
function SifremiSifirlaIci() {
  const prefersReduced = useReducedMotion();
  const FADE_UP = {
    hidden:  prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0.01 : 0.22, ease: "easeOut" as const } },
    exit:    prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
  };
  const searchParams = useSearchParams();
  // Supabase redirectTo URL'sine ?token_hash=xxx&type=recovery ekler
  const tokenHash = searchParams.get("token_hash") ?? "";

  const [state, setState] = useState<ResetState>(
    tokenHash.length >= 6 ? "form" : "invalid"
  );
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [fieldError,      setFieldError]      = useState<string | null>(null);
  const [serverError,     setServerError]     = useState<string | null>(null);

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError(null);
    setServerError(null);

    // Client-side validation — API da aynı kuralları uygular
    if (newPassword.length < 8) {
      setFieldError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setFieldError("Şifre en az bir büyük harf içermelidir.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setFieldError("Şifre en az bir rakam içermelidir.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("Şifreler eşleşmiyor.");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: tokenHash, password: newPassword }),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        // 410 = süresi dolmuş / geçersiz token
        if (res.status === 410 || res.status === 400) {
          setState("invalid");
          return;
        }
        setServerError(body.error ?? "Şifre sıfırlanırken bir hata oluştu.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setServerError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
      setState("error");
    }
  };

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
        {/* Logo */}
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
          {/* ── Form ── */}
          {state === "form" && (
            <motion.div
              key="form"
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
                }}
              >
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 6px",
                  }}
                >
                  Yeni Şifre Belirle
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--mb-muted)",
                    margin: "0 0 24px",
                    lineHeight: 1.6,
                  }}
                >
                  Hesabınız için güçlü bir şifre oluşturun.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {/* ── Yeni şifre ── */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor="new-password"
                      style={{
                        display: "block",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.8px",
                        textTransform: "uppercase",
                        color: "var(--mb-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Yeni Şifre
                    </label>

                    <div style={{ position: "relative" }}>
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          border: "1.5px solid var(--mb-border-strong)",
                          padding: "9px 52px 9px 12px",
                          fontSize: 13,
                          backgroundColor: "var(--mb-surface)",
                          color: "var(--mb-text)",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 11,
                          color: "var(--mb-muted)",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        {showPassword ? "Gizle" : "Göster"}
                      </button>
                    </div>

                    {/* Şifre güç göstergesi */}
                    {newPassword.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            height: 4,
                            backgroundColor: "var(--mb-border)",
                            border: "1px solid var(--mb-border)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${(strength.level / 3) * 100}%`,
                              backgroundColor: strength.color,
                              transition: "width 0.3s ease, background-color 0.3s ease",
                            }}
                          />
                        </div>
                        {strength.label && (
                          <div
                            style={{
                              fontSize: 10,
                              color: strength.color,
                              marginTop: 4,
                              fontWeight: 600,
                            }}
                          >
                            {strength.label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Şifre tekrar ── */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      htmlFor="confirm-password"
                      style={{
                        display: "block",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.8px",
                        textTransform: "uppercase",
                        color: "var(--mb-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Şifre Tekrar
                    </label>
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        border: "1.5px solid var(--mb-border-strong)",
                        padding: "9px 12px",
                        fontSize: 13,
                        backgroundColor: "var(--mb-surface)",
                        color: "var(--mb-text)",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Alan hatası */}
                  {fieldError && (
                    <p
                      role="alert"
                      style={{
                        fontSize: 12,
                        color: "#C62828",
                        margin: "0 0 16px",
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠ {fieldError}
                    </p>
                  )}

                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      backgroundColor: "var(--mb-primary)",
                      color: "var(--mb-primary-text)",
                      border: "none",
                      padding: "11px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Şifremi Sıfırla
                  </button>
                </form>

                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <Link
                    href="/giris"
                    style={{
                      fontSize: 12,
                      color: "var(--mb-muted)",
                      textDecoration: "underline",
                    }}
                  >
                    Giriş sayfasına dön
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

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
                  Şifreniz güncelleniyor…
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Başarı ── */}
          {state === "success" && (
            <motion.div
              key="success"
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
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 10px",
                  }}
                >
                  Şifre Güncellendi
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--mb-muted)",
                    lineHeight: 1.7,
                    margin: "0 0 20px",
                  }}
                >
                  Şifreniz başarıyla değiştirildi.
                  <br />
                  Yeni şifrenizle giriş yapabilirsiniz.
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

          {/* ── Geçersiz / süresi dolmuş bağlantı ── */}
          {state === "invalid" && (
            <motion.div
              key="invalid"
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
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 10px",
                  }}
                >
                  Bağlantı Geçersiz
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--mb-muted)",
                    lineHeight: 1.7,
                    margin: "0 0 8px",
                  }}
                >
                  Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--mb-muted)",
                    lineHeight: 1.6,
                    margin: "0 0 24px",
                  }}
                >
                  Bağlantılar 24 saat geçerlidir. Yeni bir bağlantı talep edin.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link
                    href="/sifremi-unuttum"
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
                    Yeni Bağlantı İste
                  </Link>
                  <Link
                    href="/giris"
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
                    Giriş Yap
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Sunucu hatası ── */}
          {state === "error" && (
            <motion.div
              key="error"
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
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 10px",
                  }}
                >
                  Şifre Sıfırlanamadı
                </h1>
                {serverError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#C62828",
                      lineHeight: 1.7,
                      margin: "0 0 20px",
                    }}
                  >
                    {serverError}
                  </p>
                )}
                <button
                  onClick={() => {
                    setServerError(null);
                    setState("form");
                  }}
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
export default function SifremiSifirlaPage() {
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
      <SifremiSifirlaIci />
    </Suspense>
  );
}
