"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SeansTipiSec from "./SeansTipiSec";
import TarihSaatSec from "./TarihSaatSec";
import PaketSec from "./PaketSec";
import OdemeAdimi from "./OdemeAdimi";

// ─── Ortak tipler (page.tsx tarafından import edilir) ────────────

export type SeansTipi =
  | "bireysel"
  | "asenkron"
  | "on_gorusme"
  | "cift_aile"
  | "supervizyon";

export interface DanisanBilgi {
  id: string;
  slug: string;
  title: string | null;
  price_individual: number | null;
  price_async: number | null;
  session_duration: number | null;
  is_online: boolean | null;
  is_in_person: boolean | null;
  is_supervisor: boolean | null;
  intro_session_enabled: boolean | null;
  intro_session_duration: number | null;
  sliding_scale: boolean | null;
  sliding_scale_price: number | null;
  ad: string;
  avatarUrl: string | null;
}

export interface PaketBilgi {
  id: string;
  name: string;
  session_count: number | null;
  price: number | null;
  discount_percent: number | null;
  validity_days: number | null;
}

export interface WizardState {
  seansTipi: SeansTipi | null;
  tarih: string | null;     // "YYYY-MM-DD"
  saat: string | null;      // "HH:MM"
  tekrarlayan: boolean;
  paketSecim: "tekil" | string; // "tekil" veya paket id
  fiyat: number;
}

// ─── Adım etiketleri ─────────────────────────────────────────────

const ADIMLAR = ["Seans Türü", "Tarih / Saat", "Paket / Tekil", "Ödeme"] as const;

// ─── Ana bileşen ──────────────────────────────────────────────────

interface Props {
  danisan: DanisanBilgi;
  paketler: PaketBilgi[];
}

export default function RandevuSihirbazi({ danisan, paketler }: Props) {
  const prefersReduced = useReducedMotion();
  const [adim, setAdim] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<WizardState>({
    seansTipi: null,
    tarih: null,
    saat: null,
    tekrarlayan: false,
    paketSecim: "tekil",
    fiyat: danisan.price_individual ?? 0,
  });

  function ileri() {
    setAdim((a) => (Math.min(a + 1, 4) as 1 | 2 | 3 | 4));
  }
  function geri() {
    setAdim((a) => (Math.max(a - 1, 1) as 1 | 2 | 3 | 4));
  }

  const adimIcerigi: Record<1 | 2 | 3 | 4, React.ReactNode> = {
    1: <SeansTipiSec danisan={danisan} state={state} setState={setState} onIleri={ileri} />,
    2: <TarihSaatSec danisan={danisan} state={state} setState={setState} onIleri={ileri} onGeri={geri} />,
    3: <PaketSec danisan={danisan} paketler={paketler} state={state} setState={setState} onIleri={ileri} onGeri={geri} />,
    4: <OdemeAdimi danisan={danisan} state={state} onGeri={geri} />,
  };

  const variants = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: -8 },
      };

  return (
    <div className="max-w-[900px] mx-auto border-[1.5px] border-[#325343] bg-white">
      {/* Danışman özet çubuğu */}
      <DanisanBar danisan={danisan} fiyat={state.fiyat} />

      {/* Adım göstergesi */}
      <StepIndicator adim={adim} />

      {/* İçerik */}
      <AnimatePresence mode="wait">
        <motion.div
          key={adim}
          {...variants}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {adimIcerigi[adim]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Danışman özet çubuğu ─────────────────────────────────────────

function DanisanBar({ danisan, fiyat }: { danisan: DanisanBilgi; fiyat: number }) {
  return (
    <div className="bg-[#F5F7F5] border-b border-[#D4E4D8] px-6 py-2.5 flex items-center gap-3">
      <div className="w-9 h-9 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD] flex items-center justify-center text-[9px] text-[#4A4D4A] shrink-0 overflow-hidden relative">
        {danisan.avatarUrl ? (
          <Image
            src={danisan.avatarUrl}
            alt=""
            fill
            sizes="36px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          "Foto"
        )}
      </div>
      <div>
        <div className="text-[13px] font-bold text-[#252625]">{danisan.ad}</div>
        <div className="text-[11px] text-[#4A4D4A]">
          {danisan.title ?? "Danışman"}
          {danisan.is_online ? " · Online Seans" : ""}
        </div>
      </div>
      <div className="ml-auto text-[14px] font-bold text-[#252625]">
        {fiyat > 0 ? `${fiyat}₺` : "Ücretsiz"}
        <span className="text-[11px] font-normal text-[#4A4D4A]"> / seans</span>
      </div>
    </div>
  );
}

// ─── Adım göstergesi ──────────────────────────────────────────────

function StepIndicator({ adim }: { adim: 1 | 2 | 3 | 4 }) {
  return (
    <div className="px-8 pt-5 pb-4 border-b border-[#D4E4D8] flex items-center">
      {ADIMLAR.map((baslik, i) => {
        const num = (i + 1) as 1 | 2 | 3 | 4;
        const done   = num < adim;
        const active = num === adim;
        const isLast = num === 4;

        return (
          <div key={num} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            {/* Daire + etiket */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[12px] font-bold shrink-0"
                style={{
                  borderColor: done || active ? "#252625" : "#4A4D4A",
                  background:  done || active ? "#252625" : "#FFFFFF",
                  color:       done || active ? "#FFFFFF" : "#4A4D4A",
                  boxShadow:   active ? "0 0 0 3px #E0E0E0" : "none",
                }}
              >
                {done ? "✓" : num}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[9px] font-bold tracking-[0.5px] uppercase"
                  style={{ color: done || active ? "#252625" : "#4A4D4A" }}
                >
                  Adım {num}
                </span>
                <span
                  className="text-[12px]"
                  style={{
                    color:      done || active ? "#252625" : "#4A4D4A",
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {baslik}
                </span>
              </div>
            </div>
            {/* Bağlantı çizgisi */}
            {!isLast && (
              <div
                className="flex-1 h-[1.5px] mx-2"
                style={{ background: done ? "#252625" : "#D4E4D8" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
