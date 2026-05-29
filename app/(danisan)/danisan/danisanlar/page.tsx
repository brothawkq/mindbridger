import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DanisanlarKlient from "@/components/danisan/DanisanlarKlient";

export const metadata = { title: "Danışanlarım — Danışman | MindBridger" };

export default async function DanisanDanisanlarPage() {
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

  // All randevular for this danisan — get unique musteri IDs + stats
  const { data: randevular } = await supabase
    .from("randevular")
    .select("musteri_id, status, scheduled_at, price")
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false });

  const musteriIds = [
    ...new Set((randevular ?? []).map((r) => r.musteri_id).filter(Boolean)),
  ] as string[];

  if (musteriIds.length === 0) {
    return <DanisanlarKlient danisanlar={[]} />;
  }

  const { data: profiller } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, phone, churn_risk_score, created_at")
    .in("id", musteriIds)
    .is("deleted_at", null);

  const danisanlar = (profiller ?? []).map((p) => {
    const musterininRandevulari = (randevular ?? []).filter(
      (r) => r.musteri_id === p.id
    );
    const tamamlanan = musterininRandevulari.filter(
      (r) => r.status === "completed"
    );
    const sonRandevu = musterininRandevulari[0]?.scheduled_at ?? null;
    const toplamGelir = tamamlanan.reduce((s, r) => s + (r.price ?? 0), 0);

    return {
      id: p.id,
      isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
      avatarUrl: p.avatar_url ?? null,
      telefon: p.phone ?? null,
      churnRiskScore: p.churn_risk_score ?? 0,
      kayitTarihi: p.created_at,
      toplamSeans: musterininRandevulari.length,
      tamamlananSeans: tamamlanan.length,
      sonRandevu,
      toplamGelir,
    };
  });

  return <DanisanlarKlient danisanlar={danisanlar} />;
}
