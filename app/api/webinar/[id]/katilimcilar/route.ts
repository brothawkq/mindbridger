import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await requireRole(supabase, ["danisan", "admin"]);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    // Danışman yalnızca kendi webinarına erişebilir
    const { data: webinar } = await supabase
      .from("webinarlar")
      .select("host_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!webinar) return Response.json({ error: "Webinar bulunamadı" }, { status: 404 });

    const { data: profil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profil?.role !== "admin" && webinar.host_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { data: kayitlar } = await supabase
      .from("webinar_kayitlar")
      .select("id, musteri_id, status, joined_at, created_at")
      .eq("webinar_id", id)
      .order("created_at", { ascending: false });

    if (!kayitlar || kayitlar.length === 0) {
      return Response.json({ katilimcilar: [], toplam: 0 });
    }

    const musteriIds = [...new Set(kayitlar.map((k) => k.musteri_id))];
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", musteriIds);

    const profilMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        { isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)", avatar_url: p.avatar_url ?? null },
      ])
    );

    const katilimcilar = kayitlar.map((k) => ({
      id: k.id,
      musteriId: k.musteri_id,
      musteriIsim: profilMap.get(k.musteri_id)?.isim ?? "(adsız)",
      musteriAvatar: profilMap.get(k.musteri_id)?.avatar_url ?? null,
      status: k.status,
      joined_at: k.joined_at,
      kayit_tarihi: k.created_at,
    }));

    return Response.json({ katilimcilar, toplam: katilimcilar.length });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
