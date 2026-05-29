/**
 * PATCH /api/bildirimler/[id]/oku
 * Tek bir bildirimi okundu olarak işaretler.
 *
 * Güvenlik: Yalnızca bildirimin sahibi işaretleyebilir.
 * Zaten okunmuşsa idempotent — 200 döner.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    // Sahiplik kontrolü
    const { data: bildirim } = await supabase
      .from("bildirimler")
      .select("id, read_at, user_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!bildirim) return Response.json({ error: "Bildirim bulunamadı" }, { status: 404 });
    if (bildirim.user_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });

    // Zaten okunmuşsa idempotent
    if (bildirim.read_at) {
      return Response.json({ ok: true, zatenOkunmus: true });
    }

    const { error } = await supabase
      .from("bildirimler")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
