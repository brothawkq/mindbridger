import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DanismanBulKlient from "@/components/musteri/DanismanBulKlient";
import type { DanismanKartiVeri } from "@/components/public/DanismanKarti";

export const metadata = { title: "Danışman Bul — Müşteri | MindBridger" };

export default async function DanismanlarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: danismanlarRaw, count } = await supabase
    .from("danisanlar")
    .select(
      "id, slug, title, specialties, city, is_online, is_in_person, intro_session_enabled, price_individual, sliding_scale, sliding_scale_price, average_rating, total_reviews, profiles:profile_id(first_name, last_name, avatar_url)",
      { count: "exact" }
    )
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .order("average_rating", { ascending: false })
    .limit(24);

  const danismanlar = (danismanlarRaw ?? []) as unknown as DanismanKartiVeri[];

  return (
    <DanismanBulKlient
      baslangicDanismanlar={danismanlar}
      baslangicToplam={count ?? 0}
    />
  );
}
