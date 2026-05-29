"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Hata izleme sistemine gönder (production'da)
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "var(--mb-bg)",
        color: "var(--mb-text)",
        fontFamily: "system-ui, Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          border: "1.5px solid #212121",
          padding: "40px 32px",
          backgroundColor: "var(--mb-surface)",
          maxWidth: 480,
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--mb-muted)",
            marginBottom: 12,
          }}
        >
          Hata
        </p>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--mb-text)",
            margin: "0 0 12px",
          }}
        >
          Beklenmedik Bir Hata Oluştu
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--mb-muted)",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Bir şeyler ters gitti. Sayfayı yenilemeyi deneyin. Sorun devam ederse
          lütfen{" "}
          <a
            href="/iletisim"
            style={{ color: "var(--mb-text)", fontWeight: 700 }}
          >
            bizimle iletişime geçin
          </a>
          .
        </p>

        {/* Hata kodu (debug) */}
        {error.digest && (
          <p
            style={{
              fontSize: 10,
              color: "var(--mb-muted)",
              margin: "0 0 20px",
              fontFamily: "monospace",
            }}
          >
            Hata kodu: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "11px 24px",
              backgroundColor: "#212121",
              color: "#FFFFFF",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "11px 24px",
              backgroundColor: "transparent",
              color: "var(--mb-text)",
              border: "1.5px solid #212121",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
