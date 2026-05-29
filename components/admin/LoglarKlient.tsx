"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface LogSatir {
  id: string;
  tarih: string;
  kullanici: string;
  aksiyon: string;
  tablo: string;
  kayitId: string;
  ip: string;
}

interface LogResponse {
  loglar: LogSatir[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

const AKSIYON_SECENEKLERI = [
  "kayit",
  "giris",
  "randevu_olustur",
  "iptal",
  "odeme",
  "seans_baslat",
  "admin_islem",
];

export default function LoglarKlient() {
  const shouldReduce = useReducedMotion();
  const [aksiyon, setAksiyon] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [data, setData] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ sayfa: String(sayfa) });
    if (aksiyon) params.set("aksiyon", aksiyon);
    if (baslangic) params.set("baslangic", baslangic);
    if (bitis) params.set("bitis", bitis);

    fetch(`/api/admin/loglar?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: LogResponse) => { setData(d); setLoading(false); })
      .catch(() => {});
  }, [aksiyon, baslangic, bitis, sayfa]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  function resetFilters() {
    setAksiyon("");
    setBaslangic("");
    setBitis("");
    setSayfa(1);
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <h1 className="text-[16px] font-bold text-[#252625]">Sistem Logları</h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">Tüm kritik işlemlerin denetim kaydı (90 gün saklanır)</p>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-[#D4E4D8] flex gap-2 flex-wrap items-center">
        <select
          className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
          value={aksiyon}
          onChange={(e) => { setAksiyon(e.target.value); setSayfa(1); }}
        >
          <option value="">Aksiyon: Tümü</option>
          {AKSIYON_SECENEKLERI.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          type="date"
          className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
          value={baslangic}
          onChange={(e) => { setBaslangic(e.target.value); setSayfa(1); }}
          placeholder="Başlangıç"
        />
        <input
          type="date"
          className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
          value={bitis}
          onChange={(e) => { setBitis(e.target.value); setSayfa(1); }}
          placeholder="Bitiş"
        />

        {(aksiyon || baslangic || bitis) && (
          <button
            onClick={resetFilters}
            className="text-[11px] text-[#4A4D4A] underline cursor-pointer border-none bg-transparent"
          >
            Temizle
          </button>
        )}

        <span className="text-[11px] text-[#4A4D4A] ml-auto">
          {loading ? "Yükleniyor..." : `${data?.toplam ?? 0} kayıt`}
        </span>
      </div>

      {/* Table */}
      <div className="p-5 flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#4A4D4A]">
            Yükleniyor...
          </div>
        ) : !data || data.loglar.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Bu filtreyle eşleşen log kaydı bulunamadı.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    {["Tarih", "Kullanıcı", "Aksiyon", "Tablo", "Kayıt ID", "IP"].map((h) => (
                      <th
                        key={h}
                        className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <motion.tbody
                  variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.03 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {data.loglar.map((r) => (
                    <motion.tr
                      key={r.id}
                      variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } }}
                      className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
                    >
                      <td className="py-[9px] px-[10px] whitespace-nowrap text-[#4A4D4A] font-mono text-[11px]">{r.tarih}</td>
                      <td className="py-[9px] px-[10px] font-semibold">{r.kullanici}</td>
                      <td className="py-[9px] px-[10px]">
                        <span className={`text-[10px] font-bold px-[9px] py-[3px] ${
                          r.aksiyon === "admin_islem"
                            ? "bg-[#A6DE9B] text-[#325343]"
                            : r.aksiyon.startsWith("giris") || r.aksiyon === "kayit"
                            ? "border-[1.5px] border-[#325343] text-[#252625]"
                            : "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]"
                        }`}>
                          {r.aksiyon}
                        </span>
                      </td>
                      <td className="py-[9px] px-[10px] text-[#4A4D4A] font-mono text-[11px]">{r.tablo}</td>
                      <td className="py-[9px] px-[10px] text-[#4A4D4A] font-mono text-[11px] max-w-[120px] truncate">{r.kayitId}</td>
                      <td className="py-[9px] px-[10px] text-[#4A4D4A] font-mono text-[11px]">{r.ip}</td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.toplamSayfa > 1 && (
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
                <span className="text-[11px] text-[#4A4D4A]">
                  Toplam <strong className="text-[#252625]">{data.toplam}</strong> log · Sayfa {data.sayfa} / {data.toplamSayfa}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                    disabled={sayfa <= 1}
                    className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
                  >‹</button>
                  {Array.from({ length: Math.min(5, data.toplamSayfa) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setSayfa(p)}
                        className={`w-[26px] h-[26px] border-[1.5px] flex items-center justify-center text-[11.5px] font-bold cursor-pointer ${
                          sayfa === p ? "bg-[#A6DE9B] text-[#325343] border-[#325343]" : "bg-white border-[#D4E4D8] text-[#252625]"
                        }`}
                      >{p}</button>
                    );
                  })}
                  <button
                    onClick={() => setSayfa((p) => Math.min(data.toplamSayfa, p + 1))}
                    disabled={sayfa >= data.toplamSayfa}
                    className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
                  >›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
