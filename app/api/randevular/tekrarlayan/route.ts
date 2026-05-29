import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { cakismaVarMi, izinliMi } from "@/lib/takvim/cakisma";
import type { Database } from "@/types/supabase";

type SessionType = Database["public"]["Enums"]["session_type"];

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

function toTRDate(iso: string): string {
  return new Date(new Date(iso).getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

const sessionTypeEnum = z.enum([
  "bireysel", "asenkron", "grup", "cift_aile", "on_gorusme", "supervizyon",
]) satisfies z.ZodType<SessionType>;

const postSchema = z.object({
  danisan_id:   z.string().uuid(),
  session_type: sessionTypeEnum,
  scheduled_at: z.string().datetime({ offset: true }),
  hafta_sayisi: z.coerce.number().int().min(1).max(12),
});

const MAX_HAFTA = 12;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
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

  const { danisan_id, session_type, scheduled_at, hafta_sayisi } = parsed.data;
  const hafta = Math.min(hafta_sayisi, MAX_HAFTA);

  try {
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
    const ilkTarih = new Date(scheduled_at);

    if (ilkTarih <= new Date()) {
      return Response.json({ error: "Geçmiş bir tarih için randevu alınamaz" }, { status: 422 });
    }

    const olusturulanlar: { id: string; scheduled_at: string }[] = [];
    const atlananlar: { tarih: string; sebep: string }[] = [];

    for (let i = 0; i < hafta; i++) {
      const haftaBaslangic = new Date(ilkTarih.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const haftaIso = haftaBaslangic.toISOString();
      const tarih = toTRDate(haftaIso);

      const izinli = await izinliMi(danisan.id, tarih, supabase);
      if (izinli) {
        atlananlar.push({ tarih, sebep: "izin" });
        continue;
      }

      const cakisma = await cakismaVarMi(danisan.id, haftaBaslangic, suresDakika, supabase);
      if (cakisma) {
        atlananlar.push({ tarih, sebep: "cakisma" });
        continue;
      }

      const { data: yeni, error: insertErr } = await supabase
        .from("randevular")
        .insert({
          musteri_id: user.id,
          danisan_id: danisan.id,
          session_type,
          status: "pending",
          scheduled_at: haftaIso,
          duration_minutes: suresDakika,
          price: fiyat,
          is_recurring: true,
          no_show_charged: false,
        })
        .select("id, scheduled_at")
        .single();

      if (insertErr || !yeni) {
        // 23505 = unique_violation: eşzamanlı istek aynı slotu kapattı
        const sebep =
          (insertErr as { code?: string } | null)?.code === "23505"
            ? "cakisma"
            : "hata";
        atlananlar.push({ tarih, sebep });
        continue;
      }

      olusturulanlar.push({ id: yeni.id, scheduled_at: yeni.scheduled_at });
    }

    return Response.json(
      { olusturulanlar, atlananlar, toplam: olusturulanlar.length },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
