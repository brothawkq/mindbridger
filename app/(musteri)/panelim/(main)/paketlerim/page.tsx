import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import PaketlerimKlient, {
  type MusteriPaketi,
  type PaketDurum,
} from "@/components/musteri/PaketlerimKlient";

export const metadata = { title: "Paketlerim | MindBridger" };

const GECERLI_DURUMLAR = ["active", "expired", "completed"] as const;
function isPaketDurum(v: string | null): v is PaketDurum {
  return (GECERLI_DURUMLAR as readonly string[]).includes(v ?? "");
}

export default async function PaketlerimPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: paketlerRaw } = await supabase
    .from("musteri_paketler")
    .select(
      "id, danisan_paket_id, sessions_total, sessions_used, sessions_remaining, status, expires_at, created_at"
    )
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const paketler = paketlerRaw ?? [];

  if (paketler.length === 0) {
    return (
      <>
        <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5">
          <span className="text-[12px] font-bold text-[#252625] dark:text-white">
            Paketlerim
          </span>
          <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white">
            Müşteri
          </span>
        </div>
        <PaketlerimKlient paketler={[]} />
      </>
    );
  }

  // Fetch danisan_paketler details
  const danisanPaketIds = paketler.map((p) => p.danisan_paket_id);
  const { data: danisanPaketler } = await supabase
    .from("danisan_paketler")
    .select("id, danisan_id, name, price, discount_percent")
    .in("id", danisanPaketIds);

  const dpMap = new Map(
    (danisanPaketler ?? []).map((dp) => [
      dp.id,
      {
        danisan_id: dp.danisan_id,
        name: dp.name,
        price: dp.price,
        discount_percent: dp.discount_percent,
      },
    ])
  );

  // Fetch danisanlar + profiles
  const danisanIds = [
    ...new Set((danisanPaketler ?? []).map((dp) => dp.danisan_id)),
  ];
  let danisanIsimMap = new Map<string, string>();
  let danisanSlugMap = new Map<string, string>();

  if (danisanIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, profile_id, slug")
      .in("id", danisanIds);

    const profileIds = (danisanlar ?? []).map((d) => d.profile_id);
    if (profileIds.length > 0) {
      const { data: profiller } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profilMap = new Map(
        (profiller ?? []).map((p) => [
          p.id,
          `${p.first_name} ${p.last_name}`.trim(),
        ])
      );

      danisanIsimMap = new Map(
        (danisanlar ?? []).map((d) => [
          d.id,
          profilMap.get(d.profile_id) ?? "Danışman",
        ])
      );
      danisanSlugMap = new Map(
        (danisanlar ?? []).map((d) => [d.id, d.slug ?? ""])
      );
    }
  }

  const zenginPaketler: MusteriPaketi[] = paketler.map((p) => {
    const dp = dpMap.get(p.danisan_paket_id);
    const danisanId = dp?.danisan_id ?? "";
    return {
      id: p.id,
      name: dp?.name ?? "Paket",
      sessions_total: p.sessions_total,
      sessions_used: p.sessions_used,
      sessions_remaining: p.sessions_remaining,
      status: isPaketDurum(p.status) ? p.status : "expired",
      expires_at: p.expires_at,
      created_at: p.created_at,
      fiyat: dp?.price ?? 0,
      indirim: dp?.discount_percent ?? 0,
      danisan_isim: danisanIsimMap.get(danisanId) ?? "Danışman",
      danisan_slug: danisanSlugMap.get(danisanId) ?? "",
    };
  });

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Paketlerim
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Satın aldığınız seans paketleri burada görünür
        </span>
      </div>

      <PaketlerimKlient paketler={zenginPaketler} />
    </>
  );
}
