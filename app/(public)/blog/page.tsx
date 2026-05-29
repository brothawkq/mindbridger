import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import BlogListeKlient, {
  type BlogYaziOzet,
} from "@/components/public/BlogListeKlient";

export const metadata: Metadata = {
  title: "Blog | MindBridger",
  description:
    "Psikologlar ve PDR danışmanlarının kaleme aldığı ruh sağlığı, kişisel gelişim ve terapi yazıları.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: APP_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${APP_URL}/blog`,
    },
  ],
};

const PAGE_SIZE = 9;

export default async function BlogPage() {
  const supabase = await createClient();

  const [{ data: yazilarRaw, count }, { data: tumTagler }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, cover_image_url, tags, published_at, view_count, danisan_id",
        { count: "exact" }
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from("blog_posts")
      .select("tags")
      .eq("status", "published")
      .is("deleted_at", null),
  ]);

  const yazilar = yazilarRaw ?? [];

  // Yazar isimleri — danisan_id listesi → danisanlar → profiles
  const danisanIds = [
    ...new Set(
      yazilar
        .map((y) => y.danisan_id)
        .filter((id): id is string => id !== null)
    ),
  ];
  let yazarMap = new Map<string, { isim: string; slug: string }>();

  if (danisanIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, slug, profile_id")
      .in("id", danisanIds);

    const profileIds = (danisanlar ?? []).map((d) => d.profile_id);
    if (profileIds.length > 0) {
      const { data: profiller } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profilMap = new Map(
        (profiller ?? []).map((p) => [
          p.id,
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        ])
      );
      yazarMap = new Map(
        (danisanlar ?? []).map((d) => [
          d.id,
          { isim: profilMap.get(d.profile_id) ?? "Danışman", slug: d.slug ?? "" },
        ])
      );
    }
  }

  const zenginYazilar: BlogYaziOzet[] = yazilar.map((y) => ({
    ...y,
    danisan_id: y.danisan_id ?? "",
    yazar_isim: y.danisan_id ? (yazarMap.get(y.danisan_id)?.isim ?? "Danışman") : "MindBridger",
    yazar_slug: y.danisan_id ? (yazarMap.get(y.danisan_id)?.slug ?? "") : "",
  }));

  // Popüler tag'ları topla ve sırala
  const tagSayim = new Map<string, number>();
  for (const row of tumTagler ?? []) {
    for (const t of row.tags ?? []) {
      tagSayim.set(t, (tagSayim.get(t) ?? 0) + 1);
    }
  }
  const populerTagler = [...tagSayim.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  const toplamSayfa = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--pub-bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
      />
      {/* Hero */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px",
            textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
            marginBottom: 12,
          }}>
            Blog
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F5F7F5", margin: "0 0 12px", lineHeight: 1.2 }}>
            Uzman Yazıları
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,247,245,0.75)", maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
            Uzman danışmanlarımızın ruh sağlığı ve kişisel gelişim yazıları
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px" }}>
        <BlogListeKlient
          baslangicYazilar={zenginYazilar}
          toplamSayfa={toplamSayfa}
          popülerTagler={populerTagler}
        />
      </div>
    </div>
  );
}
