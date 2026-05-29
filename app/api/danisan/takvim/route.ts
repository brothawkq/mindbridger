import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

/** Returns ISO date string for the Monday of the given date's week. */
function mondayOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0]!;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0]!;
}

/** Formats a UTC ISO timestamp to UTC+3 HH:MM and YYYY-MM-DD. */
function toUTC3Parts(iso: string): { tarih: string; saat: string } {
  const d = new Date(iso);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const tarih = utc3.toISOString().split("T")[0]!;
  const saat = `${String(utc3.getUTCHours()).padStart(2, "0")}:${String(utc3.getUTCMinutes()).padStart(2, "0")}`;
  return { tarih, saat };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow)
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });

  const danisanId = danisanRow.id;

  // Determine week
  const { searchParams } = new URL(req.url);
  const haftaParam = searchParams.get("hafta");
  // today in UTC+3
  const todayUTC3 = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const mondayISO = haftaParam ? mondayOf(haftaParam) : mondayOf(todayUTC3);
  const sundayISO = addDays(mondayISO, 6);

  // Monday & Sunday as UTC timestamps for randevular query
  const mondayUTC = new Date(mondayISO + "T00:00:00+03:00").toISOString();
  const sundayUTC = new Date(sundayISO + "T23:59:59+03:00").toISOString();

  const [
    { data: musaitlikSablon },
    { data: izinler },
    { data: randevular },
    { data: tamponAyar },
  ] = await Promise.all([
    supabase
      .from("danisan_musaitlik")
      .select("day_of_week, start_time, end_time")
      .eq("danisan_id", danisanId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),

    supabase
      .from("danisan_izin")
      .select("date")
      .eq("danisan_id", danisanId)
      .gte("date", mondayISO)
      .lte("date", sundayISO)
      .is("deleted_at", null),

    supabase
      .from("randevular")
      .select("id, scheduled_at, duration_minutes, musteri_id, session_type, status")
      .eq("danisan_id", danisanId)
      .in("status", ["confirmed", "pending"])
      .gte("scheduled_at", mondayUTC)
      .lte("scheduled_at", sundayUTC)
      .order("scheduled_at", { ascending: true }),

    supabase
      .from("platform_ayarlari")
      .select("value")
      .eq("key", "buffer_minutes_between_sessions")
      .maybeSingle(),
  ]);

  // Fetch musteri names
  const musteriIds = [
    ...new Set((randevular ?? []).map((r) => r.musteri_id).filter(Boolean)),
  ] as string[];
  let musteriMap = new Map<string, string>();
  if (musteriIds.length > 0) {
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", musteriIds);
    musteriMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
      ])
    );
  }

  // Check Google Calendar sync
  const { data: googleSync } = await supabase
    .from("takvim_sync")
    .select("id")
    .eq("danisan_id", danisanId)
    .eq("provider", "google")
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json({
    hafta: mondayISO,
    musaitlikSablon: (musaitlikSablon ?? []).map((s) => ({
      gun: s.day_of_week,
      baslangic: (s.start_time as string).substring(0, 5),
      bitis: (s.end_time as string).substring(0, 5),
    })),
    izinler: (izinler ?? []).map((i) => i.date as string),
    randevular: (randevular ?? []).map((r) => {
      const { tarih, saat } = toUTC3Parts(r.scheduled_at);
      return {
        id: r.id,
        tarih,
        saat,
        sure: r.duration_minutes ?? 50,
        musteriAdi: musteriMap.get(r.musteri_id ?? "") ?? "(adsız)",
        tip: r.session_type ?? "—",
        durum: r.status,
      };
    }),
    takvimAyarlari: {
      tamponSuresi: Number(tamponAyar?.value ?? 10),
      googleBagli: !!googleSync,
    },
  });
}
