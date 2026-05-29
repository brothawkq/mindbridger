import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import BlogYazisiFormKlient from "@/components/admin/BlogYazisiFormKlient";

export const metadata: Metadata = {
  title: "Yeni Blog Yazısı — Admin | MindBridger",
};

export default async function AdminBlogYeniPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  return (
    <BlogYazisiFormKlient
      kategoriler={[]}
      mod="yeni"
    />
  );
}
