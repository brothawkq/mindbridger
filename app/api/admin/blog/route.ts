import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

// ─── Slug ────────────────────────────────────────────────────────────────────
function slugOlustur(baslik: string): string {
  return baslik
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
    .replace(/^-|-$/g, "");
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const Schema = z.object({
  baslik: z.string().min(5, "Başlık en az 5 karakter olmalıdır.").max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Geçersiz slug formatı."),
  icerik: z.string().min(100, "İçerik en az 100 karakter olmalıdır.").max(100000),
  ozet: z.string().max(300).optional().nullable(),
  durum: z.enum(["draft", "published"]),
  kapak_url: z.string().url().optional().nullable().or(z.literal("")),
  etiketler: z.array(z.string().max(50)).max(20).optional().nullable(),
});

// ─── POST /api/admin/blog ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek formatı." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Doğrulama hatası.";
    return NextResponse.json({ hata: firstErr }, { status: 422 });
  }

  const d = parsed.data;

  // Slug çakışma kontrolü — gerekirse suffix ekle
  let slug = slugOlustur(d.slug || d.baslik);
  for (let i = 2; i <= 10; i++) {
    const { data: mevcut } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (!mevcut) break;
    slug = `${slugOlustur(d.slug || d.baslik)}-${i}`;
  }

  const now = new Date().toISOString();

  const { data: yazi, error } = await supabase
    .from("blog_posts")
    .insert({
      author_id: user.id,
      danisan_id: null,
      title: d.baslik,
      slug,
      content: d.icerik,
      excerpt: d.ozet ?? null,
      cover_image_url: d.kapak_url || null,
      status: d.durum,
      tags: d.etiketler ?? [],
      published_at: d.durum === "published" ? now : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[api/admin/blog] insert error:", error.message);
    return NextResponse.json({ hata: "Blog yazısı oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ id: yazi.id, slug: yazi.slug }, { status: 201 });
}
