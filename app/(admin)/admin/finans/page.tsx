import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import FinansKlient from "@/components/admin/FinansKlient";

export const metadata = { title: "Finansal Yönetim — Admin | MindBridger" };

export default async function AdminFinansPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <FinansKlient />;
}
