import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type {
  AdminFinansResponse,
  FinansSummary,
  PayoutSatir,
  IslemSatir,
  IadeSatir,
} from "@/types/admin";

const PAGE_SIZE = 20;

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

function adSoyad(fn: string | null, ln: string | null): string {
  return `${fn ?? ""} ${ln ?? ""}`.trim() || "(adsız)";
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tab = searchParams.get("tab") ?? "odemeler";
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const durum = searchParams.get("durum") ?? "";
  const offset = (sayfa - 1) * PAGE_SIZE;

  // ── Summary (payouts tablosundan) ─────────────────────────
  const { data: summaryPayouts } = await supabase
    .from("payouts")
    .select("total_amount, status, danisan_id")
    .is("deleted_at", null);

  const payoutRows = summaryPayouts ?? [];
  const bekleyenRows = payoutRows.filter((p) => p.status === "pending");
  const summary: FinansSummary = {
    toplamBrut: 0,
    toplamKomisyon: 0,
    toplamNet: 0,
    seansAdet: 0,
    bekleyenDanisanSayisi: new Set(bekleyenRows.map((p) => p.danisan_id)).size,
    bekleyenTutar: bekleyenRows.reduce((a, p) => a + Number(p.total_amount ?? 0), 0),
    isleniyorTutar: payoutRows
      .filter((p) => p.status === "processing")
      .reduce((a, p) => a + Number(p.total_amount ?? 0), 0),
    odendiTutar: payoutRows
      .filter((p) => p.status === "completed")
      .reduce((a, p) => a + Number(p.total_amount ?? 0), 0),
  };

  // Son 7 günün ödeme özeti
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekPayments } = await supabase
    .from("payments")
    .select("amount_gross, commission_amount, amount_net")
    .gte("created_at", since)
    .is("deleted_at", null);
  for (const p of weekPayments ?? []) {
    summary.toplamBrut += Number(p.amount_gross ?? 0);
    summary.toplamKomisyon += Number(p.commission_amount ?? 0);
    summary.toplamNet += Number(p.amount_net ?? 0);
    summary.seansAdet += 1;
  }

  let payoutlar: PayoutSatir[] = [];
  let islemler: IslemSatir[] = [];
  let iadeler: IadeSatir[] = [];
  let toplam = 0;

  // ── Ödemeler tab ─────────────────────────────────────────
  if (tab === "odemeler") {
    let q = supabase
      .from("payouts")
      .select("id, danisan_id, period_start, period_end, total_amount, status, paid_at", {
        count: "exact",
      })
      .is("deleted_at", null);

    if (durum) q = q.eq("status", durum as "pending" | "processing" | "completed" | "failed");

    const { data: rawPayouts, count } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    const danisanIds = [...new Set((rawPayouts ?? []).map((p) => p.danisan_id).filter(Boolean))] as string[];

    type DRow = { id: string; profile_id: string | null; bank_name: string | null; bank_account_name: string | null; title: string | null };
    let danisanlarData: DRow[] = [];
    if (danisanIds.length > 0) {
      const { data } = await supabase
        .from("danisanlar")
        .select("id, profile_id, bank_name, bank_account_name, title")
        .in("id", danisanIds);
      danisanlarData = (data as DRow[]) ?? [];
    }

    const danProfileIds = [...new Set(danisanlarData.map((d) => d.profile_id).filter(Boolean))] as string[];
    type PRow = { id: string; first_name: string | null; last_name: string | null };
    let profilesData: PRow[] = [];
    if (danProfileIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", danProfileIds);
      profilesData = (data as PRow[]) ?? [];
    }

    const danisanMap = new Map(danisanlarData.map((d) => [d.id, d]));
    const profileMap = new Map(profilesData.map((p) => [p.id, p]));

    payoutlar = (rawPayouts ?? []).map((p) => {
      const d = danisanMap.get(p.danisan_id ?? "");
      const pr = d?.profile_id ? profileMap.get(d.profile_id) : undefined;
      const komisyon = summary.toplamBrut > 0
        ? Math.round(Number(p.total_amount ?? 0) * 0.2 * 100) / 100
        : 0;
      return {
        id: p.id,
        danisanAdi: pr ? adSoyad(pr.first_name, pr.last_name) : "(adsız)",
        danisanUnvan: d?.title ?? null,
        bankAdi: d?.bank_name ?? null,
        seansAdet: 0, // randevu sayısı payment_ids ile hesaplanabilir ama basit tutuyoruz
        brut: Math.round((Number(p.total_amount ?? 0) / 0.8) * 100) / 100,
        komisyon,
        net: Number(p.total_amount ?? 0),
        durum: (p.status ?? "pending") as PayoutSatir["durum"],
        odenmeTarihi: p.paid_at ? fmt(p.paid_at) : null,
      };
    });
  }

  // ── İşlemler tab ─────────────────────────────────────────
  if (tab === "islemler") {
    const { data: rawPays, count } = await supabase
      .from("payments")
      .select("id, musteri_id, danisan_id, amount_gross, commission_amount, amount_net, status, paid_at", {
        count: "exact",
      })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    const mIds = [...new Set((rawPays ?? []).map((p) => p.musteri_id).filter(Boolean))] as string[];
    const dIds = [...new Set((rawPays ?? []).map((p) => p.danisan_id).filter(Boolean))] as string[];

    type PRow = { id: string; first_name: string | null; last_name: string | null };
    let musteriProfiles: PRow[] = [];
    if (mIds.length > 0) {
      const { data } = await supabase.from("profiles").select("id, first_name, last_name").in("id", mIds);
      musteriProfiles = (data as PRow[]) ?? [];
    }

    type DRow = { id: string; profile_id: string | null };
    let danisanRows: DRow[] = [];
    if (dIds.length > 0) {
      const { data } = await supabase.from("danisanlar").select("id, profile_id").in("id", dIds).is("deleted_at", null);
      danisanRows = (data as DRow[]) ?? [];
    }
    const danProfileIds2 = [...new Set(danisanRows.map((d) => d.profile_id).filter(Boolean))] as string[];
    let danisanProfiles: PRow[] = [];
    if (danProfileIds2.length > 0) {
      const { data } = await supabase.from("profiles").select("id, first_name, last_name").in("id", danProfileIds2);
      danisanProfiles = (data as PRow[]) ?? [];
    }

    const mMap = new Map(musteriProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)]));
    const dProfMap = new Map(danisanProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)]));
    const dMap = new Map(danisanRows.map((d) => [d.id, d.profile_id ? (dProfMap.get(d.profile_id) ?? "(adsız)") : "(adsız)"]));

    islemler = (rawPays ?? []).map((p) => ({
      id: p.id,
      tarih: fmt(p.paid_at),
      musteriAdi: p.musteri_id ? (mMap.get(p.musteri_id) ?? "(adsız)") : "-",
      danisanAdi: p.danisan_id ? (dMap.get(p.danisan_id) ?? "(adsız)") : "-",
      brut: Number(p.amount_gross ?? 0),
      komisyon: Number(p.commission_amount ?? 0),
      net: Number(p.amount_net ?? 0),
      durum: p.status ?? "-",
    }));
  }

  // ── İadeler tab ──────────────────────────────────────────
  if (tab === "iadeler") {
    const { data: rawRefunds, count } = await supabase
      .from("refunds")
      .select("id, amount, refund_percent, reason, status, created_at", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    iadeler = (rawRefunds ?? []).map((r) => ({
      id: r.id,
      tarih: fmt(r.created_at),
      miktar: Number(r.amount ?? 0),
      iadePct: Number(r.refund_percent ?? 0),
      sebep: r.reason ?? "-",
      durum: r.status ?? "-",
    }));
  }

  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const body: AdminFinansResponse = {
    summary,
    payoutlar,
    islemler,
    iadeler,
    toplam,
    sayfa,
    toplamSayfa,
  };
  return NextResponse.json(body);
}
