import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import AyarlarKlient from "@/components/danisan/AyarlarKlient";

export const metadata = { title: "Ayarlar — Danışman | MindBridger" };

export default async function DanisanAyarlarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const [{ data: profil }, { data: tercihler }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, phone, dark_mode, language, notification_channel")
      .eq("id", user.id)
      .single(),
    supabase
      .from("bildirim_tercihleri")
      .select("randevu_email, randevu_sms, randevu_uygulama, odeme_email, blog_email, marketing_email")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!profil) redirect("/giris");

  return (
    <AyarlarKlient
      userId={user.id}
      profil={profil}
      tercihler={tercihler ?? null}
    />
  );
}
