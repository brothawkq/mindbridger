/**
 * Cron: Churn Risk Tarama
 * Schedule: Her gün 10:00 (vercel.json: "0 10 * * *")
 *
 * Son 30 gündeki randevu aktivitesine göre müşterilerin
 * churn_risk_score değerini günceller.
 *
 * Skor Algoritması (0–100):
 *   - Son 30 günde hiç randevu yok     → +50
 *   - Son 14 günde hiç randevu yok     → +30 (ek)
 *   - Son 7 günde hiç randevu yok      → +20 (ek, sadece aktif kullanıcılar)
 *   - Tamamlanan seans / beklenen oran → -10 ile -20 azaltma
 *   - Maks skor: 100, min: 0
 *
 * Yüksek riskli (≥70) kullanıcılara churn e-postası gönderilir.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonder } from "@/lib/bildirim/gonder";
import { render } from "@react-email/render";
import ChurnMail from "@/lib/resend/templates/churn";

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
    const gun30Once = new Date(simdi.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const gun14Once = new Date(simdi.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const gun7Once = new Date(simdi.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Aktif müşteri listesi (deleted_at null, status=active)
    const { data: musteriler } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, churn_risk_score")
      .eq("role", "musteri")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(500); // Saatlik değil günlük; 500 batch yeterli

    if (!musteriler || musteriler.length === 0) {
      return Response.json({ ok: true, islenen: 0 });
    }

    let guncellenen = 0;
    let emailGonderilen = 0;

    for (const musteri of musteriler) {
      // Son 30 gün randevu sayısı
      const { count: son30 } = await supabase
        .from("randevular")
        .select("id", { count: "exact", head: true })
        .eq("musteri_id", musteri.id)
        .in("status", ["confirmed", "completed"])
        .gte("scheduled_at", gun30Once)
        .is("deleted_at", null);

      // Son 14 gün randevu sayısı
      const { count: son14 } = await supabase
        .from("randevular")
        .select("id", { count: "exact", head: true })
        .eq("musteri_id", musteri.id)
        .in("status", ["confirmed", "completed"])
        .gte("scheduled_at", gun14Once)
        .is("deleted_at", null);

      // Son 7 gün randevu sayısı
      const { count: son7 } = await supabase
        .from("randevular")
        .select("id", { count: "exact", head: true })
        .eq("musteri_id", musteri.id)
        .in("status", ["confirmed", "completed"])
        .gte("scheduled_at", gun7Once)
        .is("deleted_at", null);

      // Skor hesapla
      let skor = 0;
      if ((son30 ?? 0) === 0) skor += 50;
      if ((son14 ?? 0) === 0 && (son30 ?? 0) > 0) skor += 30;
      if ((son7 ?? 0) === 0 && (son30 ?? 0) > 0) skor += 20;

      // Aktif seans bonusu (skor azaltma)
      if ((son30 ?? 0) >= 4) skor = Math.max(0, skor - 20);
      else if ((son30 ?? 0) >= 2) skor = Math.max(0, skor - 10);

      skor = Math.min(100, Math.max(0, skor));

      // Skor değiştiyse güncelle
      if (skor !== musteri.churn_risk_score) {
        await supabase
          .from("profiles")
          .update({ churn_risk_score: skor })
          .eq("id", musteri.id);
        guncellenen++;
      }

      // Yüksek risk + henüz bu ay churn maili gönderilmemiş
      if (skor >= 70) {
        const aySonu = new Date(simdi.getFullYear(), simdi.getMonth(), 1).toISOString();
        const { data: mevcutChurnBildirim } = await supabase
          .from("bildirimler")
          .select("id")
          .eq("user_id", musteri.id)
          .eq("type", "pazarlama")
          .contains("data", { churn: true } as Record<string, unknown>)
          .gte("created_at", aySonu)
          .maybeSingle();

        if (!mevcutChurnBildirim) {
          // Son danışman bul
          const { data: sonRandevu } = await supabase
            .from("randevular")
            .select("danisan_id, scheduled_at")
            .eq("musteri_id", musteri.id)
            .eq("status", "completed")
            .is("deleted_at", null)
            .order("scheduled_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let danisanIsim: string | undefined;
          if (sonRandevu?.danisan_id) {
            const { data: dp } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", sonRandevu.danisan_id)
              .single();
            if (dp) danisanIsim = `${dp.first_name ?? ""} ${dp.last_name ?? ""}`.trim() || undefined;
          }

          const sonRandevuTarih = sonRandevu
            ? `${Math.round((simdi.getTime() - new Date(sonRandevu.scheduled_at).getTime()) / (30 * 24 * 60 * 60 * 1000))} ay`
            : "uzun süredir";

          const isim = `${musteri.first_name ?? ""} ${musteri.last_name ?? ""}`.trim() || "Değerli Üyemiz";
          const emailHtml = await render(
            ChurnMail({
              isim,
              sonRandevuTarih,
              danisanIsim,
            }),
          );

          await bildirimGonder({
            userId: musteri.id,
            title: "Sizi Özledik",
            body: "Bir süredır görüşemedik. Randevu almak ister misiniz?",
            type: "pazarlama",
            emailHtml,
            emailKonu: `Sizi Özledik, ${isim} — MindBridger`,
            data: { churn: true, skor },
          });

          emailGonderilen++;
        }
      }
    }

    return Response.json({
      ok: true,
      islenen: musteriler.length,
      guncellenen,
      emailGonderilen,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/churn] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
