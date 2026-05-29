import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // ── Statik rotalar ─────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/danismanlar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/kurumsal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/testler`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/fiyatlandirma`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/kaynaklar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/webinar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/sss`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_URL}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_URL}/affiliate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_URL}/iletisim`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/giris`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/kayit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/gizlilik-politikasi`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/kvkk`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // ── Danışman profil sayfaları ──────────────────────────────────
  const { data: danismanlar } = await supabase
    .from("danisanlar")
    .select("slug, updated_at")
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(500)

  const danismanRoutes: MetadataRoute.Sitemap = (danismanlar ?? [])
    .filter((d) => d.slug)
    .map((d) => ({
      url: `${APP_URL}/danismanlar/${d.slug}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  // ── Blog yazıları ──────────────────────────────────────────────
  const { data: yazilar } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1000)

  const blogRoutes: MetadataRoute.Sitemap = (yazilar ?? [])
    .filter((y) => y.slug)
    .map((y) => ({
      url: `${APP_URL}/blog/${y.slug}`,
      lastModified: y.updated_at ? new Date(y.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

  // ── Psikolojik testler ─────────────────────────────────────────
  const { data: testler } = await supabase
    .from("psikolojik_testler")
    .select("slug, updated_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200)

  const testRoutes: MetadataRoute.Sitemap = (testler ?? [])
    .filter((t) => t.slug)
    .map((t) => ({
      url: `${APP_URL}/testler/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

  // ── Webinarlar ─────────────────────────────────────────────────
  const { data: webinarlar } = await supabase
    .from("webinarlar")
    .select("id, updated_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(100)

  const webinarRoutes: MetadataRoute.Sitemap = (webinarlar ?? []).map((w) => ({
    url: `${APP_URL}/webinar/${w.id}`,
    lastModified: w.updated_at ? new Date(w.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...danismanRoutes,
    ...blogRoutes,
    ...testRoutes,
    ...webinarRoutes,
  ]
}
