"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── Schema ──────────────────────────────────────────────────────
const sifremiUnuttumSchema = z.object({
  email: z
    .string({ message: "E-posta adresi zorunludur." })
    .email({ message: "Geçerli bir e-posta adresi girin." })
    .max(254, { message: "E-posta adresi çok uzun." }),
});

type SifremiUnuttumForm = z.infer<typeof sifremiUnuttumSchema>;


// ─── Field bileşeni ───────────────────────────────────────────────
function Field({
  label,
  name,
  type = "text",
  placeholder,
  register,
  error,
  autoComplete,
}: {
  label: string;
  name: keyof SifremiUnuttumForm;
  type?: string;
  placeholder?: string;
  register: ReturnType<typeof useForm<SifremiUnuttumForm>>["register"];
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor={name}
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: "var(--mb-muted)",
        }}
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...register(name)}
        style={{
          border: `1.5px solid ${error ? "var(--mb-border-strong)" : "var(--mb-border-strong)"}`,
          padding: "9px 12px",
          fontSize: 13,
          backgroundColor: error ? "var(--mb-bg)" : "var(--mb-surface)",
          color: "var(--mb-text)",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <span
          id={`${name}-error`}
          role="alert"
          style={{ fontSize: 11, color: "#C62828", display: "flex", alignItems: "center", gap: 4 }}
        >
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  );
}

// ─── Sayfa ────────────────────────────────────────────────────────
export default function SifremiUnuttumPage() {
  const prefersReduced = useReducedMotion();
  const FADE_UP = {
    hidden:  prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0.01 : 0.22, ease: "easeOut" as const } },
    exit:    prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
  };
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<SifremiUnuttumForm>({
    resolver: zodResolver(sifremiUnuttumSchema) as Resolver<SifremiUnuttumForm>,
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: SifremiUnuttumForm) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        let msg = "Bir hata oluştu. Lütfen tekrar deneyin.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) msg = body.error;
        } catch {
          // JSON parse başarısız — genel mesaj kullan
        }
        setServerError(msg);
        return;
      }

      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch {
      setServerError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
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
        {/* Logo / marka */}
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
          {!submitted ? (
            /* ── Form görünümü ── */
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
                  padding: "28px 24px",
                }}
              >
                {/* Başlık */}
                <div style={{ marginBottom: 20 }}>
                  <h1
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--mb-text)",
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    Şifremi Unuttum
                  </h1>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--mb-muted)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    Kayıtlı e-posta adresinizi girin. Şifre sıfırlama bağlantısını göndereceğiz.
                  </p>
                </div>

                {/* Sunucu hatası */}
                {serverError && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: "#FFF3F3",
                      border: "1.5px solid #C62828",
                      padding: "10px 12px",
                      marginBottom: 16,
                      fontSize: 12,
                      color: "#C62828",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                    }}
                  >
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>⚠</span>
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <Field
                    label="E-posta Adresi"
                    name="email"
                    type="email"
                    placeholder="ornek@eposta.com"
                    autoComplete="email"
                    register={register}
                    error={errors.email?.message}
                  />

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                    transition={{ duration: 0.1 }}
                    style={{
                      backgroundColor: isSubmitting
                        ? "var(--mb-muted)"
                        : "var(--mb-primary)",
                      color: "var(--mb-primary-text)",
                      border: "none",
                      padding: "11px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
                  </motion.button>
                </form>
              </div>

              {/* Giriş sayfasına dön */}
              <p
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 12,
                  color: "var(--mb-muted)",
                }}
              >
                <Link
                  href="/giris"
                  style={{
                    color: "var(--mb-text)",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </motion.div>
          ) : (
            /* ── Başarı görünümü ── */
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
                {/* İkon */}
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
                  ✉
                </div>

                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 10px",
                  }}
                >
                  E-posta Gönderildi
                </h2>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--mb-muted)",
                    lineHeight: 1.7,
                    margin: "0 0 6px",
                  }}
                >
                  Şifre sıfırlama bağlantısı aşağıdaki adrese gönderildi:
                </p>

                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 18px",
                    wordBreak: "break-all",
                  }}
                >
                  {submittedEmail}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: "var(--mb-muted)",
                    lineHeight: 1.7,
                    margin: "0 0 24px",
                  }}
                >
                  Bağlantı <strong>15 dakika</strong> süreyle geçerlidir.
                  E-posta gelmezse spam / gereksiz posta klasörünü kontrol edin.
                </p>

                {/* Tekrar gönder notu */}
                <div
                  style={{
                    borderTop: "1px solid var(--mb-border)",
                    paddingTop: 16,
                    fontSize: 11,
                    color: "var(--mb-muted)",
                  }}
                >
                  E-posta almadınız mı?{" "}
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setServerError(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--mb-text)",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Tekrar dene
                  </button>
                </div>
              </div>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 12,
                  color: "var(--mb-muted)",
                }}
              >
                <Link
                  href="/giris"
                  style={{
                    color: "var(--mb-text)",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
