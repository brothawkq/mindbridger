import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import FaturalarKlient from "@/components/admin/FaturalarKlient";

export const metadata = { title: "Faturalar — Admin | MindBridger" };

export default async function AdminFaturalarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <FaturalarKlient />;
}
