"use client";

import { useEffect, useState, useCallback } from "react";
import { useReducedMotion, motion } from "framer-motion";
import Link from "next/link";

interface DanisanBilgi {
  id: string;
  title: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

interface YaklasanRandevu {
  id: string;
  scheduled_at: string;
  status: string;
  session_type: string;
  danisan_id: string;
  danisanBilgi: DanisanBilgi | null;
}

interface BugunMood {
  id: string;
  mood: number | null;
  mood_emoji: string | null;
  note: string | null;
}

interface AktifPaket {
  id: string;
  sessions_used: number;
  sessions_total: number;
  sessions_remaining: number | null;
  status: string;
  expires_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  tags: string[] | null;
  excerpt: string | null;
  published_at: string | null;
  danisan_id: string;
  danisanBilgi: DanisanBilgi | null;
}

interface Rozet {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned: boolean;
  earned_at: string | null;
}

interface HaftaGorevler {
  gunlukYaz: boolean;
  randevuKatil: boolean;
  odevTamamla: boolean;
  mesajGonder: boolean;
}

interface IstatistikData {
  yaklasanRandevu: YaklasanRandevu | null;
  bugunMood: BugunMood | null;
  bekleyenOdev: number;
  aktivePaket: AktifPaket | null;
  blogIcerikleri: BlogPost[];
  rozetler: Rozet[];
  haftaGorevler: HaftaGorevler;
  tamamlananGorev: number;
  toplamGorev: number;
}

interface Props {
  baslangicVeri: IstatistikData;
  kullaniciIsim: string;
}

const GOREV_ETIKETLER: { key: keyof HaftaGorevler; label: string }[] = [
  { key: "gunlukYaz", label: "Günlük yaz" },
  { key: "randevuKatil", label: "Randevuya katıl" },
  { key: "odevTamamla", label: "Ödevi tamamla" },
  { key: "mesajGonder", label: "Mesaj gönder" },
];

function formatTarih(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  const gunler = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  return `${gunler[d.getUTCDay()] ?? ""} ${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")} ${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function kalanGun(iso: string) {
  const fark = new Date(iso).getTime() - Date.now();
  const gun = Math.ceil(fark / 86400000);
  if (gun <= 0) return "Bugün";
  if (gun === 1) return "Yarın";
  return `${gun} gün kaldı`;
}

function moodEmoji(mood: BugunMood | null) {
  if (!mood) return null;
  if (mood.mood_emoji) return mood.mood_emoji;
  const score = mood.mood ?? 3;
  const emojis = ["😢", "😔", "😐", "😊", "😄"];
  return emojis[Math.min(4, Math.max(0, score - 1))];
}

function moodLabel(mood: BugunMood | null) {
  if (!mood) return "Henüz girilmedi";
  const score = mood.mood ?? 3;
  const labels = ["Çok kötü", "Kötü", "Orta", "İyi", "Çok iyi"];
  return labels[Math.min(4, Math.max(0, score - 1))];
}

export default function DashboardKlient({ baslangicVeri, kullaniciIsim }: Props) {
  const reduced = useReducedMotion();
  const [veri, setVeri] = useState<IstatistikData>(baslangicVeri);

  const yenile = useCallback(async () => {
    try {
      const res = await fetch("/api/musteri/istatistik");
      if (res.ok) {
        const json = (await res.json()) as IstatistikData;
        setVeri(json);
      }
    } catch {
      /* sessiz hata */
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(yenile, 60_000);
    return () => clearInterval(timer);
  }, [yenile]);

  const bugununTarihi = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paketYuzde = veri.aktivePaket
    ? Math.round((veri.aktivePaket.sessions_used / veri.aktivePaket.sessions_total) * 100)
    : 0;

  const hedefYuzde = veri.toplamGorev > 0
    ? Math.round((veri.tamamlananGorev / veri.toplamGorev) * 100)
    : 0;

  const fadeIn = reduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 max-w-4xl w-full">
      {/* Başlık */}
      <motion.div {...fadeIn} transition={{ duration: 0.2 }} className="mb-5">
        <h1 className="text-base font-bold text-[#252625] dark:text-white">
          Hoş geldin, {kullaniciIsim} 👋
        </h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">{bugununTarihi}</p>
      </motion.div>

      {/* KPI Kartları */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5"
        initial={reduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Yaklaşan Randevu */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.2, delay: reduced ? 0 : 0.05 }}
          className="border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] p-3"
        >
          <div className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
            Yaklaşan Randevu
          </div>
          {veri.yaklasanRandevu ? (
            <>
              <div className="text-[13px] font-bold text-[#252625] dark:text-white leading-tight">
                {formatTarih(veri.yaklasanRandevu.scheduled_at)}
              </div>
              <div className="text-[10.5px] text-[#4A4D4A] mt-0.5">
                {veri.yaklasanRandevu.danisanBilgi?.profiles
                  ? `${veri.yaklasanRandevu.danisanBilgi.profiles.first_name} ${veri.yaklasanRandevu.danisanBilgi.profiles.last_name}`
                  : "Danışman"}
              </div>
              <div className="mt-1.5">
                <span className="text-[9px] font-bold bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625] px-1.5 py-0.5">
                  {kalanGun(veri.yaklasanRandevu.scheduled_at)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-bold text-[#4A4D4A]">—</div>
              <div className="text-[10.5px] text-[#4A4D4A] mt-0.5">Randevu yok</div>
              <div className="mt-1.5">
                <Link
                  href="/danismanlar"
                  className="text-[9px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-1.5 py-0.5"
                >
                  Randevu Al
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {/* Ruh Hali Bugün */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.2, delay: reduced ? 0 : 0.1 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
        >
          <div className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
            Ruh Hali Bugün
          </div>
          <div className="text-[22px] leading-none mb-1">
            {moodEmoji(veri.bugunMood) ?? "—"}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A]">
            {moodLabel(veri.bugunMood)}
          </div>
          {!veri.bugunMood && (
            <div className="mt-1.5">
              <Link
                href="/panelim/gunluk"
                className="text-[9px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-1.5 py-0.5"
              >
                Gir
              </Link>
            </div>
          )}
        </motion.div>

        {/* Bekleyen Ödev */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.2, delay: reduced ? 0 : 0.15 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
        >
          <div className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
            Bekleyen Ödev
          </div>
          <div className="text-[13px] font-bold text-[#252625] dark:text-white mb-0.5">
            {veri.bekleyenOdev > 0 ? `${veri.bekleyenOdev} ödev` : "—"}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A]">
            {veri.bekleyenOdev > 0 ? "Tamamlanmayı bekliyor" : "Tümü tamamlandı"}
          </div>
          {veri.bekleyenOdev > 0 && (
            <div className="mt-1.5">
              <span className="text-[9px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white px-1.5 py-0.5">
                Bekliyor
              </span>
            </div>
          )}
        </motion.div>

        {/* Paket Durumu */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.2, delay: reduced ? 0 : 0.2 }}
          className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3"
        >
          <div className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1.5">
            Paket Durumu
          </div>
          {veri.aktivePaket ? (
            <>
              <div className="text-[13px] font-bold text-[#252625] dark:text-white mb-0.5">
                {veri.aktivePaket.sessions_used} / {veri.aktivePaket.sessions_total} Seans
              </div>
              <div className="text-[10.5px] text-[#4A4D4A] mb-1.5">
                {(veri.aktivePaket.sessions_remaining ?? 0)} seans kaldı
              </div>
              <div className="h-[5px] bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
                <motion.div
                  className="h-full bg-[#325343] dark:bg-white"
                  initial={reduced ? {} : { width: 0 }}
                  animate={{ width: `${paketYuzde}%` }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-bold text-[#4A4D4A]">—</div>
              <div className="text-[10.5px] text-[#4A4D4A] mt-0.5">Aktif paket yok</div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Orta Alan */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Blog İçerikleri */}
        <section>
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3 pb-2 border-b border-dotted border-[#D4E4D8] dark:border-[#333]">
            Kişiselleştirilmiş İçerikler
          </div>
          {veri.blogIcerikleri.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-6 text-center text-xs text-[#4A4D4A]">
              İçerik bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {veri.blogIcerikleri.map((blog, i) => {
                const danisanIsim = blog.danisanBilgi?.profiles
                  ? `${blog.danisanBilgi.profiles.first_name ?? ""} ${blog.danisanBilgi.profiles.last_name ?? ""}`.trim()
                  : blog.danisanBilgi?.title ?? "Danışman";
                return (
                  <motion.div
                    key={blog.id}
                    {...fadeIn}
                    transition={{ duration: 0.2, delay: reduced ? 0 : 0.05 * i }}
                    whileHover={reduced ? {} : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: { duration: 0.15 } }}
                  >
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="flex gap-2.5 border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-2.5 hover:border-[#325343] dark:hover:border-white transition-colors"
                    >
                      <div className="w-[52px] h-[42px] bg-[#D4E4D8] dark:bg-[#333] border-[1.5px] border-[#BDBDBD] flex-shrink-0 flex items-center justify-center text-[9px] text-[#4A4D4A]">
                        IMG
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-[#252625] dark:text-white leading-snug mb-0.5 truncate">
                          {blog.title}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-0.5">
                          {(blog.tags ?? []).slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-bold border-[1.5px] border-[#D4E4D8] px-1 py-px text-[#4A4D4A]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-[#4A4D4A]">
                          {danisanIsim}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Gamification Paneli */}
        <section className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3">
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3">
            Rozetlerim
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {veri.rozetler.slice(0, 6).map((rozet, i) => (
              <motion.div
                key={rozet.id}
                className="flex flex-col items-center gap-1"
                initial={reduced ? {} : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: reduced ? 0 : 0.05 * i }}
                title={rozet.description ?? rozet.name}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-[1.5px] ${
                    rozet.earned
                      ? "bg-[#325343] border-[#325343] dark:bg-white dark:border-white"
                      : "bg-[#F5F7F5] border-dashed border-[#BDBDBD] dark:bg-[#222]"
                  }`}
                >
                  <span className={rozet.earned ? "" : "opacity-30"}>
                    {rozet.icon ?? "⭐"}
                  </span>
                </div>
                <div
                  className={`text-[9px] font-semibold text-center leading-tight ${
                    rozet.earned ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"
                  }`}
                >
                  {rozet.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Haftalık Hedef */}
          <div className="border-t border-[#D4E4D8] dark:border-[#333] pt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10.5px] font-bold text-[#252625] dark:text-white">
                Haftalık Hedef
              </span>
              <span className="text-[11px] font-bold text-[#252625] dark:text-white">
                %{hedefYuzde}
              </span>
            </div>
            <div className="h-2 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD] mb-1">
              <motion.div
                className="h-full bg-[#325343] dark:bg-white"
                initial={reduced ? {} : { width: 0 }}
                animate={{ width: `${hedefYuzde}%` }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </div>
            <div className="text-[10px] text-[#4A4D4A] mb-3">
              {veri.tamamlananGorev} / {veri.toplamGorev} görev tamamlandı
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-2">
              Bu Hafta Yapılacaklar
            </div>
            <div className="space-y-1">
              {GOREV_ETIKETLER.map(({ key, label }) => {
                const tamam = veri.haftaGorevler[key];
                return (
                  <div
                    key={key}
                    className={`text-[11px] flex items-center gap-1.5 ${
                      tamam ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"
                    }`}
                  >
                    <span>{tamam ? "✓" : "○"}</span>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
