import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();
    if (!danisanRow) return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });

    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, status, danisan_id, scheduled_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    if (randevu.danisan_id !== danisanRow.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (randevu.status !== "confirmed") {
      return Response.json({ error: "Yalnızca onaylanmış randevular no-show olarak işaretlenebilir" }, { status: 409 });
    }

    // Randevu saati geçmeden no-show işaretlenemez
    if (new Date(randevu.scheduled_at).getTime() > Date.now()) {
      return Response.json({ error: "Randevu saati henüz gelmedi" }, { status: 409 });
    }

    const { data: guncellendi, error: updateErr } = await supabase
      .from("randevular")
      .update({ status: "no_show", no_show_charged: true })
      .eq("id", id)
      .select("id, status, no_show_charged, scheduled_at")
      .single();

    if (updateErr) return Response.json({ error: "No-show işaretlenemedi" }, { status: 500 });

    return Response.json({ randevu: guncellendi });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
