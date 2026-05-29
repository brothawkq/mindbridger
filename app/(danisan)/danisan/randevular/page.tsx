import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import RandevularKlient from "@/components/danisan/RandevularKlient";

export const metadata = { title: "Randevular — Danışman | MindBridger" };

export default async function DanisanRandevularPage() {
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

  const { data: randevular } = await supabase
    .from("randevular")
    .select(
      "id, status, session_type, scheduled_at, duration_minutes, price, musteri_id, is_recurring, no_show_charged"
    )
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  const musteriIds = [
    ...new Set((randevular ?? []).map((r) => r.musteri_id).filter(Boolean)),
  ] as string[];

  let musteriMap = new Map<string, { isim: string; avatarUrl: string | null }>();
  if (musteriIds.length > 0) {
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", musteriIds);
    musteriMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        {
          isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
          avatarUrl: p.avatar_url ?? null,
        },
      ])
    );
  }

  const randevularZengin = (randevular ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    session_type: r.session_type,
    scheduled_at: r.scheduled_at,
    duration_minutes: r.duration_minutes,
    price: r.price,
    is_recurring: r.is_recurring,
    no_show_charged: r.no_show_charged,
    musteriId: r.musteri_id,
    musteriIsim: musteriMap.get(r.musteri_id)?.isim ?? "(adsız)",
    musteriAvatarUrl: musteriMap.get(r.musteri_id)?.avatarUrl ?? null,
  }));

  return <RandevularKlient randevular={randevularZengin} />;
}
