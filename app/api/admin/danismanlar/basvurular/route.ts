import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type { BasvuruListeResponse, BasvuruOzet } from "@/types/admin";

const PAGE_SIZE = 20;

const VALID_TAB = ["bekleyen", "onaylanmis", "reddedilen", "askida"] as const;
type Tab = (typeof VALID_TAB)[number];

const TAB_DURUM: Record<Tab, "pending" | "active" | "rejected" | "suspended"> =
  {
    bekleyen: "pending",
    onaylanmis: "active",
    reddedilen: "rejected",
    askida: "suspended",
  };

function formatGMY(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tabParam = searchParams.get("tab") ?? "bekleyen";
  const tab: Tab = (VALID_TAB as readonly string[]).includes(tabParam)
    ? (tabParam as Tab)
    : "bekleyen";
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const q = (searchParams.get("q") ?? "").trim();

  const status = TAB_DURUM[tab];

  let profileQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, created_at", { count: "exact" })
    .eq("role", "danisan")
    .eq("status", status)
    .is("deleted_at", null);

  if (q) {
    const safe = q.replace(/[%_\\]/g, "\\$&");
    profileQuery = profileQuery.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`
    );
  }

  const { data: profiles, count, error: profileError } = await profileQuery
    .order("created_at", { ascending: false })
    .range((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE - 1);

  if (profileError) {
    return NextResponse.json({ hata: "Sorgu başarısız." }, { status: 500 });
  }

  const profileIds = (profiles ?? []).map((p) => p.id);

  type DanisanRow = {
    id: string;
    profile_id: string;
    specialties: string[] | null;
    city: string | null;
    diploma_url: string | null;
    id_document_url: string | null;
    rejection_reason: string | null;
    profile_completion_percent: number | null;
  };

  let danisanlarData: DanisanRow[] = [];

  if (profileIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select(
        "id, profile_id, specialties, city, diploma_url, id_document_url, rejection_reason, profile_completion_percent"
      )
      .in("profile_id", profileIds)
      .is("deleted_at", null);

    danisanlarData = (danisanlar as DanisanRow[]) ?? [];
  }

  const danisanMap = new Map(danisanlarData.map((d) => [d.profile_id, d]));

  const basvurular: BasvuruOzet[] = (profiles ?? []).map((p) => {
    const d = danisanMap.get(p.id);
    return {
      profilId: p.id,
      danisanId: d?.id ?? "",
      adSoyad:
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
      uzmanlik: d?.specialties ?? [],
      sehir: d?.city ?? null,
      basvuruTarihi: formatGMY(p.created_at),
      durum: status as BasvuruOzet["durum"],
      diplomaUrl: d?.diploma_url ?? null,
      idDocumentUrl: d?.id_document_url ?? null,
      profilTamamlanma: d?.profile_completion_percent ?? 0,
      redGerekce: d?.rejection_reason ?? null,
    };
  });

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const body: BasvuruListeResponse = { basvurular, toplam, sayfa, toplamSayfa };
  return NextResponse.json(body);
}
