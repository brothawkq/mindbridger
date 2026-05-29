import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Psikolojik Testler | MindBridger",
  description:
    "Uzman psikologlar tarafından hazırlanan ücretsiz psikolojik testler. Anksiyete, depresyon, stres ve daha fazlası.",
};

export default async function TestlerPage() {
  const supabase = await createClient();

  const { data: testler } = await supabase
    .from("psikolojik_testler")
    .select("id, title, slug, description, estimated_minutes")
    .eq("is_active", true)
    .order("title", { ascending: true });

  const liste = testler ?? [];

  return (
    <main style={{ flex: 1, backgroundColor: "var(--pub-bg)", color: "var(--pub-text)", fontFamily: "system-ui, Arial, sans-serif" }}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(245,247,245,0.5)", marginBottom: 12 }}>
            Değerlendirme Araçları
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F5F7F5", margin: "0 0 16px", lineHeight: 1.2 }}>
            Psikolojik Testler
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,247,245,0.75)", maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
            Uzman psikologlar tarafından hazırlanan ücretsiz değerlendirme araçları.
            Sonuçlar bilgi amaçlıdır, profesyonel tanı yerine geçmez.
          </p>
        </div>
      </section>

      {/* ── İçerik ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 64px" }}>

        {liste.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--pub-muted)", textAlign: "center", padding: "64px 0" }}>
            Henüz aktif test bulunmuyor.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {liste.map((test) => (
              <Link
                key={test.id}
                href={`/testler/${test.slug}`}
                style={{
                  display: "block",
                  border: "1.5px solid var(--pub-border)",
                  backgroundColor: "var(--pub-surface)",
                  padding: "20px",
                  textDecoration: "none",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: "#325343", margin: "0 0 8px" }}>
                  {test.title}
                </p>
                {test.description && (
                  <p style={{ fontSize: 12, color: "var(--pub-muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
                    {test.description}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "var(--pub-muted)" }}>
                  {test.estimated_minutes && (
                    <span>≈ {test.estimated_minutes} dakika</span>
                  )}
                  <span style={{ fontWeight: 700, color: "#325343" }}>Testi Al →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 40, border: "1.5px solid #325343", padding: "24px 28px", backgroundColor: "var(--pub-surface)" }}>
          <p style={{ fontSize: 12, color: "var(--pub-muted)", marginBottom: 12 }}>
            Test sonuçlarınızı kaydetmek ve danışmanınızla paylaşmak için üye olun.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href="/kayit"
              style={{ fontSize: 12, fontWeight: 700, backgroundColor: "#325343", color: "#FFFFFF", padding: "9px 18px", textDecoration: "none" }}
            >
              Ücretsiz Kayıt Ol
            </Link>
            <Link
              href="/danismanlar"
              style={{ fontSize: 12, fontWeight: 700, border: "1.5px solid #325343", color: "#325343", padding: "9px 18px", textDecoration: "none" }}
            >
              Danışman Bul
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
