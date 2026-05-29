import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";

const Schema = z.object({
  durum: z.enum(["processing", "completed", "failed"]),
  bankTransferRef: z.string().max(100).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser)
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { payoutId } = await params;

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
  const { durum, bankTransferRef } = parse.data;

  const { data: payout, error: fetchErr } = await supabase
    .from("payouts")
    .select("id, status")
    .eq("id", payoutId)
    .is("deleted_at", null)
    .single();

  if (fetchErr || !payout) {
    return NextResponse.json({ hata: "Ödeme kaydı bulunamadı." }, { status: 404 });
  }

  if (payout.status === "completed") {
    return NextResponse.json({ hata: "Bu ödeme zaten tamamlanmış." }, { status: 400 });
  }

  const updates: {
    status: "processing" | "completed" | "failed";
    updated_at: string;
    paid_at?: string;
    bank_transfer_ref?: string;
  } = {
    status: durum,
    updated_at: new Date().toISOString(),
  };
  if (durum === "completed") updates.paid_at = new Date().toISOString();
  if (bankTransferRef) updates.bank_transfer_ref = bankTransferRef;

  const { error: updateErr } = await supabase
    .from("payouts")
    .update(updates)
    .eq("id", payoutId);

  if (updateErr) {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }

  const auditNew = JSON.parse(JSON.stringify(updates)) as Record<string, string>;

  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: adminUser.id,
    action: "admin_islem",
    table_name: "payouts",
    record_id: payoutId,
    old_values: { status: payout.status },
    new_values: auditNew,
    ip_address:
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown",
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({ basarili: true });
}
