import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata = { title: "Affiliate Yönetimi — Admin | MindBridger" };

const DURUM_PILL: Record<string, string> = {
  pending: "border-[1.5px] border-[#325343] text-[#252625]",
  active: "bg-[#A6DE9B] text-[#325343]",
  suspended: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

const DURUM_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  active: "Aktif",
  suspended: "Askıda",
};

function formatTL(n: number) {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; sayfa?: string }>;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const { durum, sayfa: sayfaStr } = await searchParams;
  const PAGE_SIZE = 20;
  const sayfa = Math.max(1, parseInt(sayfaStr ?? "1", 10));
  const offset = (sayfa - 1) * PAGE_SIZE;

  let q = supabase
    .from("affiliates")
    .select(
      "id, profile_id, platform_info, referral_code, commission_rate, status, total_earned",
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (durum) q = q.eq("status", durum as "pending" | "active" | "suspended");

  const { data: affiliateler, count } = await q;

  const profileIds = [
    ...new Set((affiliateler ?? []).map((a) => a.profile_id).filter(Boolean)),
  ] as string[];
  type PRow = { id: string; first_name: string | null; last_name: string | null };
  let profiles: PRow[] = [];
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds);
    profiles = (data as PRow[]) ?? [];
  }
  const profileMap = new Map(
    profiles.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)"])
  );

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  // Conversion stats
  const { data: convStats } = await supabase
    .from("affiliate_conversions")
    .select("affiliate_id, commission_amount, status")
    .is("deleted_at", null);

  const convMap = new Map<string, { bekleyen: number; odendi: number; adet: number }>();
  for (const c of convStats ?? []) {
    const prev = convMap.get(c.affiliate_id) ?? { bekleyen: 0, odendi: 0, adet: 0 };
    convMap.set(c.affiliate_id, {
      adet: prev.adet + 1,
      bekleyen: prev.bekleyen + (c.status === "pending" ? Number(c.commission_amount ?? 0) : 0),
      odendi: prev.odendi + (c.status === "paid" ? Number(c.commission_amount ?? 0) : 0),
    });
  }

  const DURUM_TABS = [
    { key: "", label: "Tümü" },
    { key: "pending", label: "Bekliyor" },
    { key: "active", label: "Aktif" },
    { key: "suspended", label: "Askıda" },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <h1 className="text-[16px] font-bold text-[#252625]">Affiliate Yönetimi</h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">{toplam} affiliate kayıtlı</p>
      </div>

      {/* Status tabs */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] bg-white px-5">
        {DURUM_TABS.map((t) => {
          const aktif = (durum ?? "") === t.key;
          return (
            <a
              key={t.key}
              href={`/admin/affiliate${t.key ? `?durum=${t.key}` : ""}`}
              className={`py-[10px] px-4 text-[12px] font-semibold border-b-[2.5px] -mb-[1.5px] whitespace-nowrap transition-colors no-underline ${
                aktif
                  ? "text-[#252625] border-[#325343]"
                  : "text-[#4A4D4A] border-transparent hover:text-[#252625]"
              }`}
            >
              {t.label}
            </a>
          );
        })}
        <a
          href="/api/admin/raporlar/affiliate"
          className="ml-auto self-center text-[10.5px] font-semibold border-[1.5px] border-[#D4E4D8] px-3 py-[5px] text-[#252625] no-underline hover:border-[#325343] transition-colors"
        >
          ↓ CSV
        </a>
      </div>

      {/* Table */}
      <div className="p-5">
        {!affiliateler || affiliateler.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Bu filtreyle eşleşen affiliate bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Ad Soyad", "Referral Kodu", "Platform", "Komisyon Oranı", "Dönüşüm", "Bekleyen", "Ödendi", "Durum"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${
                          i >= 3 && i <= 6 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {(affiliateler ?? []).map((a) => {
                  const conv = convMap.get(a.id) ?? { bekleyen: 0, odendi: 0, adet: 0 };
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
                    >
                      <td className="py-[10px] px-[10px] font-bold">
                        {a.profile_id ? (profileMap.get(a.profile_id) ?? "(adsız)") : "—"}
                      </td>
                      <td className="py-[10px] px-[10px] font-mono text-[11px] text-[#4A4D4A]">
                        {a.referral_code ?? "—"}
                      </td>
                      <td className="py-[10px] px-[10px] text-[#4A4D4A] text-[11px] max-w-[140px] truncate">
                        {a.platform_info ?? "—"}
                      </td>
                      <td className="py-[10px] px-[10px] text-right">
                        %{Number(a.commission_rate ?? 0).toFixed(0)}
                      </td>
                      <td className="py-[10px] px-[10px] text-right font-bold">{conv.adet}</td>
                      <td className="py-[10px] px-[10px] text-right text-[#4A4D4A]">
                        {formatTL(conv.bekleyen)}
                      </td>
                      <td className="py-[10px] px-[10px] text-right font-bold">
                        {formatTL(conv.odendi)}
                      </td>
                      <td className="py-[10px] px-[10px]">
                        <span className={`text-[10px] font-bold px-[9px] py-[3px] ${DURUM_PILL[a.status ?? ""] ?? "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]"}`}>
                          {DURUM_LABEL[a.status ?? ""] ?? a.status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {toplamSayfa > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
            <span className="text-[11px] text-[#4A4D4A]">
              Toplam <strong className="text-[#252625]">{toplam}</strong> affiliate · Sayfa {sayfa} / {toplamSayfa}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
                const p = i + 1;
                const href = `/admin/affiliate?${new URLSearchParams({ ...(durum ? { durum } : {}), sayfa: String(p) })}`;
                return (
                  <a
                    key={p}
                    href={href}
                    className={`w-[26px] h-[26px] border-[1.5px] flex items-center justify-center text-[11.5px] font-bold no-underline ${
                      sayfa === p
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343]"
                        : "bg-white border-[#D4E4D8] text-[#252625]"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
