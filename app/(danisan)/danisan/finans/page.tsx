import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import FinansKlient from "@/components/danisan/FinansKlient";

export const metadata = { title: "Gelir Paneli — Danışman | MindBridger" };

export default async function DanisanFinansPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  // Initial data: current month
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/danisan/finans?donem=ay&sayfa=1`,
    {
      headers: { Cookie: "" }, // server-side fetch, auth handled via supabase server client
      cache: "no-store",
    }
  );

  // Fallback: fetch directly via supabase if fetch fails (e.g., cold start)
  // Pass empty initial data; client will fetch on mount
  type FinansResponse = Awaited<ReturnType<typeof getFinansData>>;

  async function getFinansData() {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const ayBas = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const ayBit = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)).toISOString();

    const [donemRes, komisyonRes, payoutRes] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount_gross, amount_net, commission_amount, randevu_id, musteri_id, paid_at")
        .eq("danisan_id", danisanRow!.id)
        .eq("status", "captured")
        .gte("paid_at", ayBas)
        .lte("paid_at", ayBit)
        .is("deleted_at", null),

      supabase
        .from("platform_ayarlari")
        .select("value")
        .eq("key", "commission_rate")
        .maybeSingle(),

      supabase
        .from("payouts")
        .select("total_amount, period_end, status")
        .eq("danisan_id", danisanRow!.id)
        .in("status", ["pending", "processing"])
        .is("deleted_at", null)
        .order("period_end", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const odemeler = donemRes.data ?? [];
    const brutGelir = odemeler.reduce((s, p) => s + p.amount_gross, 0);
    const komisyonToplam = odemeler.reduce((s, p) => s + p.commission_amount, 0);
    const netKazanc = odemeler.reduce((s, p) => s + p.amount_net, 0);
    const seansAdedi = odemeler.length;
    const komisyonOrani = parseFloat(komisyonRes.data?.value ?? "20");

    // 6 ay grafik
    const AYLAR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    const grafik: { ay: string; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      grafik.push({ ay: AYLAR[d.getUTCMonth()] ?? "", net: 0 });
    }

    const altiAyBas = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)
    ).toISOString();
    const { data: altıAyOdemeler } = await supabase
      .from("payments")
      .select("amount_net, paid_at")
      .eq("danisan_id", danisanRow!.id)
      .eq("status", "captured")
      .gte("paid_at", altiAyBas)
      .is("deleted_at", null);

    for (const od of altıAyOdemeler ?? []) {
      if (!od.paid_at) continue;
      const d = new Date(new Date(od.paid_at).getTime() + 3 * 60 * 60 * 1000);
      const idx = 5 - (now.getUTCMonth() - d.getUTCMonth() + 12 * (now.getUTCFullYear() - d.getUTCFullYear()));
      if (idx >= 0 && idx < 6) grafik[idx]!.net += od.amount_net;
    }

    // Seans listesi (first 20)
    const randevuIds = odemeler.map((p) => p.randevu_id).filter(Boolean);
    const musteriIds = [...new Set(odemeler.map((p) => p.musteri_id).filter(Boolean))];

    const [randevuRes, musteriRes] = await Promise.all([
      randevuIds.length > 0
        ? supabase.from("randevular").select("id, session_type, scheduled_at, status").in("id", randevuIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; session_type: string; scheduled_at: string; status: string }[] }),
      musteriIds.length > 0
        ? supabase.from("profiles").select("id, first_name, last_name").in("id", musteriIds)
        : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null }[] }),
    ]);

    const randevuMap = new Map((randevuRes.data ?? []).map((r) => [r.id, r]));
    const musteriMap = new Map((musteriRes.data ?? []).map((p) => [p.id, p]));

    const sirali = [...odemeler].sort((a, b) => {
      const ra = randevuMap.get(a.randevu_id);
      const rb = randevuMap.get(b.randevu_id);
      return (rb?.scheduled_at ?? "").localeCompare(ra?.scheduled_at ?? "");
    });

    const seanslar = sirali.slice(0, 20).map((od) => {
      const r = randevuMap.get(od.randevu_id);
      const m = musteriMap.get(od.musteri_id);
      return {
        odemeId: od.id,
        tarih: r?.scheduled_at ?? od.paid_at ?? "",
        musteriBasHarfler: `${m?.first_name?.charAt(0)?.toUpperCase() ?? "?"}. ${m?.last_name?.charAt(0)?.toUpperCase() ?? "?"}.`,
        sessionType: r?.session_type ?? "bireysel",
        brutUcret: od.amount_gross,
        komisyon: od.commission_amount,
        netKazanc: od.amount_net,
        durum: r?.status ?? "completed",
      };
    });

    return {
      kpi: {
        brutGelir,
        komisyon: komisyonToplam,
        netKazanc,
        seansAdedi,
        ortalamaFiyat: seansAdedi > 0 ? Math.round(brutGelir / seansAdedi) : 0,
        komisyonOrani,
        trend: null as number | null,
      },
      sonrakiOdeme: payoutRes.data
        ? { tarih: payoutRes.data.period_end, tutar: payoutRes.data.total_amount, durum: payoutRes.data.status }
        : null,
      grafik: grafik.map((g) => ({ ...g, net: Math.round(g.net) })),
      seanslar,
      ozet: { toplamBrut: brutGelir, toplamKomisyon: komisyonToplam, toplamNet: netKazanc },
      sayfalama: { sayfa: 1, toplamSayfa: Math.max(1, Math.ceil(seansAdedi / 20)), toplamSeans: seansAdedi, sayfaBoyutu: 20 },
    };
  }

  const baslangicVeri: FinansResponse = await getFinansData();

  return <FinansKlient baslangicVeri={baslangicVeri} baslangicDonem="ay" />;
}
