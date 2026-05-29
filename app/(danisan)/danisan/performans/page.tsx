import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import PerformansKlient from "@/components/danisan/PerformansKlient";

export const metadata = { title: "Performans — Danışman | MindBridger" };

export default async function PerformansPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id, average_rating, total_reviews, total_sessions")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  const buAyBaslangic = new Date();
  buAyBaslangic.setDate(1);
  buAyBaslangic.setHours(0, 0, 0, 0);

  const [
    { count: toplamRandevu },
    { count: tamamlananRandevu },
    { count: iptalRandevu },
    { count: noShowRandevu },
    { count: tekrarMusteriler },
    { data: sonYorumlar },
    { data: rozetler },
    { data: kullaniciRozetler },
  ] = await Promise.all([
    supabase.from("randevular").select("*", { count: "exact", head: true })
      .eq("danisan_id", danisanRow.id).is("deleted_at", null),
    supabase.from("randevular").select("*", { count: "exact", head: true })
      .eq("danisan_id", danisanRow.id).eq("status", "completed").is("deleted_at", null),
    supabase.from("randevular").select("*", { count: "exact", head: true })
      .eq("danisan_id", danisanRow.id).eq("status", "cancelled").is("deleted_at", null),
    supabase.from("randevular").select("*", { count: "exact", head: true })
      .eq("danisan_id", danisanRow.id).eq("status", "no_show").is("deleted_at", null),
    supabase
      .from("randevular")
      .select("musteri_id")
      .eq("danisan_id", danisanRow.id)
      .eq("status", "completed")
      .is("deleted_at", null)
      .then(({ data }) => ({
        count: data ? new Set(data.map((r: { musteri_id: string }) => r.musteri_id)).size : 0,
      })),
    supabase.from("degerlendirmeler")
      .select("id, rating, comment, created_at, profiles:musteri_id(first_name, last_name)")
      .eq("danisan_id", danisanRow.id)
      .eq("is_visible", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("rozetler_tanim").select("id, code, name, description, icon").is("deleted_at", null),
    supabase.from("kullanici_rozetleri")
      .select("rozet_id, earned_at")
      .eq("musteri_id", user.id)
      .is("deleted_at", null),
  ]);

  const tamamlanmaOrani = toplamRandevu ? Math.round(((tamamlananRandevu ?? 0) / toplamRandevu) * 100) : 0;
  const iptalOrani = toplamRandevu ? Math.round(((iptalRandevu ?? 0) / toplamRandevu) * 100) : 0;
  const noShowOrani = toplamRandevu ? Math.round(((noShowRandevu ?? 0) / toplamRandevu) * 100) : 0;

  type KullaniciRozet = { rozet_id: string; earned_at: string };
  const kazanilanRozetIds = new Set((kullaniciRozetler ?? []).map((r: KullaniciRozet) => r.rozet_id));
  const kazanilanRozetler = (rozetler ?? []).map((r) => ({
    ...r,
    earned: kazanilanRozetIds.has(r.id),
    earned_at: (kullaniciRozetler ?? []).find((kr: KullaniciRozet) => kr.rozet_id === r.id)?.earned_at ?? null,
  }));

  return (
    <PerformansKlient
      kpi={{
        toplamRandevu: toplamRandevu ?? 0,
        tamamlananRandevu: tamamlananRandevu ?? 0,
        iptalRandevu: iptalRandevu ?? 0,
        noShowRandevu: noShowRandevu ?? 0,
        tamamlanmaOrani,
        iptalOrani,
        noShowOrani,
        tekrarMusteriler: tekrarMusteriler ?? 0,
        ortalamaPuan: danisanRow.average_rating ?? 0,
        toplamYorum: danisanRow.total_reviews ?? 0,
        toplamSeans: danisanRow.total_sessions ?? 0,
      }}
      sonYorumlar={(sonYorumlar ?? []) as Parameters<typeof PerformansKlient>[0]["sonYorumlar"]}
      rozetler={kazanilanRozetler}
    />
  );
}
