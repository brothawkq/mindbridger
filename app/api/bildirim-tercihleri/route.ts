/**
 * GET /api/bildirim-tercihleri
 * Oturum açmış kullanıcının bildirim tercihlerini döner.
 * Kayıt yoksa varsayılan değerlerle döner (DB'ye yazmadan).
 *
 * PUT /api/bildirim-tercihleri
 * Bildirim tercihlerini günceller (upsert).
 * Body: { randevu_email, randevu_sms, randevu_uygulama, odeme_email, blog_email, marketing_email }
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { z } from "zod";

const tercihSchema = z.object({
  randevu_email:    z.boolean().optional(),
  randevu_sms:      z.boolean().optional(),
  randevu_uygulama: z.boolean().optional(),
  odeme_email:      z.boolean().optional(),
  blog_email:       z.boolean().optional(),
  marketing_email:  z.boolean().optional(),
  // notification_channel: profiles tablosunda, burada da güncellenebilir
  notification_channel: z.enum(["email", "sms", "uygulama_ici"]).optional(),
});

const VARSAYILAN = {
  randevu_email: true,
  randevu_sms: true,
  randevu_uygulama: true,
  odeme_email: true,
  blog_email: true,
  marketing_email: false,
};

export async function GET(_req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const { data: tercihler } = await supabase
      .from("bildirim_tercihleri")
      .select("randevu_email, randevu_sms, randevu_uygulama, odeme_email, blog_email, marketing_email")
      .eq("user_id", user.id)
      .maybeSingle();

    return Response.json(tercihler ?? VARSAYILAN);
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const body = await req.json();
    const parsed = tercihSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Geçersiz veri", details: parsed.error.issues }, { status: 400 });
    }

    const { notification_channel, ...bildirimAlanlar } = parsed.data;

    // bildirim_tercihleri tablosuna upsert
    if (Object.keys(bildirimAlanlar).length > 0) {
      const { error: upsertError } = await supabase
        .from("bildirim_tercihleri")
        .upsert(
          {
            user_id: user.id,
            ...bildirimAlanlar,
          },
          { onConflict: "user_id" },
        );

      if (upsertError) throw upsertError;
    }

    // notification_channel varsa profiles tablosunu da güncelle
    if (notification_channel) {
      const { error: profilError } = await supabase
        .from("profiles")
        .update({ notification_channel })
        .eq("id", user.id);

      if (profilError) throw profilError;
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
