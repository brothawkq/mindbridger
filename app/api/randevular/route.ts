import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireRole";
import { cakismaVarMi, izinliMi } from "@/lib/takvim/cakisma";
import type { Database } from "@/types/supabase";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type SessionType = Database["public"]["Enums"]["session_type"];

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

function toTRDate(iso: string): string {
  return new Date(new Date(iso).getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

// ─── Şemalar ─────────────────────────────────────────────────────

const sessionTypeEnum = z.enum([
  "bireysel", "asenkron", "grup", "cift_aile", "on_gorusme", "supervizyon",
]) satisfies z.ZodType<SessionType>;

const getSchema = z.object({
  durum:     z.string().optional(),
  baslangic: z.string().optional(),
  bitis:     z.string().optional(),
  sayfa:     z.coerce.number().int().min(1).default(1),
});

const postSchema = z.object({
  danisan_id:   z.string().uuid(),
  session_type: sessionTypeEnum,
  scheduled_at: z.string().datetime({ offset: true }),
  partner_id:   z.string().uuid().optional(),
  paket_id:     z.string().uuid().optional(),
});

const PAGE_SIZE = 20;

// ─── GET /api/randevular ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = getSchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz parametreler" }, { status: 400 });
  }
  const { durum, baslangic, bitis, sayfa } = parsed.data;
  const offset = (sayfa - 1) * PAGE_SIZE;

  try {
    // Musteri için notes_private DB-seviyesinde kısıtlı (REVOKE SELECT),
    // danışman için admin client ile açıkça danisan_id filtreli sorgu yapılır.
    if (user.role === "danisan") {
      // Danışman: admin client — notes_private erişimi için (column REVOKE bypass)
      const adminSupabase = createAdminClient();
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow) return Response.json({ randevular: [], toplam: 0 });

      let q = adminSupabase
        .from("randevular")
        .select(
          `id, status, session_type, scheduled_at, duration_minutes, price,
           is_sliding_scale, is_recurring, cancellation_reason,
           cancelled_at, no_show_charged, musteri_id, danisan_id, package_id,
           daily_room_name, summary_shared, notes_private`,
          { count: "exact" },
        )
        .eq("danisan_id", danisanRow.id)
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (durum) q = q.eq("status", durum as AppointmentStatus);
      if (baslangic) q = q.gte("scheduled_at", baslangic);
      if (bitis)     q = q.lte("scheduled_at", bitis);

      const { data, count, error } = await q;
      if (error) return Response.json({ error: "Randevular alınamadı" }, { status: 500 });
      return Response.json({ randevular: data ?? [], toplam: count ?? 0 });
    }

    // Musteri / admin: notes_private dahil değil (musteri için DB-level REVOKE var)
    let query = supabase
      .from("randevular")
      .select(
        `id, status, session_type, scheduled_at, duration_minutes, price,
         is_sliding_scale, is_recurring, cancellation_reason,
         cancelled_at, no_show_charged, musteri_id, danisan_id, package_id,
         daily_room_name, summary_shared`,
        { count: "exact" },
      )
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (user.role === "musteri") query = query.eq("musteri_id", user.id);
    // admin: filtre yok

    if (durum) query = query.eq("status", durum as AppointmentStatus);
    if (baslangic) query = query.gte("scheduled_at", baslangic);
    if (bitis)     query = query.lte("scheduled_at", bitis);

    const { data, count, error } = await query;
    if (error) return Response.json({ error: "Randevular alınamadı" }, { status: 500 });

    return Response.json({ randevular: data ?? [], toplam: count ?? 0 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// ─── POST /api/randevular ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { danisan_id, session_type, scheduled_at, partner_id, paket_id } = parsed.data;

  // musteri_id: musteri ise kendi id'si; danisan ise başkası için (faz 3 kısıtı)
  const musteri_id = user.role === "musteri" ? user.id : null;
  if (!musteri_id) {
    return Response.json({ error: "Müşteri ID gerekli" }, { status: 400 });
  }

  try {
    // Danişman kaydı + seans süresi
    const { data: danisan } = await supabase
      .from("danisanlar")
      .select("id, session_duration, buffer_minutes, profile_published, profile_completion_percent, price_individual, price_async, price_group")
      .eq("id", danisan_id)
      .is("deleted_at", null)
      .single();

    if (!danisan || !danisan.profile_published || danisan.profile_completion_percent !== 100) {
      return Response.json({ error: "Danışman bulunamadı veya aktif değil" }, { status: 404 });
    }

    const suresDakika = danisan.session_duration ?? 50;
    const fiyat =
      session_type === "asenkron" ? (danisan.price_async ?? 0)
      : session_type === "grup"   ? (danisan.price_group ?? 0)
      : (danisan.price_individual ?? 0);
    const baslangicDate = new Date(scheduled_at);

    // Geçmiş tarih kontrolü
    if (baslangicDate <= new Date()) {
      return Response.json({ error: "Geçmiş bir tarih için randevu alınamaz" }, { status: 422 });
    }

    // İzin günü kontrolü
    const tarih = toTRDate(scheduled_at);
    const izinli = await izinliMi(danisan.id, tarih, supabase);
    if (izinli) {
      return Response.json({ error: "Danışman bu gün izinli" }, { status: 409 });
    }

    // Çakışma kontrolü
    const cakisma = await cakismaVarMi(danisan.id, baslangicDate, suresDakika, supabase);
    if (cakisma) {
      return Response.json({ error: "Seçilen saat dolu, lütfen başka bir saat seçin" }, { status: 409 });
    }

    // Randevu oluştur (status: pending, ödeme Faz 4'te)
    const { data: yeniRandevu, error: insertErr } = await supabase
      .from("randevular")
      .insert({
        musteri_id,
        danisan_id: danisan.id,
        session_type,
        status: "pending",
        scheduled_at,
        duration_minutes: suresDakika,
        price: fiyat,
        is_recurring: false,
        no_show_charged: false,
        partner_id: partner_id ?? null,
        package_id: paket_id ?? null,
      })
      .select("id, status, scheduled_at, session_type, duration_minutes")
      .single();

    if (insertErr) {
      // 23505 = unique_violation: eşzamanlı istek aynı slota girdi (race condition)
      if ((insertErr as { code?: string }).code === "23505") {
        return Response.json(
          { error: "Seçilen saat dilimi dolu, lütfen başka bir saat seçin" },
          { status: 409 },
        );
      }
      return Response.json({ error: "Randevu oluşturulamadı" }, { status: 500 });
    }

    return Response.json({ randevu: yeniRandevu }, { status: 201 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
