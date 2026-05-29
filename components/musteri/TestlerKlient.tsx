"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export interface TestOzet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  sonKayit: {
    result_label: string | null;
    score: number | null;
    created_at: string;
  } | null;
}

export interface GecmisSonuc {
  id: string;
  test_id: string;
  test_title: string;
  test_slug: string;
  score: number | null;
  result_label: string | null;
  shared_with_danisan: boolean;
  created_at: string;
}

export interface TestlerKlientProps {
  testler: TestOzet[];
  gecmisSonuclar: GecmisSonuc[];
}

function formatTarih(isoStr: string): string {
  const d = new Date(isoStr);
  const gun = d.getDate();
  const aylar = [
    "Oca","Şub","Mar","Nis","May","Haz",
    "Tem","Ağu","Eyl","Eki","Kas","Ara",
  ];
  const ay = aylar[d.getMonth()] ?? "";
  const yil = d.getFullYear();
  return `${gun} ${ay} ${yil}`;
}

export default function TestlerKlient({
  testler,
  gecmisSonuclar,
}: TestlerKlientProps) {
  const prefersReduced = useReducedMotion();
  const [gecmisAcik, setGecmisAcik] = useState(false);

  return (
    <div className="px-6 py-5">
      {/* Section heading */}
      <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-4 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
        Psikolojik Testler
      </div>

      {testler.length === 0 ? (
        <div className="text-[13px] text-[#4A4D4A] py-10 text-center">
          Şu an aktif test bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2">
          {testler.map((test, i) => (
            <motion.div
              key={test.id}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.18, delay: prefersReduced ? 0 : i * 0.05 }}
              className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#111] p-4 flex flex-col gap-3 hover:border-[#325343] dark:hover:border-white transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-[14px] text-[#252625] dark:text-white leading-snug">
                  {test.title}
                </div>
                {test.estimated_minutes && (
                  <span className="text-[9px] font-bold border-[1.5px] border-[#BDBDBD] px-2 py-[2px] text-[#4A4D4A] whitespace-nowrap flex-shrink-0">
                    ~{test.estimated_minutes} dk
                  </span>
                )}
              </div>

              {/* Description */}
              {test.description && (
                <p className="text-[12px] text-[#424242] dark:text-[#4A4D4A] leading-relaxed">
                  {test.description.length > 120
                    ? `${test.description.slice(0, 120)}...`
                    : test.description}
                </p>
              )}

              {/* Last result */}
              {test.sonKayit && (
                <div className="flex items-center gap-2 text-[10px] text-[#4A4D4A] border-t border-[#D4E4D8] dark:border-[#333] pt-2">
                  <span>Son sonuç:</span>
                  <span className="font-bold text-[#252625] dark:text-white">
                    {test.sonKayit.result_label ?? `${test.sonKayit.score ?? 0} puan`}
                  </span>
                  <span>·</span>
                  <span>{formatTarih(test.sonKayit.created_at)}</span>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/panelim/testler/${test.slug}`}
                className="mt-auto block w-full bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-center text-[12px] font-bold py-2 hover:bg-[#333] dark:hover:bg-[#D4E4D8] transition-colors"
              >
                {test.sonKayit ? "Tekrar Al" : "Testi Al"}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Past results */}
      {gecmisSonuclar.length > 0 && (
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
          <button
            onClick={() => setGecmisAcik((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b border-[#D4E4D8] dark:border-[#333] cursor-pointer"
            style={{ fontFamily: "inherit" }}
          >
            <span>Geçmiş Sonuçlarım ({gecmisSonuclar.length})</span>
            <span className="text-[#4A4D4A] text-[12px]">
              {gecmisAcik ? "▲" : "▼"}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {gecmisAcik && (
              <motion.div
                key="gecmis"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
                className="overflow-hidden"
              >
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b border-[#D4E4D8] dark:border-[#333]">
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                        Test
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                        Sonuç
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                        Tarih
                      </th>
                      <th className="text-right text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] px-4 py-2">
                        Paylaşım
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gecmisSonuclar.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: prefersReduced ? 0 : i * 0.03 }}
                        className="border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] last:border-b-0"
                      >
                        <td className="px-4 py-2.5 text-[#252625] dark:text-white font-medium">
                          <Link
                            href={`/panelim/testler/${s.test_slug}`}
                            className="hover:underline"
                          >
                            {s.test_title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          {s.result_label ? (
                            <span className="text-[#252625] dark:text-white font-bold">
                              {s.result_label}
                            </span>
                          ) : (
                            <span className="text-[#4A4D4A]">
                              {s.score ?? 0} puan
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[#4A4D4A]">
                          {formatTarih(s.created_at)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {s.shared_with_danisan ? (
                            <span className="text-[9px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-1.5 py-[1px]">
                              ✓ Paylaşıldı
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#4A4D4A]">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
