import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BasvurularKlient from "@/components/admin/BasvurularKlient";

export const metadata: Metadata = {
  title: "Danışman Yönetimi — MindBridger Admin",
};

export default async function DanismanBasvurularPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <BasvurularKlient />;
}
