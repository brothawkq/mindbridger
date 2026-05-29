import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import ProfilKlient from "@/components/danisan/ProfilKlient";

export const metadata = { title: "Profilim — Danışman | MindBridger" };

export default async function DanisanProfilPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const [danisanRes, profilRes] = await Promise.all([
    supabase
      .from("danisanlar")
      .select(`
        id, slug, title, bio, specialties, approach, age_groups, languages,
        city, district, gender, is_online, is_in_person, is_supervisor,
        price_individual, price_group, price_async, session_duration,
        buffer_minutes, intro_session_enabled, intro_session_duration,
        sliding_scale, sliding_scale_price, profile_completion_percent,
        profile_published, diploma_url, id_document_url
      `)
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single(),

    supabase
      .from("profiles")
      .select("first_name, last_name, phone, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!danisanRes.data) redirect("/giris");

  return (
    <ProfilKlient
      danisan={danisanRes.data}
      profil={profilRes.data ?? { first_name: null, last_name: null, phone: null, avatar_url: null }}
    />
  );
}
