"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface KonusmaOzet {
  id: string;
  type: "lojistik" | "asenkron_seans";
  last_message_at: string | null;
  danisanId: string;
  danisanIsim: string;
  okunmamisSayi: number;
  sonMesaj: string | null;
}

interface Props {
  konusmalar: KonusmaOzet[];
}

const TIP_ETIKET: Record<string, string> = {
  lojistik: "Lojistik",
  asenkron_seans: "Asenkron Seans",
};

function formatZaman(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const bugun = now.toISOString().substring(0, 10);
  const tarih = d.toISOString().substring(0, 10);
  if (tarih === bugun) {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export default function MusteriMesajlarKlient({ konusmalar }: Props) {
  const prefersReduced = useReducedMotion();
  const [aramaMetni, setAramaMetni] = useState("");
  const [tipFiltre, setTipFiltre] = useState<"tumu" | "lojistik" | "asenkron_seans">("tumu");

  const filtreliListe = useMemo(() => {
    let liste = [...konusmalar];
    if (aramaMetni.trim()) {
      const q = aramaMetni.toLowerCase();
      liste = liste.filter((k) => k.danisanIsim.toLowerCase().includes(q));
    }
    if (tipFiltre !== "tumu") {
      liste = liste.filter((k) => k.type === tipFiltre);
    }
    return liste;
  }, [konusmalar, aramaMetni, tipFiltre]);

  const toplamOkunmamis = konusmalar.reduce((s, k) => s + k.okunmamisSayi, 0);

  return (
    <div className="p-6 max-w-3xl w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">
            Müşteri
          </div>
          <h1 className="text-base font-bold text-[#252625] dark:text-white">Mesajlar</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">Danışmanlarınızla konuşmalar</p>
        </div>
        {toplamOkunmamis > 0 && (
          <div className="bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[11px] font-bold px-2.5 py-1">
            {toplamOkunmamis} okunmamış
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="Danışman ara…"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-[9px] w-48 outline-none"
        />
        <div className="flex gap-1">
          {(["tumu", "lojistik", "asenkron_seans"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipFiltre(t)}
              className={`text-[10px] font-bold uppercase tracking-[0.8px] px-2 py-1.5 transition-colors ${
                tipFiltre === t
                  ? "bg-[#325343] dark:bg-white text-white dark:text-[#252625]"
                  : "border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#252625] dark:text-white hover:border-[#325343]"
              }`}
            >
              {t === "tumu" ? "Tümü" : TIP_ETIKET[t]}
            </button>
          ))}
        </div>
      </div>

      {filtreliListe.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-12 text-center text-[#4A4D4A] text-[13px]">
          {konusmalar.length === 0
            ? "Henüz hiç konuşma yok."
            : "Arama sonucu bulunamadı."}
        </div>
      ) : (
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
          <AnimatePresence initial={false}>
            {filtreliListe.map((k, i) => (
              <motion.div
                key={k.id}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.15, delay: prefersReduced ? 0 : i * 0.04 }}
              >
                <Link
                  href={`/panelim/mesajlar/${k.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors group"
                >
                  <div className="w-9 h-9 shrink-0 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[13px] font-bold text-[#252625] dark:text-white relative">
                    {k.danisanIsim.charAt(0).toUpperCase()}
                    {k.okunmamisSayi > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[8px] font-bold flex items-center justify-center">
                        {k.okunmamisSayi > 9 ? "9+" : k.okunmamisSayi}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[13px] truncate ${
                          k.okunmamisSayi > 0
                            ? "font-bold text-[#252625] dark:text-white"
                            : "text-[#252625] dark:text-white"
                        }`}
                      >
                        {k.danisanIsim}
                      </span>
                      <span className="text-[10px] text-[#4A4D4A] shrink-0">
                        {k.last_message_at ? formatZaman(k.last_message_at) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] truncate flex-1 ${
                          k.okunmamisSayi > 0
                            ? "text-[#252625] dark:text-white"
                            : "text-[#4A4D4A]"
                        }`}
                      >
                        {k.sonMesaj ?? "Henüz mesaj yok"}
                      </span>
                      <span className="text-[9px] border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A] px-1.5 py-0.5 shrink-0">
                        {TIP_ETIKET[k.type]}
                      </span>
                    </div>
                  </div>
                  <div className="text-[#4A4D4A] group-hover:text-[#252625] dark:group-hover:text-white transition-colors shrink-0">
                    →
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
