import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

const Schema = z.object({
  durum: z.enum(["published", "rejected"]),
  gerekce: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const parse = Schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { hata: parse.error.issues[0]?.message ?? "Doğrulama hatası." },
      { status: 422 }
    );
  }
  const { durum, gerekce } = parse.data;

  if (durum === "rejected" && !gerekce?.trim()) {
    return NextResponse.json(
      { hata: "Red gerekçesi zorunludur." },
      { status: 422 }
    );
  }

  const { data: post, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchErr || !post) {
    return NextResponse.json({ hata: "Blog yazısı bulunamadı." }, { status: 404 });
  }

  const updates: {
    status: "published" | "rejected";
    updated_at: string;
    published_at?: string;
    rejection_reason?: string;
  } = {
    status: durum,
    updated_at: new Date().toISOString(),
  };

  if (durum === "published") updates.published_at = new Date().toISOString();
  if (durum === "rejected" && gerekce) updates.rejection_reason = gerekce;

  const { error: updateErr } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "blog_posts",
    record_id: id,
    old_values: { status: post.status },
    new_values: JSON.parse(JSON.stringify(updates)) as Record<string, string>,
    ip_address:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown",
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({ basarili: true });
}
