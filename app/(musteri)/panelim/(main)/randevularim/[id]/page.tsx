import "server-only";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import RandevuDetayimKlient, {
  type RandevuDetayi,
} from "@/components/musteri/RandevuDetayimKlient";

export const metadata = { title: "Randevu Detayı — Müşteri | MindBridger" };

export default async function RandevuDetayiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { id } = await params;

  const { data: randevu } = await supabase
    .from("randevular")
    .select(
      "id, scheduled_at, status, session_type, duration_minutes, price, summary_shared, cancellation_reason, daily_room_name, musteri_id, danisan_id"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!randevu || randevu.musteri_id !== user.id) notFound();

  const [{ data: danisanRow }, { data: mevcutYorum }] = await Promise.all([
    supabase
      .from("danisanlar")
      .select("id, slug, title, profiles:profile_id(first_name, last_name, avatar_url)")
      .eq("id", randevu.danisan_id)
      .single(),
    supabase
      .from("degerlendirmeler")
      .select("id, rating, comment, review_reply")
      .eq("randevu_id", id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  type DanisanWithProfiles = {
    id: string;
    slug: string;
    title: string | null;
    profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  };

  const d = danisanRow as DanisanWithProfiles | null;

  const detay: RandevuDetayi = {
    id: randevu.id,
    scheduled_at: randevu.scheduled_at,
    status: randevu.status as RandevuDetayi["status"],
    session_type: randevu.session_type,
    duration_minutes: randevu.duration_minutes,
    price: randevu.price,
    summary_shared: randevu.summary_shared,
    cancellation_reason: randevu.cancellation_reason,
    daily_room_name: randevu.daily_room_name,
    danisanBilgi: d
      ? {
          id: d.id,
          slug: d.slug,
          title: d.title,
          first_name: d.profiles?.first_name ?? null,
          last_name: d.profiles?.last_name ?? null,
          avatar_url: d.profiles?.avatar_url ?? null,
        }
      : null,
    mevcutYorum: mevcutYorum ?? null,
  };

  return <RandevuDetayimKlient randevu={detay} />;
}
