/**
 * Cron: Randevu Hatırlatma
 * Schedule: Her saat başı (vercel.json: "0 * * * *")
 *
 * Çalışma mantığı:
 *   - Şu andan 24 saat sonraki randevular → 24h hatırlatma
 *   - Şu andan 2 saat sonraki randevular  → 2h hatırlatma
 *   - Şu andan 15 dakika sonraki randevular → 15dk hatırlatma
 *
 * Her pencere ±5 dakika tolerans ile hesaplanır (saatlik cron'a uyum).
 * `bildirimler` tablosundaki mevcut kayıtlar kontrol edilerek çift
 * gönderim engellenir.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonder } from "@/lib/bildirim/gonder";
import { render } from "@react-email/render";
import RandevuHatirlama from "@/lib/resend/templates/randevu-hatirlatma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

// Hatırlatma pencereleri: [hedef dakika, tolerans, etiket]
const PENCERELER: [number, number, string][] = [
  [24 * 60, 5, "24 saat"],
  [2 * 60, 5, "2 saat"],
  [15, 5, "15 dakika"],
];

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function formatTarih(iso: string): string {
  const d = new Date(iso);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${utc3.getUTCDate()} ${AYLAR[utc3.getUTCMonth()] ?? ""} ${utc3.getUTCFullYear()}`;
}

function formatSaat(iso: string): string {
  const d = new Date(iso);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${String(utc3.getUTCHours()).padStart(2, "0")}:${String(utc3.getUTCMinutes()).padStart(2, "0")}`;
}

function formatSure(dakika: number): string {
  return dakika >= 60 ? `${Math.round(dakika / 60)} saat` : `${dakika} dakika`;
}

export async function GET(req: Request) {
  // Vercel Cron doğrulama
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const simdi = Date.now();
    let toplamGonderilen = 0;
    let toplamAtlanan = 0;

    for (const [hedefDakika, tolerans, etiket] of PENCERELER) {
      const baslangic = new Date(simdi + (hedefDakika - tolerans) * 60 * 1000).toISOString();
      const bitis = new Date(simdi + (hedefDakika + tolerans) * 60 * 1000).toISOString();

      // Bu penceredeki onaylı randevuları al
      const { data: randevular } = await supabase
        .from("randevular")
        .select("id, musteri_id, danisan_id, scheduled_at, session_type, duration_minutes, daily_room_name")
        .eq("status", "confirmed")
        .is("deleted_at", null)
        .gte("scheduled_at", baslangic)
        .lt("scheduled_at", bitis);

      if (!randevular || randevular.length === 0) continue;

      for (const randevu of randevular) {
        // Daha önce bu pencerede hatırlatma gönderilmiş mi?
        // type="randevu_hatirlatma" + data.pencere ile pencere bazlı kontrol
        const { data: mevcutBildirim } = await supabase
          .from("bildirimler")
          .select("id")
          .eq("user_id", randevu.musteri_id)
          .eq("type", "randevu_hatirlatma")
          .contains("data", { randevuId: randevu.id, pencere: hedefDakika } as Record<string, unknown>)
          .maybeSingle();

        if (mevcutBildirim) {
          toplamAtlanan++;
          continue;
        }

        // Danışman bilgisi (isim)
        const { data: danisanProfil } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", randevu.danisan_id)
          .single();

        const danisanIsim = `${danisanProfil?.first_name ?? ""} ${danisanProfil?.last_name ?? ""}`.trim() || "Danışmanınız";
        const tarih = formatTarih(randevu.scheduled_at);
        const saat = formatSaat(randevu.scheduled_at);
        // Online = daily_room_name var; yoksa yüz yüze veya asenkron
        const isOnline = !!randevu.daily_room_name;
        const seansTuru = isOnline ? "Online" : "Yüz Yüze";
        const sure = formatSure(randevu.duration_minutes);
        const randevuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/panelim/randevularim/${randevu.id}`;
        const videoUrl =
          isOnline && randevu.daily_room_name && hedefDakika <= 15
            ? `https://mindbridge.daily.co/${randevu.daily_room_name}`
            : undefined;

        // Müşteriye gönder
        const emailHtml = await render(
          RandevuHatirlama({
            aliciIsim: "Değerli Üyemiz",
            karsiTarafIsim: danisanIsim,
            tarih,
            saat,
            seansTuru,
            sure,
            kalanSure: etiket,
            randevuUrl,
            videoUrl,
          }),
        );

        await bildirimGonder({
          userId: randevu.musteri_id,
          title: `Randevu Hatırlatması — ${etiket}`,
          body: `${danisanIsim} ile randevunuz ${etiket} sonra başlıyor.`,
          type: "randevu_hatirlatma",
          emailHtml,
          emailKonu: `Randevunuz ${etiket} sonra — MindBridger`,
          smsMetin: `MindBridger: ${danisanIsim} ile randevunuz ${etiket} sonra (${tarih} ${saat}). ${randevuUrl}`,
          data: { randevuId: randevu.id, pencere: hedefDakika },
        });

        toplamGonderilen++;
      }
    }

    return Response.json({
      ok: true,
      gonderilen: toplamGonderilen,
      atlanan: toplamAtlanan,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/hatirlatma] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
