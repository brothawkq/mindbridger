"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import type { IstatistikVeri } from "@/types/admin";

type Gun = 7 | 30 | 90;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTL(n: number): string {
  return (
    "₺" +
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

function formatGuncelleme(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 3_600_000);
  const tarih = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
  const saat = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${tarih}, ${saat}`;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-[1.5px] border-[#D4E4D8] px-3 py-2 text-[11px]">
      <div className="font-bold text-[#252625]">{label}</div>
      <div className="text-[#4A4D4A]">{payload[0]?.value ?? 0} seans</div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiKart({
  baslik,
  deger,
  meta,
  badge,
  badgeVariant = "outline",
  alert = false,
  altBilesen,
}: {
  baslik: string;
  deger: string;
  meta: string;
  badge?: string;
  badgeVariant?: "filled" | "outline";
  alert?: boolean;
  altBilesen?: React.ReactNode;
}) {
  return (
    <div
      className={`border-[1.5px] p-[11px_12px] bg-white ${
        alert ? "border-[#325343]" : "border-[#D4E4D8]"
      }`}
    >
      <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1.5">
        {baslik}
      </div>
      <div className="text-[20px] font-bold text-[#252625] leading-none mb-0.5">
        {deger}
      </div>
      <div className="text-[10px] text-[#4A4D4A] mb-1">{meta}</div>
      {badge && (
        <span
          className={`inline-block text-[9px] font-bold px-[5px] py-[1px] mt-1 ${
            badgeVariant === "filled"
              ? "bg-[#A6DE9B] text-[#325343]"
              : "bg-white text-[#252625] border-[1.5px] border-[#325343]"
          }`}
        >
          {badge}
        </span>
      )}
      {altBilesen}
    </div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ durum }: { durum: string }) {
  if (durum === "Yeni") {
    return (
      <span className="text-[9.5px] font-bold px-[7px] py-[2px] bg-[#A6DE9B] text-[#325343] inline-block">
        {durum}
      </span>
    );
  }
  if (durum === "İncelemede") {
    return (
      <span className="text-[9.5px] font-bold px-[7px] py-[2px] bg-[#F5F7F5] text-[#252625] border-[1.5px] border-[#325343] inline-block">
        {durum}
      </span>
    );
  }
  return (
    <span className="text-[9.5px] font-bold px-[7px] py-[2px] bg-[#F5F7F5] text-[#4A4D4A] border-[1.5px] border-[#D4E4D8] inline-block">
      {durum}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardKlient() {
  const prefersReduced = useReducedMotion();
  const [veri, setVeri] = useState<IstatistikVeri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [gun, setGun] = useState<Gun>(30);

  const fetchVeri = useCallback(async (g: Gun) => {
    try {
      const res = await fetch(`/api/admin/istatistik?gun=${g}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("API hatası");
      const data = (await res.json()) as IstatistikVeri;
      setVeri(data);
      setHata(null);
    } catch {
      setHata("Veriler yüklenirken hata oluştu. Tekrar deneniyor…");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    setYukleniyor(true);
    void fetchVeri(gun);
    const id = setInterval(() => void fetchVeri(gun), 60_000);
    return () => clearInterval(id);
  }, [gun, fetchVeri]);

  const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number];

  const anim = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.18, ease: EASE_OUT },
      };

  const listAnim = prefersReduced
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: {
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        },
      };

  const itemAnim = prefersReduced
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 6 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.15, ease: EASE_OUT },
          },
        },
      };

  const xInterval = gun === 7 ? 0 : gun === 30 ? 3 : 8;

  if (yukleniyor) {
    return (
      <div className="p-5">
        {/* Skeleton KPI */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-[1.5px] border-[#D4E4D8] h-24 bg-white animate-pulse"
            />
          ))}
        </div>
        {/* Skeleton chart */}
        <div className="border-[1.5px] border-[#D4E4D8] h-44 bg-white animate-pulse mb-4" />
        {/* Skeleton tables */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border-[1.5px] border-[#D4E4D8] h-40 bg-white animate-pulse" />
          <div className="border-[1.5px] border-[#D4E4D8] h-40 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (hata && !veri) {
    return (
      <div className="p-5 text-center">
        <p className="text-[13px] text-[#252625] font-bold mb-2">Veri yüklenemedi</p>
        <p className="text-[11px] text-[#4A4D4A] mb-4">{hata}</p>
        <button
          onClick={() => { setYukleniyor(true); void fetchVeri(gun); }}
          className="px-4 py-2 bg-[#A6DE9B] text-[#325343] text-[12px] font-bold hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const kpi = veri?.kpi;
  const grafik = veri?.seansGrafik ?? [];
  const bekleyenBasvurular = veri?.bekleyenBasvurular ?? [];
  const bekleyenBloglar = veri?.bekleyenBloglar ?? [];
  const guncellemeTarihi = veri
    ? formatGuncelleme(veri.guncellemeTarihi)
    : "—";

  const haftaYuzdesi = kpi
    ? Math.min(100, Math.round((kpi.haftaGeliri / kpi.haftaGeliriHedef) * 100))
    : 0;

  const degisimMetin =
    !kpi || kpi.bugunDegisim === 0
      ? "Dünkü ile aynı"
      : kpi.bugunDegisim > 0
        ? `↑ ${kpi.bugunDegisim} dünden fazla`
        : `↓ ${Math.abs(kpi.bugunDegisim)} dünden az`;

  return (
    <div className="p-5">
      {/* Başlık */}
      <motion.div {...anim} className="mb-4">
        <h1 className="text-[16px] font-bold text-[#252625]">Admin Dashboard</h1>
        <p className="text-[11px] text-[#4A4D4A]">
          Son güncelleme: {guncellemeTarihi} · Otomatik yenileme: 60 sn
        </p>
        {hata && (
          <p className="text-[10px] text-[#4A4D4A] mt-1">⚠ {hata}</p>
        )}
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key="kpi"
          {...listAnim}
          className="grid grid-cols-5 gap-2 mb-4"
        >
          <motion.div {...itemAnim}>
            <KpiKart
              baslik="Bugünkü Randevular"
              deger={String(kpi?.bugunRandevular ?? 0)}
              meta={degisimMetin}
              badge={
                kpi && kpi.bugunDegisim !== 0
                  ? kpi.bugunDegisim > 0
                    ? `+${Math.round((kpi.bugunDegisim / Math.max(1, kpi.bugunRandevular - kpi.bugunDegisim)) * 100)}%`
                    : `${Math.round((kpi.bugunDegisim / Math.max(1, kpi.bugunRandevular - kpi.bugunDegisim)) * 100)}%`
                  : undefined
              }
              badgeVariant="outline"
            />
          </motion.div>

          <motion.div {...itemAnim}>
            <KpiKart
              baslik="Bekleyen Onaylar"
              deger={String(kpi?.bekleyenOnaylar ?? 0)}
              meta="Danışman başvurusu"
              badge={kpi && kpi.bekleyenOnaylar > 0 ? "⚠ Aksiyon gerekli" : undefined}
              badgeVariant="filled"
              alert={!!kpi && kpi.bekleyenOnaylar > 0}
            />
          </motion.div>

          <motion.div {...itemAnim}>
            <KpiKart
              baslik="Bu Haftanın Geliri"
              deger={formatTL(kpi?.haftaGeliri ?? 0)}
              meta={`Hedef: ${formatTL(kpi?.haftaGeliriHedef ?? 50_000)}`}
              altBilesen={
                <div className="mt-1.5 h-1 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
                  <motion.div
                    className="h-full bg-[#325343]"
                    initial={{ width: 0 }}
                    animate={{ width: `${haftaYuzdesi}%` }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>
              }
            />
          </motion.div>

          <motion.div {...itemAnim}>
            <KpiKart
              baslik="Komisyon (%20)"
              deger={formatTL(kpi?.haftaKomisyon ?? 0)}
              meta="Bu hafta kesildi"
              badge="%20 oran"
              badgeVariant="outline"
            />
          </motion.div>

          <motion.div {...itemAnim}>
            <KpiKart
              baslik="Bekleyen Transfer"
              deger={formatTL(kpi?.bekleyenTransferTutar ?? 0)}
              meta={`${kpi?.bekleyenTransferDanisanSayisi ?? 0} danışmana`}
              badge="Cuma ödeme günü"
              badgeVariant="filled"
              alert={!!kpi && kpi.bekleyenTransferTutar > 0}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── Chart ──────────────────────────────────────────── */}
      <motion.div {...anim} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-[0.5px] uppercase text-[#252625]">
            Son {gun} Gün — Seans Trendi
          </span>
          <div className="flex gap-1.5">
            {([7, 30, 90] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGun(g)}
                className={`text-[10px] px-[9px] py-[3px] border-[1.5px] font-inherit ${
                  gun === g
                    ? "border-[#325343] text-[#252625] font-bold"
                    : "border-[#D4E4D8] text-[#4A4D4A] bg-white"
                }`}
              >
                {g} Gün
              </button>
            ))}
            <button
              disabled
              className="text-[10px] px-[9px] py-[3px] border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] bg-white opacity-50 cursor-not-allowed"
            >
              PDF ↓
            </button>
          </div>
        </div>

        <div className="border-[1.5px] border-[#D4E4D8] bg-white px-4 pt-3.5 pb-2">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={grafik} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#D4E4D8" />
              <XAxis
                dataKey="tarih"
                tick={{ fontSize: 8.5, fill: "#4A4D4A" }}
                tickLine={false}
                axisLine={false}
                interval={xInterval}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#4A4D4A" }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F5F7F5" }} />
              <Bar dataKey="adet" maxBarSize={18}>
                {grafik.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.haftaSonu ? "#4A4D4A" : "#252625"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex gap-3 justify-end mt-1">
            <div className="flex items-center gap-1 text-[10px] text-[#4A4D4A]">
              <div className="w-2.5 h-2.5 bg-[#325343]" />
              Hafta içi
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#4A4D4A]">
              <div className="w-2.5 h-2.5 bg-[#D4E4D8]" />
              Hafta sonu
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom Tables ───────────────────────────────────── */}
      <motion.div {...anim} className="grid grid-cols-2 gap-3.5">
        {/* Bekleyen Başvurular */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625]">
              Bekleyen Danışman Başvuruları
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#A6DE9B] text-[#325343] px-1.5 py-0.5">
                {kpi?.bekleyenOnaylar ?? 0}
              </span>
              <Link
                href="/admin/basvurular"
                className="text-[10px] text-[#4A4D4A] underline"
              >
                Tümünü Gör →
              </Link>
            </div>
          </div>
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr>
                {["Ad Soyad", "Uzmanlık", "Tarih", "Durum", ""].map((h) => (
                  <th
                    key={h}
                    className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] border-b-[1.5px] border-[#325343] px-2 py-1.5 text-left bg-[#F5F7F5]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bekleyenBasvurular.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-[11px] text-[#4A4D4A] py-4"
                  >
                    Bekleyen başvuru yok
                  </td>
                </tr>
              ) : (
                bekleyenBasvurular.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5]"
                  >
                    <td className="px-2 py-1.5 font-bold">{b.adSoyad}</td>
                    <td className="px-2 py-1.5 text-[#4A4D4A]">{b.uzmanlik}</td>
                    <td className="px-2 py-1.5 text-[#4A4D4A]">{b.basvuruTarihi}</td>
                    <td className="px-2 py-1.5">
                      <StatusPill durum={b.durum} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Link
                        href={`/admin/basvurular/${b.id}`}
                        className="text-[10px] font-bold border-[1.5px] border-[#325343] bg-white text-[#252625] px-[9px] py-[3px] whitespace-nowrap hover:bg-[#F5F7F5]"
                      >
                        İncele
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bekleyen Blog Yazıları */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625]">
              Bekleyen Blog Yazıları
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#A6DE9B] text-[#325343] px-1.5 py-0.5">
                {bekleyenBloglar.length}
              </span>
              <Link
                href="/admin/blog"
                className="text-[10px] text-[#4A4D4A] underline"
              >
                Tümünü Gör →
              </Link>
            </div>
          </div>
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr>
                {["Başlık", "Danışman", "Gönderim", "Durum", ""].map((h) => (
                  <th
                    key={h}
                    className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] border-b-[1.5px] border-[#325343] px-2 py-1.5 text-left bg-[#F5F7F5]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bekleyenBloglar.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-[11px] text-[#4A4D4A] py-4"
                  >
                    Bekleyen blog yazısı yok
                  </td>
                </tr>
              ) : (
                bekleyenBloglar.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5]"
                  >
                    <td className="px-2 py-1.5 font-bold max-w-[140px] truncate">
                      {b.baslik}
                    </td>
                    <td className="px-2 py-1.5 text-[#4A4D4A]">{b.danisanAdi}</td>
                    <td className="px-2 py-1.5 text-[#4A4D4A]">{b.gonderiTarihi}</td>
                    <td className="px-2 py-1.5">
                      <StatusPill durum={b.durum} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Link
                        href={`/admin/blog/${b.id}`}
                        className="text-[10px] font-bold border-[1.5px] border-[#325343] bg-white text-[#252625] px-[9px] py-[3px] whitespace-nowrap hover:bg-[#F5F7F5]"
                      >
                        İncele
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
