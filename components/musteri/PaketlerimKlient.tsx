"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export type PaketDurum = "active" | "expired" | "completed";

export interface MusteriPaketi {
  id: string;
  name: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number | null;
  status: PaketDurum;
  expires_at: string;
  created_at: string;
  fiyat: number;
  indirim: number;
  danisan_isim: string;
  danisan_slug: string;
}

interface Props {
  paketler: MusteriPaketi[];
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

function gecmisMi(expires_at: string): boolean {
  return new Date(expires_at) < new Date();
}

const DURUM_LABEL: Record<PaketDurum, string> = {
  active: "AKTİF",
  expired: "SÜRESİ DOLDU",
  completed: "TAMAMLANDI",
};

export default function PaketlerimKlient({ paketler }: Props) {
  const prefersReduced = useReducedMotion();
  const aktifler = paketler.filter((p) => p.status === "active");
  const gecmisler = paketler.filter((p) => p.status !== "active");

  return (
    <div className="px-6 py-5">
      {/* Active packages */}
      <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
        Aktif Paketler ({aktifler.length})
      </div>

      {aktifler.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-6 mb-6 text-center">
          <div className="text-[13px] text-[#4A4D4A] mb-3">
            Aktif paketiniz bulunmuyor.
          </div>
          <Link
            href="/danismanlar"
            className="inline-block bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold px-5 py-2.5 hover:bg-[#333] dark:hover:bg-[#D4E4D8] transition-colors"
          >
            Danışman Bul
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {aktifler.map((paket, i) => {
            const kullanilanPct =
              paket.sessions_total > 0
                ? Math.round((paket.sessions_used / paket.sessions_total) * 100)
                : 0;
            const kalan =
              paket.sessions_remaining ?? paket.sessions_total - paket.sessions_used;

            return (
              <motion.div
                key={paket.id}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.18, delay: prefersReduced ? 0 : i * 0.05 }}
                className="border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#111] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-[14px] text-[#252625] dark:text-white mb-0.5">
                      {paket.name}
                    </div>
                    <div className="text-[11px] text-[#4A4D4A]">
                      Danışman:{" "}
                      <Link
                        href={`/danismanlar/${paket.danisan_slug}`}
                        className="text-[#252625] dark:text-white hover:underline font-medium"
                      >
                        {paket.danisan_isim}
                      </Link>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold border-[1.5px] border-[#325343] dark:border-white px-2 py-[2px] text-[#252625] dark:text-white whitespace-nowrap flex-shrink-0">
                    {DURUM_LABEL[paket.status]}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-[#4A4D4A] mb-1.5">
                    <span>
                      {paket.sessions_used} / {paket.sessions_total} seans kullanıldı
                    </span>
                    <span className="font-bold text-[#252625] dark:text-white">
                      {kalan} kalan
                    </span>
                  </div>
                  <div className="h-2 bg-[#D4E4D8] dark:bg-[#333] border-[1.5px] border-[#BDBDBD]">
                    <motion.div
                      className="h-full bg-[#325343] dark:bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${kullanilanPct}%` }}
                      transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: "easeInOut" }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#4A4D4A] flex-wrap gap-2">
                  <div className="flex gap-4">
                    <span>
                      Fiyat:{" "}
                      <span className="text-[#252625] dark:text-white font-bold">
                        ₺{paket.fiyat.toLocaleString("tr-TR")}
                      </span>
                    </span>
                    {paket.indirim > 0 && (
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        %{paket.indirim} indirim
                      </span>
                    )}
                  </div>
                  <span>
                    Son kullanım:{" "}
                    <span
                      className={
                        gecmisMi(paket.expires_at)
                          ? "text-red-500 font-bold"
                          : "text-[#252625] dark:text-white"
                      }
                    >
                      {formatTarih(paket.expires_at)}
                    </span>
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#D4E4D8] dark:border-[#333]">
                  <Link
                    href={`/panelim/randevu-al/${paket.danisan_slug}`}
                    className="inline-block text-[11px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-4 py-1.5 hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    Randevu Al
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Past packages */}
      {gecmisler.length > 0 && (
        <>
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
            Geçmiş Paketler ({gecmisler.length})
          </div>

          <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b border-[#D4E4D8] dark:border-[#333]">
                  <th className="text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                    Paket
                  </th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                    Danışman
                  </th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                    Seans
                  </th>
                  <th className="text-right text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {gecmisler.map((paket) => (
                  <tr
                    key={paket.id}
                    className="border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-[#252625] dark:text-white font-medium">
                      {paket.name}
                      <div className="text-[10px] text-[#4A4D4A] mt-0.5">
                        {formatTarih(paket.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#4A4D4A]">
                      {paket.danisan_isim}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#4A4D4A]">
                      {paket.sessions_used}/{paket.sessions_total}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[9px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] px-2 py-[2px] text-[#4A4D4A]">
                        {DURUM_LABEL[paket.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
