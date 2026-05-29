import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/blog/slug/[slug] — public: yayınlanmış yazı detayı + görüntülenme sayacı */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: yazi, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, content, excerpt, cover_image_url, tags, seo_title, seo_description, seo_keywords, published_at, view_count, danisan_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();

  if (error || !yazi) {
    return NextResponse.json({ hata: "Yazı bulunamadı." }, { status: 404 });
  }

  // view_count artır (fire-and-forget)
  void supabase
    .from("blog_posts")
    .update({ view_count: yazi.view_count + 1 })
    .eq("id", yazi.id);

  // Yazar bilgisi (admin yazılarında danisan_id olmayabilir)
  const { data: danisanRow } = yazi.danisan_id
    ? await supabase
        .from("danisanlar")
        .select("id, slug, title, profile_id")
        .eq("id", yazi.danisan_id)
        .single()
    : { data: null };

  let yazar = null;
  if (danisanRow) {
    const { data: profilRow } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", danisanRow.profile_id)
      .single();

    if (profilRow) {
      yazar = {
        isim: `${profilRow.first_name ?? ""} ${profilRow.last_name ?? ""}`.trim(),
        slug: danisanRow.slug,
        title: danisanRow.title,
        avatar_url: profilRow.avatar_url,
      };
    }
  }

  return NextResponse.json({ yazi, yazar });
}
