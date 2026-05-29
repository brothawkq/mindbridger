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
      .select("id, status, danisan_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    if (randevu.danisan_id !== danisanRow.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (randevu.status !== "pending") {
      return Response.json({ error: "Yalnızca bekleyen randevular onaylanabilir" }, { status: 409 });
    }

    const { data: guncellendi, error: updateErr } = await supabase
      .from("randevular")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select("id, status, scheduled_at")
      .single();

    if (updateErr) return Response.json({ error: "Randevu onaylanamadı" }, { status: 500 });

    return Response.json({ randevu: guncellendi });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
