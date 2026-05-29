import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import RandevularKlient from "@/components/admin/RandevularKlient";

export const metadata: Metadata = {
  title: "Randevu Yönetimi — MindBridger Admin",
};

export default async function AdminRandevularPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <RandevularKlient />;
}
