"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Database } from "@/types/supabase";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
type SessionType = Database["public"]["Enums"]["session_type"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Musteri {
  id: string;
  isim: string;
  avatarUrl: string | null;
  telefon: string | null;
  churnRiskScore: number;
  kayitTarihi: string;
  sonGirisTarihi: string | null;
}

interface RandevuItem {
  id: string;
  status: AppointmentStatus;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  summary_shared: string | null;
  notes_private: string | null;
}

interface OdevItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  completed_at: string | null;
  musteri_note: string | null;
}

interface GunlukKayit {
  id: string;
  date: string;
  mood: number | null;
  mood_emoji: string | null;
  note: string | null;
  created_at: string;
}

interface Props {
  musteri: Musteri;
  randevular: RandevuItem[];
  odevler: OdevItem[];
  gunlukKayitlar: GunlukKayit[];
}

const STATUS_ETIKET: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
  rejected: "Reddedildi",
};

const SESSION_ETIKET: Record<SessionType, string> = {
  bireysel: "Bireysel",
  asenkron: "Asenkron",
  grup: "Grup",
  cift_aile: "Çift/Aile",
  on_gorusme: "Ön Görüşme",
  supervizyon: "Süpervizyon",
};

const TASK_ETIKET: Record<TaskStatus, string> = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
  skipped: "Atlandı",
};

function formatTarih(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

function formatTarihSaat(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const MOOD_EMOJI: Record<number, string> = {
  1: "😢",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😊",
};

type Sekme = "randevular" | "odevler" | "gunluk";

export default function DanisanDetayiKlient({ musteri, randevular, odevler, gunlukKayitlar }: Props) {
  const prefersReduced = useReducedMotion();
  const [aktifSekme, setAktifSekme] = useState<Sekme>("randevular");
  const [acikRandevuId, setAcikRandevuId] = useState<string | null>(null);

  const tamamlanan = randevular.filter((r) => r.status === "completed");
  const toplamGelir = tamamlanan.reduce((s, r) => s + r.price, 0);
  const ortalamaFiyat =
    tamamlanan.length > 0 ? Math.round(toplamGelir / tamamlanan.length) : 0;

  const churnRenk =
    musteri.churnRiskScore >= 70
      ? "text-[#252625] dark:text-white font-bold"
      : musteri.churnRiskScore >= 40
        ? "text-[#4A4D4A]"
        : "text-[#4A4D4A]";

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
    >
      {/* Geri */}
      <Link
        href="/danisan/danisanlar"
        className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white underline mb-4 block"
      >
        ← Danışanlarım
      </Link>

      {/* Profil Kartı */}
      <div className="border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#1a1a1a] p-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[18px] font-bold text-[#252625] dark:text-white">
            {musteri.isim.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-[#252625] dark:text-white">
              {musteri.isim}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-[#4A4D4A]">
              {musteri.telefon && <span>{musteri.telefon}</span>}
              <span>Kayıt: {formatTarih(musteri.kayitTarihi)}</span>
              {musteri.sonGirisTarihi && (
                <span>Son giriş: {formatTarih(musteri.sonGirisTarihi)}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              CHURN RİSKİ
            </div>
            <div className={`text-[20px] font-bold ${churnRenk}`}>
              %{musteri.churnRiskScore}
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="mt-3 pt-3 border-t border-[#D4E4D8] dark:border-[#333] grid grid-cols-4 gap-3">
          {[
            { etiket: "TOPLAM SEANS", deger: randevular.length },
            { etiket: "TAMAMLANAN", deger: tamamlanan.length },
            {
              etiket: "TOPLAM GELİR",
              deger: `₺${toplamGelir.toLocaleString("tr-TR")}`,
            },
            {
              etiket: "ORT. ÜCRET",
              deger: `₺${ortalamaFiyat.toLocaleString("tr-TR")}`,
            },
          ].map(({ etiket, deger }) => (
            <div key={etiket}>
              <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
                {etiket}
              </div>
              <div className="text-[14px] font-bold text-[#252625] dark:text-white">
                {deger}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sekme Çubuğu */}
      <div className="flex border-b border-[#D4E4D8] dark:border-[#333] mb-4">
        {(
          [
            ["randevular", `Randevular (${randevular.length})`],
            ["odevler", `Ödevler (${odevler.length})`],
            ["gunluk", `Günlük (${gunlukKayitlar.length})`],
          ] as const
        ).map(([sekme, etiket]) => (
          <button
            key={sekme}
            onClick={() => setAktifSekme(sekme)}
            className={`text-[11px] font-bold uppercase tracking-[0.8px] px-4 py-2.5 border-b-2 transition-colors ${
              aktifSekme === sekme
                ? "border-[#325343] dark:border-white text-[#252625] dark:text-white"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
            }`}
          >
            {etiket}
          </button>
        ))}
      </div>

      {/* Randevular Sekmesi */}
      <AnimatePresence mode="wait">
        {aktifSekme === "randevular" && (
          <motion.div
            key="randevular"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {randevular.length === 0 ? (
              <EmptyState metin="Henüz randevu yok." />
            ) : (
              <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
                {randevular.map((r) => (
                  <div key={r.id}>
                    <button
                      onClick={() =>
                        setAcikRandevuId(acikRandevuId === r.id ? null : r.id)
                      }
                      className="w-full grid grid-cols-[1fr_100px_80px_80px_20px] items-center px-4 py-3 border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors text-left"
                    >
                      <div className="text-[12px] text-[#252625] dark:text-white">
                        {formatTarihSaat(r.scheduled_at)}
                      </div>
                      <div className="text-[11px] text-[#252625] dark:text-white">
                        {SESSION_ETIKET[r.session_type]}
                      </div>
                      <div className="text-[11px] text-[#252625] dark:text-white">
                        {r.duration_minutes} dk
                      </div>
                      <div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-[0.5px] px-1.5 py-0.5 ${
                            r.status === "completed"
                              ? "bg-[#A6DE9B] text-[#325343]"
                              : "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]"
                          }`}
                        >
                          {STATUS_ETIKET[r.status]}
                        </span>
                      </div>
                      <div className="text-[#4A4D4A] text-center">
                        {acikRandevuId === r.id ? "▲" : "▼"}
                      </div>
                    </button>

                    <AnimatePresence>
                      {acikRandevuId === r.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-[#F5F7F5] dark:bg-[#111] border-b border-[#D4E4D8] dark:border-[#333] space-y-3">
                            {r.summary_shared && (
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                                  PAYLAŞILAN ÖZET
                                </div>
                                <p className="text-[12px] text-[#252625] dark:text-white whitespace-pre-wrap">
                                  {r.summary_shared}
                                </p>
                              </div>
                            )}
                            {r.notes_private && (
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                                  ÖZEL NOTLAR
                                </div>
                                <p className="text-[12px] text-[#252625] dark:text-white whitespace-pre-wrap">
                                  {r.notes_private}
                                </p>
                              </div>
                            )}
                            {!r.summary_shared && !r.notes_private && (
                              <p className="text-[12px] text-[#4A4D4A]">
                                Bu randevu için not girilmemiş.
                              </p>
                            )}
                            <div>
                              <Link
                                href={`/danisan/randevular/${r.id}`}
                                className="text-[10px] underline text-[#252625] dark:text-white"
                              >
                                Randevu detayına git →
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Ödevler Sekmesi */}
        {aktifSekme === "odevler" && (
          <motion.div
            key="odevler"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {odevler.length === 0 ? (
              <EmptyState metin="Henüz ödev atanmamış." />
            ) : (
              <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
                {odevler.map((o) => (
                  <div
                    key={o.id}
                    className="px-4 py-3 border-b border-[#D4E4D8] dark:border-[#333]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#252625] dark:text-white">
                          {o.title}
                        </div>
                        {o.description && (
                          <div className="text-[11px] text-[#4A4D4A] mt-0.5">
                            {o.description}
                          </div>
                        )}
                        {o.musteri_note && (
                          <div className="mt-1.5 border-l-2 border-[#D4E4D8] dark:border-[#444] pl-2">
                            <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
                              DANIŞAN NOTU
                            </div>
                            <div className="text-[11px] text-[#252625] dark:text-white">
                              {o.musteri_note}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-[0.5px] px-1.5 py-0.5 ${
                            o.status === "completed"
                              ? "bg-[#A6DE9B] text-[#325343]"
                              : o.status === "skipped"
                                ? "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]"
                                : "border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A]"
                          }`}
                        >
                          {TASK_ETIKET[o.status]}
                        </span>
                        {o.due_date && (
                          <div className="text-[10px] text-[#4A4D4A] mt-1">
                            Son: {formatTarih(o.due_date)}
                          </div>
                        )}
                        {o.completed_at && (
                          <div className="text-[10px] text-[#4A4D4A]">
                            Tamamlandı: {formatTarih(o.completed_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Günlük Kayıtlar Sekmesi */}
        {aktifSekme === "gunluk" && (
          <motion.div
            key="gunluk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {gunlukKayitlar.length === 0 ? (
              <EmptyState metin="Danışan herhangi bir günlük kaydını sizinle paylaşmamış." />
            ) : (
              <div className="space-y-2">
                {gunlukKayitlar.map((g) => (
                  <div
                    key={g.id}
                    className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                        {formatTarih(g.date)}
                      </div>
                      {g.mood !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-[16px]">
                            {g.mood_emoji ?? MOOD_EMOJI[g.mood] ?? ""}
                          </span>
                          <span className="text-[10px] text-[#4A4D4A]">
                            {g.mood}/5
                          </span>
                        </div>
                      )}
                    </div>
                    {g.note && (
                      <p className="text-[12px] text-[#252625] dark:text-white whitespace-pre-wrap">
                        {g.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState({ metin }: { metin: string }) {
  return (
    <div className="border border-dashed border-[#D4E4D8] dark:border-[#333] p-10 text-center text-[#4A4D4A] text-[13px]">
      {metin}
    </div>
  );
}
