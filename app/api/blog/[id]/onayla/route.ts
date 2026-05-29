import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

/** POST /api/blog/[id]/onayla — admin: pending yazıyı yayınla (pending → published) */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select("id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!yazi) return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
  if (yazi.status !== "pending") {
    return NextResponse.json(
      { error: "Yalnızca bekleyen yazılar onaylanabilir" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: now,
      rejection_reason: null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Yazı onaylanamadı" }, { status: 500 });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "blog_post_approved",
    record_id: id,
    table_name: "blog_posts",
    new_values: { status: "published", published_at: now },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({ ok: true, status: "published" });
}
