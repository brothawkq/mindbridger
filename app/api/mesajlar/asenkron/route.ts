import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const MAX_MB = 10;

const bodySchema = z.object({
  danisan_id: z.string().uuid(),   // danisanlar.id
  icerik:     z.string().max(5000).optional(),
  audio_url:  z.string().url().optional(),
}).refine(
  (d) => d.icerik !== undefined || d.audio_url !== undefined,
  { message: "Metin veya ses kaydı gerekli" },
);

// Ses kaydı yükle → Supabase Storage → URL döndür
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // Multipart: ses kaydı yükleme
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const danisanId = form.get("danisan_id")?.toString();
    const file = form.get("audio") as File | null;

    if (!danisanId || !file) {
      return Response.json({ error: "danisan_id ve audio zorunlu" }, { status: 400 });
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      return Response.json({ error: `Maksimum ${MAX_MB} MB` }, { status: 413 });
    }

    const uzanti = file.name.split(".").pop() ?? "webm";
    const yol = `asenkron/${user.id}/${Date.now()}.${uzanti}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: yukleHata } = await supabase.storage
      .from("mesajlar")
      .upload(yol, buffer, { contentType: file.type, upsert: false });

    if (yukleHata) {
      return Response.json({ error: "Ses kaydı yüklenemedi" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("mesajlar").getPublicUrl(yol);
    return Response.json({ audio_url: urlData.publicUrl });
  }

  // JSON: asenkron seans mesajı gönder
  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const { danisan_id, icerik, audio_url } = parsed.data;

  try {
    // Danışmanın profil ID'sini bul
    const { data: danisan } = await supabase
      .from("danisanlar")
      .select("profile_id")
      .eq("id", danisan_id)
      .is("deleted_at", null)
      .single();

    if (!danisan) {
      return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });
    }

    const danisanProfileId = danisan.profile_id;

    // Mevcut asenkron seans konuşmasını bul veya oluştur
    const { data: mevcutKonusma } = await supabase
      .from("conversations")
      .select("id")
      .eq("musteri_id", user.id)
      .eq("danisan_id", danisanProfileId)
      .eq("type", "asenkron_seans")
      .is("deleted_at", null)
      .single();

    let konusmaId: string;

    if (mevcutKonusma) {
      konusmaId = mevcutKonusma.id;
    } else {
      const { data: yeniKonusma, error: konusmaHata } = await supabase
        .from("conversations")
        .insert({
          musteri_id:       user.id,
          danisan_id:       danisanProfileId,
          type:             "asenkron_seans",
          last_message_at:  new Date().toISOString(),
        })
        .select("id")
        .single();

      if (konusmaHata || !yeniKonusma) {
        return Response.json({ error: "Konuşma oluşturulamadı" }, { status: 500 });
      }
      konusmaId = yeniKonusma.id;
    }

    // Mesajı ekle
    const { data: mesaj, error: mesajHata } = await supabase
      .from("messages")
      .insert({
        conversation_id:    konusmaId,
        sender_id:          user.id,
        content:            icerik ?? "",
        audio_url:          audio_url ?? null,
        is_session_response: false,
      })
      .select("id, created_at")
      .single();

    if (mesajHata || !mesaj) {
      return Response.json({ error: "Mesaj gönderilemedi" }, { status: 500 });
    }

    // last_message_at güncelle
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", konusmaId);

    return Response.json({ mesaj_id: mesaj.id, konusma_id: konusmaId }, { status: 201 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
