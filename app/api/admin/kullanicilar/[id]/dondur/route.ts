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
  if (!adminUser) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  if (id === adminUser.id) {
    return NextResponse.json(
      { hata: "Kendi hesabınızı donduramazsınız." },
      { status: 403 }
    );
  }

  const { data: hedef, error: hedefHata } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (hedefHata || !hedef) {
    return NextResponse.json({ hata: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (hedef.role === "admin") {
    return NextResponse.json(
      { hata: "Admin hesapları dondurulamaz." },
      { status: 403 }
    );
  }

  const eskiDurum = hedef.status;

  const { error: guncelHata } = await supabase
    .from("profiles")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (guncelHata) {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "profiles",
    record_id: id,
    old_values: { status: eskiDurum },
    new_values: { status: "suspended" },
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
