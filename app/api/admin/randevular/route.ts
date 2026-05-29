import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type {
  AdminRandevuOzet,
  AdminRandevuListeResponse,
} from "@/types/admin";

const PAGE_SIZE = 20;

const VALID_DURUM = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rejected",
] as const;
type Durum = (typeof VALID_DURUM)[number];

function isDurum(v: string): v is Durum {
  return (VALID_DURUM as readonly string[]).includes(v);
}

function formatGMYS(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hour = String(d.getUTCHours() + 3).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hour}:${min}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const durum = searchParams.get("durum") ?? "";
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const baslangic = searchParams.get("baslangic") ?? "";
  const bitis = searchParams.get("bitis") ?? "";

  let query = supabase
    .from("randevular")
    .select(
      "id, scheduled_at, session_type, status, price, duration_minutes, musteri_id, danisan_id, cancellation_reason, no_show_charged",
      { count: "exact" }
    )
    .is("deleted_at", null);

  if (durum && isDurum(durum)) query = query.eq("status", durum);
  if (baslangic) query = query.gte("scheduled_at", baslangic);
  if (bitis) query = query.lte("scheduled_at", bitis);

  const { data: randevular, count, error } = await query
    .order("scheduled_at", { ascending: false })
    .range((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ hata: "Sorgu başarısız." }, { status: 500 });
  }

  const rows = randevular ?? [];

  const musteriIds = [...new Set(rows.map((r) => r.musteri_id).filter(Boolean))] as string[];
  const danisanIds = [...new Set(rows.map((r) => r.danisan_id).filter(Boolean))] as string[];

  const [musteriRes, danisanRowRes] = await Promise.all([
    musteriIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", musteriIds)
      : Promise.resolve({ data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> }),
    danisanIds.length > 0
      ? supabase
          .from("danisanlar")
          .select("id, profile_id")
          .in("id", danisanIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as Array<{ id: string; profile_id: string | null }> }),
  ]);

  const danisanProfileIds = [
    ...new Set(
      (danisanRowRes.data ?? [])
        .map((d) => d.profile_id)
        .filter(Boolean) as string[]
    ),
  ];

  const danisanProfileRes =
    danisanProfileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", danisanProfileIds)
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };

  const musteriMap = new Map(
    (musteriRes.data ?? []).map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    ])
  );

  const danisanProfileMap = new Map(
    (danisanProfileRes.data ?? []).map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    ])
  );

  const danisanNameMap = new Map(
    (danisanRowRes.data ?? []).map((d) => [
      d.id,
      d.profile_id ? (danisanProfileMap.get(d.profile_id) ?? "(adsız)") : "(adsız)",
    ])
  );

  const result: AdminRandevuOzet[] = rows.map((r) => ({
    id: r.id,
    scheduledAt: formatGMYS(r.scheduled_at),
    sessionType: r.session_type ?? "-",
    status: r.status ?? "-",
    price: r.price ?? null,
    durationMinutes: r.duration_minutes ?? null,
    musteriAdi: r.musteri_id ? (musteriMap.get(r.musteri_id) ?? "(adsız)") : "-",
    musteriId: r.musteri_id ?? "",
    danisanAdi: r.danisan_id ? (danisanNameMap.get(r.danisan_id) ?? "(adsız)") : "-",
    danisanId: r.danisan_id ?? "",
    cancellationReason: r.cancellation_reason ?? null,
    noShowCharged: r.no_show_charged ?? false,
  }));

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const body: AdminRandevuListeResponse = { randevular: result, toplam, sayfa, toplamSayfa };
  return NextResponse.json(body);
}
