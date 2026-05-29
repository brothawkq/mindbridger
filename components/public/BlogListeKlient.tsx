"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";

export interface BlogYaziOzet {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  published_at: string | null;
  view_count: number;
  danisan_id: string;
  yazar_isim: string;
  yazar_slug: string;
}

interface BlogListeKlientProps {
  baslangicYazilar: BlogYaziOzet[];
  toplamSayfa: number;
  popülerTagler: string[];
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

export default function BlogListeKlient({
  baslangicYazilar,
  toplamSayfa: baslangicToplamSayfa,
  popülerTagler,
}: BlogListeKlientProps) {
  const reduced = useReducedMotion();
  const [yazilar, setYazilar] = useState<BlogYaziOzet[]>(baslangicYazilar);
  const [aramaQ, setAramaQ] = useState("");
  const [seciliTag, setSeciliTag] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(baslangicToplamSayfa);
  const [yukleniyor, setYukleniyor] = useState(false);
  const aramaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aramaYap = useCallback(
    async (q: string, tag: string | null, yeniSayfa: number) => {
      setYukleniyor(true);
      try {
        const params = new URLSearchParams({ sayfa: String(yeniSayfa) });
        if (q) params.set("q", q);
        if (tag) params.set("tag", tag);
        const res = await fetch(`/api/blog?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          yazilar: Omit<BlogYaziOzet, "yazar_isim" | "yazar_slug">[];
          sayfalama: { toplamSayfa: number };
        };
        // Yazar isimleri server-side olarak eklendi; API sadece id döndürür
        // Basit fallback: yazar_isim/slug olmadan listele
        setYazilar(
          json.yazilar.map((y) => ({
            ...y,
            yazar_isim: "",
            yazar_slug: "",
          }))
        );
        setToplamSayfa(json.sayfalama.toplamSayfa);
        setSayfa(yeniSayfa);
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  function handleArama(value: string) {
    setAramaQ(value);
    if (aramaTimer.current) clearTimeout(aramaTimer.current);
    aramaTimer.current = setTimeout(() => {
      void aramaYap(value, seciliTag, 1);
    }, 400);
  }

  function handleTag(tag: string | null) {
    setSeciliTag(tag);
    void aramaYap(aramaQ, tag, 1);
  }

  function handleSayfa(yeni: number) {
    void aramaYap(aramaQ, seciliTag, yeni);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filtreler ── */}
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={aramaQ}
          onChange={(e) => handleArama(e.target.value)}
          placeholder="Yazı ara..."
          className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#325343] dark:text-white text-[13px] px-3 py-2 focus:outline-none placeholder:text-[#BDBDBD]"
        />

        {popülerTagler.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTag(null)}
              className={`text-[11px] font-bold px-3 py-1 border-[1.5px] transition-colors ${
                seciliTag === null
                  ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#325343]"
                  : "border-[#E0E0E0] dark:border-[#333] text-[#BDBDBD] hover:border-[#325343] dark:hover:border-white hover:text-[#325343] dark:hover:text-white"
              }`}
            >
              Tümü
            </button>
            {popülerTagler.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTag(tag)}
                className={`text-[11px] font-bold px-3 py-1 border-[1.5px] transition-colors ${
                  seciliTag === tag
                    ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#325343]"
                    : "border-[#E0E0E0] dark:border-[#333] text-[#BDBDBD] hover:border-[#325343] dark:hover:border-white hover:text-[#325343] dark:hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Yazı Listesi ── */}
      {yukleniyor ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border-[1.5px] border-[#E0E0E0] dark:border-[#333] p-4 animate-pulse"
            >
              <div className="h-4 bg-[#E0E0E0] dark:bg-[#333] mb-2 w-3/4" />
              <div className="h-3 bg-[#E0E0E0] dark:bg-[#333] mb-1 w-full" />
              <div className="h-3 bg-[#E0E0E0] dark:bg-[#333] w-1/2" />
            </div>
          ))}
        </div>
      ) : yazilar.length === 0 ? (
        <div className="text-[13px] text-[#BDBDBD] py-16 text-center">
          {aramaQ || seciliTag
            ? "Arama kriterlerinize uygun yazı bulunamadı."
            : "Henüz yayınlanmış yazı yok."}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${aramaQ}-${seciliTag ?? ""}-${sayfa}`}
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {yazilar.map((yazi, i) => (
              <motion.div
                key={yazi.id}
                initial={reduced ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
              >
                <Link
                  href={`/blog/${yazi.slug}`}
                  className="block border-[1.5px] border-[#E0E0E0] dark:border-[#333] bg-white dark:bg-[#111] hover:border-[#325343] dark:hover:border-white transition-colors group"
                >
                  {yazi.cover_image_url && (
                    <div className="h-36 overflow-hidden bg-[#F5F7F5] dark:bg-[#1a1a1a] relative">
                      <Image
                        src={yazi.cover_image_url}
                        alt={yazi.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="group-hover:scale-[1.02] transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-[13px] font-bold text-[#325343] dark:text-white mb-1.5 leading-snug line-clamp-2">
                      {yazi.title}
                    </h2>
                    {yazi.excerpt && (
                      <p className="text-[11px] text-[#BDBDBD] mb-3 line-clamp-2 leading-relaxed">
                        {yazi.excerpt}
                      </p>
                    )}
                    {yazi.tags && yazi.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {yazi.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] border-[1.5px] border-[#E0E0E0] dark:border-[#333] px-1.5 py-0.5 text-[#BDBDBD]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#BDBDBD]">
                      <span>
                        {yazi.yazar_isim || "Danışman"}
                      </span>
                      <span>
                        {yazi.published_at ? formatTarih(yazi.published_at) : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Sayfalama ── */}
      {toplamSayfa > 1 && !yukleniyor && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleSayfa(sayfa - 1)}
            disabled={sayfa <= 1}
            className="text-[12px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#325343] dark:text-white px-3 py-1.5 disabled:border-dashed disabled:border-[#BDBDBD] disabled:text-[#BDBDBD]"
          >
            ← Önceki
          </button>
          <span className="text-[11px] text-[#BDBDBD]">
            {sayfa} / {toplamSayfa}
          </span>
          <button
            onClick={() => handleSayfa(sayfa + 1)}
            disabled={sayfa >= toplamSayfa}
            className="text-[12px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#325343] dark:text-white px-3 py-1.5 disabled:border-dashed disabled:border-[#BDBDBD] disabled:text-[#BDBDBD]"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
