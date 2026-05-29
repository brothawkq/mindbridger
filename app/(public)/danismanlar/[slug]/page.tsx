import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DanismanProfilSayfasi } from "@/components/public/DanismanProfilSayfasi";
import type {
  DanismanProfilVeri,
  PaketVeri,
  DegerlendirmeVeri,
} from "@/components/public/DanismanProfilSayfasi";

// ─── Supabase select string (DRY) ────────────────────────────────
const DANISAN_SELECT = `
  id, slug, bio, title, approach, specialties, age_groups, languages,
  gender, city, district, is_online, is_in_person, is_supervisor,
  intro_session_enabled, intro_session_duration, session_duration, buffer_minutes,
  price_individual, price_group, price_async,
  sliding_scale, sliding_scale_price,
  average_rating, total_reviews, total_sessions,
  profiles!danisanlar_profile_id_fkey (
    first_name, last_name, avatar_url
  )
` as const;

// Base URL for OG/structured data — falls back to localhost
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── generateMetadata ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("danisanlar")
    .select("slug, bio, title, profiles!danisanlar_profile_id_fkey ( first_name, last_name, avatar_url )")
    .eq("slug", slug)
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .single();

  if (!data) {
    return { title: "Danışman Bulunamadı | MindBridger" };
  }

  // Cast profiles — join returns object not array with the `!` syntax
  const profiles = data.profiles as {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;

  const adSoyad     = [profiles?.first_name, profiles?.last_name].filter(Boolean).join(" ") || "Danışman";
  const pageTitle   = `${adSoyad}${data.title ? ` — ${data.title}` : ""} | MindBridger`;
  const description = data.bio?.slice(0, 160) ?? `MindBridger'da danışman profili: ${adSoyad}`;
  const pageUrl     = `${APP_URL}/danismanlar/${slug}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/danismanlar/${slug}` },
    openGraph: {
      title:       pageTitle,
      description,
      url:         pageUrl,
      images:      profiles?.avatar_url ? [{ url: profiles.avatar_url }] : [],
      siteName:    "MindBridger",
      locale:      "tr_TR",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────
export default async function DanismanProfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  // ── 1. Danışman profili ──────────────────────────────────────
  const { data: rawDanisan } = await supabase
    .from("danisanlar")
    .select(DANISAN_SELECT)
    .eq("slug", slug)
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .single();

  if (!rawDanisan) notFound();

  // ── 2. Aktif paketler ────────────────────────────────────────
  const { data: rawPaketler } = await supabase
    .from("danisan_paketler")
    .select("id, name, session_count, price, discount_percent, validity_days")
    .eq("danisan_id", rawDanisan.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price", { ascending: true });

  // ── 3. Görünür değerlendirmeler (son 10) ─────────────────────
  const { data: rawDegerlendirmeler } = await supabase
    .from("degerlendirmeler")
    .select("id, rating, comment, review_reply, reply_at, created_at")
    .eq("danisan_id", rawDanisan.id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const danisan          = rawDanisan           as unknown as DanismanProfilVeri;
  const paketler         = (rawPaketler         ?? []) as unknown as PaketVeri[];
  const degerlendirmeler = (rawDegerlendirmeler  ?? []) as unknown as DegerlendirmeVeri[];

  // ── 4. JSON-LD Person structured data ───────────────────────
  const adSoyad = [danisan.profiles?.first_name, danisan.profiles?.last_name]
    .filter(Boolean)
    .join(" ") || "Danışman";

  const jsonLd: Record<string, unknown> = {
    "@context":  "https://schema.org",
    "@type":     "Person",
    name:        adSoyad,
    jobTitle:    danisan.title ?? "Danışman",
    url:         `${APP_URL}/danismanlar/${slug}`,
    knowsAbout:  danisan.specialties  ?? [],
    knowsLanguage: danisan.languages  ?? [],
  };

  if (danisan.profiles?.avatar_url) {
    jsonLd.image = danisan.profiles.avatar_url;
  }
  if (danisan.city) {
    jsonLd.address = {
      "@type":         "PostalAddress",
      addressLocality: danisan.city,
      addressCountry:  "TR",
    };
  }
  if (danisan.total_reviews > 0) {
    jsonLd.aggregateRating = {
      "@type":      "AggregateRating",
      ratingValue:  danisan.average_rating.toFixed(1),
      reviewCount:  danisan.total_reviews,
      bestRating:   5,
      worstRating:  1,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
      />
      <DanismanProfilSayfasi
        danisan={danisan}
        paketler={paketler}
        degerlendirmeler={degerlendirmeler}
      />
    </>
  );
}
