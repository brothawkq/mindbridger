import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import OnboardingFormlarKlient from "@/components/danisan/OnboardingFormlarKlient";

export const metadata = { title: "Onboarding Formları — Danışman | MindBridger" };

export default async function OnboardingFormlarPage() {
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

  const { data: formlar } = await supabase
    .from("onboarding_formlar")
    .select(`
      id, title, is_default, questions, created_at,
      onboarding_yanitlar(count)
    `)
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <OnboardingFormlarKlient
      formlar={(formlar ?? []) as Parameters<typeof OnboardingFormlarKlient>[0]["formlar"]}
      danisanId={danisanRow.id}
    />
  );
}
