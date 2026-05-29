/**
 * Cron: Kurumsal Aylık Fatura
 * Schedule: Her ayın 1'i 08:00 (vercel.json: "0 8 1 * *")
 *
 * Aktif kurumsal hesaplar için önceki ayın seans özetini toplar,
 * fatura kaydı oluşturur ve yöneticiye bütçe uyarısı maili gönderir.
 *
 * Bütçe uyarısı eşiği: default_monthly_budget'ın %80'i.
 * kurumsal_kullanicilar.budget_alert_sent = false olan hesaplar işlenir.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { bildirimGonder } from "@/lib/bildirim/gonder";
import { faturaNumarasiUret } from "@/lib/fatura/numara";
import { render } from "@react-email/render";
import KurumsalButceUyariMail from "@/lib/resend/templates/kurumsal-butce-uyari";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com";
const UYARI_ESIGI = 80; // %

function formatTL(n: number): string {
  return `${n.toLocaleString("tr-TR")} TL`;
}

function ayAdi(tarih: Date): string {
  const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${AYLAR[tarih.getMonth()] ?? ""} ${tarih.getFullYear()}`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const simdi = new Date();

    // Önceki ayın başı ve sonu
    const gecenAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth() - 1, 1);
    const gecenAyBitis = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    const gecenAyStr = ayAdi(gecenAyBaslangic);

    // Aktif kurumsal hesaplar
    const { data: hesaplar } = await supabase
      .from("kurumsal_hesaplar")
      .select("id, company_name, contact_email, contact_name, default_monthly_budget")
      .eq("status", "active")
      .is("deleted_at", null);

    if (!hesaplar || hesaplar.length === 0) {
      return Response.json({ ok: true, islenen: 0 });
    }

    let islenen = 0;
    let faturalar = 0;
    let uyarilar = 0;

    for (const hesap of hesaplar) {
      // Bu hesaptaki kullanıcılar
      const { data: kurKullanicilar } = await supabase
        .from("kurumsal_kullanicilar")
        .select("musteri_id")
        .eq("kurumsal_id", hesap.id)
        .is("deleted_at", null);

      if (!kurKullanicilar || kurKullanicilar.length === 0) continue;

      const musteriIds = kurKullanicilar.map((k) => k.musteri_id);

      // Geçen ay bu kullanıcıların ödemeleri
      const { data: odemeler } = await supabase
        .from("payments")
        .select("amount_gross, musteri_id")
        .eq("status", "captured")
        .in("musteri_id", musteriIds)
        .is("deleted_at", null)
        .gte("paid_at", gecenAyBaslangic.toISOString())
        .lt("paid_at", gecenAyBitis.toISOString());

      const toplamTutar = (odemeler ?? []).reduce((sum, o) => sum + o.amount_gross, 0);

      // seans_faturalari tablosuna kurumsal aylık fatura kaydı
      const periodStart = gecenAyBaslangic.toISOString().substring(0, 10);
      const periodEnd = gecenAyBitis.toISOString().substring(0, 10);
      const { data: mevcutFatura } = await supabase
        .from("seans_faturalari")
        .select("id")
        .eq("kurumsal_id", hesap.id)
        .eq("period_start", periodStart)
        .eq("invoice_type", "kurumsal_aylik")
        .maybeSingle();

      if (!mevcutFatura && toplamTutar > 0) {
        const faturaNo = await faturaNumarasiUret(supabase);
        await supabase
          .from("seans_faturalari")
          .insert({
            kurumsal_id: hesap.id,
            amount: toplamTutar,
            invoice_number: faturaNo,
            invoice_type: "kurumsal_aylik",
            period_start: periodStart,
            period_end: periodEnd,
          });
        faturalar++;
      }

      // Bütçe kullanım oranı
      const butce = hesap.default_monthly_budget;
      if (butce > 0 && toplamTutar > 0) {
        const kullanimYuzde = Math.round((toplamTutar / butce) * 100);

        if (kullanimYuzde >= UYARI_ESIGI && hesap.contact_email) {
          const yoneticiIsim = hesap.contact_name ?? "Yetkili";
          const emailHtml = await render(
            KurumsalButceUyariMail({
              yoneticiIsim,
              firmaAdi: hesap.company_name,
              donem: gecenAyStr,
              toplamButce: formatTL(butce),
              kullanilanButce: formatTL(toplamTutar),
              kalanButce: formatTL(Math.max(0, butce - toplamTutar)),
              kullanimYuzde: Math.min(100, kullanimYuzde),
              uyariEsik: UYARI_ESIGI,
              panelUrl: `${APP_URL}/kurumsal-panel/butce`,
            }),
          );

          // Yönetici kullanıcısına bildirim gönder
          // contact_email üzerinden direkt Resend'e göndermek daha basit
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "MindBridger Kurumsal <kurumsal@mindbridger.com>",
            to: hesap.contact_email,
            subject: `Bütçe Kullanım Raporu — ${gecenAyStr} · ${hesap.company_name}`,
            html: emailHtml,
          });

          uyarilar++;
        }
      }

      // sessions_used_this_month sıfırla (yeni ay başı)
      await supabase
        .from("kurumsal_kullanicilar")
        .update({ sessions_used_this_month: 0, budget_alert_sent: false })
        .eq("kurumsal_id", hesap.id)
        .is("deleted_at", null);

      islenen++;
    }

    return Response.json({
      ok: true,
      islenen,
      faturalar,
      uyarilar,
      donem: gecenAyStr,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/kurumsal-fatura] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
