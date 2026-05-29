/**
 * Cron: Audit Log Temizliği
 * Schedule: Her gün 03:00 (vercel.json: "0 3 * * *")
 *
 * 90 günden eski audit_logs kayıtlarını soft-delete ile işaretler.
 * Hassas veri saklama politikası: KVKK uyumu için 90 gün.
 *
 * Ayrıca soft-deleted (deleted_at != null) eski kayıtları hard-delete eder
 * (30 günden fazla silinmiş).
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const LOG_SAKLA_GUN = 90;         // Aktif loglar saklanma süresi
const SILINDI_SAKLA_GUN = 30;    // Soft-delete sonrası hard-delete bekleme

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const simdi = new Date();

    // 1. 90 günden eski aktif logları soft-delete
    const eskiLog = new Date(simdi.getTime() - LOG_SAKLA_GUN * 24 * 60 * 60 * 1000).toISOString();
    const { data: softData } = await supabase
      .from("audit_logs")
      .update({ deleted_at: simdi.toISOString() })
      .lt("created_at", eskiLog)
      .is("deleted_at", null)
      .select("id");

    // 2. 30 günden fazla soft-deleted olanları hard-delete
    const eskiSilindi = new Date(simdi.getTime() - SILINDI_SAKLA_GUN * 24 * 60 * 60 * 1000).toISOString();
    const { data: hardData } = await supabase
      .from("audit_logs")
      .delete()
      .lt("deleted_at", eskiSilindi)
      .select("id");

    return Response.json({
      ok: true,
      softSilinen: softData?.length ?? 0,
      hardSilinen: hardData?.length ?? 0,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/log-temizlik] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
