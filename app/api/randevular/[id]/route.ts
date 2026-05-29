import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireRole";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    if (user.role === "danisan") {
      // Danışman: önce kimlik doğrulaması (regular client → RLS), sonra admin client ile notes_private
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow) return Response.json({ error: "Yetkisiz" }, { status: 403 });

      const adminSupabase = createAdminClient();
      const { data, error } = await adminSupabase
        .from("randevular")
        .select(
          `id, status, session_type, scheduled_at, duration_minutes, price,
           is_sliding_scale, is_recurring, cancellation_reason,
           cancelled_at, cancelled_by, no_show_charged, musteri_id, danisan_id,
           package_id, partner_id, daily_room_name, summary_shared, notes_private,
           created_at`,
        )
        .eq("id", id)
        .eq("danisan_id", danisanRow.id)
        .is("deleted_at", null)
        .single();

      if (error || !data) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
      return Response.json({ randevu: data });
    }

    // Musteri / admin: notes_private hariç (musteri için DB-level REVOKE var)
    const { data, error } = await supabase
      .from("randevular")
      .select(
        `id, status, session_type, scheduled_at, duration_minutes, price,
         is_sliding_scale, is_recurring, cancellation_reason,
         cancelled_at, cancelled_by, no_show_charged, musteri_id, danisan_id,
         package_id, partner_id, daily_room_name, summary_shared,
         created_at`,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    }

    if (user.role === "musteri" && data.musteri_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    // admin: erişim serbest

    return Response.json({ randevu: data });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
