"use client";

import { motion, useReducedMotion } from "framer-motion";

interface KPI {
  toplamRandevu: number;
  tamamlananRandevu: number;
  iptalRandevu: number;
  noShowRandevu: number;
  tamamlanmaOrani: number;
  iptalOrani: number;
  noShowOrani: number;
  tekrarMusteriler: number;
  ortalamaPuan: number;
  toplamYorum: number;
  toplamSeans: number;
}

interface Yorum {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string } | null;
}

interface Rozet {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned: boolean;
  earned_at: string | null;
}

interface Props {
  kpi: KPI;
  sonYorumlar: Yorum[];
  rozetler: Rozet[];
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
      <motion.div
        className="h-full bg-[#325343] dark:bg-white"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </div>
  );
}

function Yildiz({ puan }: { puan: number }) {
  return (
    <span className="text-xs text-[#252625] dark:text-white">
      {"★".repeat(Math.round(puan))}{"☆".repeat(5 - Math.round(puan))}
    </span>
  );
}

function formatTarih(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

export default function PerformansKlient({ kpi, sonYorumlar, rozetler }: Props) {
  const prefersReduced = useReducedMotion();

  const kpiKartlar = [
    { etiket: "Toplam Seans", deger: kpi.toplamSeans },
    { etiket: "Tamamlanan", deger: kpi.tamamlananRandevu },
    { etiket: "Ortalama Puan", deger: kpi.ortalamaPuan.toFixed(1) },
    { etiket: "Toplam Yorum", deger: kpi.toplamYorum },
  ];

  const oranlar = [
    { etiket: "Tamamlanma Oranı", oran: kpi.tamamlanmaOrani },
    { etiket: "İptal Oranı", oran: kpi.iptalOrani },
    { etiket: "No-Show Oranı", oran: kpi.noShowOrani },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Araçlar</div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">Performans</h1>
      </div>

      {/* KPI Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {kpiKartlar.map((k, i) => (
          <motion.div
            key={k.etiket}
            {...(prefersReduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.2 } })}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3 text-center"
          >
            <div className="text-xl font-bold text-[#252625] dark:text-white">{k.deger}</div>
            <div className="text-[10px] text-[#4A4D4A] mt-0.5">{k.etiket}</div>
          </motion.div>
        ))}
      </div>

      {/* Oran Çubukları */}
      <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Seans Oranları</div>
        <div className="space-y-4">
          {oranlar.map((o) => (
            <div key={o.etiket}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#252625] dark:text-white">{o.etiket}</span>
                <span className="font-bold text-[#252625] dark:text-white">%{o.oran}</span>
              </div>
              <ProgressBar value={o.oran} />
            </div>
          ))}
        </div>
      </div>

      {/* Rozetler */}
      <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Rozetler</div>
        {rozetler.length === 0 ? (
          <div className="text-sm text-[#4A4D4A]">Henüz rozet yok.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rozetler.map((rozet, i) => (
              <motion.div
                key={rozet.id}
                {...(prefersReduced ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { delay: i * 0.04 } })}
                className={`p-3 border-[1.5px] text-center ${
                  rozet.earned
                    ? "border-[#325343] dark:border-white"
                    : "border-dashed border-[#BDBDBD]"
                }`}
              >
                <div className="text-2xl mb-1">{rozet.icon}</div>
                <div className={`text-xs font-bold mb-0.5 ${rozet.earned ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"}`}>
                  {rozet.name}
                </div>
                <div className="text-[10px] text-[#4A4D4A]">{rozet.description}</div>
                {rozet.earned && rozet.earned_at && (
                  <div className="text-[9px] text-[#4A4D4A] mt-1">{formatTarih(rozet.earned_at)}</div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Son Yorumlar */}
      <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Son Değerlendirmeler</div>
        {sonYorumlar.length === 0 ? (
          <div className="text-sm text-[#4A4D4A]">Henüz değerlendirme yok.</div>
        ) : (
          <div className="space-y-3">
            {sonYorumlar.map((yorum) => {
              const isim = yorum.profiles
                ? `${yorum.profiles.first_name} ${yorum.profiles.last_name}`
                : "Anonim";
              return (
                <div key={yorum.id} className="border-b border-[#D4E4D8] dark:border-[#333] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#252625] dark:text-white">{isim}</span>
                    <div className="flex items-center gap-2">
                      <Yildiz puan={yorum.rating} />
                      <span className="text-[10px] text-[#4A4D4A]">{formatTarih(yorum.created_at)}</span>
                    </div>
                  </div>
                  {yorum.comment && (
                    <p className="text-[11px] text-[#4A4D4A] line-clamp-3">{yorum.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
