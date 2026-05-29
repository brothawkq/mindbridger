import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FiltreSidebar } from "@/components/public/FiltreSidebar";
import { DanismanlarIstemci } from "@/components/public/DanismanlarIstemci";
import type { DanismanKartiVeri } from "@/components/public/DanismanKarti";
import type { DanismanlarMeta } from "@/components/public/DanismanlarIstemci";
import type { Database } from "@/types/supabase";
import { AramaInput } from "@/components/public/AramaInput";
import { AiEslestirBtn } from "@/components/public/AiEslestirBtn";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: APP_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Danışman Bul",
      item: `${APP_URL}/danismanlar`,
    },
  ],
};

// ─── Sabitler ────────────────────────────────────────────────────
const PAGE_SIZE = 12;

type GenderType = Database["public"]["Enums"]["gender_type"];

const VALID_GENDERS: readonly GenderType[] = [
  "erkek",
  "kadin",
  "belirtmek_istemiyorum",
] as const;

// ─── Metadata ────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Danışman Bul | MindBridger",
  description:
    "Türkiye'nin en geniş online terapi platformunda uzman psikolog ve danışman bulun. Filtreleyin, karşılaştırın, randevu alın.",
};

// ─── Yardımcılar ─────────────────────────────────────────────────
type RawParams = Record<string, string | string[] | undefined>;

function strParam(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? (v[0] ?? undefined) : v;
}

function numParam(v: string | string[] | undefined): number | undefined {
  const s = strParam(v);
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? undefined : n;
}

function csvParam(v: string | string[] | undefined): string[] {
  const s = strParam(v);
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ─── Filtre params → URL string (sayfa hariç) ────────────────────
const PASSTHROUGH_KEYS = [
  "uzmanlik", "yaklasim", "yas_grubu", "dil",
  "sehir", "cinsiyet",
  "online", "yuz_yuze", "ucretsiz_gorusme", "sliding_scale",
  "min_fiyat", "max_fiyat",
  "siralama", "q", "min_puan",
] as const;

function buildSearchParamsString(sp: RawParams): string {
  const out = new URLSearchParams();
  for (const key of PASSTHROUGH_KEYS) {
    const val = strParam(sp[key]);
    if (val) out.set(key, val);
  }
  return out.toString();
}

// ─── Sayfa ───────────────────────────────────────────────────────
//
// Server Component: Sayfa 1'i doğrudan Supabase'den çeker (HTTP round-trip yok).
// Client bileşen (DanismanlarIstemci) sayfa 2+ için /api/danismanlar'ı kullanır.
//
export default async function DanismanlarPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();

  // ── Temel sorgu (API route ile aynı güvenlik koşulları) ──────
  let query = supabase
    .from("danisanlar")
    .select(
      `
      id,
      slug,
      title,
      specialties,
      city,
      is_online,
      is_in_person,
      intro_session_enabled,
      price_individual,
      sliding_scale,
      sliding_scale_price,
      average_rating,
      total_reviews,
      profiles!danisanlar_profile_id_fkey (
        first_name,
        last_name,
        avatar_url
      )
      `,
      { count: "exact" },
    )
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null);

  // ── Filtreler ────────────────────────────────────────────────

  const sehir = strParam(sp.sehir);
  if (sehir) {
    query = query.ilike("city", `%${sehir}%`);
  }

  const cinsiyet = strParam(sp.cinsiyet);
  if (cinsiyet && (VALID_GENDERS as readonly string[]).includes(cinsiyet)) {
    query = query.eq("gender", cinsiyet as GenderType);
  }

  if (sp.online            === "true") query = query.eq("is_online", true);
  if (sp.yuz_yuze          === "true") query = query.eq("is_in_person", true);
  if (sp.ucretsiz_gorusme  === "true") query = query.eq("intro_session_enabled", true);
  if (sp.sliding_scale     === "true") query = query.eq("sliding_scale", true);

  const minFiyat = numParam(sp.min_fiyat);
  const maxFiyat = numParam(sp.max_fiyat);
  if (minFiyat !== undefined) query = query.gte("price_individual", minFiyat);
  if (maxFiyat !== undefined) query = query.lte("price_individual", maxFiyat);

  const uzmanliklar = csvParam(sp.uzmanlik);
  if (uzmanliklar.length > 0) query = query.overlaps("specialties", uzmanliklar);

  const yaklasimlar = csvParam(sp.yaklasim);
  if (yaklasimlar.length > 0) query = query.overlaps("approach", yaklasimlar);

  const yasGruplari = csvParam(sp.yas_grubu);
  if (yasGruplari.length > 0) query = query.overlaps("age_groups", yasGruplari);

  const diller = csvParam(sp.dil);
  if (diller.length > 0) query = query.overlaps("languages", diller);

  const q = strParam(sp.q);
  if (q) {
    const safe = q.replace(/%/g, "").replace(/_/g, "");
    query = query.or(`title.ilike.%${safe}%,bio.ilike.%${safe}%`);
  }

  const minPuan = numParam(sp.min_puan);
  if (minPuan !== undefined) query = query.gte("average_rating", minPuan);

  // ── Sıralama ─────────────────────────────────────────────────
  const siralama = strParam(sp.siralama) ?? "puan";

  switch (siralama) {
    case "fiyat_artan":
      query = query.order("price_individual", { ascending: true,  nullsFirst: false });
      break;
    case "fiyat_azalan":
      query = query.order("price_individual", { ascending: false, nullsFirst: false });
      break;
    case "seans_sayisi":
      query = query.order("total_sessions", { ascending: false });
      break;
    default: // "puan"
      query = query
        .order("average_rating", { ascending: false })
        .order("total_reviews",  { ascending: false });
  }

  // ── Sayfa 1 ──────────────────────────────────────────────────
  query = query.range(0, PAGE_SIZE - 1);

  const { data, count } = await query;

  const toplam       = count ?? 0;
  const toplamSayfa  = Math.ceil(toplam / PAGE_SIZE);

  const initialMeta: DanismanlarMeta = {
    toplam,
    sayfa:        1,
    toplam_sayfa: toplamSayfa,
    limit:        PAGE_SIZE,
    sonuc_var:    toplam > 0,
  };

  // Supabase join tipi (isOneToOne:false) ile DanismanKartiVeri arasındaki
  // uyumsuzluğu gidermek için unknown üzerinden cast yapılır.
  const initialDanismanlar = (data ?? []) as unknown as DanismanKartiVeri[];

  // Client bileşene geçirilecek filtre string'i (sayfa hariç)
  const searchParamsString = buildSearchParamsString(sp);

  return (
    <div style={{ backgroundColor: "var(--pub-bg)", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
      />
      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 32px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px",
            textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
            marginBottom: 10,
          }}>
            Danışmanlar
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#F5F7F5", margin: "0 0 10px", lineHeight: 1.2 }}>
            Size Uygun Danışmanı Bulun
          </h1>
          {/* ── Arama satırı ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <AramaInput />
            <AiEslestirBtn />
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* ── Düzen: filtre sidebar + sonuç alanı ── */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <FiltreSidebar />
          <DanismanlarIstemci
            key={searchParamsString}
            initialDanismanlar={initialDanismanlar}
            initialMeta={initialMeta}
            searchParamsString={searchParamsString}
          />
        </div>
      </main>
    </div>
  );
}
