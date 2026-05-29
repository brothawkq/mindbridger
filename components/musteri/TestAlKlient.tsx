"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type TestSoru = {
  id: string;
  text: string;
  options: { value: number; label: string }[];
};

export interface TestAlKlientProps {
  testId: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  sorular: TestSoru[];
}

type SonucData = {
  score: number;
  label: string | null;
  description: string | null;
  recommendation: string | null;
};

export default function TestAlKlient({
  testId,
  title,
  description,
  estimatedMinutes,
  sorular,
}: TestAlKlientProps) {
  const prefersReduced = useReducedMotion();
  const [basladi, setBasladi] = useState(false);
  const [mevcutIndex, setMevcutIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Record<string, number>>({});
  const [paylasimOnay, setPaylasimOnay] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<SonucData | null>(null);

  const mevcutSoru = sorular[mevcutIndex];
  const toplamSoru = sorular.length;
  const ilerlemePct =
    toplamSoru > 0 ? Math.round(((mevcutIndex + 1) / toplamSoru) * 100) : 0;
  const cevapVarildi = mevcutSoru
    ? cevaplar[mevcutSoru.id] !== undefined
    : false;
  const tumCevaplar = toplamSoru > 0 && Object.keys(cevaplar).length === toplamSoru;

  function secimiKaydet(soruId: string, value: number) {
    setCevaplar((prev) => ({ ...prev, [soruId]: value }));
  }

  function ileri() {
    if (mevcutIndex < toplamSoru - 1) {
      setMevcutIndex((i) => i + 1);
    }
  }

  function geri() {
    if (mevcutIndex > 0) {
      setMevcutIndex((i) => i - 1);
    }
  }

  async function handleGonder() {
    if (!tumCevaplar) {
      setHata("Lütfen tüm soruları cevaplayın.");
      return;
    }
    setYukleniyor(true);
    setHata(null);

    try {
      const res = await fetch("/api/testler/sonuc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: testId,
          answers: cevaplar,
          shared_with_danisan: paylasimOnay,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setHata(data.error ?? "Bir hata oluştu.");
        return;
      }

      const data = (await res.json()) as {
        sonuc: {
          score: number;
          label: string | null;
          description: string | null;
          recommendation: string | null;
        };
      };
      setSonuc(data.sonuc);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  // ── Result screen ──
  if (sonuc) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.25 }}
        className="px-6 py-8 max-w-xl mx-auto"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
          Test Tamamlandı
        </div>
        <div className="text-[20px] font-bold text-[#252625] dark:text-white mb-6">
          {title}
        </div>

        {/* Score card */}
        <div className="border-[1.5px] border-[#325343] dark:border-white p-5 mb-4">
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            Puan
          </div>
          <div className="text-[36px] font-bold text-[#252625] dark:text-white leading-none mb-1">
            {sonuc.score}
          </div>
          {sonuc.label && (
            <div className="text-[14px] font-bold text-[#252625] dark:text-white mt-2">
              {sonuc.label}
            </div>
          )}
        </div>

        {/* Description */}
        {sonuc.description && (
          <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4 mb-3 text-[13px] text-[#252625] dark:text-white leading-relaxed">
            {sonuc.description}
          </div>
        )}

        {/* Recommendation */}
        {sonuc.recommendation && (
          <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-4 mb-5">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1.5">
              Öneri
            </div>
            <p className="text-[12px] text-[#424242] dark:text-[#4A4D4A] leading-relaxed">
              {sonuc.recommendation}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setBasladi(false);
              setMevcutIndex(0);
              setCevaplar({});
              setSonuc(null);
            }}
            className="flex-1 border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white text-[12px] font-bold py-2.5 hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] transition-colors"
            style={{ fontFamily: "inherit" }}
          >
            Tekrar Al
          </button>
          <a
            href="/panelim/testler"
            className="flex-1 bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold py-2.5 text-center hover:bg-[#333] dark:hover:bg-[#D4E4D8] transition-colors"
          >
            Testlere Dön
          </a>
        </div>
      </motion.div>
    );
  }

  // ── Intro screen ──
  if (!basladi) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
        className="px-6 py-8 max-w-xl mx-auto"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
          Psikolojik Test
        </div>
        <div className="text-[20px] font-bold text-[#252625] dark:text-white mb-3">
          {title}
        </div>

        {description && (
          <p className="text-[13px] text-[#424242] dark:text-[#4A4D4A] leading-relaxed mb-5">
            {description}
          </p>
        )}

        <div className="flex gap-4 mb-6 text-[11px] text-[#4A4D4A]">
          <span>{toplamSoru} soru</span>
          {estimatedMinutes && <span>~{estimatedMinutes} dakika</span>}
        </div>

        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-4 mb-6">
          <p className="text-[11px] text-[#4A4D4A] leading-relaxed">
            Bu test klinik tanı koymaz. Sonuçlar yalnızca kendinizle ilgili
            farkındalık kazanmanıza yardımcı olmak içindir. Sonuçlarınızı
            danışmanınızla paylaşmak için kayıt sırasında onay verebilirsiniz.
          </p>
        </div>

        <button
          onClick={() => setBasladi(true)}
          className="w-full bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[14px] font-bold py-3 hover:bg-[#333] dark:hover:bg-[#D4E4D8] transition-colors"
          style={{ fontFamily: "inherit" }}
        >
          Teste Başla
        </button>
      </motion.div>
    );
  }

  // ── Test screen ──
  if (!mevcutSoru) {
    return (
      <div className="px-6 py-8 text-[13px] text-[#4A4D4A] text-center">
        Test sorusu bulunamadı.
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-xl mx-auto flex flex-col gap-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] text-[#4A4D4A] mb-1.5">
          <span>
            Soru {mevcutIndex + 1} / {toplamSoru}
          </span>
          <span>%{ilerlemePct}</span>
        </div>
        <div className="h-2 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
          <motion.div
            className="h-full bg-[#325343] dark:bg-white"
            animate={{ width: `${ilerlemePct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mevcutIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
        >
          <div className="text-[15px] font-bold text-[#252625] dark:text-white mb-4 leading-snug">
            {mevcutSoru.text}
          </div>

          <div className="flex flex-col gap-2">
            {mevcutSoru.options.map((opt) => {
              const secili = cevaplar[mevcutSoru.id] === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  onClick={() => secimiKaydet(mevcutSoru.id, opt.value)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.997 }}
                  className={`w-full text-left px-4 py-3 text-[13px] border-[1.5px] transition-colors cursor-pointer ${
                    secili
                      ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#252625] font-bold"
                      : "border-[#D4E4D8] dark:border-[#333] text-[#252625] dark:text-white bg-white dark:bg-[#111] hover:border-[#325343] dark:hover:border-white"
                  }`}
                  style={{ fontFamily: "inherit" }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#D4E4D8] dark:border-[#333]">
        <button
          onClick={geri}
          disabled={mevcutIndex === 0}
          className="px-5 py-2 border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white text-[12px] font-bold disabled:border-dashed disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] cursor-pointer disabled:cursor-default transition-colors"
          style={{ fontFamily: "inherit" }}
        >
          ← Önceki
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1">
          {sorular.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setMevcutIndex(i)}
              className={`w-2 h-2 transition-colors ${
                i === mevcutIndex
                  ? "bg-[#325343] dark:bg-white"
                  : cevaplar[s.id] !== undefined
                  ? "bg-[#BDBDBD]"
                  : "bg-[#D4E4D8] dark:bg-[#333]"
              }`}
              aria-label={`Soru ${i + 1}`}
            />
          ))}
        </div>

        {mevcutIndex < toplamSoru - 1 ? (
          <button
            onClick={ileri}
            disabled={!cevapVarildi}
            className="px-5 py-2 bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold disabled:bg-[#BDBDBD] cursor-pointer disabled:cursor-default transition-colors"
            style={{ fontFamily: "inherit" }}
          >
            Sonraki →
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            {tumCevaplar && (
              <label className="flex items-center gap-2 text-[10px] text-[#4A4D4A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={paylasimOnay}
                  onChange={(e) => setPaylasimOnay(e.target.checked)}
                  className="accent-[#325343]"
                />
                Danışmanımla paylaş
              </label>
            )}
            <button
              onClick={handleGonder}
              disabled={yukleniyor || !tumCevaplar}
              className="px-5 py-2 bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold disabled:bg-[#BDBDBD] cursor-pointer disabled:cursor-default transition-colors"
              style={{ fontFamily: "inherit" }}
            >
              {yukleniyor ? "Gönderiliyor..." : "Tamamla"}
            </button>
          </div>
        )}
      </div>

      {hata && (
        <div className="text-[11px] text-red-600 dark:text-red-400">
          ⚠ {hata}
        </div>
      )}
    </div>
  );
}
