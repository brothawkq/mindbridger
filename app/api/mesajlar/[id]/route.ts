import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

interface RouteParams {
  params: Promise<{ id: string }>; // conversation id
}

/** GET /api/mesajlar/[id] — konuşma id'sine göre mesajları getir, okunmamışları işaretle */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Katılımcı doğrulama
  const { data: konusma, error: konusmaHata } = await supabase
    .from("conversations")
    .select("id, type, musteri_id, danisan_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (konusmaHata || !konusma) {
    return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });
  }

  // Danisan ise danisanlar.id ile eşleştir
  let katilimciMi = false;
  if (user.role === "musteri") {
    katilimciMi = konusma.musteri_id === user.id;
  } else if (user.role === "danisan") {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();
    katilimciMi = danisanRow?.id === konusma.danisan_id;
  } else if (user.role === "admin") {
    katilimciMi = true;
  }

  if (!katilimciMi) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  // Mesajları getir
  const { data: mesajlar, error: mesajHata } = await supabase
    .from("messages")
    .select("id, sender_id, content, audio_url, is_session_response, read_at, created_at")
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (mesajHata) {
    return NextResponse.json({ error: "Mesajlar getirilemedi" }, { status: 500 });
  }

  // Karşı tarafın profil bilgisi
  let karsiTarafProfileId: string;
  if (user.role === "musteri") {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("profile_id")
      .eq("id", konusma.danisan_id)
      .is("deleted_at", null)
      .single();
    karsiTarafProfileId = danisanRow?.profile_id ?? "";
  } else {
    karsiTarafProfileId = konusma.musteri_id;
  }

  const { data: karsiTarafProfil } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", karsiTarafProfileId)
    .single();

  // Okunmamış mesajları işaretle (gönderen ben değilsem)
  const okunmamisIds = (mesajlar ?? [])
    .filter((m) => m.sender_id !== user.id && m.read_at === null)
    .map((m) => m.id);

  if (okunmamisIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", okunmamisIds);
  }

  return NextResponse.json({
    konusma: {
      id: konusma.id,
      type: konusma.type,
    },
    karsiTaraf: karsiTarafProfil
      ? {
          id: karsiTarafProfil.id,
          isim:
            `${karsiTarafProfil.first_name ?? ""} ${karsiTarafProfil.last_name ?? ""}`.trim() ||
            "(adsız)",
          avatarUrl: karsiTarafProfil.avatar_url ?? null,
        }
      : null,
    mesajlar: (mesajlar ?? []).map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      benimMesajim: m.sender_id === user.id,
      content: m.content,
      audio_url: m.audio_url,
      is_session_response: m.is_session_response,
      read_at: m.read_at,
      created_at: m.created_at,
    })),
  });
}
