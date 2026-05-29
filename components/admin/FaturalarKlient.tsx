"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FaturaListeResponse, FaturaSatir } from "@/types/admin";

const TIP_LABEL: Record<string, string> = {
  bireysel: "Bireysel",
  kurumsal_aylik: "Kurumsal Aylık",
};

function formatTL(n: number) {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FaturalarKlient() {
  const shouldReduce = useReducedMotion();
  const [tip, setTip] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [data, setData] = useState<FaturaListeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ sayfa: String(sayfa) });
    if (tip) params.set("tip", tip);

    fetch(`/api/admin/finans/faturalar?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: FaturaListeResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {});
  }, [tip, sayfa]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-end justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">Faturalar</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">Tüm seans faturaları</p>
        </div>
        <a
          href="/api/admin/raporlar/kurumsal"
          className="text-[10.5px] font-semibold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625] px-[11px] py-[5px] hover:border-[#325343] transition-colors"
        >
          ↓ Kurumsal CSV
        </a>
      </div>

      {/* Filter */}
      <div className="px-5 py-3 border-b border-[#D4E4D8] flex gap-2">
        <select
          className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
          value={tip}
          onChange={(e) => {
            setTip(e.target.value);
            setSayfa(1);
          }}
        >
          <option value="">Tip: Tümü</option>
          <option value="bireysel">Bireysel</option>
          <option value="kurumsal_aylik">Kurumsal Aylık</option>
        </select>
      </div>

      {/* Table area */}
      <div className="p-5 flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#4A4D4A]">
            Yükleniyor...
          </div>
        ) : !data || data.faturalar.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Gösterilecek fatura bulunamadı.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Fatura No", "Tarih", "Tip", "Müşteri", "Danışman", "Tutar", "PDF"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${
                            i === 5 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <motion.tbody
                  variants={
                    shouldReduce
                      ? {}
                      : { show: { transition: { staggerChildren: 0.04 } } }
                  }
                  initial="hidden"
                  animate="show"
                >
                  {data.faturalar.map((f: FaturaSatir) => (
                    <motion.tr
                      key={f.id}
                      variants={
                        shouldReduce
                          ? {}
                          : {
                              hidden: { opacity: 0, y: 6 },
                              show: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.18 },
                              },
                            }
                      }
                      className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
                    >
                      <td className="py-[10px] px-[10px] font-mono text-[11px]">{f.faturaNu}</td>
                      <td className="py-[10px] px-[10px] text-[#4A4D4A] whitespace-nowrap">
                        {f.tarih}
                      </td>
                      <td className="py-[10px] px-[10px]">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 ${
                            f.tip === "kurumsal_aylik"
                              ? "bg-[#A6DE9B] text-[#325343]"
                              : "border-[1.5px] border-[#325343] text-[#252625]"
                          }`}
                        >
                          {TIP_LABEL[f.tip] ?? f.tip}
                        </span>
                      </td>
                      <td className="py-[10px] px-[10px] font-semibold">{f.musteriAdi}</td>
                      <td className="py-[10px] px-[10px] text-[#4A4D4A]">{f.danisanAdi}</td>
                      <td className="py-[10px] px-[10px] text-right font-bold">
                        {formatTL(f.tutar)}
                      </td>
                      <td className="py-[10px] px-[10px]">
                        {f.pdfUrl ? (
                          <a
                            href={f.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold border-[1.5px] border-[#325343] px-2 py-0.5 text-[#252625] hover:bg-[#325343] hover:text-white transition-colors"
                          >
                            ↓ PDF
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#4A4D4A]">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.toplamSayfa > 1 && (
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
                <span className="text-[11px] text-[#4A4D4A]">
                  Toplam <strong className="text-[#252625]">{data.toplam}</strong> fatura · Sayfa{" "}
                  {data.sayfa} / {data.toplamSayfa}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                    disabled={sayfa <= 1}
                    className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, data.toplamSayfa) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setSayfa(p)}
                        className={`w-[26px] h-[26px] border-[1.5px] flex items-center justify-center text-[11.5px] font-bold cursor-pointer ${
                          sayfa === p
                            ? "bg-[#A6DE9B] text-[#325343] border-[#325343]"
                            : "bg-white border-[#D4E4D8] text-[#252625]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSayfa((p) => Math.min(data.toplamSayfa, p + 1))}
                    disabled={sayfa >= data.toplamSayfa}
                    className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
