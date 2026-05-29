import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BlogEditorKlient from "@/components/danisan/BlogEditorKlient";

export const metadata = { title: "Yeni Blog Yazısı — Danışman | MindBridger" };

export default async function DanisanBlogYeniPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  return <BlogEditorKlient mod="yeni" />;
}
