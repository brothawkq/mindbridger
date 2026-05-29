import "server-only";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BlogListeKlient from "@/components/danisan/BlogListeKlient";

export const metadata = { title: "Blog Yazılarım — Danışman | MindBridger" };

export default async function DanisanBlogPage() {
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

  const { data: yazilar } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, status, tags, published_at, view_count, created_at, updated_at, rejection_reason")
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <BlogListeKlient yazilar={yazilar ?? []} />
  );
}
