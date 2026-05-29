import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

type Donem = "hafta" | "ay" | "3ay";
const PAGE_SIZE = 20;

function utc3Now() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

function donemAraligi(donem: Donem): { baslangic: string; bitis: string } {
  const now = utc3Now();
  const bitis = new Date(now);
  bitis.setUTCHours(23, 59, 59, 999);

  let baslangic: Date;

  if (donem === "hafta") {
    const gun = now.getUTCDay();
    const diff = gun === 0 ? -6 : 1 - gun;
    baslangic = new Date(now);
    baslangic.setUTCDate(now.getUTCDate() + diff);
    baslangic.setUTCHours(0, 0, 0, 0);
  } else if (donem === "ay") {
    baslangic = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else {
    // 3ay → son 3 ay başı
    baslangic = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  }

  return {
    baslangic: baslangic.toISOString(),
    bitis: bitis.toISOString(),
  };
}

function oncekiDonemAraligi(donem: Donem): { baslangic: string; bitis: string } {
  const { baslangic } = donemAraligi(donem);
  const bas = new Date(baslangic);

  if (donem === "hafta") {
    return {
      baslangic: new Date(bas.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      bitis: new Date(bas.getTime() - 1).toISOString(),
    };
  } else if (donem === "ay") {
    const onceki = new Date(Date.UTC(bas.getUTCFullYear(), bas.getUTCMonth() - 1, 1));
    const oncekiBitis = new Date(Date.UTC(bas.getUTCFullYear(), bas.getUTCMonth(), 0, 23, 59, 59));
    return { baslangic: onceki.toISOString(), bitis: oncekiBitis.toISOString() };
  } else {
    const onceki = new Date(Date.UTC(bas.getUTCFullYear(), bas.getUTCMonth() - 3, 1));
    return { baslangic: onceki.toISOString(), bitis: new Date(bas.getTime() - 1).toISOString() };
  }
}

/** Aylık label üret (örn: "Nis") */
function ayLabel(yil: number, ay: number): string {
  const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return AYLAR[ay] ?? "";
}

/** GET /api/danisan/finans?donem=ay&sayfa=1 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return NextResponse.json({ error: "Danışman bulunamadı" }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const donem: Donem =
    sp.get("donem") === "hafta" ? "hafta" : sp.get("donem") === "3ay" ? "3ay" : "ay";
  const sayfa = Math.max(1, parseInt(sp.get("sayfa") ?? "1", 10));

  const { baslangic, bitis } = donemAraligi(donem);
  const { baslangic: oncekiBas, bitis: oncekiBit } = oncekiDonemAraligi(donem);

  // --- Dönem ödemeleri (KPI) ---
  const [donemRes, oncekiRes, payoutRes, komisyonRes] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount_gross, amount_net, commission_amount, randevu_id, musteri_id, paid_at")
      .eq("danisan_id", danisanRow.id)
      .eq("status", "captured")
      .gte("paid_at", baslangic)
      .lte("paid_at", bitis)
      .is("deleted_at", null),

    supabase
      .from("payments")
      .select("amount_net")
      .eq("danisan_id", danisanRow.id)
      .eq("status", "captured")
      .gte("paid_at", oncekiBas)
      .lte("paid_at", oncekiBit)
      .is("deleted_at", null),

    supabase
      .from("payouts")
      .select("total_amount, period_end, status")
      .eq("danisan_id", danisanRow.id)
      .in("status", ["pending", "processing"])
      .is("deleted_at", null)
      .order("period_end", { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("platform_ayarlari")
      .select("value")
      .eq("key", "commission_rate")
      .maybeSingle(),
  ]);

  const donemOdemeler = donemRes.data ?? [];
  const oncekiOdemeler = oncekiRes.data ?? [];

  const brutGelir = donemOdemeler.reduce((s, p) => s + p.amount_gross, 0);
  const komisyonToplam = donemOdemeler.reduce((s, p) => s + p.commission_amount, 0);
  const netKazanc = donemOdemeler.reduce((s, p) => s + p.amount_net, 0);
  const seansAdedi = donemOdemeler.length;
  const ortalamaFiyat = seansAdedi > 0 ? Math.round(brutGelir / seansAdedi) : 0;
  const komisyonOrani = parseFloat(komisyonRes.data?.value ?? "20");

  const oncekiNet = oncekiOdemeler.reduce((s, p) => s + p.amount_net, 0);
  const trend =
    oncekiNet > 0 ? Math.round(((netKazanc - oncekiNet) / oncekiNet) * 100) : null;

  // --- Son 6 Ay Grafik ---
  const now = utc3Now();
  const grafikVerisi: { ay: string; yil: number; ayNo: number; net: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    grafikVerisi.push({ ay: ayLabel(d.getUTCFullYear(), d.getUTCMonth()), yil: d.getUTCFullYear(), ayNo: d.getUTCMonth(), net: 0 });
  }

  const altiAyBas = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)
  ).toISOString();

  const { data: altıAyOdemeler } = await supabase
    .from("payments")
    .select("amount_net, paid_at")
    .eq("danisan_id", danisanRow.id)
    .eq("status", "captured")
    .gte("paid_at", altiAyBas)
    .is("deleted_at", null);

  for (const odeme of altıAyOdemeler ?? []) {
    if (!odeme.paid_at) continue;
    const d = new Date(new Date(odeme.paid_at).getTime() + 3 * 60 * 60 * 1000);
    const entry = grafikVerisi.find(
      (g) => g.yil === d.getUTCFullYear() && g.ayNo === d.getUTCMonth()
    );
    if (entry) entry.net += odeme.amount_net;
  }

  // --- Seans Listesi (paginated) ---
  // Tüm dönem ödemelerini sayfalamak için randevu bilgileri lazım
  const randevuIds = donemOdemeler.map((p) => p.randevu_id).filter(Boolean);
  const musteriIds = [...new Set(donemOdemeler.map((p) => p.musteri_id).filter(Boolean))];

  const [randevuRes, musteriRes] = await Promise.all([
    randevuIds.length > 0
      ? supabase
          .from("randevular")
          .select("id, session_type, scheduled_at, status")
          .in("id", randevuIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),

    musteriIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", musteriIds)
      : Promise.resolve({ data: [] }),
  ]);

  const randevuMap = new Map(
    (randevuRes.data ?? []).map((r) => [r.id, r])
  );
  const musteriMap = new Map(
    (musteriRes.data ?? []).map((p) => [p.id, p])
  );

  // Sıralama: en yeni önce
  const siraliBirlesik = [...donemOdemeler].sort((a, b) => {
    const ra = randevuMap.get(a.randevu_id);
    const rb = randevuMap.get(b.randevu_id);
    return (rb?.scheduled_at ?? "").localeCompare(ra?.scheduled_at ?? "");
  });

  const toplamSeans = siraliBirlesik.length;
  const toplamSayfa = Math.max(1, Math.ceil(toplamSeans / PAGE_SIZE));
  const sayfaSeanslar = siraliBirlesik.slice((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE);

  const seanslar = sayfaSeanslar.map((odeme) => {
    const randevu = randevuMap.get(odeme.randevu_id);
    const musteri = musteriMap.get(odeme.musteri_id);
    const ad = musteri?.first_name?.charAt(0)?.toUpperCase() ?? "?";
    const soyad = musteri?.last_name?.charAt(0)?.toUpperCase() ?? "?";
    return {
      odemeId: odeme.id,
      tarih: randevu?.scheduled_at ?? odeme.paid_at ?? "",
      musteriBasHarfler: `${ad}. ${soyad}.`,
      sessionType: randevu?.session_type ?? "bireysel",
      brutUcret: odeme.amount_gross,
      komisyon: odeme.commission_amount,
      netKazanc: odeme.amount_net,
      durum: randevu?.status ?? "completed",
    };
  });

  // Toplam özet (tüm dönem)
  const ozet = {
    toplamBrut: brutGelir,
    toplamKomisyon: komisyonToplam,
    toplamNet: netKazanc,
  };

  return NextResponse.json({
    kpi: {
      brutGelir,
      komisyon: komisyonToplam,
      netKazanc,
      seansAdedi,
      ortalamaFiyat,
      komisyonOrani,
      trend,
    },
    sonrakiOdeme: payoutRes.data
      ? {
          tarih: payoutRes.data.period_end,
          tutar: payoutRes.data.total_amount,
          durum: payoutRes.data.status,
        }
      : null,
    grafik: grafikVerisi.map((g) => ({ ay: g.ay, net: Math.round(g.net) })),
    seanslar,
    ozet,
    sayfalama: { sayfa, toplamSayfa, toplamSeans, sayfaBoyutu: PAGE_SIZE },
  });
}
