import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import RandevuSihirbazi from "@/components/musteri/randevu/RandevuSihirbazi";
import type { DanisanBilgi, PaketBilgi } from "@/components/musteri/randevu/RandevuSihirbazi";

interface PageProps {
  params: Promise<{ danisanSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { danisanSlug } = await params;
  return {
    title: `Randevu Al — ${danisanSlug} | MindBridger`,
    robots: { index: false },
  };
}

export default async function RandevuAlPage({ params }: PageProps) {
  const { danisanSlug } = await params;
  const supabase = await createClient();

  const { data: danisan } = await supabase
    .from("danisanlar")
    .select(
      `id, slug, title,
       price_individual, price_async,
       session_duration,
       is_online, is_in_person, is_supervisor,
       intro_session_enabled, intro_session_duration,
       sliding_scale, sliding_scale_price,
       profile_id`,
    )
    .eq("slug", danisanSlug)
    .eq("profile_published", true)
    .is("deleted_at", null)
    .single();

  if (!danisan) notFound();

  const { data: profile } = danisan.profile_id
    ? await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", danisan.profile_id)
        .single()
    : { data: null };

  const { data: paketlerRaw } = await supabase
    .from("danisan_paketler")
    .select("id, name, session_count, price, discount_percent, validity_days")
    .eq("danisan_id", danisan.id)
    .eq("is_active", true)
    .is("deleted_at", null);

  const danisanBilgi: DanisanBilgi = {
    id: danisan.id,
    slug: danisan.slug ?? danisanSlug,
    title: danisan.title,
    price_individual: danisan.price_individual,
    price_async: danisan.price_async,
    session_duration: danisan.session_duration,
    is_online: danisan.is_online,
    is_in_person: danisan.is_in_person,
    is_supervisor: danisan.is_supervisor,
    intro_session_enabled: danisan.intro_session_enabled,
    intro_session_duration: danisan.intro_session_duration,
    sliding_scale: danisan.sliding_scale,
    sliding_scale_price: danisan.sliding_scale_price,
    ad:
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Danışman",
    avatarUrl: profile?.avatar_url ?? null,
  };

  const paketler: PaketBilgi[] = (paketlerRaw ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    session_count: p.session_count,
    price: p.price,
    discount_percent: p.discount_percent,
    validity_days: p.validity_days,
  }));

  return (
    <main className="min-h-screen bg-[#F5F7F5] py-6 px-4">
      <RandevuSihirbazi danisan={danisanBilgi} paketler={paketler} />
    </main>
  );
}
