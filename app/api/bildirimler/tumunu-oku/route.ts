/**
 * PATCH /api/bildirimler/tumunu-oku
 * Kullanıcının tüm okunmamış bildirimlerini okundu olarak işaretler.
 *
 * Opsiyonel body: { kanal: "app" | "email" | "sms" }
 * Belirtilmezse tüm kanallar işaretlenir.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    let kanal: string | undefined;
    try {
      const body = await req.json() as { kanal?: string };
      kanal = body.kanal;
    } catch {
      // Body yoksa sorun değil
    }

    const okumaTarihi = new Date().toISOString();

    let query = supabase
      .from("bildirimler")
      .update({ read_at: okumaTarihi })
      .eq("user_id", user.id)
      .is("read_at", null)
      .is("deleted_at", null);

    if (kanal) {
      query = query.eq("channel", kanal as "app" | "email" | "sms");
    }

    const { data, error } = await query.select("id");
    if (error) throw error;

    return Response.json({
      ok: true,
      isaretlenen: data?.length ?? 0,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
