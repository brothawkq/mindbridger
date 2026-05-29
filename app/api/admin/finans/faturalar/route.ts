import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type { FaturaListeResponse, FaturaSatir } from "@/types/admin";

const PAGE_SIZE = 20;

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const tip = searchParams.get("tip") ?? "";
  const offset = (sayfa - 1) * PAGE_SIZE;

  let q = supabase
    .from("seans_faturalari")
    .select(
      "id, invoice_number, invoice_type, amount, pdf_url, created_at, musteri_id, danisan_id",
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (tip) q = q.eq("invoice_type", tip as "bireysel" | "kurumsal_aylik");

  const { data: raw, count } = await q;

  const mIds = [...new Set((raw ?? []).map((f) => f.musteri_id).filter(Boolean))] as string[];
  const dIds = [...new Set((raw ?? []).map((f) => f.danisan_id).filter(Boolean))] as string[];

  type PRow = { id: string; first_name: string | null; last_name: string | null };
  let musteriProfiles: PRow[] = [];
  if (mIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", mIds);
    musteriProfiles = (data as PRow[]) ?? [];
  }

  type DRow = { id: string; profile_id: string | null };
  let danisanRows: DRow[] = [];
  if (dIds.length > 0) {
    const { data } = await supabase
      .from("danisanlar")
      .select("id, profile_id")
      .in("id", dIds)
      .is("deleted_at", null);
    danisanRows = (data as DRow[]) ?? [];
  }

  const danProfileIds = [
    ...new Set(danisanRows.map((d) => d.profile_id).filter(Boolean)),
  ] as string[];
  let danisanProfiles: PRow[] = [];
  if (danProfileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", danProfileIds);
    danisanProfiles = (data as PRow[]) ?? [];
  }

  function adSoyad(fn: string | null, ln: string | null) {
    return `${fn ?? ""} ${ln ?? ""}`.trim() || "(adsız)";
  }

  const mMap = new Map(musteriProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)]));
  const dProfMap = new Map(
    danisanProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)])
  );
  const dMap = new Map(
    danisanRows.map((d) => [
      d.id,
      d.profile_id ? (dProfMap.get(d.profile_id) ?? "(adsız)") : "(adsız)",
    ])
  );

  const faturalar: FaturaSatir[] = (raw ?? []).map((f) => ({
    id: f.id,
    faturaNu: f.invoice_number ?? "-",
    tarih: fmt(f.created_at),
    tip: (f.invoice_type as FaturaSatir["tip"]) ?? "bireysel",
    musteriAdi: f.musteri_id ? (mMap.get(f.musteri_id) ?? "(adsız)") : "-",
    danisanAdi: f.danisan_id ? (dMap.get(f.danisan_id) ?? "(adsız)") : "-",
    tutar: Number(f.amount ?? 0),
    pdfUrl: f.pdf_url ?? null,
  }));

  const toplamSayfa = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const body: FaturaListeResponse = { faturalar, toplam: count ?? 0, sayfa, toplamSayfa };
  return NextResponse.json(body);
}
