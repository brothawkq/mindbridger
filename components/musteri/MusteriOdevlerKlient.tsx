"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type OdevDurum = "pending" | "completed" | "skipped";

export interface MusteriOdev {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: OdevDurum;
  completed_at: string | null;
  musteri_note: string | null;
  created_at: string;
  danisan_isim: string;
}

interface Props {
  odevler: MusteriOdev[];
}

const TAB_LABELS: { key: OdevDurum; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "completed", label: "Tamamlanan" },
  { key: "skipped", label: "Atlanan" },
];

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

function geciktiMi(due_date: string | null, status: OdevDurum): boolean {
  if (!due_date || status !== "pending") return false;
  return new Date(due_date) < new Date();
}

export default function MusteriOdevlerKlient({ odevler: ilkOdevler }: Props) {
  const prefersReduced = useReducedMotion();
  const [aktifTab, setAktifTab] = useState<OdevDurum>("pending");
  const [odevler, setOdevler] = useState<MusteriOdev[]>(ilkOdevler);

  // Tamamla modal state
  const [modalOdevId, setModalOdevId] = useState<string | null>(null);
  const [not, setNot] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const filtreli = odevler.filter((o) => o.status === aktifTab);

  const sayimlar: Record<OdevDurum, number> = {
    pending: odevler.filter((o) => o.status === "pending").length,
    completed: odevler.filter((o) => o.status === "completed").length,
    skipped: odevler.filter((o) => o.status === "skipped").length,
  };

  const handleTamamla = useCallback(async () => {
    if (!modalOdevId) return;
    setYukleniyor(true);
    setHata(null);

    try {
      const res = await fetch(`/api/odevler/${modalOdevId}/tamamla`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musteri_note: not || undefined }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setHata(data.error ?? "Bir hata oluştu.");
        return;
      }

      setOdevler((prev) =>
        prev.map((o) =>
          o.id === modalOdevId
            ? {
                ...o,
                status: "completed" as OdevDurum,
                completed_at: new Date().toISOString(),
                musteri_note: not || null,
              }
            : o
        )
      );
      setModalOdevId(null);
      setNot("");
      setAktifTab("completed");
    } catch {
      setHata("Bağlantı hatası.");
    } finally {
      setYukleniyor(false);
    }
  }, [modalOdevId, not]);

  return (
    <div className="px-6 py-5">
      {/* Tabs */}
      <div className="flex gap-0 border-b-[1.5px] border-[#325343] dark:border-white mb-5">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAktifTab(tab.key)}
            className={`px-4 py-2 text-[11px] font-bold tracking-[0.5px] uppercase transition-colors cursor-pointer border-none ${
              aktifTab === tab.key
                ? "bg-[#325343] dark:bg-white text-white dark:text-[#252625]"
                : "bg-transparent text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
            }`}
            style={{ fontFamily: "inherit" }}
          >
            {tab.label}
            {sayimlar[tab.key] > 0 && (
              <span
                className={`ml-1.5 text-[10px] font-bold ${
                  aktifTab === tab.key ? "text-white dark:text-[#252625]" : "text-[#4A4D4A]"
                }`}
              >
                ({sayimlar[tab.key]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={aktifTab}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
          className="flex flex-col gap-3"
        >
          {filtreli.length === 0 ? (
            <div className="text-[13px] text-[#4A4D4A] py-10 text-center">
              {aktifTab === "pending"
                ? "Bekleyen ödev yok. Harika!"
                : aktifTab === "completed"
                ? "Henüz tamamlanan ödev yok."
                : "Atlanan ödev yok."}
            </div>
          ) : (
            filtreli.map((odev, i) => {
              const gecikti = geciktiMi(odev.due_date, odev.status);
              return (
                <motion.div
                  key={odev.id}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.15, delay: prefersReduced ? 0 : i * 0.04 }}
                  className={`border-[1.5px] p-4 ${
                    odev.status === "pending" && !gecikti
                      ? "border-[#325343] dark:border-white"
                      : gecikti
                      ? "border-[#D4E4D8] dark:border-[#333] border-dashed"
                      : "border-[#D4E4D8] dark:border-[#333]"
                  } bg-white dark:bg-[#111]`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="font-bold text-[14px] text-[#252625] dark:text-white leading-snug">
                      {odev.title}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {gecikti && (
                        <span className="text-[9px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] px-2 py-[2px] text-[#4A4D4A] whitespace-nowrap">
                          GECİKTİ
                        </span>
                      )}
                      {odev.status === "completed" && (
                        <span className="text-[9px] font-bold border-[1.5px] border-[#325343] dark:border-white px-2 py-[2px] text-[#252625] dark:text-white whitespace-nowrap">
                          ✓ TAMAMLANDI
                        </span>
                      )}
                      {odev.status === "skipped" && (
                        <span className="text-[9px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] px-2 py-[2px] text-[#4A4D4A] whitespace-nowrap">
                          ATLAN DI
                        </span>
                      )}
                    </div>
                  </div>

                  {odev.description && (
                    <p className="text-[12px] text-[#424242] dark:text-[#4A4D4A] leading-relaxed mb-2">
                      {odev.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-[#4A4D4A] flex-wrap mb-2">
                    <span>Danışman: {odev.danisan_isim}</span>
                    {odev.due_date && (
                      <span>Son tarih: {formatTarih(odev.due_date)}</span>
                    )}
                    {odev.completed_at && (
                      <span>Tamamlandı: {formatTarih(odev.completed_at)}</span>
                    )}
                  </div>

                  {odev.musteri_note && (
                    <div className="border-[1.5px] border-dashed border-[#BDBDBD] px-3 py-2 text-[11px] text-[#4A4D4A] mb-2">
                      Notunuz: {odev.musteri_note}
                    </div>
                  )}

                  {odev.status === "pending" && (
                    <motion.button
                      onClick={() => {
                        setModalOdevId(odev.id);
                        setNot("");
                        setHata(null);
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.997 }}
                      className="mt-1 text-[11px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-4 py-1.5 hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                      style={{ fontFamily: "inherit" }}
                    >
                      Tamamla
                    </motion.button>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tamamla Modal */}
      <AnimatePresence>
        {modalOdevId && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOdevId(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="odev-tamamla-modal-title"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-[#111] border-[1.5px] border-[#325343] dark:border-white w-full max-w-md p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
                Ödevi Tamamla
              </div>
              <div id="odev-tamamla-modal-title" className="text-[16px] font-bold text-[#252625] dark:text-white mb-4">
                {odevler.find((o) => o.id === modalOdevId)?.title}
              </div>

              <div className="mb-4">
                <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1.5">
                  Danışmana Not (isteğe bağlı)
                </div>
                <textarea
                  value={not}
                  onChange={(e) => setNot(e.target.value.slice(0, 1000))}
                  placeholder="Bu ödevle ilgili düşüncelerinizi paylaşın..."
                  rows={4}
                  className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#444] dark:bg-[#1a1a1a] dark:text-white px-3 py-2 text-[12px] placeholder-[#BDBDBD] resize-none outline-none focus:border-[#325343] dark:focus:border-white transition-colors"
                  style={{ fontFamily: "inherit" }}
                />
                <div className="text-[10px] text-[#4A4D4A] text-right mt-0.5">
                  {not.length} / 1000
                </div>
              </div>

              {hata && (
                <div className="text-[11px] text-red-600 dark:text-red-400 mb-3">
                  ⚠ {hata}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setModalOdevId(null)}
                  className="flex-1 border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white text-[12px] font-bold py-2.5 hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  style={{ fontFamily: "inherit" }}
                >
                  İptal
                </button>
                <button
                  onClick={handleTamamla}
                  disabled={yukleniyor}
                  className="flex-1 bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold py-2.5 disabled:bg-[#BDBDBD] cursor-pointer disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "inherit" }}
                >
                  {yukleniyor ? "Kaydediliyor..." : "Tamamla"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
