import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const PAGE_SIZE = 25;

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const aksiyon = searchParams.get("aksiyon") ?? "";
  const baslangic = searchParams.get("baslangic") ?? "";
  const bitis = searchParams.get("bitis") ?? "";
  const offset = (sayfa - 1) * PAGE_SIZE;

  let q = supabase
    .from("audit_logs")
    .select("id, user_id, action, table_name, record_id, ip_address, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (aksiyon) q = q.eq("action", aksiyon);
  if (baslangic) q = q.gte("created_at", baslangic);
  if (bitis) q = q.lte("created_at", bitis);

  const { data: rawLogs, count, error } = await q;
  if (error) return NextResponse.json({ hata: "Loglar alınamadı." }, { status: 500 });

  const userIds = [
    ...new Set((rawLogs ?? []).map((l) => l.user_id).filter(Boolean)),
  ] as string[];

  type PRow = { id: string; first_name: string | null; last_name: string | null };
  let profiles: PRow[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
    profiles = (data as PRow[]) ?? [];
  }

  const profileMap = new Map(
    profiles.map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    ])
  );

  const loglar = (rawLogs ?? []).map((l) => ({
    id: l.id,
    tarih: fmt(l.created_at),
    kullanici: l.user_id ? (profileMap.get(l.user_id) ?? "(adsız)") : "—",
    aksiyon: l.action ?? "—",
    tablo: l.table_name ?? "—",
    kayitId: l.record_id ?? "—",
    ip: l.ip_address ?? "—",
  }));

  const toplamSayfa = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  return NextResponse.json({ loglar, toplam: count ?? 0, sayfa, toplamSayfa });
}
