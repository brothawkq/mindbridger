import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata = { title: "Bildirimler — Admin | MindBridger" };

const DURUM_PILL: Record<string, string> = {
  pending: "border-[1.5px] border-[#325343] text-[#252625]",
  sent: "bg-[#A6DE9B] text-[#325343]",
  failed: "border-[1.5px] border-dashed border-red-400 text-red-500",
};

const DURUM_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  sent: "Gönderildi",
  failed: "Başarısız",
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function AdminBildirimlerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; sayfa?: string }>;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const { durum, sayfa: sayfaStr } = await searchParams;
  const PAGE_SIZE = 30;
  const sayfa = Math.max(1, parseInt(sayfaStr ?? "1", 10));
  const offset = (sayfa - 1) * PAGE_SIZE;

  let q = supabase
    .from("bildirimler")
    .select("id, user_id, type, title, channel, delivery_status, retry_count, created_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const seciliDurum = durum ?? "failed";
  if (seciliDurum !== "tumu") {
    q = q.eq("delivery_status", seciliDurum as "pending" | "sent" | "failed");
  }

  const { data: bildirimler, count } = await q;

  const userIds = [
    ...new Set((bildirimler ?? []).map((b) => b.user_id).filter(Boolean)),
  ] as string[];
  type PRow = { id: string; first_name: string | null; last_name: string | null };
  let profiles: PRow[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
    profiles = (data as PRow[]) ?? [];
  }
  const profileMap = new Map(
    profiles.map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)"])
  );

  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));

  const DURUM_TABS = [
    { key: "failed", label: "Başarısız" },
    { key: "pending", label: "Bekliyor" },
    { key: "sent", label: "Gönderildi" },
    { key: "tumu", label: "Tümü" },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <h1 className="text-[16px] font-bold text-[#252625]">Bildirimler</h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">Sistem bildirim teslimat durumları</p>
      </div>

      {/* Status tabs */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] bg-white px-5">
        {DURUM_TABS.map((t) => {
          const aktif = seciliDurum === t.key;
          return (
            <a
              key={t.key}
              href={`/admin/bildirimler?durum=${t.key}`}
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
        <span className="ml-auto self-center text-[11px] text-[#4A4D4A]">
          {toplam} kayıt
        </span>
      </div>

      {/* Table */}
      <div className="p-5">
        {!bildirimler || bildirimler.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Bu kategoride bildirim bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["Tarih", "Kullanıcı", "Tip", "Başlık", "Kanal", "Durum", "Deneme"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i === 6 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(bildirimler ?? []).map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
                  >
                    <td className="py-[9px] px-[10px] whitespace-nowrap text-[#4A4D4A] font-mono text-[11px]">
                      {fmt(b.created_at)}
                    </td>
                    <td className="py-[9px] px-[10px] font-semibold">
                      {b.user_id ? (profileMap.get(b.user_id) ?? "(adsız)") : "—"}
                    </td>
                    <td className="py-[9px] px-[10px] text-[#4A4D4A] text-[11px]">{b.type ?? "—"}</td>
                    <td className="py-[9px] px-[10px] max-w-[200px] truncate">{b.title ?? "—"}</td>
                    <td className="py-[9px] px-[10px]">
                      <span className="text-[10px] font-bold border-[1.5px] border-[#D4E4D8] px-2 py-0.5 text-[#4A4D4A]">
                        {b.channel ?? "—"}
                      </span>
                    </td>
                    <td className="py-[9px] px-[10px]">
                      <span className={`text-[10px] font-bold px-[9px] py-[3px] ${DURUM_PILL[b.delivery_status ?? ""] ?? "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]"}`}>
                        {DURUM_LABEL[b.delivery_status ?? ""] ?? b.delivery_status ?? "—"}
                      </span>
                    </td>
                    <td className="py-[9px] px-[10px] text-right text-[#4A4D4A]">
                      {b.retry_count ?? 0}
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
              Sayfa {sayfa} / {toplamSayfa}
            </span>
            <div className="flex gap-1">
              {sayfa > 1 && (
                <a
                  href={`/admin/bildirimler?durum=${seciliDurum}&sayfa=${sayfa - 1}`}
                  className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white no-underline text-[#252625]"
                >
                  ‹
                </a>
              )}
              {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
                const p = i + 1;
                return (
                  <a
                    key={p}
                    href={`/admin/bildirimler?durum=${seciliDurum}&sayfa=${p}`}
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
              {sayfa < toplamSayfa && (
                <a
                  href={`/admin/bildirimler?durum=${seciliDurum}&sayfa=${sayfa + 1}`}
                  className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white no-underline text-[#252625]"
                >
                  ›
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
