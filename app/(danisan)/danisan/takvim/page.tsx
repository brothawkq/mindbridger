import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import TakvimKlient from "@/components/danisan/TakvimKlient";

export const metadata = { title: "Takvim — Danışman | MindBridger" };

export default async function DanisanTakvimPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id, buffer_minutes, session_duration")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  const onceki30 = new Date();
  onceki30.setDate(onceki30.getDate() - 30);

  const [musaitlikRes, izinRes, syncRes] = await Promise.all([
    supabase
      .from("danisan_musaitlik")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("danisan_izin")
      .select("id, date, reason")
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null)
      .gte("date", onceki30.toISOString().slice(0, 10))
      .order("date", { ascending: true }),
    supabase
      .from("takvim_sync")
      .select("provider, is_active")
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null),
  ]);

  const syncKayitlar = syncRes.data ?? [];

  return (
    <TakvimKlient
      bufferMinutes={danisanRow.buffer_minutes ?? 10}
      sessionDuration={danisanRow.session_duration ?? 50}
      musaitlikBaslangic={(musaitlikRes.data ?? []).map((m) => ({
        id: m.id,
        day_of_week: m.day_of_week ?? 0,
        start_time: m.start_time ?? "09:00:00",
        end_time: m.end_time ?? "18:00:00",
        is_active: m.is_active ?? true,
      }))}
      izinlerBaslangic={(izinRes.data ?? []).map((i) => ({
        id: i.id,
        date: i.date ?? "",
        reason: i.reason ?? null,
      }))}
      googleBagili={syncKayitlar.some((s) => s.provider === "google" && s.is_active)}
      outlookBagili={syncKayitlar.some((s) => s.provider === "outlook" && s.is_active)}
    />
  );
}
