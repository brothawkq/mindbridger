import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import KullanicilarKlient from "@/components/admin/KullanicilarKlient";

export const metadata: Metadata = {
  title: "Kullanıcılar — MindBridger Admin",
};

export default async function KullanicilarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return <KullanicilarKlient />;
}
