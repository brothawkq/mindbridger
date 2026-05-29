"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface DanisanOzet {
  id: string;
  isim: string;
  avatarUrl: string | null;
  telefon: string | null;
  churnRiskScore: number;
  kayitTarihi: string;
  toplamSeans: number;
  tamamlananSeans: number;
  sonRandevu: string | null;
  toplamGelir: number;
}

interface Props {
  danisanlar: DanisanOzet[];
}

function formatTarih(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

function ChurnBadge({ score }: { score: number }) {
  if (score < 40)
    return (
      <span className="text-[9px] border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A] px-1.5 py-0.5">
        DÜŞÜK
      </span>
    );
  if (score < 70)
    return (
      <span className="text-[9px] border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-1.5 py-0.5">
        ORTA
      </span>
    );
  return (
    <span className="text-[9px] border-[1.5px] border-[#325343] dark:border-[#aaa] text-[#252625] dark:text-white font-bold px-1.5 py-0.5">
      YÜKSEK
    </span>
  );
}

type Siralama = "isim" | "sonRandevu" | "tamamlananSeans" | "churn";

export default function DanisanlarKlient({ danisanlar }: Props) {
  const prefersReduced = useReducedMotion();
  const [aramaMetni, setAramaMetni] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("sonRandevu");

  const filtreliListe = useMemo(() => {
    let liste = [...danisanlar];

    if (aramaMetni.trim()) {
      const q = aramaMetni.toLowerCase();
      liste = liste.filter(
        (d) =>
          d.isim.toLowerCase().includes(q) ||
          (d.telefon ?? "").includes(q)
      );
    }

    liste.sort((a, b) => {
      switch (siralama) {
        case "isim":
          return a.isim.localeCompare(b.isim, "tr");
        case "sonRandevu":
          return (b.sonRandevu ?? "").localeCompare(a.sonRandevu ?? "");
        case "tamamlananSeans":
          return b.tamamlananSeans - a.tamamlananSeans;
        case "churn":
          return b.churnRiskScore - a.churnRiskScore;
        default:
          return 0;
      }
    });

    return liste;
  }, [danisanlar, aramaMetni, siralama]);

  const istatistik = useMemo(() => ({
    toplamDanisan: danisanlar.length,
    yuksekChurn: danisanlar.filter((d) => d.churnRiskScore >= 70).length,
    toplamGelir: danisanlar.reduce((s, d) => s + d.toplamGelir, 0),
  }), [danisanlar]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-[16px] font-bold text-[#252625] dark:text-white">
          Danışanlarım
        </h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">
          Şimdiye kadar görüştüğünüz tüm danışanlar
        </p>
      </div>

      {/* İstatistik Şeridi */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { etiket: "TOPLAM DANIŞAN", deger: istatistik.toplamDanisan },
          { etiket: "YÜKSEK CHURN RİSKİ", deger: istatistik.yuksekChurn },
          {
            etiket: "TOPLAM GELİR",
            deger: `₺${istatistik.toplamGelir.toLocaleString("tr-TR")}`,
          },
        ].map(({ etiket, deger }) => (
          <div
            key={etiket}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              {etiket}
            </div>
            <div className="text-[20px] font-bold text-[#252625] dark:text-white">
              {deger}
            </div>
          </div>
        ))}
      </div>

      {/* Filtre Araç Çubuğu */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="İsim veya telefon ara..."
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-[9px] w-52 outline-none"
        />

        <div className="ml-auto flex items-center gap-1">
          {(
            [
              ["sonRandevu", "Son Randevu"],
              ["isim", "İsim"],
              ["tamamlananSeans", "Seans"],
              ["churn", "Churn Risk"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSiralama(key)}
              className={`text-[10px] font-bold uppercase tracking-[0.8px] px-2 py-1.5 transition-colors ${
                siralama === key
                  ? "bg-[#A6DE9B] text-[#325343]"
                  : "border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#252625] dark:text-white hover:border-[#325343]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuç Sayısı */}
      <div className="text-[10px] text-[#4A4D4A] mb-2">
        {filtreliListe.length} danışan gösteriliyor
      </div>

      {/* Liste */}
      {filtreliListe.length === 0 ? (
        <div className="border border-dashed border-[#D4E4D8] dark:border-[#333] p-12 text-center text-[#4A4D4A] text-[13px]">
          {danisanlar.length === 0
            ? "Henüz hiç danışanınız yok."
            : "Arama sonucu bulunamadı."}
        </div>
      ) : (
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
          {/* Tablo Başlığı */}
          <div className="grid grid-cols-[1fr_100px_80px_100px_80px_36px] bg-[#F5F7F5] dark:bg-[#111] border-b border-[#D4E4D8] dark:border-[#333] px-4 py-2">
            {[
              "DANIŞAN",
              "SON RANDEVU",
              "SEANS",
              "GELİR",
              "CHURN",
              "",
            ].map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625] dark:text-white"
              >
                {h}
              </span>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {filtreliListe.map((d, i) => (
              <motion.div
                key={d.id}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.15, delay: prefersReduced ? 0 : i * 0.03 }}
              >
                <Link
                  href={`/danisan/danisanlar/${d.id}`}
                  className="grid grid-cols-[1fr_100px_80px_100px_80px_36px] items-center px-4 py-3 border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors group"
                >
                  {/* İsim */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[10px] font-bold text-[#252625] dark:text-white">
                      {d.isim.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] text-[#252625] dark:text-white truncate">
                        {d.isim}
                      </div>
                      {d.telefon && (
                        <div className="text-[10px] text-[#4A4D4A] truncate">
                          {d.telefon}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Son Randevu */}
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    {d.sonRandevu ? formatTarih(d.sonRandevu) : "—"}
                  </div>

                  {/* Seans */}
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    {d.tamamlananSeans}
                    <span className="text-[10px] text-[#4A4D4A] ml-0.5">
                      /{d.toplamSeans}
                    </span>
                  </div>

                  {/* Gelir */}
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    ₺{d.toplamGelir.toLocaleString("tr-TR")}
                  </div>

                  {/* Churn */}
                  <div>
                    <ChurnBadge score={d.churnRiskScore} />
                  </div>

                  {/* Ok */}
                  <div className="text-[#4A4D4A] group-hover:text-[#252625] dark:group-hover:text-white transition-colors text-right">
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
