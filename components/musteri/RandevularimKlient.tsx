"use client";

import { useState } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Durum = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rejected";

interface DanisanBilgi {
  id: string;
  slug: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface RandevuOzet {
  id: string;
  scheduled_at: string;
  status: Durum;
  session_type: string;
  duration_minutes: number;
  price: number;
  danisanBilgi: DanisanBilgi | null;
}

interface Props {
  randevular: RandevuOzet[];
}

type TabDeger = "tumu" | "yaklaşan" | "tamamlanan" | "iptal";

const TAB_ETIKETLER: { deger: TabDeger; label: string }[] = [
  { deger: "tumu", label: "Tümü" },
  { deger: "yaklaşan", label: "Yaklaşan" },
  { deger: "tamamlanan", label: "Tamamlanan" },
  { deger: "iptal", label: "İptal/Red" },
];

const DURUM_ETIKET: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
  rejected: "Reddedildi",
};

const SEANS_ETIKET: Record<string, string> = {
  bireysel: "Bireysel",
  asenkron: "Asenkron",
  grup: "Grup",
  cift_aile: "Çift/Aile",
  on_gorusme: "Ön Görüşme",
  supervizyon: "Süpervizyon",
};

function formatTarih(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")}.${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function filtrele(randevular: RandevuOzet[], tab: TabDeger): RandevuOzet[] {
  const simdi = new Date();
  switch (tab) {
    case "yaklaşan":
      return randevular.filter(
        (r) =>
          (r.status === "pending" || r.status === "confirmed") &&
          new Date(r.scheduled_at) >= simdi
      );
    case "tamamlanan":
      return randevular.filter((r) => r.status === "completed");
    case "iptal":
      return randevular.filter((r) =>
        ["cancelled", "rejected", "no_show"].includes(r.status)
      );
    default:
      return randevular;
  }
}

export default function RandevularimKlient({ randevular }: Props) {
  const reduced = useReducedMotion();
  const [aktifTab, setAktifTab] = useState<TabDeger>("tumu");

  const gosterilen = filtrele(randevular, aktifTab);

  const tabSayilar: Record<TabDeger, number> = {
    tumu: randevular.length,
    yaklaşan: filtrele(randevular, "yaklaşan").length,
    tamamlanan: filtrele(randevular, "tamamlanan").length,
    iptal: filtrele(randevular, "iptal").length,
  };

  return (
    <div className="p-6 max-w-3xl w-full">
      <div className="mb-5">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">
          Müşteri
        </div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">
          Randevularım
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#D4E4D8] dark:border-[#333] mb-4">
        {TAB_ETIKETLER.map(({ deger, label }) => (
          <button
            key={deger}
            onClick={() => setAktifTab(deger)}
            className={`text-[11px] font-bold px-4 py-2 border-b-2 transition-colors ${
              aktifTab === deger
                ? "border-[#325343] text-[#252625] dark:border-white dark:text-white"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
            }`}
          >
            {label}
            <span className="ml-1 text-[9px] text-[#4A4D4A]">
              ({tabSayilar[deger]})
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <AnimatePresence mode="wait">
        <motion.div
          key={aktifTab}
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? {} : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {gosterilen.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-10 text-center text-sm text-[#4A4D4A]">
              Bu kategoride randevu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2">
              {gosterilen.map((r, i) => {
                const danisanAdi = r.danisanBilgi
                  ? `${r.danisanBilgi.first_name ?? ""} ${r.danisanBilgi.last_name ?? ""}`.trim()
                  : "Danışman";
                return (
                  <motion.div
                    key={r.id}
                    initial={reduced ? {} : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: reduced ? 0 : 0.04 * i }}
                    className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-[#252625] dark:text-white mb-0.5">
                          {danisanAdi}
                        </div>
                        <div className="text-[11px] text-[#4A4D4A] mb-1">
                          {formatTarih(r.scheduled_at)} · {SEANS_ETIKET[r.session_type] ?? r.session_type} · {r.duration_minutes} dk
                        </div>
                        <div className="text-[11px] font-semibold text-[#252625] dark:text-white">
                          {r.price > 0 ? `${r.price} TL` : "Ücretsiz"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] font-bold uppercase border-[1.5px] border-[#325343] dark:border-white px-1.5 py-0.5 text-[#252625] dark:text-white">
                          {DURUM_ETIKET[r.status] ?? r.status}
                        </span>
                        <Link
                          href={`/panelim/randevularim/${r.id}`}
                          className="text-[11px] text-[#252625] underline dark:text-white"
                        >
                          Detay
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
