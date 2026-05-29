"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export interface GunlukKayit {
  id: string;
  date: string;
  mood: number | null;
  mood_emoji: string | null;
  note: string | null;
  tags: string[];
  intensity: number | null;
  shared_with_danisan_id: string | null;
  created_at: string;
}

export interface GunlukKlientProps {
  bugunKayit: GunlukKayit | null;
  gecmisKayitlar: GunlukKayit[];
  moodIstatistik: Record<string, { count: number; pct: number }>;
  krizAktif: boolean;
  danisanIsim: string | null;
  danisanId: string | null;
}

const EMOJILER = [
  { emoji: "😞", label: "Çok Kötü", mood: 1 },
  { emoji: "😐", label: "Kötü", mood: 2 },
  { emoji: "🙂", label: "Orta", mood: 3 },
  { emoji: "😊", label: "İyi", mood: 4 },
  { emoji: "😄", label: "Harika", mood: 5 },
] as const;

const ETIKETLER = [
  "Anksiyete",
  "Uyku",
  "Aile",
  "İş",
  "İlişkiler",
  "Başarı",
  "Stres",
  "Motivasyon",
];

const AYLAR_KISA = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];
const AYLAR_TAM = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
];
const GUNLER = [
  "Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi",
];

function kisaTarih(dateStr: string): string {
  const parts = dateStr.split("-");
  const ay = parseInt(parts[1] ?? "1", 10);
  const gun = parseInt(parts[2] ?? "1", 10);
  return `${gun} ${AYLAR_KISA[ay - 1] ?? ""}`;
}

function tamTarih(dateStr: string): string {
  const parts = dateStr.split("-");
  const yil = parts[0] ?? "";
  const ay = parseInt(parts[1] ?? "1", 10);
  const gun = parseInt(parts[2] ?? "1", 10);
  return `${gun} ${AYLAR_TAM[ay - 1] ?? ""} ${yil}`;
}

function saatStr(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + 3 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function bugunStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function dunStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().substring(0, 10);
}

export default function GunlukKlient({
  bugunKayit,
  gecmisKayitlar,
  moodIstatistik,
  krizAktif: ilkKrizAktif,
  danisanIsim,
  danisanId,
}: GunlukKlientProps) {
  const prefersReduced = useReducedMotion();
  const [krizKapatildi, setKrizKapatildi] = useState(false);
  const [krizAktif, setKrizAktif] = useState(ilkKrizAktif);

  // Form state — initialized from today's existing entry
  const [selectedMood, setSelectedMood] = useState<number | null>(
    bugunKayit?.mood ?? null
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    bugunKayit?.mood_emoji ?? null
  );
  const [intensity, setIntensity] = useState<number>(
    bugunKayit?.intensity ?? 5
  );
  const [note, setNote] = useState(bugunKayit?.note ?? "");
  const [secilenEtiketler, setSecilenEtiketler] = useState<string[]>(
    bugunKayit?.tags ?? []
  );
  const [shared, setShared] = useState(!!bugunKayit?.shared_with_danisan_id);

  // Submit state
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // History state (mutable after share toggles)
  const [kayitlar, setKayitlar] = useState<GunlukKayit[]>(gecmisKayitlar);

  const krizGoster = krizAktif && !krizKapatildi;

  const etiketToggle = useCallback((etiket: string) => {
    setSecilenEtiketler((prev) =>
      prev.includes(etiket) ? prev.filter((e) => e !== etiket) : [...prev, etiket]
    );
  }, []);

  const handleKaydet = async () => {
    if (!selectedMood || !selectedEmoji) {
      setHata("Lütfen ruh halinizi seçin.");
      return;
    }
    setYukleniyor(true);
    setHata(null);
    setBasarili(false);

    try {
      const res = await fetch("/api/gunluk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          mood_emoji: selectedEmoji,
          note: note || undefined,
          tags: secilenEtiketler,
          intensity,
          shared_with_danisan_id: shared && danisanId ? danisanId : null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setHata(data.error ?? "Bir hata oluştu.");
        return;
      }

      // If mood is 1 (Çok Kötü), check for potential crisis in updated history
      if (selectedMood === 1) {
        const today = bugunStr();
        const yesterday = dunStr();
        const twoDaysAgo = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 2);
          return d.toISOString().substring(0, 10);
        })();
        const prevBad = kayitlar.filter(
          (k) =>
            (k.date === yesterday || k.date === twoDaysAgo) && k.mood === 1
        );
        if (prevBad.length >= 2) setKrizAktif(true);
        // Suppress unused variable warning
        void today;
      }

      setBasarili(true);
      setTimeout(() => setBasarili(false), 3000);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handlePaylasimToggle = async (kayitId: string, isShared: boolean) => {
    if (!danisanId && !isShared) return;

    const res = await fetch("/api/gunluk/paylasim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: kayitId,
        shared: !isShared,
        danisan_id: danisanId ?? undefined,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { kayit: GunlukKayit };
      setKayitlar((prev) =>
        prev.map((k) => (k.id === data.kayit.id ? data.kayit : k))
      );
    }
  };

  // Chart data: sort ascending for left-to-right
  const chartData = [...kayitlar]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((k) => ({
      tarih: kisaTarih(k.date),
      ruhHali: k.mood ?? 0,
    }));

  // Today's label
  const todayDate = new Date();
  const gunAdi = GUNLER[todayDate.getDay()] ?? "";
  const bugunEtiket = `${gunAdi}, ${tamTarih(bugunStr())}`;

  const enYuksekMood = Math.max(
    ...EMOJILER.map((e) => moodIstatistik[e.emoji]?.count ?? 0)
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Crisis Band ── */}
      <AnimatePresence>
        {krizGoster && (
          <motion.div
            key="crisis"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-[#A6DE9B] text-[#325343] px-5 py-2.5 flex items-center gap-3 text-[12px] flex-wrap">
              <span className="text-[16px] flex-shrink-0">⚠</span>
              <span className="font-bold tracking-[0.2px]">
                Kriz Protokolü Aktif
              </span>
              <span className="text-[11px] text-[#4A4D4A] font-normal">
                Yalnız değilsiniz. Hemen destek alın:
              </span>
              <div className="flex gap-2.5 ml-auto flex-wrap">
                {[
                  { icon: "📞", num: "182", label: "ALO Psikiyatri" },
                  { icon: "💙", num: "182", label: "İntihar Önleme" },
                  { icon: "🚨", num: "112", label: "Acil" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-[11px] font-bold border-[1.5px] border-white px-2.5 py-[2px] flex items-center gap-1.5"
                  >
                    <span>{item.icon}</span>
                    <span className="text-[14px] tracking-[0.5px]">
                      {item.num}
                    </span>
                    <span className="font-normal text-[10px]">{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setKrizKapatildi(true)}
                aria-label="Kriz bandını kapat"
                className="text-[#4A4D4A] text-[16px] ml-2 flex-shrink-0 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-2 flex-1 min-h-0">
        {/* ── LEFT: Entry Form ── */}
        <motion.div
          className="border-r border-[#D4E4D8] dark:border-[#333] px-5 py-5 overflow-y-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
            {bugunEtiket}
          </div>
          <div className="text-[17px] font-bold text-[#252625] dark:text-white mb-5">
            Bugün Nasıl Hissediyorsun?
          </div>

          {/* Emoji Scale */}
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2.5">
              Ruh Halin
            </div>
            <div className="flex gap-1.5 items-end justify-between">
              {EMOJILER.map((item) => {
                const secili = selectedMood === item.mood;
                return (
                  <motion.button
                    key={item.mood}
                    onClick={() => {
                      setSelectedMood(item.mood);
                      setSelectedEmoji(item.emoji);
                    }}
                    className="flex flex-col items-center gap-1.5 flex-1 bg-transparent border-none p-0 cursor-pointer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <motion.div
                      className="flex items-center justify-center rounded-full"
                      animate={
                        secili
                          ? {
                              width: 56,
                              height: 56,
                              fontSize: 30,
                              borderColor: "#252625",
                              borderWidth: 2.5,
                              backgroundColor: "#F5F7F5",
                              boxShadow: "0 0 0 3px #E0E0E0",
                            }
                          : {
                              width: 44,
                              height: 44,
                              fontSize: 22,
                              borderColor: "#D4E4D8",
                              borderWidth: 1.5,
                              backgroundColor: "#FFFFFF",
                              boxShadow: "none",
                            }
                      }
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{ border: "1.5px solid #E0E0E0" }}
                    >
                      {item.emoji}
                    </motion.div>
                    <span
                      className={`text-[9px] text-center tracking-[0.3px] ${
                        secili
                          ? "text-[#252625] dark:text-white font-bold"
                          : "text-[#4A4D4A] font-semibold"
                      }`}
                    >
                      {secili ? `${item.label} ✓` : item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="flex items-center gap-2.5 mb-5">
            <span className="text-[10px] text-[#4A4D4A] whitespace-nowrap">
              Yoğunluk:
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: "#252625" }}
            />
            <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
              {intensity} / 10
            </span>
          </div>

          {/* Note Textarea */}
          <div className="mb-4">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1.5">
              Günlük Notun
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1000))}
              placeholder="Bugün aklındakileri yaz — bu alan yalnızca sana ait..."
              rows={5}
              className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#444] dark:bg-[#1a1a1a] dark:text-white px-3 py-2.5 text-[13px] text-[#252625] placeholder-[#BDBDBD] bg-white resize-none outline-none leading-relaxed focus:border-[#325343] dark:focus:border-white transition-colors"
              style={{ fontFamily: "inherit" }}
            />
            <div className="text-[10px] text-[#4A4D4A] text-right mt-0.5">
              {note.length} / 1000
            </div>
          </div>

          {/* Tag Chips */}
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1.5">
              Etiket Ekle
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ETIKETLER.map((etiket) => {
                const secili = secilenEtiketler.includes(etiket);
                return (
                  <motion.button
                    key={etiket}
                    onClick={() => etiketToggle(etiket)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`text-[11px] px-2.5 py-[3px] cursor-pointer border-[1.5px] transition-colors ${
                      secili
                        ? "border-[#325343] text-[#252625] dark:text-white bg-[#F5F7F5] dark:bg-[#333]"
                        : "border-[#D4E4D8] text-[#4A4D4A] bg-white dark:bg-[#1a1a1a]"
                    }`}
                    style={{ fontFamily: "inherit" }}
                  >
                    {etiket}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Share Toggle + Save */}
          <div className="flex flex-col gap-2.5">
            {danisanId && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-[#F5F7F5] dark:bg-[#1a1a1a]">
                <button
                  onClick={() => setShared((v) => !v)}
                  aria-label="Danışmanla paylaşımı aç/kapat"
                  className="flex-shrink-0 relative cursor-pointer border-none p-0"
                  style={{
                    width: 30,
                    height: 16,
                    borderRadius: 8,
                    border: `1.5px solid ${shared ? "#252625" : "#4A4D4A"}`,
                    backgroundColor: shared ? "#252625" : "#FFFFFF",
                    transition: "background-color 0.15s, border-color 0.15s",
                  }}
                >
                  <motion.div
                    animate={{ left: shared ? 14 : 1.5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[1.5px] rounded-full"
                    style={{
                      width: 11,
                      height: 11,
                      background: shared ? "#FFFFFF" : "#4A4D4A",
                    }}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#252625] dark:text-white">
                    Danışmanımla paylaş
                  </div>
                  <div className="text-[10px] text-[#4A4D4A]">
                    {danisanIsim} randevu notlarını görebilir
                  </div>
                </div>
                <div className="text-[10px] text-[#4A4D4A] flex-shrink-0">
                  {shared ? "Açık" : "Kapalı"}
                </div>
              </div>
            )}

            {hata && (
              <div className="text-[11px] text-red-600 dark:text-red-400 px-1">
                ⚠ {hata}
              </div>
            )}

            <motion.button
              onClick={handleKaydet}
              disabled={yukleniyor || !selectedMood}
              whileHover={!yukleniyor && !!selectedMood ? { scale: 1.01 } : {}}
              whileTap={!yukleniyor && !!selectedMood ? { scale: 0.99 } : {}}
              className={`w-full py-[11px] text-[14px] font-bold tracking-[0.3px] transition-colors border-none cursor-pointer ${
                basarili
                  ? "bg-[#2a6b2a] text-white"
                  : !selectedMood || yukleniyor
                  ? "bg-[#BDBDBD] text-white cursor-not-allowed"
                  : "bg-[#325343] dark:bg-white text-white dark:text-[#252625] hover:bg-[#333]"
              }`}
              style={{ fontFamily: "inherit" }}
            >
              {yukleniyor
                ? "Kaydediliyor..."
                : basarili
                ? "✓ Kaydedildi"
                : "Kaydet"}
            </motion.button>
          </div>
        </motion.div>

        {/* ── RIGHT: History ── */}
        <motion.div
          className="px-5 py-5 overflow-y-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
        >
          {/* Section heading */}
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white mb-3 pb-1.5 border-b-[1.5px] border-[#325343] dark:border-white flex justify-between items-center">
            Son 30 Gün — Ruh Hali Trendi
            <span className="text-[10px] font-normal text-[#4A4D4A] underline cursor-pointer">
              Filtrele
            </span>
          </div>

          {/* Mood frequency stats */}
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {EMOJILER.map((item) => {
              const stat = moodIstatistik[item.emoji] ?? { count: 0, pct: 0 };
              const vurgulu =
                stat.count > 0 && stat.count === enYuksekMood;
              return (
                <div
                  key={item.emoji}
                  className={`flex flex-col items-center gap-1 py-1.5 px-1 ${
                    vurgulu
                      ? "border-[1.5px] border-[#325343] dark:border-white bg-[#F5F7F5] dark:bg-[#222]"
                      : "border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-[#F5F7F5] dark:bg-[#1a1a1a]"
                  }`}
                >
                  <span className="text-[16px]">{item.emoji}</span>
                  <span
                    className={`font-bold text-[#252625] dark:text-white ${
                      vurgulu ? "text-[14px]" : "text-[11px]"
                    }`}
                  >
                    {stat.count}
                  </span>
                  <span className="text-[9px] text-[#4A4D4A]">
                    %{stat.pct}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Line Chart */}
          {chartData.length > 1 ? (
            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] h-[130px] mb-1 bg-white dark:bg-[#1a1a1a]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 4, left: -22 }}
                >
                  <XAxis
                    dataKey="tarih"
                    tick={{ fontSize: 9, fill: "#4A4D4A" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 9, fill: "#4A4D4A" }}
                    tickLine={false}
                    axisLine={false}
                    width={22}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E0E0E0",
                      fontSize: 10,
                      padding: "4px 8px",
                      borderRadius: 0,
                    }}
                    labelStyle={{ color: "#4A4D4A" }}
                    formatter={(value) => {
                      const n =
                        typeof value === "number" ? value : Number(value);
                      const emoji = EMOJILER[n - 1]?.emoji ?? "";
                      return [emoji, "Ruh Hali"];
                    }}
                  />
                  <ReferenceLine y={3} stroke="#D4E4D8" strokeDasharray="4 2" />
                  <Line
                    type="monotone"
                    dataKey="ruhHali"
                    stroke="#252625"
                    strokeWidth={1.5}
                    dot={{ fill: "#252625", r: 2.5 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] h-[130px] mb-1 bg-white dark:bg-[#1a1a1a] flex items-center justify-center">
              <div className="text-center text-[11px] text-[#4A4D4A]">
                <div className="font-bold text-[12px] text-[#252625] dark:text-white mb-1">
                  [ Zaman Serisi Çizgi Grafik ]
                </div>
                Y: 1–5 ruh hali skoru · X: Son 30 gün
                <div className="mt-1 text-[10px]">
                  Haftalık ortalama + günlük noktalar
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between py-1 mb-4">
            <span className="text-[9px] text-[#4A4D4A]">
              {chartData[0]?.tarih ?? ""}
            </span>
            <span className="text-[9px] text-[#4A4D4A]">
              {chartData[chartData.length - 1]?.tarih ?? ""}
            </span>
          </div>

          {/* Notes list */}
          <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#252625] dark:text-white mb-3 pb-1.5 border-b-[1.5px] border-[#325343] dark:border-white flex justify-between items-center">
            Günlük Notlarım
            <span className="text-[10px] font-normal text-[#4A4D4A] underline cursor-pointer">
              Tümünü Gör →
            </span>
          </div>

          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {kayitlar.slice(0, 6).map((kayit, i) => {
                const isShared = !!kayit.shared_with_danisan_id;
                const today = bugunStr();
                const yesterday = dunStr();
                const tarihEtiket =
                  kayit.date === today
                    ? "Bugün"
                    : kayit.date === yesterday
                    ? "Dün"
                    : tamTarih(kayit.date);

                return (
                  <motion.div
                    key={kayit.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.04 }}
                    className="py-2.5 border-b border-[#D4E4D8] dark:border-[#333] flex gap-3 items-start last:border-b-0"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-[22px]">{kayit.mood_emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-[#4A4D4A] tracking-[0.3px] mb-0.5">
                        {tarihEtiket} · {tamTarih(kayit.date)} ·{" "}
                        {saatStr(kayit.created_at)}
                      </div>
                      {kayit.note ? (
                        <div className="text-[12px] text-[#252625] dark:text-white leading-relaxed">
                          {kayit.note.length > 80
                            ? `${kayit.note.slice(0, 80)}...`
                            : kayit.note}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#4A4D4A]">
                          Not eklenmedi
                        </div>
                      )}
                      {(kayit.tags.length > 0 || isShared) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {kayit.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-[1px] border-[1.5px] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A]"
                            >
                              {tag}
                            </span>
                          ))}
                          {isShared && (
                            <span className="text-[9px] px-1.5 py-[1px] border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white font-bold">
                              ✓ Paylaşıldı
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {danisanId && (
                        <button
                          onClick={() =>
                            handlePaylasimToggle(kayit.id, isShared)
                          }
                          className="text-[10px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white px-1.5 py-[2px] border-[1.5px] border-[#D4E4D8] dark:border-[#444] bg-white dark:bg-[#1a1a1a] cursor-pointer transition-colors"
                          style={{ fontFamily: "inherit" }}
                        >
                          {isShared ? "Gizle" : "Düzenle"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {kayitlar.length === 0 && (
              <div className="text-[12px] text-[#4A4D4A] py-8 text-center">
                Henüz günlük kaydı yok.
                <br />
                <span className="text-[11px]">
                  İlk kaydını bugün oluştur!
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
