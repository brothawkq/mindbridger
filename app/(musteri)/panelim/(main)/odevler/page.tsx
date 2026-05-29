import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriOdevlerKlient, {
  type MusteriOdev,
  type OdevDurum,
} from "@/components/musteri/MusteriOdevlerKlient";

export const metadata = { title: "Ödevlerim | MindBridger" };

const GECERLI_DURUMLAR = ["pending", "completed", "skipped"] as const;
function isOdevDurum(v: string | null): v is OdevDurum {
  return (GECERLI_DURUMLAR as readonly string[]).includes(v ?? "");
}

export default async function OdevlerPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: odevlerRaw } = await supabase
    .from("odevler")
    .select(
      "id, title, description, due_date, status, completed_at, musteri_note, created_at, danisan_id"
    )
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const odevler = odevlerRaw ?? [];

  // Fetch danisan names
  const danisanIds = [...new Set(odevler.map((o) => o.danisan_id))];
  let danisanIsimMap = new Map<string, string>();

  if (danisanIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, profile_id")
      .in("id", danisanIds);

    const profileIds = (danisanlar ?? []).map((d) => d.profile_id);
    if (profileIds.length > 0) {
      const { data: profiller } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profilMap = new Map(
        (profiller ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()])
      );

      danisanIsimMap = new Map(
        (danisanlar ?? []).map((d) => [d.id, profilMap.get(d.profile_id) ?? "Danışman"])
      );
    }
  }

  const zenginOdevler: MusteriOdev[] = odevler.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    due_date: o.due_date,
    status: isOdevDurum(o.status) ? o.status : "pending",
    completed_at: o.completed_at,
    musteri_note: o.musteri_note,
    created_at: o.created_at,
    danisan_isim: danisanIsimMap.get(o.danisan_id) ?? "Danışman",
  }));

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Ödevlerim
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Danışmanınız tarafından verilen ödevler burada görünür
        </span>
      </div>

      <MusteriOdevlerKlient odevler={zenginOdevler} />
    </>
  );
}
