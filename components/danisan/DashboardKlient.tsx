"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

interface BugunSeans {
  id: string;
  saat: string;
  musteriAdi: string;
  tip: string;
}

interface YaklasanRandevu {
  id: string;
  tarihSaat: string;
  musteriAdi: string;
  tip: string;
  durum: string;
}

interface BekleyenOnay {
  id: string;
  tarihSaat: string;
  musteriAdi: string;
  tip: string;
}

interface SonYorum {
  id: string;
  puan: number;
  yorum: string;
  tarih: string;
  musteriAdi: string;
}

interface DashboardData {
  kpi: {
    bugunSeansAdet: number;
    bekleyenOnayAdet: number;
    haftaKazanc: number;
    ayKazanc: number;
    profilTamamlanma: number;
    profilYayinda: boolean;
    okunmamisMesaj: number;
  };
  bugunSeans: BugunSeans[];
  yaklasanRandevular: YaklasanRandevu[];
  bekleyenOnaylar: BekleyenOnay[];
  sonYorumlar: SonYorum[];
  guncellemeTarihi: string;
}

function formatTL(n: number) {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const DURUM_PILL: Record<string, string> = {
  confirmed: "bg-[#A6DE9B] text-[#325343]",
  pending: "border-[1.5px] border-[#325343] text-[#252625]",
  completed: "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]",
};
const DURUM_LABEL: Record<string, string> = {
  confirmed: "Onaylı",
  pending: "Bekliyor",
  completed: "Tamamlandı",
};

function Yildiz({ puan }: { puan: number }) {
  return (
    <span className="text-[11px]">
      {"★".repeat(Math.max(0, Math.min(5, puan)))}
      {"☆".repeat(Math.max(0, 5 - Math.min(5, puan)))}
    </span>
  );
}

export default function DashboardKlient() {
  const shouldReduce = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/danisan/istatistik")
      .then((r) => r.json())
      .then((d: DashboardData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // 60 sn auto-refresh
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[#4A4D4A]">
        Yükleniyor...
      </div>
    );
  }

  const { kpi } = data;

  const KPI_CARDS = [
    { label: "Bugünkü Seanslar", val: String(kpi.bugunSeansAdet), sub: "Onaylı randevu" },
    { label: "Bekleyen Onay", val: String(kpi.bekleyenOnayAdet), sub: "Yanıt bekleniyor", link: "/danisan/randevular?durum=pending" },
    { label: "Haftalık Kazanç", val: formatTL(kpi.haftaKazanc), sub: "Son 7 gün net" },
    { label: "Aylık Kazanç", val: formatTL(kpi.ayKazanc), sub: "Bu ay net", link: "/danisan/finans" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Page header */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-end justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">Dashboard</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">
            Son güncelleme: {new Date(data.guncellemeTarihi).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {kpi.okunmamisMesaj > 0 && (
          <Link
            href="/danisan/mesajlar"
            className="text-[11px] font-bold border-[1.5px] border-[#325343] px-3 py-[5px] text-[#252625] no-underline hover:bg-[#325343] hover:text-white transition-colors"
          >
            {kpi.okunmamisMesaj} okunmamış mesaj
          </Link>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">

        {/* Profil uyarısı */}
        {(!kpi.profilYayinda || kpi.profilTamamlanma < 100) && (
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border-[1.5px] border-[#325343] bg-[#F5F7F5] px-4 py-3 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-[12px] font-bold text-[#252625]">
                Profil {kpi.profilTamamlanma < 100 ? `%${kpi.profilTamamlanma} tamamlandı` : "yayında değil"}
              </div>
              <div className="text-[10px] text-[#4A4D4A] mt-0.5">
                {kpi.profilTamamlanma < 100
                  ? "Müşterilerden randevu alabilmek için profilinizi %100 tamamlayın."
                  : "Profiliniz müşterilere görünmüyor. Yayına almak için profil sayfasını ziyaret edin."}
              </div>
              {/* Progress bar */}
              <div className="mt-2 w-48 h-[6px] bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
                <div
                  className="h-full bg-[#325343] transition-all duration-600"
                  style={{ width: `${kpi.profilTamamlanma}%` }}
                />
              </div>
            </div>
            <Link
              href="/danisan/profil"
              className="text-[11px] font-bold border-[1.5px] border-[#325343] bg-white px-3 py-[5px] text-[#252625] no-underline hover:bg-[#325343] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
            >
              Profili Düzenle
            </Link>
          </motion.div>
        )}

        {/* KPI cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
        >
          {KPI_CARDS.map((c) => {
            const card = (
              <div className="border-[1.5px] border-[#D4E4D8] p-[10px_12px] bg-white hover:border-[#325343] transition-colors">
                <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                  {c.label}
                </div>
                <div className="text-[18px] font-bold text-[#252625] leading-none">{c.val}</div>
                <div className="text-[10px] text-[#4A4D4A] mt-1">{c.sub}</div>
              </div>
            );
            return (
              <motion.div
                key={c.label}
                variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
              >
                {c.link ? (
                  <Link href={c.link} className="no-underline block">{card}</Link>
                ) : card}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Bugünkü seanslar */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-2 border-b border-dotted border-[#D4E4D8] pb-1">
              Bugünkü Seanslar
            </div>
            {data.bugunSeans.length === 0 ? (
              <div className="text-[12px] text-[#4A4D4A] py-3">Bugün planlanmış seans yok.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {data.bugunSeans.map((s) => (
                  <Link
                    key={s.id}
                    href={`/danisan/randevular/${s.id}`}
                    className="flex items-center justify-between border-[1.5px] border-[#D4E4D8] px-3 py-2.5 bg-white hover:border-[#325343] transition-colors no-underline"
                  >
                    <div>
                      <div className="text-[12px] font-bold text-[#252625]">{s.musteriAdi}</div>
                      <div className="text-[10px] text-[#4A4D4A]">{s.tip}</div>
                    </div>
                    <div className="text-[12px] font-bold text-[#252625]">{s.saat}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bekleyen onaylar */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-2 border-b border-dotted border-[#D4E4D8] pb-1 flex items-center justify-between">
              <span>Bekleyen Onaylar</span>
              {data.bekleyenOnaylar.length > 0 && (
                <span className="bg-[#A6DE9B] text-[#325343] text-[9px] font-bold px-1.5 py-0.5">
                  {data.bekleyenOnaylar.length}
                </span>
              )}
            </div>
            {data.bekleyenOnaylar.length === 0 ? (
              <div className="text-[12px] text-[#4A4D4A] py-3">Bekleyen randevu isteği yok.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {data.bekleyenOnaylar.map((r) => (
                  <Link
                    key={r.id}
                    href={`/danisan/randevular/${r.id}`}
                    className="flex items-center justify-between border-[1.5px] border-[#325343] px-3 py-2.5 bg-white hover:bg-[#F5F7F5] transition-colors no-underline"
                  >
                    <div>
                      <div className="text-[12px] font-bold text-[#252625]">{r.musteriAdi}</div>
                      <div className="text-[10px] text-[#4A4D4A]">{r.tip}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#252625]">{r.tarihSaat}</div>
                      <div className="text-[10px] text-[#4A4D4A] mt-0.5">Onay bekliyor →</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Yaklaşan randevular */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-2 border-b border-dotted border-[#D4E4D8] pb-1 flex items-center justify-between">
              <span>Yaklaşan Randevular</span>
              <Link href="/danisan/randevular" className="text-[10px] text-[#4A4D4A] underline no-underline hover:text-[#252625]">
                Tümü →
              </Link>
            </div>
            {data.yaklasanRandevular.length === 0 ? (
              <div className="text-[12px] text-[#4A4D4A] py-3">Yaklaşan randevu yok.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {data.yaklasanRandevular.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border-[1.5px] border-[#D4E4D8] px-3 py-2.5 bg-white"
                  >
                    <div>
                      <div className="text-[12px] font-semibold text-[#252625]">{r.musteriAdi}</div>
                      <div className="text-[10px] text-[#4A4D4A]">{r.tip}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[11px] text-[#252625]">{r.tarihSaat}</div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 ${DURUM_PILL[r.durum] ?? "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]"}`}>
                        {DURUM_LABEL[r.durum] ?? r.durum}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Son yorumlar */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-2 border-b border-dotted border-[#D4E4D8] pb-1">
              Son Değerlendirmeler
            </div>
            {data.sonYorumlar.length === 0 ? (
              <div className="text-[12px] text-[#4A4D4A] py-3">Henüz değerlendirme yok.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.sonYorumlar.map((y) => (
                  <div key={y.id} className="border-[1.5px] border-[#D4E4D8] px-3 py-2.5 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#252625]">{y.musteriAdi}</span>
                      <div className="flex items-center gap-2">
                        <Yildiz puan={y.puan} />
                        <span className="text-[10px] text-[#4A4D4A]">{y.tarih}</span>
                      </div>
                    </div>
                    {y.yorum && (
                      <p className="text-[11px] text-[#4A4D4A] leading-relaxed line-clamp-2">
                        {y.yorum}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
