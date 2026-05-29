import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import OdevlerKlient from "@/components/danisan/OdevlerKlient";

export const metadata = { title: "Ödevler — Danışman | MindBridger" };

export default async function OdevlerPage() {
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

  const [{ data: odevler, count }, { data: musteriProfilleri }] = await Promise.all([
    supabase
      .from("odevler")
      .select(`
        id, title, description, due_date, status, completed_at, musteri_note, file_url, created_at, randevu_id,
        profiles:musteri_id(first_name, last_name, avatar_url)
      `, { count: "exact" })
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("randevular")
      .select("musteri_id")
      .eq("danisan_id", danisanRow.id)
      .is("deleted_at", null),
  ]);

  const tekMusteriIds = [...new Set((musteriProfilleri ?? []).map((r) => r.musteri_id))];
  const { data: musteriProfilData } = tekMusteriIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", tekMusteriIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const tekMusteriMap = new Map<string, { id: string; first_name: string; last_name: string }>();
  for (const p of musteriProfilData ?? []) {
    if (!tekMusteriMap.has(p.id)) {
      tekMusteriMap.set(p.id, { id: p.id, first_name: p.first_name ?? "", last_name: p.last_name ?? "" });
    }
  }
  const danisanlar = Array.from(tekMusteriMap.values()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "tr")
  );

  return (
    <OdevlerKlient
      odevler={(odevler ?? []) as Parameters<typeof OdevlerKlient>[0]["odevler"]}
      danisanlar={danisanlar}
      toplam={count ?? 0}
    />
  );
}
