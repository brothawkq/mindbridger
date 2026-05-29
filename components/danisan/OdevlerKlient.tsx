"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type OdevDurum = "pending" | "completed" | "skipped";

interface OdevMusteri {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Odev {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: OdevDurum;
  completed_at: string | null;
  musteri_note: string | null;
  file_url: string | null;
  created_at: string;
  randevu_id: string | null;
  profiles: OdevMusteri | null;
}

interface Danisan {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  odevler: Odev[];
  danisanlar: Danisan[];
  toplam: number;
}

const DURUM_ETIKET: Record<OdevDurum, string> = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
  skipped: "Atlandı",
};
const DURUM_STIL: Record<OdevDurum, string> = {
  pending: "border-[1.5px] border-[#325343] text-[#252625] dark:border-white dark:text-white",
  completed: "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]",
  skipped: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

function formatTarih(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

export default function OdevlerKlient({ odevler: baslangicOdevler, danisanlar, toplam }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [durumFiltre, setDurumFiltre] = useState<OdevDurum | "hepsi">("hepsi");
  const [yeniModalAcik, setYeniModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [arama, setArama] = useState("");

  const [yeniTitle, setYeniTitle] = useState("");
  const [yeniDesc, setYeniDesc] = useState("");
  const [yeniDueDate, setYeniDueDate] = useState("");
  const [secilenMusteri, setSecilenMusteri] = useState("");

  const goruntelenecek = baslangicOdevler.filter((o) => {
    if (durumFiltre !== "hepsi" && o.status !== durumFiltre) return false;
    if (arama && !o.title.toLowerCase().includes(arama.toLowerCase())) return false;
    return true;
  });

  async function odevGonder() {
    if (!yeniTitle.trim()) { setHata("Başlık zorunlu"); return; }
    if (!secilenMusteri) { setHata("Müşteri seçilmeli"); return; }
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/odevler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_id: secilenMusteri,
          title: yeniTitle.trim(),
          description: yeniDesc.trim() || undefined,
          due_date: yeniDueDate || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "İşlem başarısız");
      }
      setYeniModalAcik(false);
      setYeniTitle("");
      setYeniDesc("");
      setYeniDueDate("");
      setSecilenMusteri("");
      router.refresh();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setYukleniyor(false);
    }
  }

  const durumTablar: { value: OdevDurum | "hepsi"; label: string }[] = [
    { value: "hepsi", label: `Tümü (${toplam})` },
    { value: "pending", label: "Bekliyor" },
    { value: "completed", label: "Tamamlandı" },
    { value: "skipped", label: "Atlandı" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Araçlar</div>
          <h1 className="text-base font-bold text-[#252625] dark:text-white">Ödevler</h1>
        </div>
        <button
          onClick={() => setYeniModalAcik(true)}
          className="bg-[#A6DE9B] text-[#325343] text-xs font-bold px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 dark:bg-white dark:text-[#252625]"
        >
          + Ödev Gönder
        </button>
      </div>

      {/* Durum Tabları */}
      <div className="flex gap-1 mb-4 border-b border-[#D4E4D8] dark:border-[#333] overflow-x-auto">
        {durumTablar.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setDurumFiltre(tab.value)}
            className={`px-3 py-2 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${
              durumFiltre === tab.value
                ? "border-[#325343] text-[#252625] dark:border-white dark:text-white"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Arama */}
      <input
        type="text"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        placeholder="Ödev adında ara..."
        className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm mb-4 bg-white dark:bg-[#111] dark:text-white dark:border-white"
      />

      {goruntelenecek.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-10 text-center text-sm text-[#4A4D4A]">
          Ödev yok.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {goruntelenecek.map((odev, i) => {
              const musteriIsim = odev.profiles
                ? `${odev.profiles.first_name} ${odev.profiles.last_name}`
                : "—";
              const gecikti = odev.status === "pending" && odev.due_date && new Date(odev.due_date) < new Date();
              return (
                <motion.div
                  key={odev.id}
                  {...(prefersReduced ? {} : {
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: i * 0.04, duration: 0.15 },
                  })}
                  whileHover={prefersReduced ? {} : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: { duration: 0.15 } }}
                  className={`border-[1.5px] bg-white dark:bg-[#1a1a1a] p-4 ${
                    gecikti ? "border-[#325343]" : "border-[#D4E4D8] dark:border-[#333]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-[#252625] dark:text-white">{odev.title}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.8px] px-1.5 py-0.5 ${DURUM_STIL[odev.status]}`}>
                          {DURUM_ETIKET[odev.status]}
                        </span>
                        {gecikti && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#252625] dark:text-white">
                            ⚠ Gecikti
                          </span>
                        )}
                      </div>
                      {odev.description && (
                        <p className="text-xs text-[#4A4D4A] mb-1 line-clamp-2">{odev.description}</p>
                      )}
                      <div className="text-[10px] text-[#4A4D4A] space-x-3">
                        <span>Müşteri: {musteriIsim}</span>
                        {odev.due_date && <span>Son: {formatTarih(odev.due_date)}</span>}
                        {odev.completed_at && <span>Tamamlandı: {formatTarih(odev.completed_at)}</span>}
                      </div>
                      {odev.musteri_note && (
                        <div className="mt-2 p-2 bg-[#F5F7F5] dark:bg-[#111] text-xs text-[#252625] dark:text-white border-l-2 border-[#BDBDBD]">
                          <span className="text-[10px] text-[#4A4D4A] block mb-0.5">Müşteri notu:</span>
                          {odev.musteri_note}
                        </div>
                      )}
                    </div>
                    {odev.file_url && (
                      <a
                        href={odev.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#252625] underline shrink-0 dark:text-white"
                      >
                        Dosya
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Yeni Ödev Modal */}
      <AnimatePresence>
        {yeniModalAcik && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setYeniModalAcik(false); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="odev-modal-title"
              className="bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#325343] dark:border-white w-full max-w-md p-6"
              {...(prefersReduced ? {} : { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.18 } })}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="odev-modal-title" className="text-sm font-bold text-[#252625] dark:text-white">Ödev Gönder</h2>
                <button onClick={() => setYeniModalAcik(false)} aria-label="Modalı kapat" className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none">×</button>
              </div>

              {hata && <div className="mb-3 p-2 bg-[#F5F7F5] border-l-2 border-[#325343] text-xs text-[#252625]">{hata}</div>}

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Müşteri *</label>
                  <select
                    value={secilenMusteri}
                    onChange={(e) => setSecilenMusteri(e.target.value)}
                    className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
                  >
                    <option value="">Seçin...</option>
                    {danisanlar.map((d) => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Başlık *</label>
                  <input
                    type="text"
                    value={yeniTitle}
                    onChange={(e) => setYeniTitle(e.target.value)}
                    placeholder="Ödev başlığı"
                    className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Açıklama</label>
                  <textarea
                    value={yeniDesc}
                    onChange={(e) => setYeniDesc(e.target.value)}
                    rows={3}
                    placeholder="Ödev açıklaması..."
                    className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Son Tarih</label>
                  <input
                    type="date"
                    value={yeniDueDate}
                    onChange={(e) => setYeniDueDate(e.target.value)}
                    className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={odevGonder}
                  disabled={yukleniyor}
                  className="flex-1 bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
                >
                  {yukleniyor ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button
                  onClick={() => setYeniModalAcik(false)}
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
