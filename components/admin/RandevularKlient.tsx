"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AdminRandevuOzet, AdminRandevuListeResponse } from "@/types/admin";

const DURUM_TABS = [
  { key: "", label: "Tümü" },
  { key: "pending", label: "Bekleyen" },
  { key: "confirmed", label: "Onaylı" },
  { key: "completed", label: "Tamamlanan" },
  { key: "cancelled", label: "İptal" },
  { key: "no_show", label: "No-Show" },
] as const;

type DurumKey = (typeof DURUM_TABS)[number]["key"];

const DURUM_ETIKET: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "No-Show",
  rejected: "Reddedildi",
};

const SEANS_ETIKET: Record<string, string> = {
  bireysel: "Bireysel",
  asenkron: "Asenkron",
  grup: "Grup",
  cift_aile: "Çift/Aile",
  on_gorusme: "Ön Görüşme",
  supervizyon: "Süpervizyon",
};

const DURUM_STIL: Record<string, string> = {
  pending: "border-[#325343] text-[#252625]",
  confirmed: "bg-[#A6DE9B] text-[#325343]",
  completed: "border-[#325343] text-[#252625]",
  cancelled: "border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  no_show: "border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  rejected: "border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

function formatTL(n: number | null): string {
  if (n == null) return "-";
  return `${n.toLocaleString("tr-TR")} ₺`;
}

interface DetailModal {
  randevu: AdminRandevuOzet;
}

export default function RandevularKlient() {
  const reduced = useReducedMotion();

  const [durum, setDurum] = useState<DurumKey>("");
  const [sayfa, setSayfa] = useState(1);
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veri, setVeri] = useState<AdminRandevuListeResponse | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [detay, setDetay] = useState<DetailModal | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchVeri = useCallback(
    async (
      seciliDurum: string,
      seciliSayfa: number,
      bas: string,
      bit: string
    ) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setYukleniyor(true);
      setHata("");
      try {
        const params = new URLSearchParams({ sayfa: String(seciliSayfa) });
        if (seciliDurum) params.set("durum", seciliDurum);
        if (bas) params.set("baslangic", bas);
        if (bit) params.set("bitis", bit);

        const res = await fetch(`/api/admin/randevular?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Sunucu hatası");
        const json = (await res.json()) as AdminRandevuListeResponse;
        setVeri(json);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setHata("Veriler yüklenemedi. Lütfen tekrar deneyin.");
        }
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchVeri(durum, sayfa, baslangic, bitis);
  }, [durum, sayfa, baslangic, bitis, fetchVeri]);

  function tabDegistir(key: DurumKey) {
    setDurum(key);
    setSayfa(1);
  }

  const rowVariants = {
    hidden: { opacity: 0, y: reduced ? 0 : 5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduced ? 0 : i * 0.035, duration: 0.13 },
    }),
    exit: { opacity: 0, transition: { duration: 0.08 } },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Frame Header */}
      <div className="border-b-[1.5px] border-[#325343] bg-[#F5F7F5] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <span className="text-[12px] font-bold text-[#252625]">
          Randevu Yönetimi
        </span>
        <span className="border-[1.5px] border-[#325343] text-[10px] font-bold px-2 py-0.5">
          ADMIN
        </span>
      </div>

      {/* Status Tab Bar */}
      <div className="flex border-b border-[#D4E4D8] bg-white px-5 flex-shrink-0 overflow-x-auto">
        {DURUM_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => tabDegistir(t.key)}
            className={`px-4 py-2.5 text-[11px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              durum === t.key
                ? "border-[#325343] text-[#252625]"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="px-5 py-2.5 border-b border-[#D4E4D8] bg-white flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
          Tarih Aralığı
        </span>
        <input
          type="date"
          value={baslangic}
          onChange={(e) => { setBaslangic(e.target.value); setSayfa(1); }}
          className="border-[1.5px] border-[#325343] px-2 py-1 text-[11px] bg-white outline-none"
        />
        <span className="text-[#4A4D4A] text-[11px]">—</span>
        <input
          type="date"
          value={bitis}
          onChange={(e) => { setBitis(e.target.value); setSayfa(1); }}
          className="border-[1.5px] border-[#325343] px-2 py-1 text-[11px] bg-white outline-none"
        />
        {(baslangic || bitis) && (
          <button
            onClick={() => { setBaslangic(""); setBitis(""); setSayfa(1); }}
            className="text-[10px] text-[#4A4D4A] underline hover:text-[#252625] transition-colors"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {hata && (
          <p className="text-[12px] text-[#252625] mb-3 border-[1.5px] border-[#D4E4D8] px-3 py-2">
            ⚠ {hata}
          </p>
        )}

        {yukleniyor && !veri && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 bg-[#F5F7F5] border-[1.5px] border-[#D4E4D8] animate-pulse"
              />
            ))}
          </div>
        )}

        {veri && (
          <>
            <div className="text-[10px] text-[#4A4D4A] mb-2">
              {veri.toplam} randevu · Sayfa {veri.sayfa}/{veri.toplamSayfa}
            </div>

            <div className="border-[1.5px] border-[#D4E4D8] overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[820px]">
                <thead>
                  <tr className="bg-[#F5F7F5] border-b border-[#D4E4D8]">
                    {[
                      "Tarih & Saat",
                      "Müşteri",
                      "Danışman",
                      "Tür",
                      "Süre",
                      "Tutar",
                      "Durum",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <tbody key={durum + sayfa + baslangic + bitis}>
                    {veri.randevular.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-[11px] text-[#4A4D4A]"
                        >
                          Bu filtrede randevu bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      veri.randevular.map((r, i) => (
                        <motion.tr
                          key={r.id}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5] transition-colors cursor-pointer"
                          onClick={() => setDetay({ randevu: r })}
                        >
                          <td className="px-3 py-2 text-[#4A4D4A] whitespace-nowrap font-mono text-[10px]">
                            {r.scheduledAt}
                          </td>
                          <td className="px-3 py-2 font-bold text-[#252625] whitespace-nowrap">
                            {r.musteriAdi}
                          </td>
                          <td className="px-3 py-2 text-[#252625] whitespace-nowrap">
                            {r.danisanAdi}
                          </td>
                          <td className="px-3 py-2 text-[#4A4D4A] whitespace-nowrap">
                            {SEANS_ETIKET[r.sessionType] ?? r.sessionType}
                          </td>
                          <td className="px-3 py-2 text-[#4A4D4A] whitespace-nowrap">
                            {r.durationMinutes ? `${r.durationMinutes} dk` : "-"}
                          </td>
                          <td className="px-3 py-2 text-[#252625] whitespace-nowrap">
                            {formatTL(r.price)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-[0.5px] border px-1.5 py-0.5 ${
                                DURUM_STIL[r.status] ??
                                "border-[#D4E4D8] text-[#4A4D4A]"
                              }`}
                            >
                              {DURUM_ETIKET[r.status] ?? r.status}
                            </span>
                            {r.noShowCharged && (
                              <span className="ml-1 text-[9px] text-[#4A4D4A]">
                                ücret kesildi
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetay({ randevu: r });
                              }}
                              className="text-[10px] border-[1.5px] border-[#325343] px-1.5 py-0.5 hover:bg-[#325343] hover:text-white transition-colors"
                            >
                              Detay
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>

            {/* Pagination */}
            {veri.toplamSayfa > 1 && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setSayfa((s) => Math.max(1, s - 1))}
                  disabled={sayfa === 1}
                  className="border-[1.5px] border-[#325343] px-3 py-1 text-[11px] font-bold disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] hover:bg-[#F5F7F5] transition-colors"
                >
                  ← Önceki
                </button>
                <span className="text-[11px] text-[#4A4D4A]">
                  {sayfa} / {veri.toplamSayfa}
                </span>
                <button
                  onClick={() =>
                    setSayfa((s) => Math.min(veri.toplamSayfa, s + 1))
                  }
                  disabled={sayfa === veri.toplamSayfa}
                  className="border-[1.5px] border-[#325343] px-3 py-1 text-[11px] font-bold disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] hover:bg-[#F5F7F5] transition-colors"
                >
                  Sonraki →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detay && (
          <motion.div
            key="detay-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDetay(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-randevu-detay-title"
              initial={{ scale: reduced ? 1 : 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: reduced ? 1 : 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white border-[1.5px] border-[#325343] w-full max-w-md mx-4 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div id="admin-randevu-detay-title" className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A]">
                  Randevu Detayı
                </div>
                <button
                  onClick={() => setDetay(null)}
                  aria-label="Modalı kapat"
                  className="text-[#4A4D4A] hover:text-[#252625] transition-colors text-[14px]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                <DetayRow etiket="Tarih" deger={detay.randevu.scheduledAt} />
                <DetayRow etiket="Müşteri" deger={detay.randevu.musteriAdi} />
                <DetayRow etiket="Danışman" deger={detay.randevu.danisanAdi} />
                <DetayRow
                  etiket="Tür"
                  deger={
                    SEANS_ETIKET[detay.randevu.sessionType] ??
                    detay.randevu.sessionType
                  }
                />
                <DetayRow
                  etiket="Süre"
                  deger={
                    detay.randevu.durationMinutes
                      ? `${detay.randevu.durationMinutes} dk`
                      : "-"
                  }
                />
                <DetayRow
                  etiket="Tutar"
                  deger={formatTL(detay.randevu.price)}
                />
                <DetayRow
                  etiket="Durum"
                  deger={
                    DURUM_ETIKET[detay.randevu.status] ??
                    detay.randevu.status
                  }
                />
                {detay.randevu.cancellationReason && (
                  <DetayRow
                    etiket="İptal Gerekçesi"
                    deger={detay.randevu.cancellationReason}
                  />
                )}
                {detay.randevu.noShowCharged && (
                  <DetayRow etiket="No-Show" deger="Ücret kesildi" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-dotted border-[#D4E4D8]">
                <p className="text-[10px] text-[#4A4D4A] italic">
                  Anlaşmazlık yönetimi — Faz 6 devam adımlarında eklenecek.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetayRow({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] w-28 flex-shrink-0 mt-0.5">
        {etiket}
      </span>
      <span className="text-[12px] text-[#252625] flex-1 break-words">
        {deger}
      </span>
    </div>
  );
}
