"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export interface MusteriWebinar {
  kayit_id: string;
  webinar_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  status: string;
  kayit_status: string;
  daily_room_name: string | null;
}

export interface WebinarKlientProps {
  webinarlar: MusteriWebinar[];
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

function formatSaat(str: string): string {
  const d = new Date(str);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${String(utc3.getUTCHours()).padStart(2, "0")}:${String(utc3.getUTCMinutes()).padStart(2, "0")}`;
}

function formatTL(n: number): string {
  if (n === 0) return "Ücretsiz";
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

const DURUM_ETIKET: Record<string, string> = {
  published: "Yaklaşan",
  completed: "Tamamlandı",
  cancelled: "İptal",
  draft: "Taslak",
};

const KAYIT_DURUM_ETIKET: Record<string, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  cancelled: "İptal",
  refunded: "İade",
};

function webinarAktif(webinar: MusteriWebinar): boolean {
  const now = Date.now();
  const start = new Date(webinar.scheduled_at).getTime();
  const end = start + webinar.duration_minutes * 60 * 1000;
  const oncesi = 10 * 60 * 1000;
  return now >= start - oncesi && now < end;
}

export default function WebinarKlient({ webinarlar }: WebinarKlientProps) {
  const reduced = useReducedMotion();

  const gelecek = webinarlar.filter((w) => w.status === "published");
  const gecmis = webinarlar.filter((w) => w.status !== "published");

  return (
    <div className="px-6 py-5 flex flex-col gap-6">

      {/* ── Upcoming ── */}
      <div>
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
          Yaklaşan Webinarlar ({gelecek.length})
        </div>

        {gelecek.length === 0 ? (
          <div className="text-[13px] text-[#4A4D4A] py-6 text-center">
            Kayıtlı olduğunuz yaklaşan webinar yok.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gelecek.map((w, i) => {
              const aktif = webinarAktif(w);
              return (
                <motion.div
                  key={w.kayit_id}
                  initial={reduced ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: i * 0.04 }}
                  className={`border-[1.5px] p-4 ${
                    aktif
                      ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white"
                      : "border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#111]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div
                        className={`text-[13px] font-bold mb-1 ${
                          aktif ? "text-white dark:text-[#252625]" : "text-[#252625] dark:text-white"
                        }`}
                      >
                        {w.title}
                      </div>
                      {w.description && (
                        <div
                          className={`text-[11px] mb-2 ${
                            aktif ? "text-[#4A4D4A] dark:text-[#424242]" : "text-[#4A4D4A]"
                          }`}
                        >
                          {w.description.length > 120
                            ? `${w.description.slice(0, 120)}...`
                            : w.description}
                        </div>
                      )}
                      <div
                        className={`text-[11px] ${
                          aktif ? "text-[#4A4D4A] dark:text-[#424242]" : "text-[#4A4D4A]"
                        }`}
                      >
                        {formatTarih(w.scheduled_at)} · {formatSaat(w.scheduled_at)} · {w.duration_minutes} dk · {formatTL(w.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-[7px] py-[1px] border-[1.5px] ${
                          aktif
                            ? "border-white text-white dark:border-[#325343] dark:text-[#252625]"
                            : "border-[#325343] dark:border-white text-[#252625] dark:text-white"
                        }`}
                      >
                        {KAYIT_DURUM_ETIKET[w.kayit_status] ?? w.kayit_status}
                      </span>
                      {aktif && w.daily_room_name && (
                        <a
                          href={`https://mindbridge.daily.co/${w.daily_room_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold bg-white dark:bg-[#325343] text-[#252625] dark:text-white px-3 py-1 border-[1.5px] border-white dark:border-[#325343]"
                        >
                          Katıl
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Past ── */}
      {gecmis.length > 0 && (
        <div>
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3 pb-1.5 border-b border-[#D4E4D8] dark:border-[#333]">
            Geçmiş Webinarlar ({gecmis.length})
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_80px_80px] gap-2 px-3 py-2 bg-[#F5F7F5] dark:bg-[#1a1a1a] border-[1.5px] border-[#D4E4D8] dark:border-[#333] mb-px">
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A]">Webinar</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A]">Tarih</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A]">Durum</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] text-right">Ücret</span>
          </div>

          <div className="flex flex-col">
            {gecmis.map((w, i) => (
              <motion.div
                key={w.kayit_id}
                initial={reduced ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12, delay: i * 0.02 }}
                className="grid grid-cols-[1fr_100px_80px_80px] gap-2 px-3 py-2.5 border border-t-0 border-[#D4E4D8] dark:border-[#333] hover:bg-[#F5F7F5] dark:hover:bg-[#1a1a1a]"
              >
                <div className="text-[12px] text-[#252625] dark:text-white">{w.title}</div>
                <div className="text-[12px] text-[#4A4D4A]">{formatTarih(w.scheduled_at)}</div>
                <div>
                  <span className="text-[10px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-[6px] py-[1px]">
                    {DURUM_ETIKET[w.status] ?? w.status}
                  </span>
                </div>
                <div className="text-[12px] text-[#4A4D4A] text-right">{formatTL(w.price)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {webinarlar.length === 0 && (
        <div className="text-[13px] text-[#4A4D4A] py-10 text-center">
          Henüz kayıtlı olduğunuz webinar bulunmuyor.
        </div>
      )}
    </div>
  );
}
