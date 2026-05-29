"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary — hata yakalayıcı.
 * Alt bileşenlerden fırlayan hataları yakalar, kullanıcıya Türkçe mesaj gösterir.
 * Class component olması zorunludur (React Error Boundary API).
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message ?? "Bilinmeyen bir hata oluştu.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // [FIX #23] Production'da log yönetim servisine (ör. Sentry) yönlendir;
    // geliştirme ortamında detaylı konsol çıktısı yeterli.
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", {
        message: error.message,
        componentStack: info.componentStack,
      });
    }
    // TODO: Production'da: Sentry.captureException(error, { contexts: { react: info } });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      // Özel fallback varsa onu göster
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              border: "1.5px solid var(--mb-border-strong)",
              backgroundColor: "var(--mb-surface)",
              padding: 28,
              textAlign: "center",
            }}
          >
            {/* İkon */}
            <div
              style={{
                fontSize: 28,
                marginBottom: 12,
                color: "var(--mb-muted)",
              }}
            >
              ⚠
            </div>

            {/* Başlık */}
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--mb-text)",
                marginBottom: 8,
              }}
            >
              Bir şeyler ters gitti
            </div>

            {/* Açıklama */}
            <p
              style={{
                fontSize: 12,
                color: "var(--mb-muted)",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Bu bileşen yüklenirken beklenmedik bir hata oluştu.
              Sayfayı yenileyebilir veya tekrar deneyebilirsiniz.
            </p>

            {/* [FIX #19] Development ortamında hata detayı gösterilir */}
            {process.env.NODE_ENV === "development" && this.state.errorMessage && (
              <details
                style={{
                  marginBottom: 16,
                  textAlign: "left",
                  border: "1px solid var(--mb-border)",
                  padding: "6px 10px",
                }}
              >
                <summary
                  style={{ fontSize: 11, color: "var(--mb-muted)", cursor: "pointer" }}
                >
                  Hata detayı (yalnızca geliştirme ortamı)
                </summary>
                <pre
                  style={{
                    fontSize: 10,
                    color: "var(--mb-muted)",
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.errorMessage}
                </pre>
              </details>
            )}

            {/* Aksiyon butonları */}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "center" }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: "var(--mb-primary)",
                  color: "var(--mb-primary-text)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: "var(--mb-surface)",
                  color: "var(--mb-text)",
                  border: "1.5px solid var(--mb-border-strong)",
                  cursor: "pointer",
                }}
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
