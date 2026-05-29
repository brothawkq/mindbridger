import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BlogEditorKlient from "@/components/danisan/BlogEditorKlient";

export const metadata = { title: "Blog Yazısını Düzenle — Danışman | MindBridger" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DanisanBlogDuzenle({ params }: PageProps) {
  const { id } = await params;
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

  const { data: yazi, error } = await supabase
    .from("blog_posts")
    .select(
      `id, title, content, excerpt, tags, seo_title, seo_description,
       cover_image_url, status, rejection_reason, danisan_id`
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !yazi) notFound();

  // Sahiplik kontrolü
  if (yazi.danisan_id !== danisanRow.id) notFound();

  return (
    <BlogEditorKlient
      mod="duzenle"
      baslangicVeri={{
        id: yazi.id,
        title: yazi.title,
        content: yazi.content ?? "",
        excerpt: yazi.excerpt,
        tags: yazi.tags,
        seo_title: yazi.seo_title,
        seo_description: yazi.seo_description,
        cover_image_url: yazi.cover_image_url,
        status: yazi.status,
        rejection_reason: yazi.rejection_reason,
      }}
    />
  );
}
