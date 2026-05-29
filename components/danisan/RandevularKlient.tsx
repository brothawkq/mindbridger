"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Database } from "@/types/supabase";

type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
type SessionType = Database["public"]["Enums"]["session_type"];

interface RandevuItem {
  id: string;
  status: AppointmentStatus;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  is_recurring: boolean;
  no_show_charged: boolean;
  musteriId: string;
  musteriIsim: string;
  musteriAvatarUrl: string | null;
}

interface Props {
  randevular: RandevuItem[];
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
  const gun = String(d.getUTCDate()).padStart(2, "0");
  const ay = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yil = d.getUTCFullYear();
  const saat = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return `${gun}.${ay}.${yil} ${saat}`;
}

type FiltreDurum = "tumu" | AppointmentStatus;
type Siralama = "yeni" | "eski";

export default function RandevularKlient({ randevular }: Props) {
  const prefersReduced = useReducedMotion();
  const [filtreDurum, setFiltreDurum] = useState<FiltreDurum>("tumu");
  const [siralama, setSiralama] = useState<Siralama>("yeni");
  const [aramaMetni, setAramaMetni] = useState("");

  const filtreliRandevular = useMemo(() => {
    let liste = [...randevular];

    if (aramaMetni.trim()) {
      const q = aramaMetni.toLowerCase();
      liste = liste.filter((r) => r.musteriIsim.toLowerCase().includes(q));
    }

    if (filtreDurum !== "tumu") {
      liste = liste.filter((r) => r.status === filtreDurum);
    }

    liste.sort((a, b) => {
      const diff =
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      return siralama === "yeni" ? -diff : diff;
    });

    return liste;
  }, [randevular, filtreDurum, siralama, aramaMetni]);

  const istatistik = useMemo(() => {
    const buAy = new Date();
    buAy.setDate(1);
    buAy.setHours(0, 0, 0, 0);
    const buAyTamamlanan = randevular.filter(
      (r) =>
        r.status === "completed" && new Date(r.scheduled_at) >= buAy
    ).length;
    const toplamGelir = randevular
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + (r.price ?? 0), 0);
    return { buAyTamamlanan, toplamGelir };
  }, [randevular]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-[16px] font-bold text-[#252625] dark:text-white">
          Randevular
        </h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">
          Tüm seans geçmişi ve yaklaşan randevular
        </p>
      </div>

      {/* İstatistik Şeridi */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { etiket: "TOPLAM", deger: randevular.length },
          { etiket: "BU AY TAMAMLANAN", deger: istatistik.buAyTamamlanan },
          {
            etiket: "TOPLAM GELİR",
            deger: `₺${istatistik.toplamGelir.toLocaleString("tr-TR")}`,
          },
        ].map(({ etiket, deger }) => (
          <div
            key={etiket}
            className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              {etiket}
            </div>
            <div className="text-[20px] font-bold text-[#252625] dark:text-white">
              {deger}
            </div>
          </div>
        ))}
      </div>

      {/* Filtre Araç Çubuğu */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="Danışan ara..."
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-[9px] w-48 outline-none"
        />

        <div className="flex items-center gap-1">
          {(
            [
              "tumu",
              "confirmed",
              "pending",
              "completed",
              "cancelled",
              "no_show",
            ] as const
          ).map((d) => (
            <button
              key={d}
              onClick={() => setFiltreDurum(d)}
              className={`text-[10px] font-bold uppercase tracking-[0.8px] px-2 py-1.5 transition-colors ${
                filtreDurum === d
                  ? "bg-[#A6DE9B] text-[#325343]"
                  : "border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#252625] dark:text-white hover:border-[#325343]"
              }`}
            >
              {d === "tumu"
                ? "Tümü"
                : STATUS_ETIKET[d as AppointmentStatus]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {(["yeni", "eski"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSiralama(s)}
              className={`text-[10px] font-bold uppercase tracking-[0.8px] px-2 py-1.5 transition-colors ${
                siralama === s
                  ? "bg-[#A6DE9B] text-[#325343]"
                  : "border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#252625] dark:text-white hover:border-[#325343]"
              }`}
            >
              {s === "yeni" ? "En Yeni" : "En Eski"}
            </button>
          ))}
        </div>
      </div>

      {/* Sonuç Sayısı */}
      <div className="text-[10px] text-[#4A4D4A] mb-2">
        {filtreliRandevular.length} randevu gösteriliyor
      </div>

      {/* Tablo */}
      {filtreliRandevular.length === 0 ? (
        <div className="border border-dashed border-[#D4E4D8] dark:border-[#333] p-12 text-center text-[#4A4D4A] text-[13px]">
          Randevu bulunamadı
        </div>
      ) : (
        <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333]">
          {/* Tablo Başlığı */}
          <div className="grid grid-cols-[1fr_120px_100px_80px_80px_36px] bg-[#F5F7F5] dark:bg-[#111] border-b border-[#D4E4D8] dark:border-[#333] px-4 py-2">
            {["DANIŞAN", "TARİH / SAAT", "TİP", "SÜRE", "DURUM", ""].map(
              (h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625] dark:text-white"
                >
                  {h}
                </span>
              )
            )}
          </div>

          <AnimatePresence initial={false}>
            {filtreliRandevular.map((r, i) => (
              <motion.div
                key={r.id}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.15, delay: prefersReduced ? 0 : i * 0.03 }}
              >
                <Link
                  href={`/danisan/randevular/${r.id}`}
                  className="grid grid-cols-[1fr_120px_100px_80px_80px_36px] items-center px-4 py-3 border-b border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#111] transition-colors group"
                >
                  {/* Danışan */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[10px] font-bold text-[#252625] dark:text-white">
                      {r.musteriIsim.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] text-[#252625] dark:text-white truncate">
                      {r.musteriIsim}
                    </span>
                    {r.is_recurring && (
                      <span className="text-[9px] border-[1.5px] border-[#BDBDBD] text-[#4A4D4A] px-1 py-0.5 shrink-0">
                        TEKRARLAYaN
                      </span>
                    )}
                  </div>

                  {/* Tarih */}
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    {formatTarih(r.scheduled_at)}
                  </div>

                  {/* Tip */}
                  <div className="text-[11px] text-[#252625] dark:text-white">
                    {SESSION_ETIKET[r.session_type]}
                  </div>

                  {/* Süre */}
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    {r.duration_minutes} dk
                  </div>

                  {/* Durum */}
                  <div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-[0.5px] px-2 py-1 ${STATUS_STIL[r.status]}`}
                    >
                      {STATUS_ETIKET[r.status]}
                    </span>
                  </div>

                  {/* Ok */}
                  <div className="text-[#4A4D4A] group-hover:text-[#252625] dark:group-hover:text-white transition-colors text-right">
                    →
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
