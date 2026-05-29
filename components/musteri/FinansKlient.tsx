"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export interface MusteriOdeme {
  id: string;
  amount_gross: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  randevu_tarih: string | null;
  danisan_isim: string;
  danisan_slug: string;
  fatura_id: string | null;
  invoice_number: string | null;
  pdf_url: string | null;
}

export interface FinansKlientProps {
  odemeler: MusteriOdeme[];
  toplamOdenen: number;
  toplamSeans: number;
  toplamFatura: number;
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

function formatTL(n: number): string {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function FinansKlient({
  odemeler,
  toplamOdenen,
  toplamSeans,
  toplamFatura,
}: FinansKlientProps) {
  const reduced = useReducedMotion();

  return (
    <div className="px-6 py-5 flex flex-col gap-6">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Toplam Ödenen", value: formatTL(toplamOdenen) },
          { label: "Tamamlanan Seans", value: String(toplamSeans) },
          { label: "Fatura Sayısı", value: String(toplamFatura) },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={reduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3"
          >
            <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
              {kpi.label}
            </div>
            <div className="text-[20px] font-bold text-[#252625] dark:text-white leading-none">
              {kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Payment list ── */}
      {odemeler.length === 0 ? (
        <div className="text-[13px] text-[#4A4D4A] py-10 text-center">
          Henüz ödeme kaydı bulunmuyor.
        </div>
      ) : (
        <div>
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
            Ödeme Geçmişi
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_100px_90px] gap-2 px-3 py-2 bg-[#F5F7F5] dark:bg-[#1a1a1a] border-[1.5px] border-[#D4E4D8] dark:border-[#333] mb-px">
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A]">Danışman</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A]">Tarih</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] text-right">Tutar</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] text-right">Fatura</span>
          </div>

          <div className="flex flex-col">
            {odemeler.map((odeme, i) => (
              <motion.div
                key={odeme.id}
                initial={reduced ? {} : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.14, delay: i * 0.03 }}
                className="grid grid-cols-[1fr_120px_100px_90px] gap-2 px-3 py-2.5 border border-t-0 border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a]"
              >
                <div>
                  <div className="text-[12px] font-semibold text-[#252625] dark:text-white">
                    {odeme.danisan_isim}
                  </div>
                  {odeme.invoice_number && (
                    <div className="text-[10px] text-[#4A4D4A]">
                      {odeme.invoice_number}
                    </div>
                  )}
                </div>
                <div className="text-[12px] text-[#4A4D4A] self-center">
                  {odeme.randevu_tarih
                    ? formatTarih(odeme.randevu_tarih)
                    : odeme.paid_at
                    ? formatTarih(odeme.paid_at)
                    : formatTarih(odeme.created_at)}
                </div>
                <div className="text-[12px] font-bold text-[#252625] dark:text-white text-right self-center">
                  {formatTL(odeme.amount_gross)}
                </div>
                <div className="text-right self-center">
                  {odeme.pdf_url ? (
                    <a
                      href={odeme.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-2 py-0.5 hover:bg-[#325343] hover:text-white dark:hover:bg-white dark:hover:text-[#252625] transition-colors"
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#4A4D4A]">—</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
