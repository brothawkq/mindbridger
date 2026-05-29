import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata = { title: "Kurumsal Hesaplar — Admin | MindBridger" };

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

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export default async function AdminKurumsalPage({
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
    .from("kurumsal_hesaplar")
    .select(
      "id, company_name, contact_name, contact_email, license_count, status, invite_code, subscription_start, subscription_end, price_per_user",
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (durum) q = q.eq("status", durum as "pending" | "active" | "suspended");

  const { data: hesaplar, count } = await q;

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const DURUM_TABS = [
    { key: "", label: "Tümü" },
    { key: "pending", label: "Bekliyor" },
    { key: "active", label: "Aktif" },
    { key: "suspended", label: "Askıda" },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-end justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">Kurumsal Hesaplar</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">
            {toplam} hesap kayıtlı
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] bg-white px-5">
        {DURUM_TABS.map((t) => {
          const aktif = (durum ?? "") === t.key;
          return (
            <a
              key={t.key}
              href={`/admin/kurumsal${t.key ? `?durum=${t.key}` : ""}`}
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
      </div>

      {/* Table */}
      <div className="p-5">
        {!hesaplar || hesaplar.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Bu filtreyle eşleşen kurumsal hesap bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Şirket", "İletişim", "Lisans", "Fiyat/Kullanıcı", "Abonelik", "Davet Kodu", "Durum"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i === 2 || i === 3 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(hesaplar ?? []).map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
                  >
                    <td className="py-[10px] px-[10px] font-bold">{h.company_name ?? "—"}</td>
                    <td className="py-[10px] px-[10px]">
                      <div className="text-[12px]">{h.contact_name ?? "—"}</div>
                      <div className="text-[10px] text-[#4A4D4A]">{h.contact_email ?? ""}</div>
                    </td>
                    <td className="py-[10px] px-[10px] text-right font-bold">
                      {h.license_count ?? 0}
                      <div className="text-[10px] text-[#4A4D4A] font-normal">kullanıcı</div>
                    </td>
                    <td className="py-[10px] px-[10px] text-right">
                      ₺{Number(h.price_per_user ?? 0).toLocaleString("tr-TR")}
                    </td>
                    <td className="py-[10px] px-[10px] whitespace-nowrap">
                      <div className="text-[11px]">{fmt(h.subscription_start)}</div>
                      <div className="text-[10px] text-[#4A4D4A]">→ {fmt(h.subscription_end)}</div>
                    </td>
                    <td className="py-[10px] px-[10px] font-mono text-[11px] text-[#4A4D4A]">
                      {h.invite_code ?? "—"}
                    </td>
                    <td className="py-[10px] px-[10px]">
                      <span className={`text-[10px] font-bold px-[9px] py-[3px] ${DURUM_PILL[h.status ?? ""] ?? "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]"}`}>
                        {DURUM_LABEL[h.status ?? ""] ?? h.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {toplamSayfa > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
            <span className="text-[11px] text-[#4A4D4A]">
              Toplam <strong className="text-[#252625]">{toplam}</strong> hesap · Sayfa {sayfa} / {toplamSayfa}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
                const p = i + 1;
                const href = `/admin/kurumsal?${new URLSearchParams({ ...(durum ? { durum } : {}), sayfa: String(p) })}`;
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
