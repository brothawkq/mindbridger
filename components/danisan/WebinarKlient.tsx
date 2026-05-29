"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type WebinarDurum = "draft" | "published" | "cancelled" | "completed";

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  capacity: number;
  registered_count: number;
  status: WebinarDurum;
  cover_image_url: string | null;
  platform_commission_rate: number;
}

interface Props {
  webinarlar: Webinar[];
}

const DURUM_ETIKET: Record<WebinarDurum, string> = {
  draft: "Taslak",
  published: "Yayında",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

const DURUM_STIL: Record<WebinarDurum, string> = {
  draft: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  published: "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]",
  cancelled: "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]",
  completed: "border-[1.5px] border-[#325343] text-[#252625] dark:border-white dark:text-white",
};

function formatTarih(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")}.${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

export default function WebinarKlient({ webinarlar: baslangicWebinarlar }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [webinarlar, setWebinarlar] = useState<Webinar[]>(baslangicWebinarlar);
  const [modalAcik, setModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState("60");
  const [formPrice, setFormPrice] = useState("0");
  const [formCapacity, setFormCapacity] = useState("50");

  function modalAc() {
    setFormTitle(""); setFormDesc(""); setFormDate(""); setFormTime("10:00");
    setFormDuration("60"); setFormPrice("0"); setFormCapacity("50");
    setHata(null);
    setModalAcik(true);
  }

  async function webinarOlustur() {
    if (!formTitle.trim()) { setHata("Başlık zorunlu"); return; }
    if (!formDate) { setHata("Tarih zorunlu"); return; }
    setYukleniyor(true);
    setHata(null);
    try {
      const scheduled_at = new Date(`${formDate}T${formTime}:00`).toISOString();
      const res = await fetch("/api/webinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          scheduled_at,
          duration_minutes: parseInt(formDuration),
          price: parseFloat(formPrice),
          capacity: parseInt(formCapacity),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "İşlem başarısız");
      }
      setModalAcik(false);
      router.refresh();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setYukleniyor(false);
    }
  }

  async function durumGuncelle(webinarId: string, yeniDurum: "published" | "cancelled") {
    setYukleniyor(true);
    try {
      const url = yeniDurum === "published"
        ? `/api/webinar/${webinarId}/yayinla`
        : `/api/webinar/${webinarId}/iptal`;
      const res = await fetch(url, { method: "PUT" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "İşlem başarısız");
      }
      setWebinarlar((prev) =>
        prev.map((w) => (w.id === webinarId ? { ...w, status: yeniDurum } : w))
      );
    } catch (err) {
      setHata(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Araçlar</div>
          <h1 className="text-base font-bold text-[#252625] dark:text-white">Webinarlarım</h1>
        </div>
        <button
          onClick={modalAc}
          className="bg-[#A6DE9B] text-[#325343] text-xs font-bold px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 dark:bg-white dark:text-[#252625]"
        >
          + Yeni Webinar
        </button>
      </div>

      {hata && !modalAcik && (
        <div className="mb-4 p-3 border-l-2 border-[#325343] bg-[#F5F7F5] text-sm text-[#252625]">{hata}</div>
      )}

      {webinarlar.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-10 text-center text-sm text-[#4A4D4A]">
          Henüz webinar yok. Yeni webinar oluşturun.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {webinarlar.map((w, i) => {
              const doluluk = w.capacity > 0 ? Math.round((w.registered_count / w.capacity) * 100) : 0;
              const netFiyat = w.price * (1 - (w.platform_commission_rate ?? 20) / 100);
              return (
                <motion.div
                  key={w.id}
                  {...(prefersReduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04, duration: 0.15 } })}
                  whileHover={prefersReduced ? {} : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: { duration: 0.15 } }}
                  className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm text-[#252625] dark:text-white">{w.title}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.8px] px-1.5 py-0.5 ${DURUM_STIL[w.status]}`}>
                          {DURUM_ETIKET[w.status]}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4A4D4A] space-x-3">
                        <span>{formatTarih(w.scheduled_at)}</span>
                        <span>{w.duration_minutes} dk</span>
                        <span>{w.price === 0 ? "Ücretsiz" : `${w.price} TL`}</span>
                        {w.price > 0 && <span className="text-[#252625] dark:text-white">Net: {netFiyat.toFixed(0)} TL</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {w.status === "draft" && (
                        <button
                          onClick={() => durumGuncelle(w.id, "published")}
                          disabled={yukleniyor}
                          className="text-[11px] font-bold bg-[#A6DE9B] text-[#325343] px-2.5 py-1 hover:opacity-80 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
                        >
                          Yayınla
                        </button>
                      )}
                      {w.status === "published" && (
                        <button
                          onClick={() => durumGuncelle(w.id, "cancelled")}
                          disabled={yukleniyor}
                          className="text-[11px] border-[1.5px] border-[#325343] px-2.5 py-1 text-[#252625] hover:bg-[#F5F7F5] dark:border-white dark:text-white dark:hover:bg-[#333]"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#D4E4D8]">
                      <div
                        className="h-full bg-[#325343] dark:bg-white transition-all"
                        style={{ width: `${doluluk}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#4A4D4A] shrink-0">
                      {w.registered_count}/{w.capacity} kayıt
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Yeni Webinar Modal */}
      <AnimatePresence>
        {modalAcik && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalAcik(false); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="webinar-modal-title"
              className="bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#325343] dark:border-white w-full max-w-md p-6"
              {...(prefersReduced ? {} : { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.18 } })}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="webinar-modal-title" className="text-sm font-bold text-[#252625] dark:text-white">Yeni Webinar</h2>
                <button onClick={() => setModalAcik(false)} aria-label="Modalı kapat" className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none">×</button>
              </div>

              {hata && <div className="mb-3 p-2 bg-[#F5F7F5] border-l-2 border-[#325343] text-xs text-[#252625]">{hata}</div>}

              <div className="space-y-3">
                {[
                  { label: "Başlık *", el: <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Webinar başlığı" className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white" /> },
                  { label: "Açıklama", el: <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} placeholder="Kısa açıklama..." className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white resize-none" /> },
                  { label: "Tarih *", el: <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white" /> },
                  { label: "Saat", el: <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white" /> },
                ].map(({ label, el }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">{label}</label>
                    {el}
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Süre (dk)", value: formDuration, set: setFormDuration, type: "number", min: "15" },
                    { label: "Fiyat (TL)", value: formPrice, set: setFormPrice, type: "number", min: "0" },
                    { label: "Kapasite", value: formCapacity, set: setFormCapacity, type: "number", min: "1" },
                  ].map(({ label, value, set, type, min }) => (
                    <div key={label}>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">{label}</label>
                      <input
                        type={type}
                        value={value}
                        min={min}
                        onChange={(e) => set(e.target.value)}
                        className="w-full border-[1.5px] border-[#325343] px-2 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={webinarOlustur}
                  disabled={yukleniyor}
                  className="flex-1 bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
                >
                  {yukleniyor ? "Oluşturuluyor..." : "Oluştur (Taslak)"}
                </button>
                <button
                  onClick={() => setModalAcik(false)}
                  className="px-4 border-[1.5px] border-[#325343] text-sm text-[#252625] hover:bg-[#F5F7F5] dark:border-white dark:text-white dark:hover:bg-[#333]"
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
