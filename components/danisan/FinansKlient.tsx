"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Donem = "hafta" | "ay" | "3ay";

interface Seans {
  odemeId: string;
  tarih: string;
  musteriBasHarfler: string;
  sessionType: string;
  brutUcret: number;
  komisyon: number;
  netKazanc: number;
  durum: string;
}

interface FinansVeri {
  kpi: {
    brutGelir: number;
    komisyon: number;
    netKazanc: number;
    seansAdedi: number;
    ortalamaFiyat: number;
    komisyonOrani: number;
    trend: number | null;
  };
  sonrakiOdeme: { tarih: string; tutar: number; durum: string } | null;
  grafik: { ay: string; net: number }[];
  seanslar: Seans[];
  ozet: { toplamBrut: number; toplamKomisyon: number; toplamNet: number };
  sayfalama: {
    sayfa: number;
    toplamSayfa: number;
    toplamSeans: number;
    sayfaBoyutu: number;
  };
}

interface Props {
  baslangicVeri: FinansVeri;
  baslangicDonem: Donem;
}

const DONEM_ETIKETLERI: Record<Donem, string> = {
  hafta: "Bu Hafta",
  ay: "Bu Ay",
  "3ay": "Son 3 Ay",
};

function formatTL(sayi: number): string {
  return `₺${sayi.toLocaleString("tr-TR")}`;
}

function formatTarih(iso: string): string {
  if (!iso) return "—";
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  const AYLAR = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()] ?? ""} ${d.getUTCFullYear()}, ${String(
    d.getUTCHours()
  ).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatSonrakiOdemeTarih(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const GUNLER = [
    "Pazar", "Pazartesi", "Salı", "Çarşamba",
    "Perşembe", "Cuma", "Cumartesi",
  ];
  const AYLAR = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];
  return `${GUNLER[d.getDay()] ?? ""}, ${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

function sessionTypeTr(t: string): { label: string; isOnline: boolean } {
  const lower = t.toLowerCase();
  if (lower.includes("online") || lower.includes("video"))
    return { label: "Online", isOnline: true };
  if (
    lower.includes("yuzyuze") ||
    lower.includes("yuz_yuze") ||
    lower.includes("yüzyüze")
  )
    return { label: "Yüz Yüze", isOnline: false };
  if (lower.includes("asenkron")) return { label: "Asenkron", isOnline: false };
  return { label: "Bireysel", isOnline: true };
}

function durumPill(durum: string): { label: string; cls: string } {
  if (durum === "completed" || durum === "tamamlandi")
    return { label: "Tamamlandı", cls: "bg-[#A6DE9B] text-[#325343]" };
  if (durum === "cancelled" || durum === "iptal")
    return {
      label: "İptal",
      cls: "bg-[#F5F7F5] text-[#4A4D4A] border-[1.5px] border-[#D4E4D8]",
    };
  return {
    label: "Bekliyor",
    cls: "border-[1.5px] border-[#325343] text-[#252625] bg-white dark:bg-transparent",
  };
}

function avatarHarfler(bas: string): string {
  return bas
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#D4E4D8] dark:border-[#333] px-3 py-2 text-[12px]">
      <div className="font-bold text-[#252625] dark:text-white mb-1">{label}</div>
      <div className="text-[#4A4D4A]">
        Net:{" "}
        <strong className="text-[#252625] dark:text-white">
          {formatTL(payload[0]?.value ?? 0)}
        </strong>
      </div>
    </div>
  );
}

export default function FinansKlient({ baslangicVeri, baslangicDonem }: Props) {
  const prefersReduced = useReducedMotion();
  const [donem, setDonem] = useState<Donem>(baslangicDonem);
  const [sayfa, setSayfa] = useState(1);
  const [veri, setVeri] = useState<FinansVeri>(baslangicVeri);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [turFiltre, setTurFiltre] = useState("tumu");
  const [durumFiltre, setDurumFiltre] = useState("tumu");
  const [seansHafta, setSeansHafta] = useState(4);
  const ilkMountRef = useRef(true);

  const veriGetir = useCallback(async (d: Donem, s: number) => {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/danisan/finans?donem=${d}&sayfa=${s}`);
      if (!res.ok) return;
      const json = (await res.json()) as FinansVeri;
      setVeri(json);
    } catch {
      // sessiz hata
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (ilkMountRef.current) {
      ilkMountRef.current = false;
      return;
    }
    void veriGetir(donem, sayfa);
  }, [donem, sayfa, veriGetir]);

  function donemDegistir(d: Donem) {
    setDonem(d);
    setSayfa(1);
    setAramaMetni("");
    setTurFiltre("tumu");
    setDurumFiltre("tumu");
  }

  // ── Tahmin hesaplama ──────────────────────────────────
  const aylikSeans = Math.round(seansHafta * 4.3);
  const estimBrut = aylikSeans * veri.kpi.ortalamaFiyat;
  const estimKomisyon = Math.round(estimBrut * (veri.kpi.komisyonOrani / 100));
  const estimNet = estimBrut - estimKomisyon;

  // ── Mini progress bar oranı ───────────────────────────
  const grafikMaxNet = Math.max(...veri.grafik.map((g) => g.net), veri.kpi.brutGelir, 1);
  const progressPct = Math.min(100, Math.round((veri.kpi.brutGelir / grafikMaxNet) * 100));

  // ── Tablo filtreleme (client-side, sayfa içinde) ──────
  const filtreliSeanslar = veri.seanslar.filter((s) => {
    const aramaEsles =
      aramaMetni === "" ||
      s.musteriBasHarfler.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      formatTarih(s.tarih).toLowerCase().includes(aramaMetni.toLowerCase());
    const turEsles =
      turFiltre === "tumu" ||
      s.sessionType.toLowerCase().includes(turFiltre.toLowerCase());
    const durumEsles =
      durumFiltre === "tumu" ||
      (durumFiltre === "tamamlandi" &&
        (s.durum === "completed" || s.durum === "tamamlandi")) ||
      (durumFiltre === "iptal" &&
        (s.durum === "cancelled" || s.durum === "iptal")) ||
      (durumFiltre === "bekliyor" &&
        s.durum !== "completed" &&
        s.durum !== "cancelled" &&
        s.durum !== "tamamlandi" &&
        s.durum !== "iptal");
    return aramaEsles && turEsles && durumEsles;
  });

  // ── Grafik istatistikleri ────────────────────────────
  const grafikNetler = veri.grafik.map((g) => g.net);
  const grafikMax = Math.max(...grafikNetler, 1);
  const grafikOrtalama =
    veri.grafik.length > 0
      ? Math.round(grafikNetler.reduce((a, b) => a + b, 0) / veri.grafik.length)
      : 0;
  const enYuksekAy = veri.grafik.reduce(
    (best, g) => (g.net > best.net ? g : best),
    veri.grafik[0] ?? { ay: "", net: 0 }
  );

  // ── Pagination hesaplama ─────────────────────────────
  type PageItem = number | "...";
  const toplamSayfa = veri.sayfalama.toplamSayfa;
  const sayfalar = Array.from({ length: toplamSayfa }, (_, i) => i + 1)
    .filter((p) => {
      if (toplamSayfa <= 5) return true;
      return p === 1 || p === toplamSayfa || Math.abs(p - sayfa) <= 1;
    })
    .reduce<PageItem[]>((acc, p, idx, arr) => {
      if (idx > 0) {
        const prev = arr[idx - 1];
        if (prev !== undefined && p - prev > 1) acc.push("...");
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: "easeOut" }}
      className="p-5"
    >
      {/* ── Başlık + Dönem Seçici ─────────────────────────── */}
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625] dark:text-white">
            Gelir Paneli
          </h1>
          <p className="text-[11px] text-[#4A4D4A]">
            {DONEM_ETIKETLERI[donem]} · Ödeme günü: Her Cuma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex">
            {(["hafta", "ay", "3ay"] as Donem[]).map((d, i, arr) => (
              <button
                key={d}
                onClick={() => donemDegistir(d)}
                className={`text-[11px] px-3 py-[5px] border-[1.5px] transition-colors ${
                  i < arr.length - 1 ? "border-r-0" : ""
                } ${
                  donem === d
                    ? "bg-[#A6DE9B] text-[#325343] border-[#325343] font-bold dark:bg-white dark:text-[#252625] dark:border-white"
                    : "bg-white dark:bg-[#1a1a1a] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white"
                }`}
              >
                {DONEM_ETIKETLERI[d]}
              </button>
            ))}
          </div>
          <a
            href={`/api/danisan/finans/export?donem=${donem}`}
            className="text-[11px] px-3 py-[5px] border-[1.5px] border-[#D4E4D8] dark:border-[#444] bg-white dark:bg-[#1a1a1a] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white transition-colors"
          >
            ↓ Excel
          </a>
        </div>
      </div>

      {/* ── Yükleniyor göstergesi ─────────────────────────── */}
      <AnimatePresence>
        {yukleniyor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] text-[#4A4D4A] mb-3"
          >
            Yükleniyor...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3 KPI Kartı ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-[10px] mb-[18px]">

        {/* Brüt Gelir */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-[14px_16px]"
        >
          <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-[6px]">
            {DONEM_ETIKETLERI[donem]} — Brüt Gelir
          </div>
          <div className="text-[24px] font-bold text-[#252625] dark:text-white leading-none mb-1">
            {formatTL(veri.kpi.brutGelir)}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A] mb-2">
            {veri.kpi.seansAdedi} seans · Ort. {veri.kpi.ortalamaFiyat}₺/seans
          </div>
          {veri.kpi.trend !== null && (
            <div
              className={`text-[10.5px] font-bold flex items-center gap-1 mb-2 ${
                veri.kpi.trend >= 0
                  ? "text-[#252625] dark:text-white"
                  : "text-[#4A4D4A]"
              }`}
            >
              {veri.kpi.trend >= 0 ? "↑" : "↓"} %{Math.abs(veri.kpi.trend)}{" "}
              geçen döneme göre
            </div>
          )}
          {/* Mini progress bar */}
          <div className="h-[5px] bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD] mt-1">
            <motion.div
              className="h-full bg-[#325343] dark:bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Komisyon */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-[14px_16px]"
        >
          <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-[6px]">
            Komisyon Kesintisi (%{veri.kpi.komisyonOrani})
          </div>
          <div className="text-[24px] font-bold text-[#4A4D4A] leading-none mb-1">
            {formatTL(veri.kpi.komisyon)}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A] mb-2">Platform payı</div>
          <div className="text-[10.5px] text-[#4A4D4A]">
            {veri.kpi.seansAdedi} seans × ort.{" "}
            {veri.kpi.seansAdedi > 0
              ? Math.round(veri.kpi.komisyon / veri.kpi.seansAdedi)
              : 0}
            ₺
          </div>
        </motion.div>

        {/* Net Kazanç — ana kart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          className="border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] p-[14px_16px]"
        >
          <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-[6px]">
            Net Kazanç (Ödenecek)
          </div>
          <div className="text-[24px] font-bold text-[#252625] dark:text-white leading-none mb-1">
            {formatTL(veri.kpi.netKazanc)}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A] mb-2">
            Hesabınıza aktarılacak
          </div>
          {/* Sonraki ödeme kutusu */}
          <div className="mt-2 p-[6px_8px] bg-[#F5F7F5] dark:bg-[#111] border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
            <div className="text-[9px] font-bold tracking-[0.5px] uppercase text-[#4A4D4A] mb-[2px]">
              Sonraki Ödeme
            </div>
            {veri.sonrakiOdeme ? (
              <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                {formatSonrakiOdemeTarih(veri.sonrakiOdeme.tarih)} ·{" "}
                {formatTL(veri.sonrakiOdeme.tutar)}
              </div>
            ) : (
              <div className="text-[12px] text-[#4A4D4A]">
                Bekleyen ödeme yok
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Orta: Tahmin Aracı + Grafik ──────────────────── */}
      <div className="grid grid-cols-2 gap-[14px] mb-[18px]">

        {/* Gelir Tahmin Aracı */}
        <div className="border-2 border-dashed border-[#325343] dark:border-white bg-[#F5F7F5] dark:bg-[#0a0a0a] p-[16px_18px]">
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white mb-3 flex items-center gap-2">
            <span>✦</span>
            Gelir Tahmin Aracı
          </div>
          <p className="text-[13px] font-semibold text-[#252625] dark:text-white mb-3 leading-[1.5]">
            Haftada kaç seans yapmak istiyorsunuz?
          </p>

          <div className="flex items-center gap-[10px] mb-[14px]">
            <div className="flex items-center border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a]">
              <button
                onClick={() => setSeansHafta((v) => Math.max(1, v - 1))}
                className="w-[30px] h-[36px] flex items-center justify-center text-[16px] font-bold text-[#252625] dark:text-white border-r border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors"
              >
                −
              </button>
              <span className="w-[52px] h-[36px] flex items-center justify-center text-[16px] font-bold text-[#252625] dark:text-white select-none">
                {seansHafta}
              </span>
              <button
                onClick={() => setSeansHafta((v) => Math.min(30, v + 1))}
                className="w-[30px] h-[36px] flex items-center justify-center text-[16px] font-bold text-[#252625] dark:text-white border-l border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-[12px] text-[#252625] dark:text-white">
              seans / hafta
            </span>
          </div>

          <div className="h-[1px] bg-[#BDBDBD] my-[10px]" />

          <div className="flex flex-col gap-[6px] mb-[10px]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#4A4D4A]">Aylık seans sayısı</span>
              <span className="font-bold text-[#252625] dark:text-white">
                ≈ {aylikSeans} seans
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#4A4D4A]">Aylık brüt gelir</span>
              <span className="font-bold text-[#252625] dark:text-white">
                {formatTL(estimBrut)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#4A4D4A]">
                Komisyon (%{veri.kpi.komisyonOrani})
              </span>
              <span className="font-bold text-[#4A4D4A]">
                − {formatTL(estimKomisyon)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-[12px] py-[10px]">
            <span className="text-[10px] font-bold tracking-[0.5px] uppercase">
              → Tahmini Aylık Net
            </span>
            <span className="text-[20px] font-bold">{formatTL(estimNet)}</span>
          </div>

          <p className="text-[10px] text-[#4A4D4A] mt-2">
            *{" "}
            {veri.kpi.ortalamaFiyat > 0
              ? `${veri.kpi.ortalamaFiyat}₺`
              : "mevcut dönem"}{" "}
            ortalama seans ücreti baz alınmıştır
          </p>
        </div>

        {/* 6 Ay Bar Grafik */}
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-[14px_16px]">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white mb-3">
            <span>Son 6 Ay — Aylık Net Gelir</span>
            <span className="font-normal text-[#4A4D4A]">Bar grafik</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={veri.grafik} barCategoryGap="20%">
              <CartesianGrid
                vertical={false}
                stroke="#D4E4D8"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="ay"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#4A4D4A" }}
              />
              <YAxis hide domain={[0, grafikMax * 1.15]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#F5F7F5" }}
              />
              <Bar dataKey="net" radius={0 as unknown as [number, number, number, number]}>
                {veri.grafik.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === veri.grafik.length - 1 ? "#252625" : "#4A4D4A"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="border-t border-[#D4E4D8] dark:border-[#333] pt-2 mt-1 flex justify-between text-[10.5px]">
            <span className="text-[#4A4D4A]">
              En yüksek:{" "}
              <strong className="text-[#252625] dark:text-white">
                {formatTL(enYuksekAy.net)}
                {enYuksekAy.ay ? ` (${enYuksekAy.ay})` : ""}
              </strong>
            </span>
            <span className="text-[#4A4D4A]">
              Ort:{" "}
              <strong className="text-[#252625] dark:text-white">
                {formatTL(grafikOrtalama)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Seans Listesi ─────────────────────────────────── */}
      <div>
        {/* Tablo başlık satırı */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white">
            Seans Geçmişi — {DONEM_ETIKETLERI[donem]}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#4A4D4A]">
              {veri.sayfalama.toplamSeans} seans
            </span>
            <a
              href={`/api/danisan/finans/fatura?donem=${donem}`}
              className="text-[10.5px] px-[11px] py-1 border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white hover:border-[#325343] transition-colors"
            >
              ↓ Fatura İndir
            </a>
          </div>
        </div>

        {/* Filtre satırı */}
        <div className="flex gap-2 mb-[10px] items-center flex-wrap">
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Danışan kodu veya tarih ara..."
            className="flex-1 min-w-[160px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[11.5px] text-[#252625] dark:text-white placeholder:text-[#4A4D4A] px-[10px] py-[6px] outline-none focus:border-[#325343] dark:focus:border-white"
          />
          <select
            value={turFiltre}
            onChange={(e) => setTurFiltre(e.target.value)}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[11.5px] text-[#252625] dark:text-white px-[10px] py-[6px] outline-none focus:border-[#325343]"
          >
            <option value="tumu">Tür: Tümü</option>
            <option value="online">Online</option>
            <option value="yuz_yuze">Yüz Yüze</option>
            <option value="asenkron">Asenkron</option>
          </select>
          <select
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[11.5px] text-[#252625] dark:text-white px-[10px] py-[6px] outline-none focus:border-[#325343]"
          >
            <option value="tumu">Durum: Tümü</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="bekliyor">Bekliyor</option>
            <option value="iptal">İptal</option>
          </select>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {(
                  [
                    ["Tarih", "text-left"],
                    ["Danışan", "text-left"],
                    ["Seans Türü", "text-left"],
                    ["Brüt Ücret", "text-right"],
                    [`Komisyon (%${veri.kpi.komisyonOrani})`, "text-right"],
                    ["Net Kazanç", "text-right"],
                    ["Durum", "text-center"],
                  ] as [string, string][]
                ).map(([th, align]) => (
                  <th
                    key={th}
                    className={`text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] dark:bg-[#111] whitespace-nowrap ${align}`}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreliSeanslar.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-[12px] text-[#4A4D4A]"
                  >
                    Bu dönemde seans bulunamadı.
                  </td>
                </tr>
              ) : (
                filtreliSeanslar.map((s, idx) => {
                  const { label: turLabel, isOnline } = sessionTypeTr(
                    s.sessionType
                  );
                  const { label: durumLabel, cls: durumCls } = durumPill(
                    s.durum
                  );
                  const isLast = idx === filtreliSeanslar.length - 1;
                  return (
                    <motion.tr
                      key={s.odemeId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12, delay: idx * 0.025 }}
                      className={`hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors ${
                        isLast
                          ? "border-b-[1.5px] border-[#325343] dark:border-white"
                          : "border-b border-[#D4E4D8] dark:border-[#333]"
                      }`}
                    >
                      <td className="py-2 px-[10px] text-[#252625] dark:text-white align-middle whitespace-nowrap">
                        {formatTarih(s.tarih)}
                      </td>
                      <td className="py-2 px-[10px] align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 shrink-0 bg-[#D4E4D8] dark:bg-[#333] border-[1.5px] border-[#BDBDBD] dark:border-[#555] flex items-center justify-center text-[10px] font-bold text-[#252625] dark:text-white">
                            {avatarHarfler(s.musteriBasHarfler)}
                          </div>
                          <div className="text-[12px] font-semibold text-[#252625] dark:text-white whitespace-nowrap">
                            {s.musteriBasHarfler}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-[10px] align-middle">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-[2px] bg-[#F5F7F5] dark:bg-[#0a0a0a] inline-block ${
                            isOnline
                              ? "border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white"
                              : "border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#252625] dark:text-white"
                          }`}
                        >
                          {turLabel}
                        </span>
                      </td>
                      <td className="py-2 px-[10px] text-right align-middle">
                        <strong className="text-[#252625] dark:text-white">
                          {formatTL(s.brutUcret)}
                        </strong>
                      </td>
                      <td className="py-2 px-[10px] text-right align-middle">
                        <span className="text-[#4A4D4A]">
                          {formatTL(s.komisyon)}
                        </span>
                      </td>
                      <td className="py-2 px-[10px] text-right align-middle">
                        <strong className="text-[#252625] dark:text-white">
                          {formatTL(s.netKazanc)}
                        </strong>
                      </td>
                      <td className="py-2 px-[10px] text-center align-middle">
                        <span
                          className={`text-[10px] font-bold px-2 py-[2px] inline-block ${durumCls}`}
                        >
                          {durumLabel}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Özet satırı */}
        <div className="flex justify-end gap-9 px-[10px] py-2 bg-[#F5F7F5] dark:bg-[#111] border-[1.5px] border-[#D4E4D8] dark:border-[#333] -mt-[1px] text-[12px]">
          <div className="text-right">
            <div className="text-[9px] font-bold tracking-[0.5px] uppercase text-[#4A4D4A] mb-[2px]">
              Toplam Brüt
            </div>
            <div className="font-bold text-[#252625] dark:text-white">
              {formatTL(veri.ozet.toplamBrut)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold tracking-[0.5px] uppercase text-[#4A4D4A] mb-[2px]">
              Toplam Komisyon
            </div>
            <div className="font-bold text-[#4A4D4A]">
              {formatTL(veri.ozet.toplamKomisyon)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold tracking-[0.5px] uppercase text-[#4A4D4A] mb-[2px]">
              Toplam Net
            </div>
            <div className="font-bold text-[15px] text-[#252625] dark:text-white">
              {formatTL(veri.ozet.toplamNet)}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-[10px] text-[11px] text-[#4A4D4A] flex-wrap gap-2">
          <div>
            {filtreliSeanslar.length} / {veri.sayfalama.toplamSeans} seans · Sayfa{" "}
            {veri.sayfalama.sayfa} / {veri.sayfalama.toplamSayfa}
          </div>
          {toplamSayfa > 1 && (
            <div className="flex gap-[3px]">
              <button
                onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                disabled={sayfa === 1}
                className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] flex items-center justify-center text-[11px] bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white disabled:opacity-30 hover:border-[#325343] transition-colors"
              >
                ‹
              </button>
              {sayfalar.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`ell-${idx}`}
                    className="w-[26px] h-[26px] flex items-center justify-center text-[10px] text-[#4A4D4A]"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setSayfa(p as number)}
                    className={`w-[26px] h-[26px] border-[1.5px] flex items-center justify-center text-[11px] transition-colors ${
                      sayfa === p
                        ? "bg-[#325343] dark:bg-white text-white dark:text-[#252625] border-[#325343] dark:border-white font-bold"
                        : "border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white hover:border-[#325343]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setSayfa((p) => Math.min(toplamSayfa, p + 1))}
                disabled={sayfa === toplamSayfa}
                className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] flex items-center justify-center text-[11px] bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white disabled:opacity-30 hover:border-[#325343] transition-colors"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
