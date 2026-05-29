/**
 * Cron: Kurumsal Bütçe Sıfırlama
 * Schedule: Her ayın 1'i gece yarısı (vercel.json: "0 0 1 * *")
 *
 * Tüm aktif kurumsal kullanıcıların `sessions_used_this_month`
 * ve `budget_alert_sent` alanlarını sıfırlar.
 *
 * kurumsal-fatura cron'undan (08:00) önce çalışır (00:00).
 * Sıfırlama sonrası fatura cron önceki aydaki verilerle çalışır.
 * UYARI: Sıralama kurumsal-fatura ile koordineli; vercel.json schedule bağımlı.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Aktif kurumsal kullanıcıların aylık sayaçlarını sıfırla
    const { error, data } = await supabase
      .from("kurumsal_kullanicilar")
      .update({
        sessions_used_this_month: 0,
        budget_alert_sent: false,
      })
      .is("deleted_at", null)
      .select("id");

    if (error) throw error;

    return Response.json({
      ok: true,
      sifirlanan: data?.length ?? 0,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/butce-sifirla] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
