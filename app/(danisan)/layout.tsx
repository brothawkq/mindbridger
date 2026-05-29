import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DanisanSidebar from "@/components/danisan/DanisanSidebar";
import MobilePanelShell from "@/components/shared/MobilePanelShell";

export default async function DanisanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const adSoyad =
    `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim() || "Danışman";

  return (
    <MobilePanelShell
      sidebar={<DanisanSidebar adSoyad={adSoyad} />}
      rolLabel="Danışman"
    >
      {children}
    </MobilePanelShell>
  );
}
