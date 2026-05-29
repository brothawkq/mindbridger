import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

const Schema = z.object({
  gerekce: z
    .string()
    .min(10, "Red gerekçesi en az 10 karakter olmalıdır.")
    .max(500),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser)
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { hata: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parse = Schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { hata: parse.error.issues[0]?.message ?? "Doğrulama hatası." },
      { status: 422 }
    );
  }
  const { gerekce } = parse.data;

  const { data: hedef, error: hedefHata } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (hedefHata || !hedef) {
    return NextResponse.json(
      { hata: "Kullanıcı bulunamadı." },
      { status: 404 }
    );
  }

  if (hedef.role !== "danisan") {
    return NextResponse.json(
      { hata: "Bu kullanıcı danışman değil." },
      { status: 400 }
    );
  }

  if (hedef.status === "rejected") {
    return NextResponse.json(
      { hata: "Bu başvuru zaten reddedilmiş." },
      { status: 400 }
    );
  }

  const { error: profilHata } = await supabase
    .from("profiles")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (profilHata) {
    return NextResponse.json(
      { hata: "Güncelleme başarısız." },
      { status: 500 }
    );
  }

  await supabase
    .from("danisanlar")
    .update({
      rejection_reason: gerekce,
      profile_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", id);

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "profiles",
    record_id: id,
    old_values: { status: hedef.status },
    new_values: { status: "rejected", rejection_reason: gerekce },
    ip_address:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown",
    expires_at: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
  });

  return NextResponse.json({ basarili: true });
}
