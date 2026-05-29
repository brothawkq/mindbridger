import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import LoglarKlient from "@/components/admin/LoglarKlient";

export const metadata = { title: "Sistem Logları — Admin | MindBridger" };

export default async function AdminLoglarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <LoglarKlient />;
}
