"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { TestSoru, ScoringLogic, ResultRange } from "@/lib/testler/scoring";
import { hesaplaSkoru, sonucBul } from "@/lib/testler/scoring";

interface PublikTestAlKlientProps {
  testId: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  sorular: TestSoru[];
  scoringLogic: ScoringLogic;
  resultRanges: ResultRange[];
}

type Adim = "intro" | "test" | "sonuc";

export default function PublikTestAlKlient({
  title,
  description,
  estimatedMinutes,
  sorular,
  scoringLogic,
  resultRanges,
}: PublikTestAlKlientProps) {
  const reduced = useReducedMotion();
  const [adim, setAdim] = useState<Adim>("intro");
  const [soruIndex, setSoruIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Record<string, number>>({});
  const [sonuc, setSonuc] = useState<{
    score: number;
    range: ResultRange | null;
  } | null>(null);

  const mevcutSoru = sorular[soruIndex];
  const ilerlemePct = sorular.length > 0
    ? Math.round((soruIndex / sorular.length) * 100)
    : 0;
  const tumunuCevapladi = sorular.every((s) => cevaplar[s.id] !== undefined);

  function secimYap(soruId: string, value: number) {
    const yeniCevaplar = { ...cevaplar, [soruId]: value };
    setCevaplar(yeniCevaplar);

    if (soruIndex < sorular.length - 1) {
      setTimeout(() => setSoruIndex((i) => i + 1), 160);
    }
  }

  function tamamla() {
    const score = hesaplaSkoru(cevaplar, scoringLogic);
    const range = sonucBul(score, resultRanges);
    setSonuc({ score, range });
    setAdim("sonuc");
  }

  function yenidenBas() {
    setAdim("intro");
    setSoruIndex(0);
    setCevaplar({});
    setSonuc(null);
  }

  if (sorular.length === 0) {
    return (
      <div className="text-[13px] text-[#BDBDBD] py-10 text-center">
        Bu test henüz sorularla doldurulmamış.
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* ── Intro ── */}
      {adim === "intro" && (
        <motion.div
          key="intro"
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="border-[1.5px] border-[#325343] dark:border-white p-6 max-w-xl mx-auto"
        >
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#BDBDBD] mb-3">
            Psikolojik Test
          </div>
          <h2 className="text-[18px] font-bold text-[#325343] dark:text-white mb-3">
            {title}
          </h2>
          {description && (
            <p className="text-[13px] text-[#BDBDBD] leading-relaxed mb-4">
              {description}
            </p>
          )}
          <div className="flex gap-4 text-[11px] text-[#BDBDBD] mb-6">
            <span>{sorular.length} soru</span>
            {estimatedMinutes && <span>≈ {estimatedMinutes} dakika</span>}
          </div>
          <p className="text-[11px] text-[#BDBDBD] mb-4 border-l-[2px] border-[#E0E0E0] pl-3">
            Bu test bilgi amaçlıdır. Profesyonel psikolojik değerlendirmenin
            yerini tutmaz. Sonuçlarınızı bir uzmanla paylaşmanızı öneririz.
          </p>
          <button
            onClick={() => setAdim("test")}
            className="bg-[#325343] dark:bg-white text-white dark:text-[#325343] text-[13px] font-bold px-6 py-2.5 hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
          >
            Teste Başla
          </button>
        </motion.div>
      )}

      {/* ── Test ── */}
      {adim === "test" && mevcutSoru && (
        <motion.div
          key="test"
          initial={reduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="max-w-xl mx-auto"
        >
          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] text-[#BDBDBD] mb-1.5">
              <span>{soruIndex + 1} / {sorular.length}</span>
              <span>{ilerlemePct}%</span>
            </div>
            <div className="h-2 bg-[#E0E0E0] dark:bg-[#333] border-[1.5px] border-[#BDBDBD]">
              <motion.div
                className="h-full bg-[#325343] dark:bg-white"
                animate={{ width: `${ilerlemePct}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            {/* Dot navigation */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {sorular.map((s, i) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 transition-colors ${
                    i === soruIndex
                      ? "bg-[#325343] dark:bg-white"
                      : cevaplar[s.id] !== undefined
                      ? "bg-[#BDBDBD]"
                      : "bg-[#E0E0E0] dark:bg-[#333]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mevcutSoru.id}
              initial={reduced ? {} : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="border-[1.5px] border-[#E0E0E0] dark:border-[#333] bg-white dark:bg-[#111] p-5"
            >
              <p className="text-[14px] font-semibold text-[#325343] dark:text-white leading-snug mb-4">
                {mevcutSoru.text}
              </p>
              <div className="flex flex-col gap-2">
                {mevcutSoru.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => secimYap(mevcutSoru.id, opt.value)}
                    className={`text-left text-[13px] px-4 py-2.5 border-[1.5px] transition-colors ${
                      cevaplar[mevcutSoru.id] === opt.value
                        ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#325343] font-bold"
                        : "border-[#E0E0E0] dark:border-[#333] text-[#325343] dark:text-white hover:border-[#325343] dark:hover:border-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-4">
            {soruIndex > 0 && (
              <button
                onClick={() => setSoruIndex((i) => i - 1)}
                className="text-[12px] text-[#BDBDBD] border-[1.5px] border-dashed border-[#BDBDBD] px-3 py-1.5 hover:border-[#325343] hover:text-[#325343] dark:hover:border-white dark:hover:text-white transition-colors"
              >
                ← Geri
              </button>
            )}
            {soruIndex < sorular.length - 1 ? (
              <button
                onClick={() => setSoruIndex((i) => i + 1)}
                disabled={cevaplar[mevcutSoru.id] === undefined}
                className="text-[12px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#325343] dark:text-white px-4 py-1.5 disabled:border-dashed disabled:border-[#BDBDBD] disabled:text-[#BDBDBD]"
              >
                Sonraki →
              </button>
            ) : (
              <button
                onClick={tamamla}
                disabled={!tumunuCevapladi}
                className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#325343] px-5 py-1.5 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-40"
              >
                Sonucu Gör
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Sonuç ── */}
      {adim === "sonuc" && sonuc && (
        <motion.div
          key="sonuc"
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-xl mx-auto flex flex-col gap-4"
        >
          {/* Score card */}
          <div className="border-[1.5px] border-[#325343] dark:border-white bg-[#325343] dark:bg-white p-6">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-white dark:text-[#325343] opacity-60 mb-2">
              Sonucunuz
            </div>
            <div className="text-[36px] font-bold text-white dark:text-[#325343] leading-none mb-1">
              {sonuc.score}
            </div>
            {sonuc.range && (
              <div className="text-[15px] font-bold text-white dark:text-[#325343] mt-2">
                {sonuc.range.label}
              </div>
            )}
          </div>

          {sonuc.range?.description && (
            <div className="border-[1.5px] border-[#E0E0E0] dark:border-[#333] bg-white dark:bg-[#111] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-2">
                Değerlendirme
              </div>
              <p className="text-[13px] text-[#325343] dark:text-white leading-relaxed">
                {sonuc.range.description}
              </p>
            </div>
          )}

          {sonuc.range?.recommendation && (
            <div className="border-[1.5px] border-[#E0E0E0] dark:border-[#333] bg-white dark:bg-[#111] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-2">
                Öneri
              </div>
              <p className="text-[13px] text-[#325343] dark:text-white leading-relaxed">
                {sonuc.range.recommendation}
              </p>
            </div>
          )}

          {/* CTA — kayıt / danışman bul */}
          <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-4 flex flex-col gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD]">
              Sonraki Adım
            </div>
            <p className="text-[12px] text-[#BDBDBD] leading-relaxed">
              Sonuçlarınızı bir uzmanla paylaşın. Üye olursanız geçmiş test
              sonuçlarınız kaydedilir ve danışmanınızla paylaşabilirsiniz.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/danismanlar"
                className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#325343] px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
              >
                Danışman Bul
              </Link>
              <Link
                href="/kayit"
                className="text-[12px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#325343] dark:text-white px-4 py-2"
              >
                Üye Ol — Sonucu Kaydet
              </Link>
            </div>
          </div>

          <button
            onClick={yenidenBas}
            className="text-[12px] text-[#BDBDBD] underline text-left"
          >
            Testi Tekrar Al
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
