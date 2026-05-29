import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import AyarlarKlient from "@/components/admin/AyarlarKlient";

export const metadata = { title: "Platform Ayarları — Admin | MindBridger" };

export default async function AdminAyarlarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const { data } = await supabase
    .from("platform_ayarlari")
    .select("key, value, description")
    .order("key", { ascending: true });

  return <AyarlarKlient ayarlar={data ?? []} />;
}
