import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BlogYazisiFormKlient from "@/components/admin/BlogYazisiFormKlient";

export const metadata: Metadata = {
  title: "Blog Yazısı Düzenle — Admin | MindBridger",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogDuzenlePage({ params }: PageProps) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const { id } = await params;

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select("id, title, slug, content, excerpt, cover_image_url, status, tags")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!yazi) notFound();

  return (
    <BlogYazisiFormKlient
      kategoriler={[]}
      mod="duzenle"
      initialVeri={{
        id: yazi.id,
        baslik: yazi.title,
        slug: yazi.slug,
        icerik: yazi.content ?? "",
        ozet: yazi.excerpt ?? "",
        kapak_url: yazi.cover_image_url ?? "",
        durum: (yazi.status as "draft" | "published") ?? "draft",
        etiketler: (yazi.tags as string[] | null) ?? [],
      }}
    />
  );
}
