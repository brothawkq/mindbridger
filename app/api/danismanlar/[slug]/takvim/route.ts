import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Yardımcılar ─────────────────────────────────────────────────

// UTC+3 offset (ms)
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

// Türkiye saatine göre bugünün tarihi ("YYYY-MM-DD")
function todayTR(): string {
  return new Date(Date.now() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

// "YYYY-MM-DD" stringine n gün ekler
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "YYYY-MM-DD" stringinin haftanın gününü döndürür (0=Pazar, 1=Pazartesi…)
function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

// UTC timestamptz string'den Türkiye saatini "HH:MM" formatında döndürür
function toTRTime(utcDateStr: string): string {
  const ms = new Date(utcDateStr).getTime() + TR_OFFSET_MS;
  const d  = new Date(ms);
  return (
    String(d.getUTCHours()).padStart(2, "0") +
    ":" +
    String(d.getUTCMinutes()).padStart(2, "0")
  );
}

// UTC timestamptz string'den Türkiye tarihini "YYYY-MM-DD" formatında döndürür
function toTRDate(utcDateStr: string): string {
  const ms = new Date(utcDateStr).getTime() + TR_OFFSET_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

// Bir günün tüm müsait slot başlangıçlarını ("HH:MM") üretir
function generateSlots(
  startTime: string,
  endTime:   string,
  sessionMinutes: number,
  bufferMinutes:  number,
): string[] {
  const toMin = (t: string): number => {
    const [h = "0", m = "0"] = t.split(":");
    return Number(h) * 60 + Number(m);
  };

  const step = sessionMinutes + bufferMinutes;
  if (step <= 0) return [];

  const start = toMin(startTime);
  const end   = toMin(endTime);
  const slots: string[] = [];

  for (let t = start; t + sessionMinutes <= end; t += step) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(
      String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"),
    );
  }

  return slots;
}

// ─── GET /api/danismanlar/[slug]/takvim ──────────────────────────
//
// Public endpoint. [slug] olarak UUID (danisanlar.id) veya slug kabul edilir.
// Bugünden itibaren 30 günlük müsaitlik takvimini döndürür.
//
// Yanıt:
//   { gunler: Array<{ tarih: string; musait: boolean; slotlar: string[] }> }
//
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = await createClient();

  // ── 1. Danışmanı bul (UUID veya slug ile) ─────────────────────
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug,
    );

  let danisanQuery = supabase
    .from("danisanlar")
    .select("id, session_duration, buffer_minutes")
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null);

  danisanQuery = isUuid
    ? danisanQuery.eq("id", slug)
    : danisanQuery.eq("slug", slug);

  const { data: danisan, error: danisanError } =
    await danisanQuery.single();

  if (danisanError || !danisan) {
    return NextResponse.json(
      { error: "Danışman bulunamadı." },
      { status: 404 },
    );
  }

  // ── 2. Tarih aralığı (bugün + 30 gün, UTC+3) ──────────────────
  const today    = todayTR();
  const rangeEnd = addDays(today, 30);

  // Supabase timestamptz filtreleri için UTC ISO string'ler
  const rangeStartUTC = new Date(`${today}T00:00:00+03:00`).toISOString();
  const rangeEndUTC   = new Date(`${rangeEnd}T00:00:00+03:00`).toISOString();

  // ── 3. Haftalık müsaitlik şablonu ─────────────────────────────
  const { data: template } = await supabase
    .from("danisan_musaitlik")
    .select("day_of_week, start_time, end_time")
    .eq("danisan_id", danisan.id)
    .eq("is_active", true);

  const templateMap = new Map<number, { start_time: string; end_time: string }>();
  for (const row of template ?? []) {
    if (row.day_of_week === null || !row.start_time || !row.end_time) continue;
    templateMap.set(row.day_of_week, {
      start_time: row.start_time,
      end_time:   row.end_time,
    });
  }

  // ── 4. İzin / tatil günleri ────────────────────────────────────
  const { data: izinler } = await supabase
    .from("danisan_izin")
    .select("date")
    .eq("danisan_id", danisan.id)
    .gte("date", today)
    .lte("date", rangeEnd);

  const izinSet = new Set(
    (izinler ?? []).map((r) => r.date).filter((d): d is string => d !== null),
  );

  // ── 5. Dolu randevular (pending + confirmed) ───────────────────
  const { data: randevular } = await supabase
    .from("randevular")
    .select("scheduled_at, duration_minutes")
    .eq("danisan_id", danisan.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", rangeStartUTC)
    .lt("scheduled_at", rangeEndUTC);

  // Tarih → Set<"HH:MM"> (dolu slot başlangıç saatleri)
  const doluSlotlar = new Map<string, Set<string>>();
  for (const r of randevular ?? []) {
    if (!r.scheduled_at) continue;
    const tarih = toTRDate(r.scheduled_at);
    const saat  = toTRTime(r.scheduled_at);
    const existing = doluSlotlar.get(tarih);
    if (existing !== undefined) {
      existing.add(saat);
    } else {
      doluSlotlar.set(tarih, new Set([saat]));
    }
  }

  // ── 6. 30 günlük takvim oluştur ───────────────────────────────
  const sessionMin = danisan.session_duration ?? 50;
  const bufferMin  = danisan.buffer_minutes   ?? 10;

  const gunler: Array<{
    tarih:   string;
    musait:  boolean;
    slotlar: string[];
  }> = [];

  for (let i = 0; i < 30; i++) {
    const tarih = addDays(today, i);
    const dow   = dayOfWeek(tarih);

    // İzin günü
    if (izinSet.has(tarih)) {
      gunler.push({ tarih, musait: false, slotlar: [] });
      continue;
    }

    // Şablonda bu gün tanımlı değil
    const tmpl = templateMap.get(dow);
    if (!tmpl) {
      gunler.push({ tarih, musait: false, slotlar: [] });
      continue;
    }

    // Tüm slotları üret, dolu olanları çıkar
    const tumSlotlar     = generateSlots(tmpl.start_time, tmpl.end_time, sessionMin, bufferMin);
    const doluSet        = doluSlotlar.get(tarih) ?? new Set<string>();
    const musaitSlotlar  = tumSlotlar.filter((s) => !doluSet.has(s));

    gunler.push({
      tarih,
      musait:  musaitSlotlar.length > 0,
      slotlar: musaitSlotlar,
    });
  }

  return NextResponse.json(
    { gunler },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
