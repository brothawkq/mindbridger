import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { sanitizeBlogContent } from "@/lib/utils/sanitizeHtml";
import { z } from "zod";

const PAGE_SIZE = 10;

function slugOlustur(baslik: string): string {
  return (
    baslik
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Date.now()
  );
}

const BlogOlusturSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalı").max(200),
  content: z.string().max(100000).optional().default(""),
  excerpt: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional().nullable(),
  seo_title: z.string().max(160).optional().nullable(),
  seo_description: z.string().max(320).optional().nullable(),
  seo_keywords: z.array(z.string().max(50)).max(20).optional().nullable(),
  cover_image_url: z.string().url().optional().nullable().or(z.literal("")),
});

/** GET /api/blog — public: yayınlanmış yazılar (sayfalı) */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const sp = new URL(req.url).searchParams;
  const sayfa = Math.max(1, parseInt(sp.get("sayfa") ?? "1", 10));
  const tag = sp.get("tag");
  const danisanId = sp.get("danisan_id");
  const q = sp.get("q")?.trim() ?? "";

  let query = supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, cover_image_url, tags, published_at, view_count, danisan_id`,
      { count: "exact" }
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .range((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE - 1);

  if (tag) query = query.contains("tags", [tag]);
  if (danisanId) query = query.eq("danisan_id", danisanId);
  if (q) {
    const safe = q.replace(/[%_]/g, "\\$&");
    query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Yazılar getirilemedi" }, { status: 500 });
  }

  return NextResponse.json({
    yazilar: data ?? [],
    sayfalama: {
      sayfa,
      toplamSayfa: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
      toplamYazi: count ?? 0,
      sayfaBoyutu: PAGE_SIZE,
    },
  });
}

/** POST /api/blog — danisan: yeni taslak oluştur */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return NextResponse.json({ error: "Danışman bulunamadı" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = BlogOlusturSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const slug = slugOlustur(d.title);

  const { data: yazi, error } = await supabase
    .from("blog_posts")
    .insert({
      danisan_id: danisanRow.id,
      title: d.title,
      slug,
      content: sanitizeBlogContent(d.content ?? ""),
      excerpt: d.excerpt ?? null,
      tags: d.tags ?? null,
      seo_title: d.seo_title ?? null,
      seo_description: d.seo_description ?? null,
      seo_keywords: d.seo_keywords ?? null,
      cover_image_url: d.cover_image_url || null,
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: "Blog yazısı oluşturulamadı" }, { status: 500 });
  }

  return NextResponse.json({ id: yazi.id, slug: yazi.slug }, { status: 201 });
}
