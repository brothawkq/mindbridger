import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import RandevuDetayiKlient from "@/components/danisan/RandevuDetayiKlient";

export const metadata = { title: "Randevu Detayı — Danışman | MindBridger" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DanisanRandevuDetayiPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  // Admin client: notes_private için DB-level REVOKE authenticated bypass
  const adminSupabase = createAdminClient();
  const { data: randevu, error: randevuHata } = await adminSupabase
    .from("randevular")
    .select(
      `id, status, session_type, scheduled_at, duration_minutes, price,
       is_recurring, is_sliding_scale, no_show_charged, musteri_id,
       notes_private, summary_shared, daily_room_name,
       cancellation_reason, cancelled_at, cancelled_by, created_at`
    )
    .eq("id", id)
    .eq("danisan_id", danisanRow.id)   // explicit filter — RLS bypass edildiği için zorunlu
    .is("deleted_at", null)
    .single();

  if (randevuHata || !randevu) notFound();

  const [profileRes, degerlendirmeRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, phone")
      .eq("id", randevu.musteri_id)
      .single(),

    supabase
      .from("degerlendirmeler")
      .select("id, rating, comment, review_reply, reply_at, is_visible, created_at")
      .eq("randevu_id", id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const profil = profileRes.data;

  return (
    <RandevuDetayiKlient
      randevu={{
        id: randevu.id,
        status: randevu.status,
        session_type: randevu.session_type,
        scheduled_at: randevu.scheduled_at,
        duration_minutes: randevu.duration_minutes,
        price: randevu.price,
        is_recurring: randevu.is_recurring,
        is_sliding_scale: randevu.is_sliding_scale,
        no_show_charged: randevu.no_show_charged,
        notes_private: randevu.notes_private,
        summary_shared: randevu.summary_shared,
        daily_room_name: randevu.daily_room_name,
        cancellation_reason: randevu.cancellation_reason,
        cancelled_at: randevu.cancelled_at,
        created_at: randevu.created_at,
      }}
      musteri={{
        id: randevu.musteri_id,
        isim: profil
          ? `${profil.first_name ?? ""} ${profil.last_name ?? ""}`.trim() ||
            "(adsız)"
          : "(adsız)",
        avatarUrl: profil?.avatar_url ?? null,
        telefon: profil?.phone ?? null,
      }}
      degerlendirme={
        degerlendirmeRes.data
          ? {
              id: degerlendirmeRes.data.id,
              rating: degerlendirmeRes.data.rating,
              comment: degerlendirmeRes.data.comment,
              review_reply: degerlendirmeRes.data.review_reply,
              reply_at: degerlendirmeRes.data.reply_at,
              is_visible: degerlendirmeRes.data.is_visible,
              created_at: degerlendirmeRes.data.created_at,
            }
          : null
      }
    />
  );
}
