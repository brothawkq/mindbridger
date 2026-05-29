import type { Metadata } from "next";
import IletisimFormuKlient from "./IletisimFormuKlient";

export const metadata: Metadata = {
  title: "İletişim | MindBridger",
  description:
    "MindBridger ile iletişime geçin. Sorularınız, önerileriniz veya destek talepleriniz için bize yazın.",
  robots: { index: true, follow: true },
};

export default function IletisimPage() {
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "var(--pub-bg)",
        color: "var(--pub-text)",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px",
            textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
            marginBottom: 12,
          }}>
            İletişim
          </p>
          <h1 style={{
            fontSize: 36, fontWeight: 700, color: "#F5F7F5",
            margin: "0 0 16px", lineHeight: 1.2,
          }}>
            Nasıl Yardımcı Olabiliriz?
          </h1>
          <p style={{
            fontSize: 15, color: "rgba(245,247,245,0.75)",
            maxWidth: 560, lineHeight: 1.7, margin: 0,
          }}>
            Sorularınız, önerileriniz veya işbirliği talepleriniz için aşağıdaki
            formu doldurun. Ortalama yanıt süremiz 1 iş günüdür.
          </p>
        </div>
      </section>

      {/* ── İçerik ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "48px 24px 64px",
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* Form */}
        <IletisimFormuKlient />

        {/* Bilgi kutusu */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "1.5px solid var(--pub-border)", padding: "20px", backgroundColor: "var(--pub-surface)", borderRadius: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 10 }}>
              E-posta
            </p>
            <p style={{ fontSize: 13, color: "var(--pub-text)", margin: 0 }}>
              platform@mindbridger.com
            </p>
          </div>

          <div style={{ border: "1.5px solid var(--pub-border)", padding: "20px", backgroundColor: "var(--pub-surface)", borderRadius: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 10 }}>
              Yanıt Süresi
            </p>
            <p style={{ fontSize: 13, color: "var(--pub-text)", margin: 0, lineHeight: 1.6 }}>
              Hafta içi 09:00–18:00 arası ortalama 4 saat, diğer zamanlarda 1 iş
              günü içinde yanıt veriyoruz.
            </p>
          </div>

          <div style={{ border: "1.5px solid var(--pub-border)", padding: "20px", backgroundColor: "var(--pub-surface)", borderRadius: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 10 }}>
              Danışman Başvuruları
            </p>
            <p style={{ fontSize: 13, color: "var(--pub-muted)", lineHeight: 1.6, margin: 0 }}>
              Danışman olarak platforma katılmak için{" "}
              <a href="/danisan-kayit" style={{ color: "#325343", fontWeight: 700 }}>
                başvuru formunu
              </a>{" "}
              kullanın.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
