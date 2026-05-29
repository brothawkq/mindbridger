import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/mesajlar/[id]/oku — mesajı okundu olarak işaretle */
export async function PATCH(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Mesajı getir
  const { data: mesaj, error: mesajHata } = await supabase
    .from("messages")
    .select(`id, sender_id, read_at, conversation_id,
             conversations!inner(musteri_id, danisan_id)`)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (mesajHata || !mesaj) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }

  // Kendi mesajını okundu işaretleyemez
  if (mesaj.sender_id === user.id) {
    return NextResponse.json({ error: "Kendi mesajınızı okundu olarak işaretleyemezsiniz" }, { status: 400 });
  }

  // Konuşma katılımcısı doğrulama
  const konusma = mesaj.conversations as { musteri_id: string; danisan_id: string };
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
  }

  if (!katilimciMi) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  if (mesaj.read_at !== null) {
    return NextResponse.json({ ok: true, zatenOkunmus: true });
  }

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
