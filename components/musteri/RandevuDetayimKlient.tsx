"use client";

import { useState } from "react";
import { useReducedMotion, motion } from "framer-motion";
import Link from "next/link";

type Durum = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rejected";

interface DanisanBilgi {
  id: string;
  slug: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface MevcutYorum {
  id: string;
  rating: number;
  comment: string | null;
  review_reply: string | null;
}

export interface RandevuDetayi {
  id: string;
  scheduled_at: string;
  status: Durum;
  session_type: string;
  duration_minutes: number;
  price: number;
  summary_shared: string | null;
  cancellation_reason: string | null;
  daily_room_name: string | null;
  danisanBilgi: DanisanBilgi | null;
  mevcutYorum: MevcutYorum | null;
}

interface Props {
  randevu: RandevuDetayi;
}

const DURUM_ETIKET: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
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

function formatTarih(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")}.${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function videoAktif(scheduledAt: string, roomName: string | null): boolean {
  if (!roomName) return false;
  const randevuZamani = new Date(scheduledAt).getTime();
  const simdi = Date.now();
  return simdi >= randevuZamani - 10 * 60 * 1000 && simdi <= randevuZamani + 90 * 60 * 1000;
}

export default function RandevuDetayimKlient({ randevu }: Props) {
  const reduced = useReducedMotion();

  const [iptalAcik, setIptalAcik] = useState(false);
  const [iptalSebebi, setIptalSebebi] = useState("");
  const [iptalYukleniyor, setIptalYukleniyor] = useState(false);
  const [iptalMesaj, setIptalMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [iptalEdildi, setIptalEdildi] = useState(false);

  const [yorumPuan, setYorumPuan] = useState(0);
  const [yorumMetin, setYorumMetin] = useState("");
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);
  const [yorumMesaj, setYorumMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  const simdi = new Date();
  const randevuGelecek = new Date(randevu.scheduled_at) > simdi;
  const iptalEdilebilir =
    !iptalEdildi &&
    (randevu.status === "pending" || randevu.status === "confirmed") &&
    randevuGelecek;
  const yorumYapilebilir =
    randevu.status === "completed" && !randevu.mevcutYorum && !gonderildi;

  async function iptalEt() {
    if (!iptalSebebi.trim()) {
      setIptalMesaj({ tip: "hata", metin: "İptal sebebi zorunludur." });
      return;
    }
    setIptalYukleniyor(true);
    setIptalMesaj(null);
    try {
      const res = await fetch(`/api/randevular/${randevu.id}/iptal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellation_reason: iptalSebebi }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "İptal başarısız");
      }
      setIptalMesaj({ tip: "ok", metin: "Randevu iptal edildi." });
      setIptalEdildi(true);
      setIptalAcik(false);
    } catch (err) {
      setIptalMesaj({
        tip: "hata",
        metin: err instanceof Error ? err.message : "İptal başarısız.",
      });
    } finally {
      setIptalYukleniyor(false);
    }
  }

  async function yorumGonder() {
    if (yorumPuan === 0) {
      setYorumMesaj({ tip: "hata", metin: "Lütfen bir puan seçin." });
      return;
    }
    setYorumYukleniyor(true);
    setYorumMesaj(null);
    try {
      const res = await fetch("/api/degerlendirmeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          randevu_id: randevu.id,
          rating: yorumPuan,
          comment: yorumMetin.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Gönderilemedi");
      }
      setYorumMesaj({ tip: "ok", metin: "Değerlendirmeniz gönderildi. Teşekkürler!" });
      setGonderildi(true);
    } catch (err) {
      setYorumMesaj({
        tip: "hata",
        metin: err instanceof Error ? err.message : "Gönderme başarısız.",
      });
    } finally {
      setYorumYukleniyor(false);
    }
  }

  const danisanAdi = randevu.danisanBilgi
    ? `${randevu.danisanBilgi.first_name ?? ""} ${randevu.danisanBilgi.last_name ?? ""}`.trim()
    : "Danışman";

  return (
    <div className="p-6 max-w-2xl w-full">
      <div className="mb-1">
        <Link href="/panelim/randevularim" className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white">
          ← Randevularım
        </Link>
      </div>
      <div className="mb-5">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">
          Randevu Detayı
        </div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">
          {formatTarih(randevu.scheduled_at)}
        </h1>
      </div>

      {/* Randevu Bilgileri */}
      <motion.section
        initial={reduced ? {} : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-4"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-sm font-bold text-[#252625] dark:text-white mb-0.5">
              {randevu.danisanBilgi?.slug ? (
                <Link
                  href={`/danismanlar/${randevu.danisanBilgi.slug}`}
                  className="hover:underline"
                >
                  {danisanAdi}
                </Link>
              ) : (
                danisanAdi
              )}
            </div>
            <div className="text-[11px] text-[#4A4D4A]">
              {randevu.danisanBilgi?.title ?? "Danışman"}
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase border-[1.5px] border-[#325343] dark:border-white px-1.5 py-0.5 text-[#252625] dark:text-white">
            {iptalEdildi ? "İptal" : (DURUM_ETIKET[randevu.status] ?? randevu.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-[11px]">
          <div>
            <span className="text-[#4A4D4A]">Tarih/Saat:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {formatTarih(randevu.scheduled_at)}
            </span>
          </div>
          <div>
            <span className="text-[#4A4D4A]">Süre:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {randevu.duration_minutes} dk
            </span>
          </div>
          <div>
            <span className="text-[#4A4D4A]">Tür:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {SEANS_ETIKET[randevu.session_type] ?? randevu.session_type}
            </span>
          </div>
          <div>
            <span className="text-[#4A4D4A]">Ücret:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {randevu.price > 0 ? `${randevu.price} TL` : "Ücretsiz"}
            </span>
          </div>
        </div>

        {randevu.cancellation_reason && (
          <div className="mt-3 pt-3 border-t border-[#D4E4D8] dark:border-[#333] text-[11px] text-[#4A4D4A]">
            <span className="font-bold text-[#252625] dark:text-white">İptal Sebebi: </span>
            {randevu.cancellation_reason}
          </div>
        )}
      </motion.section>

      {/* Video Butonu */}
      {videoAktif(randevu.scheduled_at, randevu.daily_room_name) && (
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="mb-4"
        >
          <Link
            href={`/api/video/token/${randevu.id}`}
            className="block w-full bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-sm font-bold py-3 text-center hover:opacity-90"
          >
            Görüşmeye Katıl →
          </Link>
        </motion.div>
      )}

      {/* Seans Notu */}
      {randevu.summary_shared && (
        <motion.section
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-4"
        >
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-2">
            Seans Özeti
          </div>
          <p className="text-sm text-[#252625] dark:text-white leading-relaxed whitespace-pre-line">
            {randevu.summary_shared}
          </p>
        </motion.section>
      )}

      {/* İptal Bölümü */}
      {iptalEdilebilir && (
        <motion.section
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-4"
        >
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3">
            Randevuyu İptal Et
          </div>
          {!iptalAcik ? (
            <button
              onClick={() => setIptalAcik(true)}
              className="text-[11px] border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-3 py-1.5 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              İptal İste
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={iptalSebebi}
                onChange={(e) => setIptalSebebi(e.target.value)}
                placeholder="İptal sebebini belirtin…"
                rows={3}
                className="w-full border-[1.5px] border-[#325343] dark:border-white px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={iptalEt}
                  disabled={iptalYukleniyor}
                  className="text-[11px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-4 py-2 hover:opacity-90 disabled:opacity-50"
                >
                  {iptalYukleniyor ? "İptal Ediliyor…" : "Onayla"}
                </button>
                <button
                  onClick={() => { setIptalAcik(false); setIptalSebebi(""); setIptalMesaj(null); }}
                  className="text-[11px] text-[#4A4D4A] px-4 py-2 border-[1.5px] border-[#D4E4D8] dark:border-[#333] hover:text-[#252625] dark:hover:text-white"
                >
                  Vazgeç
                </button>
              </div>
              {iptalMesaj && (
                <div
                  className={`text-xs p-2 border-l-2 ${
                    iptalMesaj.tip === "ok"
                      ? "border-[#325343] bg-[#F5F7F5] text-[#252625]"
                      : "border-red-500 bg-red-50 text-red-700"
                  }`}
                >
                  {iptalMesaj.metin}
                </div>
              )}
            </div>
          )}
          {iptalMesaj && !iptalAcik && (
            <div
              className={`text-xs p-2 border-l-2 mt-2 ${
                iptalMesaj.tip === "ok"
                  ? "border-[#325343] bg-[#F5F7F5] text-[#252625]"
                  : "border-red-500 bg-red-50 text-red-700"
              }`}
            >
              {iptalMesaj.metin}
            </div>
          )}
        </motion.section>
      )}

      {/* Değerlendirme — Mevcut */}
      {randevu.mevcutYorum && (
        <motion.section
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4 mb-4"
        >
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-2">
            Değerlendirmeniz
          </div>
          <div className="flex gap-0.5 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-base ${i < randevu.mevcutYorum!.rating ? "text-[#252625] dark:text-white" : "text-[#E0E0E0]"}`}
              >
                ★
              </span>
            ))}
          </div>
          {randevu.mevcutYorum.comment && (
            <p className="text-sm text-[#252625] dark:text-white">{randevu.mevcutYorum.comment}</p>
          )}
          {randevu.mevcutYorum.review_reply && (
            <div className="mt-2 pt-2 border-t border-[#D4E4D8] dark:border-[#333] text-[11px]">
              <span className="text-[#4A4D4A]">Danışman yanıtı: </span>
              <span className="text-[#252625] dark:text-white">{randevu.mevcutYorum.review_reply}</span>
            </div>
          )}
        </motion.section>
      )}

      {/* Değerlendirme Formu */}
      {yorumYapilebilir && (
        <motion.section
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4"
        >
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3">
            Değerlendirme Yap
          </div>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setYorumPuan(i + 1)}
                className={`text-xl transition-colors ${
                  i < yorumPuan ? "text-[#252625] dark:text-white" : "text-[#E0E0E0] hover:text-[#4A4D4A]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={yorumMetin}
            onChange={(e) => setYorumMetin(e.target.value)}
            placeholder="Deneyiminizi paylaşın… (isteğe bağlı)"
            rows={3}
            maxLength={2000}
            className="w-full border-[1.5px] border-[#325343] dark:border-white px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white resize-none mb-2"
          />
          <button
            onClick={yorumGonder}
            disabled={yorumYukleniyor || yorumPuan === 0}
            className="w-full bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-sm font-bold py-2.5 hover:opacity-90 disabled:opacity-50"
          >
            {yorumYukleniyor ? "Gönderiliyor…" : "Değerlendirmeyi Gönder"}
          </button>
          {yorumMesaj && (
            <div
              className={`mt-2 text-xs p-2 border-l-2 ${
                yorumMesaj.tip === "ok"
                  ? "border-[#325343] bg-[#F5F7F5] text-[#252625]"
                  : "border-red-500 bg-red-50 text-red-700"
              }`}
            >
              {yorumMesaj.metin}
            </div>
          )}
        </motion.section>
      )}

      {gonderildi && yorumMesaj?.tip === "ok" && (
        <div className="border-[1.5px] border-[#325343] dark:border-white bg-[#F5F7F5] dark:bg-[#1a1a1a] p-4 text-sm text-[#252625] dark:text-white">
          {yorumMesaj.metin}
        </div>
      )}
    </div>
  );
}
