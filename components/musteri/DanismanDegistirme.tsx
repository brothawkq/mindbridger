"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";

interface DanismanOneri {
  id: string;
  slug: string;
  title: string | null;
  specialties: string[] | null;
  price_individual: number | null;
  average_rating: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

type Adim = "idle" | "gerekce" | "yukleniyor" | "oneri" | "bitti";

export default function DanismanDegistirme({
  mevcutDanisanId,
}: {
  mevcutDanisanId?: string;
}) {
  const reduced = useReducedMotion();
  const [adim, setAdim] = useState<Adim>("idle");
  const [gerekce, setGerekce] = useState("");
  const [oneriler, setOneriler] = useState<DanismanOneri[]>([]);
  const [secilen, setSecilen] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function onerileriGetir() {
    if (gerekce.trim().length < 10) {
      setHata("Lütfen en az 10 karakter gerekçe yazın.");
      return;
    }
    setHata(null);
    setAdim("yukleniyor");

    try {
      const params = new URLSearchParams({ limit: "3" });
      const res = await fetch(`/api/danismanlar?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = (await res.json()) as {
        danismanlar: DanismanOneri[];
      };

      const liste = (json.danismanlar ?? []).filter(
        (d) => d.id !== mevcutDanisanId
      ).slice(0, 3);

      setOneriler(liste);
      setAdim(liste.length > 0 ? "oneri" : "idle");
      if (liste.length === 0) {
        setHata("Şu an uygun alternatif danışman bulunamadı.");
      }
    } catch {
      setHata("Öneriler yüklenirken bir hata oluştu.");
      setAdim("gerekce");
    }
  }

  return (
    <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
      <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3">
        Danışman Değiştirme
      </div>

      <AnimatePresence mode="wait">
        {adim === "idle" && (
          <motion.div
            key="idle"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-[12px] text-[#4A4D4A] mb-3">
              Mevcut danışmanınızdan memnun değil misiniz? Gerekçenizi belirtin,
              size 3 alternatif öneri sunalım.
            </p>
            <button
              onClick={() => setAdim("gerekce")}
              className="text-[12px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-4 py-2 hover:bg-[#325343] hover:text-white dark:hover:bg-white dark:hover:text-[#252625] transition-colors"
            >
              Danışman Değiştirmek İstiyorum
            </button>
          </motion.div>
        )}

        {(adim === "gerekce" || adim === "yukleniyor") && (
          <motion.div
            key="gerekce"
            initial={reduced ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            <p className="text-[12px] text-[#4A4D4A]">
              Neden danışman değiştirmek istiyorsunuz?
            </p>
            <textarea
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
              placeholder="Gerekçenizi yazın... (min. 10 karakter)"
              maxLength={500}
              rows={3}
              className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[12px] px-3 py-2 resize-none focus:outline-none placeholder:text-[#4A4D4A]"
            />
            {hata && (
              <span className="text-[11px] text-[#4A4D4A]">⚠ {hata}</span>
            )}
            <div className="flex gap-2">
              <button
                onClick={onerileriGetir}
                disabled={adim === "yukleniyor"}
                className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-4 py-2 disabled:opacity-50"
              >
                {adim === "yukleniyor" ? "Yükleniyor..." : "Öneri Al"}
              </button>
              <button
                onClick={() => { setAdim("idle"); setGerekce(""); setHata(null); }}
                className="text-[12px] text-[#4A4D4A] underline"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        )}

        {adim === "oneri" && (
          <motion.div
            key="oneri"
            initial={reduced ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            <p className="text-[11px] text-[#4A4D4A] mb-1">
              Geçmiş verileriniz korunur. Aşağıdaki danışmanlardan birini
              inceleyebilirsiniz:
            </p>
            {oneriler.map((d, i) => {
              const isim = [d.profiles?.first_name, d.profiles?.last_name]
                .filter(Boolean)
                .join(" ") || "Danışman";
              return (
                <motion.div
                  key={d.id}
                  initial={reduced ? {} : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.14, delay: i * 0.05 }}
                  className={`border-[1.5px] p-3 cursor-pointer transition-colors ${
                    secilen === d.id
                      ? "border-[#325343] dark:border-white bg-[#F5F7F5] dark:bg-[#1a1a1a]"
                      : "border-[#D4E4D8] dark:border-[#333] hover:border-[#325343] dark:hover:border-white"
                  }`}
                  onClick={() => setSecilen(d.id)}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                        {isim}
                      </div>
                      {d.title && (
                        <div className="text-[10px] text-[#4A4D4A]">{d.title}</div>
                      )}
                      {d.specialties && d.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.specialties.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] px-1.5 py-0.5 text-[#4A4D4A]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {d.average_rating > 0 && (
                        <div className="text-[11px] font-bold text-[#252625] dark:text-white">
                          ★ {d.average_rating.toFixed(1)}
                        </div>
                      )}
                      {d.price_individual !== null && (
                        <div className="text-[10px] text-[#4A4D4A]">
                          {d.price_individual.toLocaleString("tr-TR")} TL
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex gap-2 mt-1">
              {secilen && (
                <Link
                  href={`/danismanlar/${oneriler.find((d) => d.id === secilen)?.slug ?? ""}`}
                  className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-4 py-2"
                >
                  Profili İncele
                </Link>
              )}
              <button
                onClick={() => { setAdim("idle"); setOneriler([]); setSecilen(null); setGerekce(""); }}
                className="text-[12px] text-[#4A4D4A] underline"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
