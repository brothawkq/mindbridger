import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { data: kayit } = await supabase
      .from("bekleme_listesi")
      .select("id, musteri_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!kayit) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    if (kayit.musteri_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("bekleme_listesi")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) return Response.json({ error: "Listeden çıkılamadı" }, { status: 500 });

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
