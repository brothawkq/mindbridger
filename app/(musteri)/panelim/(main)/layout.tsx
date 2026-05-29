import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriSidebar from "@/components/musteri/MusteriSidebar";
import MobilePanelShell from "@/components/shared/MobilePanelShell";

export default async function PanelimMainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const isim =
    `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim() || "Müşteri";

  return (
    <MobilePanelShell
      sidebar={<MusteriSidebar kullaniciIsim={isim} />}
      rolLabel="Müşteri"
    >
      {children}
    </MobilePanelShell>
  );
}
