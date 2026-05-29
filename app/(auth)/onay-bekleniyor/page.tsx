"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ─── Adım kartı ───────────────────────────────────────────────────
function AdimKarti({
  numara,
  baslik,
  aciklama,
  tamamlandi,
}: {
  numara: number;
  baslik: string;
  aciklama: string;
  tamamlandi: boolean;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReduced ? 0 : numara * 0.08, duration: prefersReduced ? 0.01 : 0.2, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        border: `1.5px solid ${tamamlandi ? "var(--mb-border-strong)" : "var(--mb-border)"}`,
        backgroundColor: "var(--mb-surface)",
      }}
    >
      {/* Numara / tik */}
      <div
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          border: `1.5px solid ${tamamlandi ? "var(--mb-border-strong)" : "var(--mb-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: tamamlandi ? "var(--mb-text)" : "var(--mb-muted)",
        }}
      >
        {tamamlandi ? "✓" : numara}
      </div>

      {/* İçerik */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: tamamlandi ? "var(--mb-text)" : "var(--mb-muted)",
            marginBottom: 2,
          }}
        >
          {baslik}
        </div>
        <div style={{ fontSize: 11, color: "var(--mb-muted)", lineHeight: 1.6 }}>
          {aciklama}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sayfa ────────────────────────────────────────────────────────
export default function OnayBekleniyorPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const FADE_UP = {
    hidden:  prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0.01 : 0.25, ease: "easeOut" as const } },
  };
  // FIX #11: Tek bir client örneği — useEffect ve handleSignOut aynı instance'ı paylaşır.
  // Her çağrıda createClient() çağrılması birden fazla ayrı bağlantı açar.
  const supabase = useMemo(() => createClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"danisan" | "kurumsal" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          // Oturum yoksa giriş sayfasına gönder
          router.replace("/giris");
          return;
        }

        // Profil bilgisi al
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (profileError || !profile) {
          router.replace("/giris");
          return;
        }

        // Onay beklemiyorsa uygun panele yönlendir
        if (profile.status === "active") {
          const target =
            profile.role === "danisan"
              ? "/danisan/dashboard"
              : profile.role === "kurumsal"
              ? "/kurumsal/dashboard"
              : "/panelim/dashboard";
          router.replace(target);
          return;
        }

        setUserEmail(user.email ?? null);
        setRole(profile.role as "danisan" | "kurumsal");
      } catch {
        // Sessiz hata — yükleme tamamlanmış sayılır
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();
    return () => { cancelled = true; };
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/giris");
    }
  };

  if (loading) {
    return (
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
    );
  }

  // Danışman için adımlar
  const danisanAdimlari = [
    {
      baslik: "E-posta Doğrulandı",
      aciklama: "Kayıt sırasında verdiğiniz e-posta adresi onaylandı.",
      tamamlandi: true,
    },
    {
      baslik: "Başvuru İncelemede",
      aciklama:
        "Belge ve sertifikalarınız ekibimiz tarafından inceleniyor. Bu süreç genellikle 1-3 iş günü sürer.",
      tamamlandi: false,
    },
    {
      baslik: "Onay & Aktivasyon",
      aciklama:
        "Başvurunuz onaylandığında e-posta ile bilgilendirileceksiniz ve panelinize erişebileceksiniz.",
      tamamlandi: false,
    },
  ];

  // Kurumsal için adımlar
  const kurumsalAdimlari = [
    {
      baslik: "Başvuru Alındı",
      aciklama: "Kurumsal başvurunuz sistemimize kaydedildi.",
      tamamlandi: true,
    },
    {
      baslik: "Sözleşme & Fiyatlandırma",
      aciklama:
        "Satış ekibimiz sizinle iletişime geçerek paket detaylarını ve sözleşmeyi paylaşacak.",
      tamamlandi: false,
    },
    {
      baslik: "Hesap Aktivasyonu",
      aciklama:
        "Sözleşme imzalandıktan sonra kurumsal paneliniz aktive edilecek.",
      tamamlandi: false,
    },
  ];

  const adimlar = role === "kurumsal" ? kurumsalAdimlari : danisanAdimlari;

  const baslikMetni =
    role === "kurumsal" ? "Başvurunuz İncelemede" : "Başvurunuz İncelemede";

  const aciklamaMetni =
    role === "kurumsal"
      ? "Kurumsal başvurunuzu aldık. Satış ekibimiz en kısa sürede sizinle iletişime geçecek."
      : "Danışman başvurunuzu aldık. Belgeleriniz incelendikten sonra e-posta ile bilgilendirileceksiniz.";

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
      <div style={{ width: "100%", maxWidth: 480 }}>
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

        <motion.div variants={FADE_UP} initial="hidden" animate="visible">
          {/* Ana kart */}
          <div
            style={{
              backgroundColor: "var(--mb-surface)",
              border: "1.5px solid var(--mb-border)",
              padding: "28px 24px",
              marginBottom: 16,
            }}
          >
            {/* Başlık alanı */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
              {/* İkon */}
              <div
                aria-hidden="true"
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  border: "1.5px solid var(--mb-border-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {role === "kurumsal" ? "🏢" : "⏳"}
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--mb-text)",
                    margin: "0 0 6px",
                  }}
                >
                  {baslikMetni}
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--mb-muted)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {aciklamaMetni}
                </p>
              </div>
            </div>

            {/* E-posta bilgisi */}
            {userEmail && (
              <div
                style={{
                  backgroundColor: "var(--mb-bg)",
                  border: "1.5px solid var(--mb-border)",
                  padding: "8px 12px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ fontSize: 11, color: "var(--mb-muted)" }}
                >
                  ✉
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "var(--mb-muted)",
                      marginBottom: 1,
                    }}
                  >
                    Kayıtlı E-posta
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mb-text)", fontWeight: 600 }}>
                    {userEmail}
                  </div>
                </div>
              </div>
            )}

            {/* Adımlar */}
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--mb-muted)",
                marginBottom: 10,
              }}
            >
              Süreç
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {adimlar.map((adim, i) => (
                <AdimKarti
                  key={i}
                  numara={i + 1}
                  baslik={adim.baslik}
                  aciklama={adim.aciklama}
                  tamamlandi={adim.tamamlandi}
                />
              ))}
            </div>
          </div>

          {/* Yardım notu */}
          <div
            style={{
              backgroundColor: "var(--mb-surface)",
              border: "1.5px solid var(--mb-border)",
              padding: "14px 16px",
              marginBottom: 16,
              fontSize: 11,
              color: "var(--mb-muted)",
              lineHeight: 1.7,
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: 6,
                color: "var(--mb-muted)",
              }}
            >
              Yardım
            </span>
            Sorularınız için{" "}
            <a
              href="mailto:destek@mindbridger.com"
              style={{ color: "var(--mb-text)", fontWeight: 600, textDecoration: "underline" }}
            >
              destek@mindbridger.com
            </a>{" "}
            adresine yazabilirsiniz.
          </div>

          {/* Çıkış yap */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleSignOut}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: "var(--mb-muted)",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Çıkış yap
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
