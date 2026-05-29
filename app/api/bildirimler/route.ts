/**
 * GET /api/bildirimler
 * Oturum açmış kullanıcının bildirimlerini listeler.
 *
 * Query params:
 *   ?okunmamis=true   → sadece read_at IS NULL
 *   ?kanal=app|email|sms
 *   ?sayfa=1          → 20'lik sayfalama
 *
 * Yanıt: { bildirimler, toplamOkunmamis, toplamSayfa }
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const SAYFA_BOYUTU = 20;

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireAuth(supabase);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const url = new URL(req.url);
    const okunmamis = url.searchParams.get("okunmamis") === "true";
    const kanal = url.searchParams.get("kanal");
    const sayfa = Math.max(1, parseInt(url.searchParams.get("sayfa") ?? "1", 10));
    const offset = (sayfa - 1) * SAYFA_BOYUTU;

    // Bildirim listesi
    let query = supabase
      .from("bildirimler")
      .select("id, title, body, type, channel, delivery_status, read_at, data, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + SAYFA_BOYUTU - 1);

    if (okunmamis) query = query.is("read_at", null);
    if (kanal) query = query.eq("channel", kanal as "app" | "email" | "sms");

    const { data: bildirimler, error, count } = await query;
    if (error) throw error;

    // Toplam okunmamış sayısı (filtreden bağımsız)
    const { count: toplamOkunmamis } = await supabase
      .from("bildirimler")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)
      .is("deleted_at", null);

    return Response.json({
      bildirimler: bildirimler ?? [],
      toplamOkunmamis: toplamOkunmamis ?? 0,
      toplamSayfa: Math.ceil((count ?? 0) / SAYFA_BOYUTU),
      mevcutSayfa: sayfa,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
