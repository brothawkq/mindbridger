import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DanismanKarti } from "@/components/public/DanismanKarti";
import type { DanismanKartiVeri } from "@/components/public/DanismanKarti";

// ─── Config ──────────────────────────────────────────────────────

export const revalidate   = 3600; // ISR: saatte bir yenile
export const dynamicParams = true; // Listede olmayan şehirler SSR ile render edilir

// Build zamanında pre-render edilecek büyük şehirler
const BUYUK_SEHIRLER = [
  "istanbul", "ankara", "izmir", "bursa", "antalya",
  "adana", "konya", "gaziantep", "kayseri", "mersin",
  "eskisehir", "diyarbakir", "samsun", "denizli", "sakarya",
  "hatay", "manisa", "kocaeli", "balikesir", "van",
] as const;

// ─── Yardımcılar ─────────────────────────────────────────────────

// "istanbul"  → "İstanbul"
// "gaziantep" → "Gaziantep"
function slugToDisplayCity(slug: string): string {
  // Runtime guard: params may be undefined during Next.js template prerendering
  const s = typeof slug === "string" && slug ? slug : "";
  return s
    .split("-")
    .map((word) => {
      const first = word[0] ?? "";
      const rest  = word.slice(1);
      // Türkçe: küçük i → büyük İ
      const upper = first === "i" ? "İ" : first.toUpperCase();
      return upper + rest;
    })
    .join(" ");
}

// Supabase ilike için her iki biçimi de kapsar
function cityOrFilter(slug: string, display: string): string {
  if (slug.toLowerCase() === display.toLowerCase()) {
    return `city.ilike.%${slug}%`;
  }
  return `city.ilike.%${slug}%,city.ilike.%${display}%`;
}

// ─── generateStaticParams ─────────────────────────────────────────
export function generateStaticParams() {
  return BUYUK_SEHIRLER.map((sehir) => ({ sehir }));
}

// ─── generateMetadata ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ sehir: string }>;
}): Promise<Metadata> {
  const { sehir } = await params;
  if (!sehir) return {};
  const city = slugToDisplayCity(sehir);

  return {
    title:       `${city} Psikolog ve Danışman Bul | MindBridger`,
    description: `${city}'daki online ve yüz yüze psikolog ve PDR danışmanları. Uzman terapi desteği için size en uygun danışmanı bulun ve anında randevu alın.`,
    alternates:  { canonical: `/${sehir}-psikolog` },
    openGraph: {
      title:       `${city} Psikolog ve Danışmanlar | MindBridger`,
      description: `${city}'da psikolojik destek almak için doğru adres. Yüzlerce danışman, online ve yüz yüze seçenekler.`,
      locale:      "tr_TR",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function SehirPsikologPage({
  params,
}: {
  params: Promise<{ sehir: string }>;
}) {
  const { sehir } = await params;
  if (!sehir) notFound();
  const displayCity = slugToDisplayCity(sehir);

  const supabase = await createClient();

  const { data, count } = await supabase
    .from("danisanlar")
    .select(
      `
      id, slug, title, specialties, city,
      is_online, is_in_person, intro_session_enabled,
      price_individual, sliding_scale, sliding_scale_price,
      average_rating, total_reviews,
      profiles!danisanlar_profile_id_fkey (
        first_name, last_name, avatar_url
      )
      `,
      { count: "exact" },
    )
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .or(cityOrFilter(sehir, displayCity))
    .order("average_rating", { ascending: false })
    .order("total_reviews",  { ascending: false })
    .limit(24);

  const danismanlar = (data ?? []) as unknown as DanismanKartiVeri[];
  const toplam      = count ?? 0;

  // ── LocalBusiness JSON-LD ──────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "LocalBusiness",
    "@id":      `${APP_URL}/${sehir}-psikolog`,
    name:        `MindBridger — ${displayCity} Psikolog ve Danışmanlar`,
    description: `${displayCity}'daki online ve yüz yüze psikolog ve PDR danışmanları.`,
    url:         `${APP_URL}/${sehir}-psikolog`,
    priceRange:  "₺₺",
    areaServed: {
      "@type":          "City",
      name:             displayCity,
      addressCountry:   "TR",
    },
    knowsAbout: ["Psikoterapi", "Psikolojik Danışmanlık", "PDR", "Online Terapi"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
      />

      <main style={{ backgroundColor: "var(--mb-bg)", minHeight: "100vh", padding: "24px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Breadcrumb ── */}
          <nav
            aria-label="Gezinti izi"
            style={{ fontSize: 11, color: "var(--mb-muted)", marginBottom: 16 }}
          >
            <Link href="/" style={{ color: "var(--mb-muted)", textDecoration: "underline" }}>
              Ana Sayfa
            </Link>
            <span style={{ margin: "0 6px" }}>›</span>
            <Link href="/danismanlar" style={{ color: "var(--mb-muted)", textDecoration: "underline" }}>
              Danışmanlar
            </Link>
            <span style={{ margin: "0 6px" }}>›</span>
            <span style={{ color: "var(--mb-text)" }}>{displayCity} Psikolog</span>
          </nav>

          {/* ── Başlık ── */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 6px" }}>
              {displayCity} Psikolog ve Danışman Bul
            </h1>
            <p style={{ fontSize: 13, color: "var(--mb-muted)", margin: 0 }}>
              {toplam > 0
                ? `${toplam} uzman psikolog ve PDR danışmanı — online ve yüz yüze seçenekler`
                : `${displayCity} için kayıtlı danışman bulunamadı.`}
            </p>
          </div>

          {/* ── Kart ızgarası ── */}
          {danismanlar.length > 0 ? (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}>
                {danismanlar.map((d, i) => (
                  <DanismanKarti key={d.id} danisan={d} index={i} />
                ))}
              </div>

              {/* ── Filtreli listeye CTA ── */}
              <div style={{
                paddingTop: 16,
                borderTop: "1px solid var(--mb-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}>
                <span style={{ fontSize: 12, color: "var(--mb-muted)" }}>
                  Filtreler, sıralama ve daha fazla seçenek için:
                </span>
                <Link
                  href={`/danismanlar?sehir=${encodeURIComponent(sehir)}`}
                  style={{
                    fontSize: 12, fontWeight: 700,
                    border: "1.5px solid var(--mb-text)",
                    padding: "7px 14px",
                    color: "var(--mb-text)",
                    textDecoration: "none",
                    backgroundColor: "var(--mb-surface)",
                  }}
                >
                  Tüm {displayCity} danışmanlarını filtrele →
                </Link>
              </div>
            </>
          ) : (
            /* ── Boş durum ── */
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              border: "1.5px dashed var(--mb-border)",
              backgroundColor: "var(--mb-surface)",
            }}>
              <p style={{ fontSize: 13, color: "var(--mb-muted)", marginBottom: 16 }}>
                Henüz bu şehirde kayıtlı danışman bulunmuyor.
                <br />
                Tüm danışmanlarımıza göz atabilirsiniz.
              </p>
              <Link
                href="/danismanlar"
                style={{
                  display: "inline-block",
                  background: "var(--mb-text)",
                  color: "var(--mb-primary-text)",
                  padding: "10px 22px",
                  fontSize: 12, fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Tüm Danışmanları Gör
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
