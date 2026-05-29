import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

const PutSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(500),
});

export async function GET(req: NextRequest) {
  void req;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("platform_ayarlari")
    .select("key, value, description")
    .order("key", { ascending: true });

  if (error) return NextResponse.json({ hata: "Ayarlar alınamadı." }, { status: 500 });

  return NextResponse.json({ ayarlar: data ?? [] });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const parse = PutSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { hata: parse.error.issues[0]?.message ?? "Doğrulama hatası." },
      { status: 422 }
    );
  }
  const { key, value } = parse.data;

  const { data: existing } = await supabase
    .from("platform_ayarlari")
    .select("key, value")
    .eq("key", key)
    .single();

  if (!existing) {
    return NextResponse.json({ hata: "Geçersiz ayar anahtarı." }, { status: 404 });
  }

  const { error } = await supabase
    .from("platform_ayarlari")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "platform_ayarlari",
    record_id: null,
    old_values: { key, value: existing.value } as Record<string, string>,
    new_values: { key, value } as Record<string, string>,
    ip_address:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown",
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({ basarili: true });
}
