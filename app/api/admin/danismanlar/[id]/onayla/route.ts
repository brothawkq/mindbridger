import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser)
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

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

  if (hedef.status !== "pending") {
    return NextResponse.json(
      { hata: "Yalnızca bekleyen başvurular onaylanabilir." },
      { status: 400 }
    );
  }

  const { error: guncelHata } = await supabase
    .from("profiles")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (guncelHata) {
    return NextResponse.json(
      { hata: "Güncelleme başarısız." },
      { status: 500 }
    );
  }

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "profiles",
    record_id: id,
    old_values: { status: hedef.status },
    new_values: { status: "active" },
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
