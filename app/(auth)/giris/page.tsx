"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];

// ─── Zod şeması ───────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta zorunludur.")
    .email("Geçerli bir e-posta adresi girin."),
  password: z
    .string()
    .min(1, "Şifre zorunludur.")
    .min(6, "Şifre en az 6 karakter olmalıdır."),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Rol → dashboard yönlendirmesi ────────────────────────────
const ROLE_DASHBOARD: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  danisan: "/danisan/dashboard",
  musteri: "/panelim/dashboard",
  kurumsal: "/kurumsal-panel/dashboard",
  affiliate: "/affiliate-panel/dashboard",
  visitor: "/",
};

// ─── Hata mesajları (URL param) ────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  ip_banned:          "IP adresiniz geçici olarak engellendi. Lütfen daha sonra tekrar deneyin.",
  account_suspended:  "Hesabınız askıya alınmıştır. Destek için iletişime geçin.",
  session_expired:    "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
};

const LOCK_SECONDS   = 15 * 60; // 15 dakika — sunucu ile tutarlı

// ─── useSearchParams gerektiren iç bileşen ────────────────────
// Next.js 15+: useSearchParams Suspense sınırı gerektirir.
function GirisIci() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const prefersReduced = useReducedMotion();
  const supabase     = createClient();

  const redirectTo = searchParams.get("redirect") ?? "";
  const urlError   = searchParams.get("error") ?? "";

  const [serverError,  setServerError]  = useState(urlError ? ERROR_MESSAGES[urlError] ?? "" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil,  setLockedUntil]  = useState<Date | null>(null);
  const [countdown,    setCountdown]    = useState(0); // saniye
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked = lockedUntil !== null && countdown > 0;

  // ─── Geri sayım ───────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) setLockedUntil(null);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const formatCountdown = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Form ─────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = useCallback(
    async (data: LoginForm) => {
      if (isLocked || isSubmitting) return;
      setIsSubmitting(true);
      setServerError("");

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const json = (await res.json()) as {
          role?: UserRole;
          status?: string;
          error?: string;
          until?: string | null;
          reason?: string;
        };

        if (!res.ok) {
          if (res.status === 429 && json.until) {
            setLockedUntil(new Date(json.until));
          }
          setServerError(json.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.");
          return;
        }

        // Başarılı giriş → rol bazlı yönlendirme
        if (json.status === "pending" && json.role === "danisan") {
          router.push("/onay-bekleniyor");
          return;
        }

        const destination =
          redirectTo || (json.role ? ROLE_DASHBOARD[json.role] : "/") || "/";

        router.push(destination);
        router.refresh();
      } catch {
        setServerError("Bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLocked, isSubmitting, router, redirectTo]
  );

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const progressPct = lockedUntil
    ? ((LOCK_SECONDS - countdown) / LOCK_SECONDS) * 100
    : 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#FFFCF6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px 80px",
        fontFamily: "var(--font-inter)",
      }}
    >
      {/* Ana kart */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: "easeOut" }}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(50,83,67,0.10)",
          maxWidth: 480,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Kart üst — dark green logo bölümü */}
        <div
          style={{
            backgroundColor: "#325343",
            padding: "28px 40px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-overpass)",
              fontSize: 24,
              fontWeight: 700,
              color: "#A6DE9B",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            MindBridger
          </div>
          <div style={{ fontSize: 13, color: "rgba(245,247,245,0.65)" }}>
            Hesabınıza giriş yapın
          </div>
        </div>

        {/* Form gövdesi */}
        <div style={{ padding: "28px 40px 32px" }}>

          {/* Kilitlenme durumu */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
                style={{ textAlign: "center", marginBottom: 20 }}
              >
                <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>🔒</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Hesap kilitlendi.
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    letterSpacing: 2,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {formatCountdown(countdown)}
                </span>
                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: "var(--mb-border)",
                    border: "1px solid var(--mb-muted)",
                  }}
                >
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{ height: "100%", backgroundColor: "var(--mb-primary)" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--mb-muted)",
                    marginTop: 8,
                    lineHeight: 1.6,
                  }}
                >
                  15 dk geri sayım · Form alanları devre dışı
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sunucu / validasyon hatası */}
          <AnimatePresence>
            {serverError && !isLocked && (
              <motion.div
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
                style={{
                  backgroundColor: "var(--mb-bg)",
                  border: "1.5px solid var(--mb-border-strong)",
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "var(--mb-text)",
                  marginBottom: 14,
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                }}
                role="alert"
              >
                <span>⚠</span>
                <span>{serverError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* E-posta */}
            <label
              htmlFor="email"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--mb-text)",
                marginBottom: 6,
              }}
            >
              E-POSTA <span style={{ color: "var(--mb-muted)" }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLocked || isSubmitting}
              placeholder="kullanici@ornek.com"
              {...register("email")}
              style={{
                width: "100%",
                border: `1.5px solid ${errors.email ? "oklch(0.577 0.245 27.325)" : "var(--mb-border-strong)"}`,
                padding: "9px 12px",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--mb-text)",
                textAlign: "center",
                backgroundColor: errors.email ? "var(--mb-bg)" : "var(--mb-surface)",
                marginBottom: 4,
                display: "block",
                opacity: isLocked ? 0.5 : 1,
              }}
            />
            {errors.email && (
              <p style={{ fontSize: 11, color: "oklch(0.577 0.245 27.325)", marginBottom: 10, textAlign: "center" }}>
                ⚠ {errors.email.message}
              </p>
            )}

            {/* Şifre */}
            <label
              htmlFor="password"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--mb-text)",
                marginBottom: 6,
                marginTop: errors.email ? 0 : 10,
              }}
            >
              ŞİFRE <span style={{ color: "var(--mb-muted)" }}>*</span>
            </label>
            <div style={{ position: "relative", marginBottom: 4 }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isLocked || isSubmitting}
                {...register("password")}
                style={{
                  width: "100%",
                  border: `1.5px solid ${errors.password ? "oklch(0.577 0.245 27.325)" : "var(--mb-border-strong)"}`,
                  padding: "9px 36px 9px 12px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: "var(--mb-text)",
                  textAlign: "center",
                  backgroundColor: errors.password ? "var(--mb-bg)" : "var(--mb-surface)",
                  letterSpacing: showPassword ? "normal" : 4,
                  opacity: isLocked ? 0.5 : 1,
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
                  background: "transparent",
                  border: "none",
                  color: "var(--mb-muted)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: 11, color: "oklch(0.577 0.245 27.325)", marginBottom: 10, textAlign: "center" }}>
                ⚠ {errors.password.message}
              </p>
            )}

            {/* Google OAuth */}
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--mb-muted)",
                margin: "14px 0 8px",
                position: "relative",
              }}
            >
              <span
                style={{
                  backgroundColor: "var(--mb-surface)",
                  padding: "0 8px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                veya
              </span>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: "var(--mb-border)",
                  zIndex: 0,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLocked || isSubmitting}
              style={{
                width: "100%",
                border: "1.5px solid var(--mb-border)",
                backgroundColor: "var(--mb-surface)",
                padding: 9,
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--mb-text)",
                textAlign: "center",
                cursor: isLocked ? "not-allowed" : "pointer",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "var(--mb-border)",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mb-muted)",
                  flexShrink: 0,
                }}
              >
                G
              </span>
              Google ile Giriş
            </button>

            {/* Giriş Yap butonu */}
            <button
              type="submit"
              disabled={isLocked || isSubmitting}
              style={{
                width: "100%",
                backgroundColor: isLocked ? "transparent" : "var(--mb-primary)",
                color: isLocked ? "var(--mb-muted)" : "var(--mb-primary-text)",
                border: isLocked ? "1.5px dashed var(--mb-muted)" : "none",
                padding: 11,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                textAlign: "center",
                cursor: isLocked || isSubmitting ? "not-allowed" : "pointer",
                display: "block",
                marginBottom: 8,
              }}
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            {/* Şifremi unuttum */}
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <Link
                href="/sifremi-unuttum"
                style={{
                  fontSize: 11,
                  color: "var(--mb-text)",
                  textDecoration: "underline",
                }}
              >
                Şifremi unuttum
              </Link>
            </div>
          </form>

          {/* Kayıt linki */}
          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid var(--mb-border)",
              paddingTop: 12,
              textAlign: "center",
              fontSize: 12,
              color: "var(--mb-muted)",
            }}
          >
            Hesabın yok mu?{" "}
            <Link
              href="/kayit"
              style={{ color: "var(--mb-text)", fontWeight: 700, textDecoration: "underline" }}
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dışa aktarılan sayfa bileşeni ────────────────────────────────
// GirisIci, Suspense sınırı içinde render edilir.
export default function GirisPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--mb-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--mb-muted)" }}>Yükleniyor…</p>
        </div>
      }
    >
      <GirisIci />
    </Suspense>
  );
}
