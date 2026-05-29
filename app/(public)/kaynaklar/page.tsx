import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kaynak Kütüphanesi | MindBridger",
  description:
    "Psikoloji, kişisel gelişim ve ruh sağlığı üzerine uzman psikologlar tarafından seçilmiş ücretsiz kaynaklar.",
};

type KaynakTipi = "pdf" | "video" | "link";

interface Kaynak {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  type: KaynakTipi;
  category: string[] | null;
  created_at: string;
}

const tipEtiketi: Record<KaynakTipi, string> = {
  pdf: "PDF",
  video: "Video",
  link: "Bağlantı",
};

const tipSimge: Record<KaynakTipi, string> = {
  pdf: "↓",
  video: "▶",
  link: "↗",
};

function tumKategorileri(kaynaklar: Kaynak[]): string[] {
  const set = new Set<string>();
  for (const k of kaynaklar) {
    for (const cat of k.category ?? []) {
      set.add(cat);
    }
  }
  return Array.from(set).sort();
}

export default async function KaynaklarPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("kaynaklar")
    .select("id, title, description, file_url, type, category, created_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const kaynaklar = (data ?? []) as Kaynak[];
  const kategoriler = tumKategorileri(kaynaklar);

  const pdfler = kaynaklar.filter((k) => k.type === "pdf");
  const videolar = kaynaklar.filter((k) => k.type === "video");
  const linkler = kaynaklar.filter((k) => k.type === "link");

  return (
    <main style={{ flex: 1, backgroundColor: "var(--pub-bg)", color: "var(--pub-text)", fontFamily: "system-ui, Arial, sans-serif" }}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(245,247,245,0.5)", marginBottom: 12 }}>
            Kaynak Kütüphanesi
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F5F7F5", margin: "0 0 16px", lineHeight: 1.2 }}>
            Uzmanlardan Seçilmiş<br />Ücretsiz Kaynaklar
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,247,245,0.75)", maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
            Psikoloji ve kişisel gelişim üzerine uzman psikologlar tarafından seçilmiş materyaller.
            PDF, video ve faydalı bağlantılar — tamamen ücretsiz.
          </p>
        </div>
      </section>

      {/* ── İçerik ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 64px" }}>

        {kaynaklar.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--pub-muted)", textAlign: "center", padding: "64px 0" }}>
            Henüz kaynak eklenmemiş.
          </p>
        ) : (
          <>
            {/* Kategori etiketleri */}
            {kategoriler.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {kategoriler.map((cat) => (
                  <span
                    key={cat}
                    style={{ fontSize: 10, fontWeight: 700, border: "1.5px solid var(--pub-border)", padding: "3px 8px", color: "var(--pub-muted)" }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* PDF'ler */}
            {pdfler.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px dashed var(--pub-border)" }}>
                  PDF Dökümanlar
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pdfler.map((k) => <KaynakKarti key={k.id} kaynak={k} tipEtiketi={tipEtiketi} tipSimge={tipSimge} />)}
                </div>
              </section>
            )}

            {/* Videolar */}
            {videolar.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px dashed var(--pub-border)" }}>
                  Videolar
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {videolar.map((k) => <KaynakKarti key={k.id} kaynak={k} tipEtiketi={tipEtiketi} tipSimge={tipSimge} />)}
                </div>
              </section>
            )}

            {/* Linkler */}
            {linkler.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px dashed var(--pub-border)" }}>
                  Faydalı Bağlantılar
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {linkler.map((k) => <KaynakKarti key={k.id} kaynak={k} tipEtiketi={tipEtiketi} tipSimge={tipSimge} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <div style={{ marginTop: 24, border: "1.5px solid #325343", padding: "24px 28px", backgroundColor: "var(--pub-surface)" }}>
          <p style={{ fontSize: 12, color: "var(--pub-muted)", marginBottom: 12 }}>
            Bir uzmanla birebir görüşerek daha fazla destek alın.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href="/danismanlar"
              style={{ fontSize: 12, fontWeight: 700, backgroundColor: "#325343", color: "#FFFFFF", padding: "9px 18px", textDecoration: "none" }}
            >
              Danışman Bul
            </Link>
            <Link
              href="/testler"
              style={{ fontSize: 12, fontWeight: 700, border: "1.5px solid #325343", color: "#325343", padding: "9px 18px", textDecoration: "none" }}
            >
              Psikolojik Test Al
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function KaynakKarti({
  kaynak,
  tipEtiketi,
  tipSimge,
}: {
  kaynak: Kaynak;
  tipEtiketi: Record<KaynakTipi, string>;
  tipSimge: Record<KaynakTipi, string>;
}) {
  return (
    <a
      href={kaynak.file_url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        border: "1.5px solid var(--pub-border)",
        backgroundColor: "var(--pub-surface)",
        padding: "16px",
        textDecoration: "none",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", border: "1.5px solid var(--pub-border)", padding: "2px 6px", color: "var(--pub-muted)" }}>
            {tipEtiketi[kaynak.type]}
          </span>
          {(kaynak.category ?? []).slice(0, 2).map((cat) => (
            <span key={cat} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--pub-muted)" }}>
              {cat}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#325343", margin: "0 0 4px", lineHeight: 1.4 }}>
          {kaynak.title}
        </p>
        {kaynak.description && (
          <p style={{ fontSize: 11, color: "var(--pub-muted)", lineHeight: 1.6, margin: 0 }}>
            {kaynak.description}
          </p>
        )}
      </div>
      <div style={{ fontSize: 18, color: "var(--pub-muted)", flexShrink: 0, marginTop: 4 }}>
        {tipSimge[kaynak.type]}
      </div>
    </a>
  );
}
