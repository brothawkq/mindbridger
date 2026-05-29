import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import WebinarKlient from "@/components/danisan/WebinarKlient";

export const metadata = { title: "Webinar — Danışman | MindBridger" };

export default async function DanisanWebinarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: webinarlar } = await supabase
    .from("webinarlar")
    .select("id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, status, cover_image_url, platform_commission_rate")
    .eq("host_id", user.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false });

  return <WebinarKlient webinarlar={webinarlar ?? []} />;
}
