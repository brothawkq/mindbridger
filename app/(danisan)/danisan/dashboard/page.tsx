import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DashboardKlient from "@/components/danisan/DashboardKlient";

export const metadata = { title: "Dashboard — Danışman | MindBridger" };

export default async function DanisanDashboardPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");
  return <DashboardKlient />;
}
