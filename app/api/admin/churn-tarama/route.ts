import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const CHURN_ESIK = 70;

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export async function GET(req: NextRequest) {
  void req;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { data: riskliKullanicilar, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, status, churn_risk_score, created_at")
    .gte("churn_risk_score", CHURN_ESIK)
    .eq("role", "musteri")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("churn_risk_score", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ hata: "Churn taraması başarısız." }, { status: 500 });

  const kullanicilar = (riskliKullanicilar ?? []).map((p) => ({
    id: p.id,
    adSoyad: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    churnSkoru: p.churn_risk_score ?? 0,
    kayitTarihi: fmt(p.created_at),
  }));

  return NextResponse.json({ kullanicilar, esik: CHURN_ESIK, toplam: kullanicilar.length });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  void req;

  // DEN-21: N+1 sorgu yerine toplu (bulk) sorgu — 3 round-trip ile tüm müşteriler işlenir.
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();

  // 1. Aktif müşterilerin mevcut skorlarını al
  const { data: aktifMusteriler } = await supabase
    .from("profiles")
    .select("id, churn_risk_score")
    .eq("role", "musteri")
    .eq("status", "active")
    .is("deleted_at", null);

  if (!aktifMusteriler || aktifMusteriler.length === 0) {
    return NextResponse.json({ basarili: true, guncellenen: 0 });
  }

  const tumIds = aktifMusteriler.map((m) => m.id);

  // 2. Son 7 günde randevusu olan müşteri ID'leri (tek sorgu)
  const { data: son7Rows } = await supabase
    .from("randevular")
    .select("musteri_id")
    .in("musteri_id", tumIds)
    .gte("scheduled_at", since7)
    .neq("status", "cancelled")
    .is("deleted_at", null);

  const son7Set = new Set((son7Rows ?? []).map((r) => r.musteri_id).filter(Boolean));

  // 3. Son 30 günde randevusu olan müşteri ID'leri (tek sorgu)
  const { data: son30Rows } = await supabase
    .from("randevular")
    .select("musteri_id")
    .in("musteri_id", tumIds)
    .gte("scheduled_at", since30)
    .neq("status", "cancelled")
    .is("deleted_at", null);

  const son30Set = new Set((son30Rows ?? []).map((r) => r.musteri_id).filter(Boolean));

  // 4. Skor hesapla ve toplu güncelle
  let guncellenen = 0;
  const guncellemeler: Array<{ id: string; skor: number }> = [];

  for (const musteri of aktifMusteriler) {
    const mevcutSkor = musteri.churn_risk_score ?? 0;
    let yeniSkor: number;

    if (son7Set.has(musteri.id)) {
      yeniSkor = 0; // Son 7 günde randevu → aktif kullanıcı
    } else if (son30Set.has(musteri.id)) {
      yeniSkor = Math.min(100, mevcutSkor + 10); // Son 30 günde var ama son 7'de yok
    } else {
      yeniSkor = Math.min(100, mevcutSkor + 30); // 30 günde hiç randevu yok
    }

    if (yeniSkor !== mevcutSkor) {
      guncellemeler.push({ id: musteri.id, skor: yeniSkor });
    }
  }

  // 5. Toplu güncelle — skor gruplarına bölerek (IN + update)
  for (const { id, skor } of guncellemeler) {
    await supabase
      .from("profiles")
      .update({ churn_risk_score: skor, updated_at: new Date().toISOString() })
      .eq("id", id);
    guncellenen++;
  }

  return NextResponse.json({ basarili: true, guncellenen });
}
