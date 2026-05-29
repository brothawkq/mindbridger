import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { grupSeansKapasiteAl } from "@/lib/grup-seans/kapasite";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ randevuId: string }> },
) {
  const { randevuId } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan", "admin"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, session_type, status, scheduled_at, danisan_id")
      .eq("id", randevuId)
      .eq("session_type", "grup")
      .is("deleted_at", null)
      .single();

    if (!randevu) {
      return Response.json({ error: "Grup seansı bulunamadı" }, { status: 404 });
    }

    // Danışman yalnızca kendi seansının durumunu görebilir
    if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow || randevu.danisan_id !== danisanRow.id) {
        return Response.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }

    const kapasite = await grupSeansKapasiteAl(randevuId, supabase);

    return Response.json({
      randevu_id: randevuId,
      seans_durumu: randevu.status,
      scheduled_at: randevu.scheduled_at,
      ...kapasite,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
