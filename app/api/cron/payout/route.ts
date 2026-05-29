/**
 * Cron: Danışman Payout Hesaplama
 * Schedule: Her Cuma 09:00 (vercel.json: "0 9 * * 5")
 *
 * Önceki hafta (Pazartesi–Pazar) tamamlanan seanslardaki
 * `payments` kayıtlarını tarar ve danışman başına `payouts`
 * satırı oluşturur. Var olanlar atlanır (idempotent).
 *
 * payments.danisan_id → danisanlar.id (profiles.id değil)
 * payouts.total_amount = amount_net toplamı
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const simdi = new Date();

    // Geçen haftanın Pazartesi ve Pazar sınırlarını hesapla (UTC+3)
    const utc3Offset = 3 * 60 * 60 * 1000;
    const simdiUtc3 = new Date(simdi.getTime() + utc3Offset);
    const gunOfWeek = simdiUtc3.getUTCDay(); // 0=Paz, 1=Pzt…5=Cum

    // Geçen haftanın Pazartesi 00:00 (UTC+3)
    const pazartesiOffset = gunOfWeek === 0 ? 13 : gunOfWeek + 6;
    const gecenPazartesiUtc3 = new Date(simdiUtc3);
    gecenPazartesiUtc3.setUTCDate(simdiUtc3.getUTCDate() - pazartesiOffset);
    gecenPazartesiUtc3.setUTCHours(0, 0, 0, 0);
    const gecenPazartesi = new Date(gecenPazartesiUtc3.getTime() - utc3Offset).toISOString();

    // Geçen haftanın Pazar 23:59:59 (UTC+3) = Pazartesi + 7 gün
    const gecenPazarUtc3 = new Date(gecenPazartesiUtc3);
    gecenPazarUtc3.setUTCDate(gecenPazartesiUtc3.getUTCDate() + 7);
    const gecenPazar = new Date(gecenPazarUtc3.getTime() - utc3Offset).toISOString();

    const donemBaslangic = gecenPazartesi.substring(0, 10);
    const donemBitis = gecenPazar.substring(0, 10);

    // Bu dönemdeki tamamlanan ödemeler
    const { data: odemeler } = await supabase
      .from("payments")
      .select("id, danisan_id, amount_net, amount_gross, commission_amount")
      .eq("status", "captured")
      .is("deleted_at", null)
      .gte("paid_at", gecenPazartesi)
      .lt("paid_at", gecenPazar);

    if (!odemeler || odemeler.length === 0) {
      return Response.json({
        ok: true,
        olusturulan: 0,
        donem: donemBaslangic,
        mesaj: "Bu dönem için ödeme yok",
      });
    }

    // Danışman ID bazında grupla (danisanlar.id)
    const danisanMap = new Map<string, {
      netToplam: number;
      odemeIds: string[];
    }>();

    for (const odeme of odemeler) {
      const mevcut = danisanMap.get(odeme.danisan_id) ?? {
        netToplam: 0,
        odemeIds: [],
      };
      mevcut.netToplam += odeme.amount_net;
      mevcut.odemeIds.push(odeme.id);
      danisanMap.set(odeme.danisan_id, mevcut);
    }

    let olusturulan = 0;
    let atlanan = 0;

    for (const [danisanId, ozet] of danisanMap) {
      // İdempotent: bu dönem için zaten payout var mı?
      const { data: mevcutPayout } = await supabase
        .from("payouts")
        .select("id")
        .eq("danisan_id", danisanId)
        .eq("period_start", donemBaslangic)
        .maybeSingle();

      if (mevcutPayout) {
        atlanan++;
        continue;
      }

      const { error } = await supabase
        .from("payouts")
        .insert({
          danisan_id: danisanId,
          total_amount: Math.round(ozet.netToplam * 100) / 100,
          payment_ids: ozet.odemeIds,
          period_start: donemBaslangic,
          period_end: donemBitis,
          status: "pending",
        });

      if (!error) olusturulan++;
    }

    return Response.json({
      ok: true,
      donem: donemBaslangic,
      danisanSayisi: danisanMap.size,
      olusturulan,
      atlanan,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/payout] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
