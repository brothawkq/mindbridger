import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

// ─── Şema ────────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

const slotSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(timeRegex, "HH:MM formatında olmalı"),
    end_time: z.string().regex(timeRegex, "HH:MM formatında olmalı"),
    is_active: z.boolean(),
  })
  .refine(
    (s) => s.start_time < s.end_time,
    { message: "Başlangıç saati bitiş saatinden önce olmalı" },
  );

const putSchema = z.object({
  // Haftanın her günü için maksimum 2 blok (sabah + öğleden sonra)
  musaitlik: z.array(slotSchema).max(14),
});

// ─── Yardımcı: danisanlar.id bul ─────────────────────────────────

async function danisanId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .single();
  return data?.id ?? null;
}

// ─── GET /api/danismanlar/musaitlik ──────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const danId = await danisanId(supabase, user.id);
  if (!danId) {
    return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });
  }

  try {
    const { data, error } = await supabase
      .from("danisan_musaitlik")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("danisan_id", danId)
      .is("deleted_at", null)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return Response.json({ error: "Müsaitlik bilgisi alınamadı" }, { status: 500 });
    }

    return Response.json({ musaitlik: data ?? [] });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// ─── PUT /api/danismanlar/musaitlik ──────────────────────────────

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const danId = await danisanId(supabase, user.id);
  if (!danId) {
    return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { musaitlik } = parsed.data;

  try {
    // Mevcut şablonu soft-delete yap (geçmiş korunur)
    const { error: deleteErr } = await supabase
      .from("danisan_musaitlik")
      .update({ deleted_at: new Date().toISOString() })
      .eq("danisan_id", danId)
      .is("deleted_at", null);

    if (deleteErr) {
      return Response.json({ error: "Şablon güncellenemedi" }, { status: 500 });
    }

    if (musaitlik.length === 0) {
      return Response.json({ ok: true });
    }

    // Yeni şablonu ekle
    const yeniKayitlar = musaitlik.map((slot) => ({
      danisan_id: danId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: slot.is_active,
    }));

    const { error: insertErr } = await supabase
      .from("danisan_musaitlik")
      .insert(yeniKayitlar);

    if (insertErr) {
      return Response.json({ error: "Şablon kaydedilemedi" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
