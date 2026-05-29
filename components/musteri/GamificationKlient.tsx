"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export interface Rozet {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned: boolean;
  earned_at: string | null;
}

export interface HaftalikGorev {
  label: string;
  tamamlandi: boolean;
}

export interface GamificationKlientProps {
  rozetler: Rozet[];
  haftaGorevleri: HaftalikGorev[];
  tamamlananGorev: number;
  toplamGorev: number;
  istatistikler: {
    toplamSeans: number;
    toplamGunluk: number;
    toplamRozet: number;
    streak: number;
  };
  haftaSeansler: { tamamlanan: number; hedef: number };
  haftaMoodlar: { tamamlanan: number; hedef: number };
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

export default function GamificationKlient({
  rozetler,
  haftaGorevleri,
  tamamlananGorev,
  toplamGorev,
  istatistikler,
  haftaSeansler,
  haftaMoodlar,
}: GamificationKlientProps) {
  const reduced = useReducedMotion();
  const ilerlemePct = toplamGorev > 0
    ? Math.round((tamamlananGorev / toplamGorev) * 100)
    : 0;

  const kazanilanRozetler = rozetler.filter((r) => r.earned);
  const kazanilmayanRozetler = rozetler.filter((r) => !r.earned);

  return (
    <div className="px-6 py-5 flex flex-col gap-6">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Kazanılan Rozet", value: istatistikler.toplamRozet, suffix: "" },
          { label: "Tamamlanan Seans", value: istatistikler.toplamSeans, suffix: "" },
          { label: "Günlük Log", value: istatistikler.toplamGunluk, suffix: "" },
          { label: "Günlük Streak", value: istatistikler.streak, suffix: " gün" },
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
            <div className="text-[24px] font-bold text-[#252625] dark:text-white leading-none">
              {kpi.value}
              {kpi.suffix && (
                <span className="text-[14px] font-normal text-[#4A4D4A] ml-0.5">
                  {kpi.suffix}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Weekly goals ── */}
      <div className="border-[1.5px] border-[#325343] dark:border-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white">
            Bu Haftaki Hedefler
          </div>
          <span className="text-[11px] font-bold text-[#252625] dark:text-white">
            {tamamlananGorev} / {toplamGorev}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#D4E4D8] dark:bg-[#333] border-[1.5px] border-[#BDBDBD] mb-4">
          <motion.div
            className="h-full bg-[#325343] dark:bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${ilerlemePct}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>

        {/* Task list */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {haftaGorevleri.map((gorev, i) => (
            <motion.div
              key={gorev.label}
              initial={reduced ? {} : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              className={`flex items-center gap-2 px-3 py-2 border-[1.5px] text-[12px] ${
                gorev.tamamlandi
                  ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#252625] font-bold"
                  : "border-dashed border-[#BDBDBD] text-[#4A4D4A]"
              }`}
            >
              <span className="text-[14px]">
                {gorev.tamamlandi ? "✓" : "○"}
              </span>
              <span>{gorev.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Session + mood progress mini */}
        <div className="grid grid-cols-2 gap-3 border-t border-[#D4E4D8] dark:border-[#333] pt-3">
          {[
            { label: "Bu Hafta Seans", tamamlanan: haftaSeansler.tamamlanan, hedef: haftaSeansler.hedef },
            { label: "Bu Hafta Günlük", tamamlanan: haftaMoodlar.tamamlanan, hedef: haftaMoodlar.hedef },
          ].map((item) => {
            const pct = item.hedef > 0 ? Math.round((item.tamamlanan / item.hedef) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] text-[#4A4D4A] mb-1">
                  <span>{item.label}</span>
                  <span className="font-bold text-[#252625] dark:text-white">
                    {item.tamamlanan}/{item.hedef}
                  </span>
                </div>
                <div className="h-1.5 bg-[#D4E4D8] dark:bg-[#333] border-[1.5px] border-[#BDBDBD]">
                  <motion.div
                    className="h-full bg-[#325343] dark:bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Earned badges ── */}
      {kazanilanRozetler.length > 0 && (
        <div>
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
            Kazanılan Rozetler ({kazanilanRozetler.length})
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {kazanilanRozetler.map((rozet, i) => (
              <motion.div
                key={rozet.id}
                initial={reduced ? {} : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex flex-col items-center gap-1.5 border-[1.5px] border-[#325343] dark:border-white bg-[#325343] dark:bg-white p-3"
                title={rozet.description ?? rozet.name}
              >
                <div className="text-[28px] leading-none">
                  {rozet.icon ?? "🏅"}
                </div>
                <div className="text-[10px] font-bold text-white dark:text-[#252625] text-center leading-tight">
                  {rozet.name}
                </div>
                {rozet.earned_at && (
                  <div className="text-[9px] text-[#4A4D4A] dark:text-[#424242] text-center">
                    {formatTarih(rozet.earned_at)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Locked badges ── */}
      {kazanilmayanRozetler.length > 0 && (
        <div>
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
            Kilitli Rozetler ({kazanilmayanRozetler.length})
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {kazanilmayanRozetler.map((rozet, i) => (
              <motion.div
                key={rozet.id}
                initial={reduced ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                className="flex flex-col items-center gap-1.5 border-[1.5px] border-dashed border-[#BDBDBD] bg-[#F5F7F5] dark:bg-[#1a1a1a] p-3"
                title={rozet.description ?? rozet.name}
              >
                <div className="text-[28px] leading-none grayscale opacity-40">
                  {rozet.icon ?? "🏅"}
                </div>
                <div className="text-[10px] font-bold text-[#4A4D4A] text-center leading-tight">
                  {rozet.name}
                </div>
                {rozet.description && (
                  <div className="text-[9px] text-[#4A4D4A] text-center leading-tight">
                    {rozet.description.length > 40
                      ? `${rozet.description.slice(0, 40)}...`
                      : rozet.description}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {rozetler.length === 0 && (
        <div className="text-[13px] text-[#4A4D4A] py-10 text-center">
          Rozet tanımı yüklenemedi.
        </div>
      )}
    </div>
  );
}
