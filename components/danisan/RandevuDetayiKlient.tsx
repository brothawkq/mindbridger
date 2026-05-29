"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Database } from "@/types/supabase";

type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
type SessionType = Database["public"]["Enums"]["session_type"];

interface Randevu {
  id: string;
  status: AppointmentStatus;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  is_recurring: boolean;
  is_sliding_scale: boolean;
  no_show_charged: boolean;
  notes_private: string | null;
  summary_shared: string | null;
  daily_room_name: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
}

interface Musteri {
  id: string;
  isim: string;
  avatarUrl: string | null;
  telefon: string | null;
}

interface Degerlendirme {
  id: string;
  rating: number;
  comment: string | null;
  review_reply: string | null;
  reply_at: string | null;
  is_visible: boolean;
  created_at: string;
}

interface Props {
  randevu: Randevu;
  musteri: Musteri;
  degerlendirme: Degerlendirme | null;
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

const STATUS_STIL: Record<AppointmentStatus, string> = {
  pending: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  confirmed: "border-[1.5px] border-[#325343] text-[#252625]",
  completed: "bg-[#A6DE9B] text-[#325343]",
  cancelled: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  no_show: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  rejected: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

function formatTarih(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-[14px] ${s <= rating ? "text-[#252625] dark:text-white" : "text-[#E0E0E0] dark:text-[#444]"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function RandevuDetayiKlient({ randevu, musteri, degerlendirme }: Props) {
  const prefersReduced = useReducedMotion();
  const [notlarPrivate, setNotlarPrivate] = useState(randevu.notes_private ?? "");
  const [ozet, setOzet] = useState(randevu.summary_shared ?? "");
  const [notlarKaydediliyor, setNotlarKaydediliyor] = useState(false);
  const [notlarMesaj, setNotlarMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);

  const [yanit, setYanit] = useState(degerlendirme?.review_reply ?? "");
  const [yanitKaydediliyor, setYanitKaydediliyor] = useState(false);
  const [yanitMesaj, setYanitMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [yanitKaydedildi, setYanitKaydedildi] = useState(!!degerlendirme?.review_reply);

  const [noShowYukleniyor, setNoShowYukleniyor] = useState(false);
  const [noShowMesaj, setNoShowMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [mevcutStatus, setMevcutStatus] = useState<AppointmentStatus>(randevu.status);

  const randevuGecmis = new Date(randevu.scheduled_at).getTime() < Date.now();
  const noShowGosterilebilir =
    mevcutStatus === "confirmed" && randevuGecmis;

  async function notlarKaydet() {
    setNotlarKaydediliyor(true);
    setNotlarMesaj(null);
    try {
      const res = await fetch(`/api/randevular/${randevu.id}/notlar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes_private: notlarPrivate, summary_shared: ozet }),
      });
      if (!res.ok) throw new Error();
      setNotlarMesaj({ tip: "ok", metin: "Notlar kaydedildi." });
    } catch {
      setNotlarMesaj({ tip: "hata", metin: "Notlar kaydedilemedi." });
    } finally {
      setNotlarKaydediliyor(false);
    }
  }

  async function yanitKaydet() {
    if (!degerlendirme) return;
    setYanitKaydediliyor(true);
    setYanitMesaj(null);
    try {
      const res = await fetch(`/api/degerlendirmeler/${degerlendirme.id}/yenit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_reply: yanit }),
      });
      if (!res.ok) throw new Error();
      setYanitMesaj({ tip: "ok", metin: "Yanıt kaydedildi." });
      setYanitKaydedildi(true);
    } catch {
      setYanitMesaj({ tip: "hata", metin: "Yanıt kaydedilemedi." });
    } finally {
      setYanitKaydediliyor(false);
    }
  }

  async function noShowIsaretle() {
    if (!noShowGosterilebilir) return;
    setNoShowYukleniyor(true);
    setNoShowMesaj(null);
    try {
      const res = await fetch(`/api/randevular/${randevu.id}/no-show`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "İşlem başarısız");
      }
      setMevcutStatus("no_show");
      setNoShowMesaj({ tip: "ok", metin: "No-show olarak işaretlendi." });
    } catch (e) {
      setNoShowMesaj({
        tip: "hata",
        metin: e instanceof Error ? e.message : "İşlem başarısız.",
      });
    } finally {
      setNoShowYukleniyor(false);
    }
  }

  return (
    <motion.div
      className="p-6 max-w-3xl mx-auto"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
    >
      {/* Geri Bağlantısı */}
      <Link
        href="/danisan/randevular"
        className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white underline mb-4 block"
      >
        ← Tüm Randevular
      </Link>

      {/* Başlık Kartı */}
      <div className="border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#1a1a1a] p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] font-bold uppercase tracking-[0.5px] px-2 py-1 ${STATUS_STIL[mevcutStatus]}`}
              >
                {STATUS_ETIKET[mevcutStatus]}
              </span>
              <span className="text-[10px] text-[#4A4D4A]">
                {SESSION_ETIKET[randevu.session_type]}
              </span>
              {randevu.is_recurring && (
                <span className="text-[9px] border-[1.5px] border-[#BDBDBD] text-[#4A4D4A] px-1 py-0.5">
                  TEKRARLAYAN
                </span>
              )}
            </div>
            <div className="text-[16px] font-bold text-[#252625] dark:text-white">
              {musteri.isim}
            </div>
            <div className="text-[12px] text-[#4A4D4A] mt-0.5">
              {formatTarih(randevu.scheduled_at)} · {randevu.duration_minutes} dk
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              ÜCRET
            </div>
            <div className="text-[18px] font-bold text-[#252625] dark:text-white">
              ₺{randevu.price.toLocaleString("tr-TR")}
            </div>
            {randevu.is_sliding_scale && (
              <div className="text-[9px] text-[#4A4D4A]">Kayan ücret</div>
            )}
          </div>
        </div>

        {/* Danışan Bağlantısı */}
        <div className="mt-3 pt-3 border-t border-[#D4E4D8] dark:border-[#333] flex items-center gap-2">
          <div className="w-6 h-6 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[10px] font-bold text-[#252625] dark:text-white">
            {musteri.isim.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[12px] text-[#252625] dark:text-white">
              {musteri.isim}
            </span>
            {musteri.telefon && (
              <span className="text-[11px] text-[#4A4D4A] ml-2">
                {musteri.telefon}
              </span>
            )}
          </div>
          <Link
            href={`/danisan/danisanlar/${musteri.id}`}
            className="ml-auto text-[10px] text-[#252625] dark:text-white underline"
          >
            Profili gör
          </Link>
        </div>
      </div>

      {/* İptal Bilgisi */}
      <AnimatePresence>
        {(mevcutStatus === "cancelled" || mevcutStatus === "rejected") &&
          randevu.cancellation_reason && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-[1.5px] border-dashed border-[#BDBDBD] p-3 mb-4"
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                İPTAL NEDENİ
              </div>
              <div className="text-[12px] text-[#252625] dark:text-white">
                {randevu.cancellation_reason}
              </div>
              {randevu.cancelled_at && (
                <div className="text-[10px] text-[#4A4D4A] mt-1">
                  {formatTarih(randevu.cancelled_at)}
                </div>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* No-Show İşlemi */}
      <AnimatePresence>
        {noShowGosterilebilir && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-[1.5px] border-dashed border-[#BDBDBD] p-3 mb-4 flex items-center justify-between gap-3"
          >
            <div>
              <div className="text-[12px] text-[#252625] dark:text-white font-bold">
                Danışan gelmedi mi?
              </div>
              <div className="text-[10px] text-[#4A4D4A]">
                No-show olarak işaretleme ücret kesintisini tetikler.
              </div>
            </div>
            <button
              onClick={noShowIsaretle}
              disabled={noShowYukleniyor}
              className="text-[11px] font-bold uppercase tracking-[0.5px] border-[1.5px] border-[#325343] dark:border-[#555] text-[#252625] dark:text-white px-3 py-2 hover:bg-[#325343] hover:text-white transition-colors disabled:opacity-50"
            >
              {noShowYukleniyor ? "İşleniyor..." : "No-Show İşaretle"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {noShowMesaj && (
        <div
          className={`text-[11px] mb-3 px-3 py-2 border ${noShowMesaj.tip === "ok" ? "border-[#325343] text-[#252625]" : "border-dashed border-[#BDBDBD] text-[#4A4D4A]"}`}
        >
          {noShowMesaj.metin}
        </div>
      )}

      {/* Seans Notları */}
      <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] mb-4">
        <div className="px-4 py-2 bg-[#F5F7F5] dark:bg-[#111] border-b border-[#D4E4D8] dark:border-[#333]">
          <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625] dark:text-white">
            Seans Notları
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
              Özel Notlar (sadece siz görebilirsiniz)
            </label>
            <textarea
              value={notlarPrivate}
              onChange={(e) => setNotlarPrivate(e.target.value)}
              rows={4}
              maxLength={5000}
              className="w-full border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#0a0a0a] text-[13px] text-[#252625] dark:text-white px-3 py-2 resize-none outline-none"
              placeholder="Seans sırasında aldığınız klinik notlar..."
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
              Paylaşılan Özet (danışan da görebilir)
            </label>
            <textarea
              value={ozet}
              onChange={(e) => setOzet(e.target.value)}
              rows={3}
              maxLength={5000}
              className="w-full border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#0a0a0a] text-[13px] text-[#252625] dark:text-white px-3 py-2 resize-none outline-none"
              placeholder="Danışanla paylaşmak istediğiniz seans özeti..."
            />
          </div>

          <div className="flex items-center justify-between">
            <AnimatePresence>
              {notlarMesaj && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-[11px] ${notlarMesaj.tip === "ok" ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"}`}
                >
                  {notlarMesaj.metin}
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={notlarKaydet}
              disabled={notlarKaydediliyor}
              className="ml-auto text-[11px] font-bold uppercase tracking-[0.5px] bg-[#A6DE9B] text-[#325343] px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
            >
              {notlarKaydediliyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      {/* Değerlendirme */}
      {degerlendirme && (
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] mb-4">
          <div className="px-4 py-2 bg-[#F5F7F5] dark:bg-[#111] border-b border-[#D4E4D8] dark:border-[#333]">
            <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625] dark:text-white">
              Danışan Değerlendirmesi
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <StarRating rating={degerlendirme.rating} />
              <span className="text-[12px] font-bold text-[#252625] dark:text-white">
                {degerlendirme.rating}/5
              </span>
              <span className="text-[10px] text-[#4A4D4A]">
                {formatTarih(degerlendirme.created_at)}
              </span>
              {!degerlendirme.is_visible && (
                <span className="text-[9px] border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-1 py-0.5">
                  GİZLİ
                </span>
              )}
            </div>
            {degerlendirme.comment && (
              <p className="text-[13px] text-[#252625] dark:text-white mb-4">
                {degerlendirme.comment}
              </p>
            )}

            {/* Yanıt Alanı */}
            {yanitKaydedildi && yanit && !yanitMesaj ? (
              <div className="border-l-2 border-[#325343] dark:border-[#555] pl-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                  YANITINIZ
                </div>
                <p className="text-[12px] text-[#252625] dark:text-white">{yanit}</p>
                <button
                  onClick={() => setYanitKaydedildi(false)}
                  className="text-[10px] underline text-[#4A4D4A] mt-2"
                >
                  Düzenle
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
                  {degerlendirme.review_reply ? "YANITINIZI DÜZENLEYİN" : "YANIT YAZ"}
                </label>
                <textarea
                  value={yanit}
                  onChange={(e) => setYanit(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#0a0a0a] text-[13px] text-[#252625] dark:text-white px-3 py-2 resize-none outline-none"
                  placeholder="Değerlendirmeye yanıt yazın..."
                />
                <div className="flex items-center justify-between mt-2">
                  <AnimatePresence>
                    {yanitMesaj && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`text-[11px] ${yanitMesaj.tip === "ok" ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"}`}
                      >
                        {yanitMesaj.metin}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={yanitKaydet}
                    disabled={yanitKaydediliyor || !yanit.trim()}
                    className="ml-auto text-[11px] font-bold uppercase tracking-[0.5px] bg-[#A6DE9B] text-[#325343] px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
                  >
                    {yanitKaydediliyor ? "Kaydediliyor..." : "Yanıtı Kaydet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meta Bilgi */}
      <div className="text-[10px] text-[#4A4D4A] space-y-0.5">
        <div>Randevu ID: {randevu.id}</div>
        <div>Oluşturulma: {formatTarih(randevu.created_at)}</div>
      </div>
    </motion.div>
  );
}
