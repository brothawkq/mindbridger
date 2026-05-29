/**
 * Cron: Randevu Temizlik
 * Schedule: Her 15 dakikada bir (vercel.json: "* /15 * * * *")
 *
 * Çalışma mantığı:
 *   - 30 dakikadan eski "pending" randevuları bulur
 *   - İlgili ödeme kaydı olmayan veya ödeme "failed" olan randevuları soft-delete eder
 *   - Bu sayede ödeme akışında terk edilen slot'lar serbest kalır
 *
 * DEN-12 düzeltmesi: Unique slot constraint (006_randevular_unique_slot.sql) ile
 * birlikte zorunlu — orphan pending, slotu kalıcı bloke ederdi.
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET;
const PENDING_TTL_MINUTES = 30;

export async function GET(req: Request) {
  // Vercel Cron güvenlik kontrolü
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const admin = createAdminClient();
  const eskiSinir = new Date(
    Date.now() - PENDING_TTL_MINUTES * 60 * 1000
  ).toISOString();

  // 30+ dakika önce oluşturulmuş pending randevular
  const { data: eskiPending, error: fetchErr } = await admin
    .from("randevular")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", eskiSinir)
    .is("deleted_at", null);

  if (fetchErr) {
    console.error("[randevu-temizlik] fetch hatası:", fetchErr.message);
    return Response.json({ error: "Fetch hatası" }, { status: 500 });
  }

  if (!eskiPending || eskiPending.length === 0) {
    return Response.json({ ok: true, temizlenen: 0 });
  }

  const ids = eskiPending.map((r) => r.id);

  // Ödemesi tamamlanmış (captured) randevuları filtrele — bunlara dokunma
  const { data: odenenler } = await admin
    .from("payments")
    .select("randevu_id")
    .in("randevu_id", ids)
    .eq("status", "captured");

  const korunanIds = new Set(
    (odenenler ?? [])
      .map((p) => p.randevu_id)
      .filter((id): id is string => id !== null)
  );

  const silinecekIds = ids.filter((id) => !korunanIds.has(id));

  if (silinecekIds.length === 0) {
    return Response.json({ ok: true, temizlenen: 0 });
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("randevular")
    .update({ deleted_at: now, status: "cancelled" })
    .in("id", silinecekIds);

  if (updateErr) {
    console.error("[randevu-temizlik] update hatası:", updateErr.message);
    return Response.json({ error: "Update hatası" }, { status: 500 });
  }

  return Response.json({ ok: true, temizlenen: silinecekIds.length });
}
