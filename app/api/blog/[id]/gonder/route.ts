import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

/** POST /api/blog/[id]/gonder — danisan: taslağı incelemeye gönder (draft → pending) */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select("id, danisan_id, status, title, content")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!yazi) return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
  if (yazi.danisan_id !== danisanRow.id) {
    return NextResponse.json({ error: "Bu yazıya erişim yetkiniz yok" }, { status: 403 });
  }
  if (yazi.status !== "draft") {
    return NextResponse.json({ error: "Yalnızca taslak yazılar gönderilebilir" }, { status: 409 });
  }
  if (!yazi.title?.trim()) {
    return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
  }
  if (!yazi.content || yazi.content.replace(/<[^>]*>/g, "").trim().length < 100) {
    return NextResponse.json({ error: "İçerik en az 100 karakter olmalı" }, { status: 400 });
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Yazı gönderilemedi" }, { status: 500 });

  return NextResponse.json({ ok: true, status: "pending" });
}
