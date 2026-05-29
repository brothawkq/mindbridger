import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type { KullaniciListeResponse, KullaniciOzet } from "@/types/admin";

const PAGE_SIZE = 20;

const VALID_DURUM = ["pending", "active", "suspended", "rejected"] as const;
type ValidDurum = (typeof VALID_DURUM)[number];

const VALID_ROL = [
  "visitor",
  "musteri",
  "danisan",
  "kurumsal",
  "affiliate",
  "admin",
] as const;
type ValidRol = (typeof VALID_ROL)[number];

function isDurum(v: string): v is ValidDurum {
  return (VALID_DURUM as readonly string[]).includes(v);
}

function isRol(v: string): v is ValidRol {
  return (VALID_ROL as readonly string[]).includes(v);
}

function formatGMY(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").trim();
  const durum = searchParams.get("durum") ?? "";
  const rol = searchParams.get("rol") ?? "";
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));

  let query = supabase
    .from("profiles")
    .select(
      "id, role, status, first_name, last_name, last_login_at, churn_risk_score, created_at",
      { count: "exact" }
    )
    .is("deleted_at", null);

  if (q) {
    const safe = q.replace(/[%_\\]/g, "\\$&");
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`);
  }
  if (durum && isDurum(durum)) query = query.eq("status", durum);
  if (rol && isRol(rol)) query = query.eq("role", rol);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ hata: "Sorgu başarısız." }, { status: 500 });
  }

  const kullanicilar: KullaniciOzet[] = (data ?? []).map((p) => ({
    id: p.id,
    adSoyad:
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    rol: p.role ?? "visitor",
    durum: p.status ?? "pending",
    kayitTarihi: formatGMY(p.created_at),
    sonGiris: p.last_login_at ? formatGMY(p.last_login_at) : null,
    churnSkoru: p.churn_risk_score ?? 0,
  }));

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const body: KullaniciListeResponse = {
    kullanicilar,
    toplam,
    sayfa,
    toplamSayfa,
  };
  return NextResponse.json(body);
}
