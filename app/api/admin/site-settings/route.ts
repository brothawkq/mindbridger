import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

const PatchItemSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(500),
});

const PatchBodySchema = z.array(PatchItemSchema).min(1).max(50);

export async function GET(req: NextRequest) {
  void req;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, description, updated_at")
    .order("key");

  if (error) {
    return NextResponse.json({ hata: "Veri alınamadı" }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ hata: "Geçersiz veri", detay: parsed.error.flatten() }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Toplu güncelleme — her key için ayrı upsert
  const updates = parsed.data;
  const errors: string[] = [];

  for (const item of updates) {
    const { error } = await adminClient
      .from("site_settings")
      .update({ value: item.value, updated_at: new Date().toISOString() })
      .eq("key", item.key);

    if (error) errors.push(item.key);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { hata: "Bazı ayarlar güncellenemedi", hataliKeyler: errors },
      { status: 500 }
    );
  }

  // Audit log
  try {
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "site_settings_update",
      table_name: "site_settings",
      new_values: { updated_keys: updates.map((u) => u.key) },
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    // Audit log hatası kritik değil
  }

  return NextResponse.json({ basarili: true, guncellenen: updates.length });
}
