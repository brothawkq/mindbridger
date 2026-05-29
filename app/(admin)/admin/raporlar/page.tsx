import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import Link from "next/link";

export const metadata = { title: "Raporlar — Admin | MindBridger" };

const RAPORLAR = [
  {
    key: "komisyon",
    baslik: "Komisyon Raporu",
    aciklama: "Platform komisyon gelirlerinin tarih bazlı dökümü",
    href: "/api/admin/raporlar/komisyon",
  },
  {
    key: "gelir",
    baslik: "Gelir Raporu",
    aciklama: "Brüt işlem hacmi ve danışman net ödemeleri",
    href: "/api/admin/raporlar/gelir",
  },
  {
    key: "vergi",
    baslik: "Vergi Raporu",
    aciklama: "KDV dahil komisyon tutarları (muhasebe için)",
    href: "/api/admin/raporlar/vergi",
  },
  {
    key: "affiliate",
    baslik: "Affiliate Raporu",
    aciklama: "Affiliate dönüşüm ve komisyon kaydı",
    href: "/api/admin/raporlar/affiliate",
  },
  {
    key: "kurumsal",
    baslik: "Kurumsal Fatura Raporu",
    aciklama: "Kurumsal aylık fatura toplamları",
    href: "/api/admin/raporlar/kurumsal",
  },
] as const;

export default async function AdminRaporlarPage({
  searchParams,
}: {
  searchParams: Promise<{ baslangic?: string; bitis?: string }>;
}) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const { baslangic, bitis } = await searchParams;

  function buildHref(base: string) {
    const p = new URLSearchParams();
    if (baslangic) p.set("baslangic", baslangic);
    if (bitis) p.set("bitis", bitis);
    return p.size > 0 ? `${base}?${p}` : base;
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <h1 className="text-[16px] font-bold text-[#252625]">Raporlar</h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">CSV formatında dışa aktarım (Excel uyumlu)</p>
      </div>

      {/* Date range filter */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <form method="GET" className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              name="baslangic"
              defaultValue={baslangic ?? ""}
              className="border-[1.5px] border-[#325343] px-3 py-[7px] text-[13px] outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              name="bitis"
              defaultValue={bitis ?? ""}
              className="border-[1.5px] border-[#325343] px-3 py-[7px] text-[13px] outline-none bg-white"
            />
          </div>
          <button
            type="submit"
            className="bg-[#A6DE9B] text-[#325343] font-bold text-[12px] px-5 py-[9px] border-none cursor-pointer"
          >
            Filtrele
          </button>
          {(baslangic || bitis) && (
            <Link
              href="/admin/raporlar"
              className="text-[11px] text-[#4A4D4A] underline self-center"
            >
              Temizle
            </Link>
          )}
        </form>
        {(baslangic || bitis) && (
          <p className="text-[10px] text-[#4A4D4A] mt-2">
            Tarih aralığı:{" "}
            <strong>{baslangic ?? "—"}</strong> → <strong>{bitis ?? "—"}</strong>
          </p>
        )}
      </div>

      {/* Report cards */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RAPORLAR.map((r) => (
            <div
              key={r.key}
              className="border-[1.5px] border-[#D4E4D8] p-4 bg-white flex flex-col gap-3"
            >
              <div>
                <div className="text-[12px] font-bold text-[#252625]">{r.baslik}</div>
                <div className="text-[10px] text-[#4A4D4A] mt-1">{r.aciklama}</div>
              </div>
              <a
                href={buildHref(r.href)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold border-[1.5px] border-[#325343] px-3 py-[6px] text-[#252625] bg-white hover:bg-[#325343] hover:text-white transition-colors w-fit"
              >
                ↓ CSV İndir
              </a>
            </div>
          ))}
        </div>

        {/* Loglar link */}
        <div className="mt-6 border-t border-[#D4E4D8] pt-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-3">
            Denetim Kayıtları
          </div>
          <Link
            href="/admin/raporlar/loglar"
            className="inline-flex items-center gap-2 border-[1.5px] border-[#325343] px-4 py-[9px] text-[12px] font-bold text-[#252625] hover:bg-[#325343] hover:text-white transition-colors"
          >
            Sistem Loglarını Görüntüle →
          </Link>
        </div>
      </div>
    </div>
  );
}
