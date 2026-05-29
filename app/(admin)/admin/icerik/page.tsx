import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import IcerikKlient from "@/components/admin/IcerikKlient";

export const metadata = { title: "İçerik Yönetimi — Admin | MindBridger" };

export default async function AdminIcerikPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <IcerikKlient />;
}
