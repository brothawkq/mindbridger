import "server-only";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const PostSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  danisan_id: z.string().uuid().optional(), // danisanlar.id — yeni konuşma açmak için
  icerik: z.string().min(1).max(5000),
}).refine(
  (d) => d.conversation_id !== undefined || d.danisan_id !== undefined,
  { message: "conversation_id veya danisan_id gerekli" }
);

/** GET /api/mesajlar — kullanıcının tüm konuşmalarını listele */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let konusmalar: {
    id: string;
    type: string;
    last_message_at: string | null;
    karsiTarafId: string;
    karsiTarafIsim: string;
    karsiTarafAvatar: string | null;
    okunmamisSayi: number;
    sonMesaj: string | null;
  }[] = [];

  if (user.role === "danisan") {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!danisanRow) return NextResponse.json({ konusmalar: [] });

    const { data: rows } = await supabase
      .from("conversations")
      .select("id, type, last_message_at, musteri_id")
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!rows || rows.length === 0) return NextResponse.json({ konusmalar: [] });

    const musteriIds = [...new Set(rows.map((r) => r.musteri_id))];
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", musteriIds);

    const profilMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        {
          isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
          avatar: p.avatar_url ?? null,
        },
      ])
    );

    // Unread + last message for each conversation
    const konusmaIds = rows.map((r) => r.id);
    const { data: okunmamisler } = await supabase
      .from("messages")
      .select("conversation_id, id, content, read_at, sender_id")
      .in("conversation_id", konusmaIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const unreadMap = new Map<string, number>();
    const lastMsgMap = new Map<string, string | null>();

    for (const msg of okunmamisler ?? []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg.content);
      }
      if (msg.sender_id !== user.id && msg.read_at === null) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1);
      }
    }

    konusmalar = rows.map((r) => ({
      id: r.id,
      type: r.type,
      last_message_at: r.last_message_at,
      karsiTarafId: r.musteri_id,
      karsiTarafIsim: profilMap.get(r.musteri_id)?.isim ?? "(adsız)",
      karsiTarafAvatar: profilMap.get(r.musteri_id)?.avatar ?? null,
      okunmamisSayi: unreadMap.get(r.id) ?? 0,
      sonMesaj: lastMsgMap.get(r.id) ?? null,
    }));
  } else if (user.role === "musteri") {
    const { data: rows } = await supabase
      .from("conversations")
      .select("id, type, last_message_at, danisan_id")
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!rows || rows.length === 0) return NextResponse.json({ konusmalar: [] });

    const danisanIds = [...new Set(rows.map((r) => r.danisan_id))];
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, profile_id")
      .in("id", danisanIds);

    const profileIds = (danisanlar ?? []).map((d) => d.profile_id);
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", profileIds);

    const danisanProfileMap = new Map(
      (danisanlar ?? []).map((d) => [d.id, d.profile_id])
    );
    const profilMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        {
          isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
          avatar: p.avatar_url ?? null,
        },
      ])
    );

    const konusmaIds = rows.map((r) => r.id);
    const { data: okunmamisler } = await supabase
      .from("messages")
      .select("conversation_id, id, content, read_at, sender_id")
      .in("conversation_id", konusmaIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const unreadMap = new Map<string, number>();
    const lastMsgMap = new Map<string, string | null>();

    for (const msg of okunmamisler ?? []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg.content);
      }
      if (msg.sender_id !== user.id && msg.read_at === null) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1);
      }
    }

    konusmalar = rows.map((r) => {
      const profileId = danisanProfileMap.get(r.danisan_id) ?? "";
      return {
        id: r.id,
        type: r.type,
        last_message_at: r.last_message_at,
        karsiTarafId: r.danisan_id,
        karsiTarafIsim: profilMap.get(profileId)?.isim ?? "(adsız)",
        karsiTarafAvatar: profilMap.get(profileId)?.avatar ?? null,
        okunmamisSayi: unreadMap.get(r.id) ?? 0,
        sonMesaj: lastMsgMap.get(r.id) ?? null,
      };
    });
  }

  return NextResponse.json({ konusmalar });
}

/** POST /api/mesajlar — mesaj gönder (lojistik konuşma) */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["danisan", "musteri"].includes(user.role)) {
    return NextResponse.json({ error: "Yetkisiz rol" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { conversation_id, danisan_id: danisanIdParam, icerik } = parsed.data;

  try {
    let konusmaId: string;

    if (conversation_id) {
      // Katılımcı doğrulama
      const { data: konusma } = await supabase
        .from("conversations")
        .select("id, musteri_id, danisan_id")
        .eq("id", conversation_id)
        .is("deleted_at", null)
        .single();

      if (!konusma) return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });

      const { data: danisanRow } = user.role === "danisan"
        ? await supabase
          .from("danisanlar")
          .select("id")
          .eq("profile_id", user.id)
          .is("deleted_at", null)
          .single()
        : { data: null };

      const katilimciMi =
        user.role === "musteri"
          ? konusma.musteri_id === user.id
          : konusma.danisan_id === danisanRow?.id;

      if (!katilimciMi) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

      konusmaId = conversation_id;
    } else {
      // Yeni lojistik konuşma oluştur (musteri → danisan)
      if (!danisanIdParam) {
        return NextResponse.json({ error: "danisan_id gerekli" }, { status: 400 });
      }

      if (user.role !== "musteri") {
        return NextResponse.json({ error: "Yeni konuşma yalnızca müşteri tarafından başlatılabilir" }, { status: 403 });
      }

      // Mevcut lojistik konuşma var mı?
      const { data: mevcut } = await supabase
        .from("conversations")
        .select("id")
        .eq("musteri_id", user.id)
        .eq("danisan_id", danisanIdParam)
        .eq("type", "lojistik")
        .is("deleted_at", null)
        .maybeSingle();

      if (mevcut) {
        konusmaId = mevcut.id;
      } else {
        const { data: yeni, error: yeniHata } = await supabase
          .from("conversations")
          .insert({
            musteri_id: user.id,
            danisan_id: danisanIdParam,
            type: "lojistik",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (yeniHata || !yeni) {
          return NextResponse.json({ error: "Konuşma oluşturulamadı" }, { status: 500 });
        }
        konusmaId = yeni.id;
      }
    }

    const { data: mesaj, error: mesajHata } = await supabase
      .from("messages")
      .insert({
        conversation_id: konusmaId,
        sender_id: user.id,
        content: icerik,
        is_session_response: false,
      })
      .select("id, created_at")
      .single();

    if (mesajHata || !mesaj) {
      return NextResponse.json({ error: "Mesaj gönderilemedi" }, { status: 500 });
    }

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", konusmaId);

    return NextResponse.json({ mesaj_id: mesaj.id, konusma_id: konusmaId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
