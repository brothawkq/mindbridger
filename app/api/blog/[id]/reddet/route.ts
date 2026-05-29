import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const Schema = z.object({
  gerekce: z
    .string()
    .min(10, "Red gerekçesi en az 10 karakter olmalı")
    .max(1000),
});

/** POST /api/blog/[id]/reddet — admin: pending yazıyı reddet (pending → rejected) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Gerekçe zorunlu" },
      { status: 400 }
    );
  }

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select("id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!yazi) return NextResponse.json({ error: "Yazı bulunamadı" }, { status: 404 });
  if (yazi.status !== "pending") {
    return NextResponse.json(
      { error: "Yalnızca bekleyen yazılar reddedilebilir" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.gerekce,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Yazı reddedilemedi" }, { status: 500 });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "blog_post_rejected",
    record_id: id,
    table_name: "blog_posts",
    new_values: { status: "rejected", rejection_reason: parsed.data.gerekce },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({ ok: true, status: "rejected" });
}
