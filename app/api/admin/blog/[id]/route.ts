import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

// ─── Schema ───────────────────────────────────────────────────────────────────
const PatchSchema = z.object({
  baslik: z.string().min(5).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  icerik: z.string().min(100).max(100000).optional(),
  ozet: z.string().max(300).optional().nullable(),
  durum: z.enum(["draft", "published"]).optional(),
  kapak_url: z.string().url().optional().nullable().or(z.literal("")),
  etiketler: z.array(z.string().max(50)).max(20).optional().nullable(),
});

// ─── PATCH /api/admin/blog/[id] ──────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek formatı." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Doğrulama hatası.";
    return NextResponse.json({ hata: firstErr }, { status: 422 });
  }

  const d = parsed.data;

  // Mevcut yazıyı kontrol et
  const { data: mevcut } = await supabase
    .from("blog_posts")
    .select("id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!mevcut) {
    return NextResponse.json({ hata: "Blog yazısı bulunamadı." }, { status: 404 });
  }

  // Güncellenecek alanları hazırla
  type BlogUpdate = {
    updated_at: string;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string | null;
    status?: "draft" | "published" | "pending" | "rejected";
    published_at?: string;
    cover_image_url?: string | null;
    tags?: string[];
  };

  const updates: BlogUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (d.baslik !== undefined) updates.title = d.baslik;
  if (d.slug !== undefined) updates.slug = d.slug;
  if (d.icerik !== undefined) updates.content = d.icerik;
  if (d.ozet !== undefined) updates.excerpt = d.ozet;
  if (d.durum !== undefined) {
    updates.status = d.durum;
    if (d.durum === "published" && mevcut.status !== "published") {
      updates.published_at = new Date().toISOString();
    }
  }
  if (d.kapak_url !== undefined) updates.cover_image_url = d.kapak_url || null;
  if (d.etiketler !== undefined) updates.tags = d.etiketler ?? [];

  const { error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[api/admin/blog/[id]] update error:", error.message);
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }

  return NextResponse.json({ basarili: true });
}

// ─── DELETE /api/admin/blog/[id] — soft delete ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const { data: mevcut } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!mevcut) {
    return NextResponse.json({ hata: "Blog yazısı bulunamadı." }, { status: 404 });
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[api/admin/blog/[id]] delete error:", error.message);
    return NextResponse.json({ hata: "Silme başarısız." }, { status: 500 });
  }

  return NextResponse.json({ basarili: true });
}
