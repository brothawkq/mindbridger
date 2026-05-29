"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { DanismanKarti, type DanismanKartiVeri } from "@/components/public/DanismanKarti";

type SiralaTip = "puan" | "fiyat_artan" | "fiyat_azalan";
type SeansTip = "tumu" | "online" | "yuz_yuze";

interface Props {
  baslangicDanismanlar: DanismanKartiVeri[];
  baslangicToplam: number;
}

const SIRALAMA_ETIKETLER: { deger: SiralaTip; label: string }[] = [
  { deger: "puan", label: "Puana Göre" },
  { deger: "fiyat_artan", label: "Fiyat ↑" },
  { deger: "fiyat_azalan", label: "Fiyat ↓" },
];

export default function DanismanBulKlient({
  baslangicDanismanlar,
  baslangicToplam,
}: Props) {
  const reduced = useReducedMotion();

  const [danismanlar, setDanismanlar] = useState<DanismanKartiVeri[]>(baslangicDanismanlar);
  const [toplam, setToplam] = useState(baslangicToplam);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [q, setQ] = useState("");
  const [seansTip, setSeansTip] = useState<SeansTip>("tumu");
  const [siralama, setSiralama] = useState<SiralaTip>("puan");
  const [maxFiyat, setMaxFiyat] = useState("");

  const aramaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDanismanlar = useCallback(
    async (
      aramaTerimi: string,
      tip: SeansTip,
      sir: SiralaTip,
      fiyat: string
    ) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setYukleniyor(true);
      try {
        const params = new URLSearchParams();
        if (aramaTerimi) params.set("q", aramaTerimi);
        if (tip === "online") params.set("online", "true");
        if (tip === "yuz_yuze") params.set("yuz_yuze", "true");
        if (sir !== "puan") params.set("siralama", sir);
        if (fiyat) params.set("max_fiyat", fiyat);
        params.set("limit", "24");

        const res = await fetch(`/api/danismanlar?${params}`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          danismanlar: DanismanKartiVeri[];
          toplam: number;
        };
        setDanismanlar(json.danismanlar ?? []);
        setToplam(json.toplam ?? 0);
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") {
          setDanismanlar([]);
        }
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  useEffect(() => {
    if (aramaRef.current) clearTimeout(aramaRef.current);
    aramaRef.current = setTimeout(() => {
      void fetchDanismanlar(q, seansTip, siralama, maxFiyat);
    }, 400);
    return () => {
      if (aramaRef.current) clearTimeout(aramaRef.current);
      // DEN-22: unmount'ta in-flight isteği iptal et; aksi hâlde unmount sonrası setState çağrılır
      abortRef.current?.abort();
    };
  }, [q, seansTip, siralama, maxFiyat, fetchDanismanlar]);

  return (
    <div className="p-6 max-w-4xl w-full">
      <div className="mb-5">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">
          Müşteri
        </div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">
          Danışman Bul
        </h1>
      </div>

      {/* Filtre Çubuğu */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="İsim, uzmanlık veya yaklaşım ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[180px] border-[1.5px] border-[#325343] dark:border-white px-3 py-1.5 text-sm bg-white dark:bg-[#111] dark:text-white placeholder:text-[#4A4D4A]"
        />

        <div className="flex border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
          {(
            [
              { deger: "tumu", label: "Tümü" },
              { deger: "online", label: "Online" },
              { deger: "yuz_yuze", label: "Yüz Yüze" },
            ] as { deger: SeansTip; label: string }[]
          ).map(({ deger, label }) => (
            <button
              key={deger}
              onClick={() => setSeansTip(deger)}
              className={`text-[11px] font-bold px-3 py-1.5 transition-colors ${
                seansTip === deger
                  ? "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]"
                  : "bg-white dark:bg-[#1a1a1a] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={siralama}
          onChange={(e) => setSiralama(e.target.value as SiralaTip)}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] px-2 py-1.5 text-[11px] bg-white dark:bg-[#1a1a1a] dark:text-white"
        >
          {SIRALAMA_ETIKETLER.map(({ deger, label }) => (
            <option key={deger} value={deger}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Max TL"
          value={maxFiyat}
          onChange={(e) => setMaxFiyat(e.target.value)}
          className="w-[80px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] px-2 py-1.5 text-[11px] bg-white dark:bg-[#1a1a1a] dark:text-white placeholder:text-[#4A4D4A]"
        />
      </div>

      {/* Sonuç Özeti */}
      <div className="text-[11px] text-[#4A4D4A] mb-3">
        {yukleniyor ? "Aranıyor…" : `${toplam} danışman bulundu`}
      </div>

      {/* Danışman Listesi */}
      <AnimatePresence mode="wait">
        {yukleniyor ? (
          <motion.div
            key="loading"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3 h-[180px] animate-pulse"
              />
            ))}
          </motion.div>
        ) : danismanlar.length === 0 ? (
          <motion.div
            key="empty"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-[1.5px] border-dashed border-[#BDBDBD] p-10 text-center text-sm text-[#4A4D4A]"
          >
            Arama kriterlerinize uygun danışman bulunamadı.
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {danismanlar.map((d, i) => (
              <DanismanKarti key={d.id} danisan={d} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
