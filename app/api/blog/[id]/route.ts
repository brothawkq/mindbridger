import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { sanitizeBlogContent } from "@/lib/utils/sanitizeHtml";
import { z } from "zod";

const BlogGuncelleSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter").max(200).optional(),
  content: z.string().max(100000).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).nullable().optional(),
  seo_title: z.string().max(160).nullable().optional(),
  seo_description: z.string().max(320).nullable().optional(),
  seo_keywords: z.array(z.string().max(50)).max(20).nullable().optional(),
  cover_image_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

type Params = { params: Promise<{ id: string }> };

/** GET /api/blog/[id] — tek yazı detayı; taslak/bekleyen sadece sahibi/admin görür */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: yazi, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !yazi) {
    return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
  }

  // Yayınlanmamış yazılar için yetki kontrolü
  if (yazi.status !== "published") {
    const user = await requireRole(supabase, ["danisan", "admin"]);
    if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const { data: profil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profil?.role !== "admin") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();

      if (!danisanRow || yazi.danisan_id !== danisanRow.id) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }
  }

  return NextResponse.json(yazi);
}

/** PUT /api/blog/[id] — danisan: taslak veya reddedilmiş yazıyı güncelle */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const { data: mevcut } = await supabase
    .from("blog_posts")
    .select("id, danisan_id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!mevcut) {
    return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
  }
  if (mevcut.danisan_id !== danisanRow.id) {
    return NextResponse.json({ error: "Bu yazıya erişim yetkiniz yok" }, { status: 403 });
  }
  if (mevcut.status !== "draft" && mevcut.status !== "rejected") {
    return NextResponse.json(
      { error: "Sadece taslak veya reddedilmiş yazılar düzenlenebilir" },
      { status: 409 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = BlogGuncelleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const updates = {
    ...parsed.data,
    ...(parsed.data.content !== undefined
      ? { content: sanitizeBlogContent(parsed.data.content) }
      : {}),
  };
  // Reddedilmiş yazı düzenlenince taslağa döner
  const yeniDurum = mevcut.status === "rejected" ? ("draft" as const) : undefined;

  const { data: guncellendi, error } = await supabase
    .from("blog_posts")
    .update({
      ...updates,
      ...(yeniDurum ? { status: yeniDurum } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, slug, status, title")
    .single();

  if (error) {
    return NextResponse.json({ error: "Yazı güncellenemedi" }, { status: 500 });
  }

  return NextResponse.json(guncellendi);
}

/** DELETE /api/blog/[id] — danisan: taslak yazıyı sil (soft-delete) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan", "admin"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select("id, danisan_id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!yazi) return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });

  if (profil?.role !== "admin") {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!danisanRow || yazi.danisan_id !== danisanRow.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (yazi.status === "published") {
      return NextResponse.json({ error: "Yayınlanmış yazılar silinemez" }, { status: 409 });
    }
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Yazı silinemedi" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
