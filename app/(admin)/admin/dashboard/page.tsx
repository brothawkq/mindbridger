import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DashboardKlient from "@/components/admin/DashboardKlient";

export const metadata: Metadata = {
  title: "Admin Dashboard — MindBridger",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <DashboardKlient />;
}
