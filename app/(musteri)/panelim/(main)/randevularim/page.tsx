import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import RandevularimKlient, {
  type RandevuOzet,
} from "@/components/musteri/RandevularimKlient";

export const metadata = { title: "Randevularım — Müşteri | MindBridger" };

export default async function RandevularimPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: randevularRaw } = await supabase
    .from("randevular")
    .select("id, scheduled_at, status, session_type, duration_minutes, price, danisan_id")
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(100);

  const danisanIds = [
    ...new Set((randevularRaw ?? []).map((r) => r.danisan_id)),
  ];

  const { data: danisanlar } = danisanIds.length > 0
    ? await supabase
        .from("danisanlar")
        .select("id, slug, title, profiles:profile_id(first_name, last_name)")
        .in("id", danisanIds)
    : { data: [] as { id: string; slug: string; title: string | null; profiles: { first_name: string | null; last_name: string | null } | null }[] };

  type DanisanRow = {
    id: string;
    slug: string;
    title: string | null;
    profiles: { first_name: string | null; last_name: string | null } | null;
  };

  const danisanMap = new Map<string, DanisanRow>(
    (danisanlar ?? []).map((d) => [d.id, d as DanisanRow])
  );

  const randevular: RandevuOzet[] = (randevularRaw ?? []).map((r) => {
    const d = danisanMap.get(r.danisan_id);
    return {
      id: r.id,
      scheduled_at: r.scheduled_at,
      status: r.status as RandevuOzet["status"],
      session_type: r.session_type,
      duration_minutes: r.duration_minutes,
      price: r.price,
      danisanBilgi: d
        ? {
            id: d.id,
            slug: d.slug,
            title: d.title,
            first_name: d.profiles?.first_name ?? null,
            last_name: d.profiles?.last_name ?? null,
          }
        : null,
    };
  });

  return <RandevularimKlient randevular={randevular} />;
}
