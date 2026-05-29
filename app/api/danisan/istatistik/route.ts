import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()} ${String(d.getUTCHours() + 3).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  void req;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  // danisan kaydını bul
  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id, profile_completion_percent, profile_published")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });
  }

  const danisanId = danisanRow.id;

  const now = new Date();
  const bugunBaslangic = new Date(now);
  bugunBaslangic.setUTCHours(0, 0, 0, 0);
  const bugunBitis = new Date(now);
  bugunBitis.setUTCHours(23, 59, 59, 999);
  const haftaBaslangic = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ayBaslangic = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Paralel sorgular
  const [
    { data: bugunSeans, count: bugunAdet },
    { data: bekleyenOnay },
    { data: yaklaşanRandevular },
    { data: haftaOdemeler },
    { data: ayOdemeler },
    { data: sonYorumlar },
    { data: okunmamisMesajlar, count: okunmamisAdet },
  ] = await Promise.all([
    // Bugünkü onaylı seanslar
    supabase
      .from("randevular")
      .select("id, scheduled_at, musteri_id, session_type", { count: "exact" })
      .eq("danisan_id", danisanId)
      .eq("status", "confirmed")
      .gte("scheduled_at", bugunBaslangic.toISOString())
      .lte("scheduled_at", bugunBitis.toISOString())
      .order("scheduled_at", { ascending: true }),

    // Onay bekleyen randevular
    supabase
      .from("randevular")
      .select("id, scheduled_at, musteri_id, session_type")
      .eq("danisan_id", danisanId)
      .eq("status", "pending")
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Yaklaşan 5 randevu (bugün dahil, onaylı)
    supabase
      .from("randevular")
      .select("id, scheduled_at, musteri_id, session_type, status")
      .eq("danisan_id", danisanId)
      .in("status", ["confirmed", "pending"])
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Bu hafta tamamlanan seanslardan net kazanç
    supabase
      .from("payments")
      .select("amount_net")
      .eq("danisan_id", danisanId)
      .eq("status", "captured")
      .gte("paid_at", haftaBaslangic.toISOString())
      .is("deleted_at", null),

    // Bu ay net kazanç
    supabase
      .from("payments")
      .select("amount_net")
      .eq("danisan_id", danisanId)
      .eq("status", "captured")
      .gte("paid_at", ayBaslangic)
      .is("deleted_at", null),

    // Son 3 değerlendirme
    supabase
      .from("degerlendirmeler")
      .select("id, rating, comment, created_at, musteri_id")
      .eq("danisan_id", danisanId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(3),

    // Okunmamış mesaj sayısı
    supabase
      .from("bildirimler")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)
      .eq("type", "mesaj"),
  ]);

  // Müşteri adlarını çek (yaklaşan randevular + bekleyen onaylar için)
  const musteriIds = [
    ...new Set([
      ...(yaklaşanRandevular ?? []).map((r) => r.musteri_id),
      ...(bekleyenOnay ?? []).map((r) => r.musteri_id),
      ...(sonYorumlar ?? []).map((r) => r.musteri_id),
    ].filter(Boolean)),
  ] as string[];

  type PRow = { id: string; first_name: string | null; last_name: string | null };
  let musteriProfiller: PRow[] = [];
  if (musteriIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", musteriIds);
    musteriProfiller = (data as PRow[]) ?? [];
  }
  const mMap = new Map(
    musteriProfiller.map((p) => [
      p.id,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
    ])
  );

  // Hesaplamalar
  const haftaKazanc = (haftaOdemeler ?? []).reduce(
    (a, p) => a + Number(p.amount_net ?? 0),
    0
  );
  const ayKazanc = (ayOdemeler ?? []).reduce(
    (a, p) => a + Number(p.amount_net ?? 0),
    0
  );

  return NextResponse.json({
    kpi: {
      bugunSeansAdet: bugunAdet ?? 0,
      bekleyenOnayAdet: (bekleyenOnay ?? []).length,
      haftaKazanc,
      ayKazanc,
      profilTamamlanma: danisanRow.profile_completion_percent ?? 0,
      profilYayinda: danisanRow.profile_published ?? false,
      okunmamisMesaj: okunmamisAdet ?? 0,
    },
    bugunSeans: (bugunSeans ?? []).map((r) => ({
      id: r.id,
      saat: fmt(r.scheduled_at),
      musteriAdi: mMap.get(r.musteri_id ?? "") ?? "(adsız)",
      tip: r.session_type ?? "—",
    })),
    yaklasanRandevular: (yaklaşanRandevular ?? []).map((r) => ({
      id: r.id,
      tarihSaat: fmt(r.scheduled_at),
      musteriAdi: mMap.get(r.musteri_id ?? "") ?? "(adsız)",
      tip: r.session_type ?? "—",
      durum: r.status,
    })),
    bekleyenOnaylar: (bekleyenOnay ?? []).map((r) => ({
      id: r.id,
      tarihSaat: fmt(r.scheduled_at),
      musteriAdi: mMap.get(r.musteri_id ?? "") ?? "(adsız)",
      tip: r.session_type ?? "—",
    })),
    sonYorumlar: (sonYorumlar ?? []).map((r) => ({
      id: r.id,
      puan: r.rating,
      yorum: r.comment ?? "",
      tarih: fmt(r.created_at),
      musteriAdi: mMap.get(r.musteri_id ?? "") ?? "(adsız)",
    })),
    guncellemeTarihi: new Date().toISOString(),
  });
}
