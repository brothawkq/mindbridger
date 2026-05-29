"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  getDay,
  parseISO,
  isSameDay,
  getHours,
  getMinutes,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  getISOWeek,
} from "date-fns";
import { tr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────
interface MusaitlikSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface IzinKaydi {
  id: string;
  date: string;
  reason: string | null;
}

interface Randevu {
  id: string;
  musteri_id: string;
  danisan_id: string;
  status: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number | null;
  price: number | null;
}

type HucreKalip = "avail" | "booked" | "buffer" | "closed";

export interface TakvimKlientProps {
  bufferMinutes: number;
  sessionDuration: number;
  musaitlikBaslangic: MusaitlikSlot[];
  izinlerBaslangic: IzinKaydi[];
  googleBagili: boolean;
  outlookBagili: boolean;
}

// ─── Constants ───────────────────────────────────────────────────
const SAATLER = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
// getDay() returns 0=Sun,1=Mon...6=Sat
const GUN_KISA: Record<number, string> = {
  0: "Paz",
  1: "Pzt",
  2: "Sal",
  3: "Çar",
  4: "Per",
  5: "Cum",
  6: "Cmt",
};
const GUN_TAM = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const SEANS_ETIKET: Record<string, string> = {
  bireysel: "Bireysel",
  asenkron: "Asenkron",
  grup: "Grup",
  cift_aile: "Çift/Aile",
  on_gorusme: "Ön Görüşme",
  supervizyon: "Supervizyon",
};

const STATUS_ETIKET: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
  rejected: "Reddedildi",
};

// ─── Helpers ─────────────────────────────────────────────────────
function timeToMin(t: string): number {
  const parts = t.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

function haftaBaslangici(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 }); // Pazartesi
}

// ─── Müsaitlik Modal ──────────────────────────────────────────────
interface MusaitlikModalProps {
  musaitlik: MusaitlikSlot[];
  onKaydet: (yeni: Omit<MusaitlikSlot, "id">[]) => Promise<void>;
  onKapat: () => void;
}

function MusaitlikModal({ musaitlik, onKaydet, onKapat }: MusaitlikModalProps) {
  const prefersReduced = useReducedMotion();

  const [form, setForm] = useState(() =>
    Array.from({ length: 7 }, (_, d) => {
      const slot = musaitlik.find((m) => m.day_of_week === d);
      return {
        day: d,
        start: (slot?.start_time ?? "09:00:00").slice(0, 5),
        end: (slot?.end_time ?? "18:00:00").slice(0, 5),
        active: slot?.is_active ?? false,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    for (const f of form.filter((f) => f.active)) {
      if (timeToMin(f.start) >= timeToMin(f.end)) {
        setHata(`${GUN_TAM[f.day] ?? ""}: Başlangıç saati bitiş saatinden önce olmalı.`);
        return;
      }
    }
    setSaving(true);
    try {
      await onKaydet(
        form
          .filter((f) => f.active)
          .map((f) => ({
            day_of_week: f.day,
            start_time: f.start + ":00",
            end_time: f.end + ":00",
            is_active: true,
          }))
      );
      onKapat();
    } catch {
      setHata("Şablon kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(i: number) {
    setForm((prev) =>
      prev.map((p, j) => (j === i ? { ...p, active: !p.active } : p))
    );
  }

  function setStart(i: number, v: string) {
    setForm((prev) => prev.map((p, j) => (j === i ? { ...p, start: v } : p)));
  }

  function setEnd(i: number, v: string) {
    setForm((prev) => prev.map((p, j) => (j === i ? { ...p, end: v } : p)));
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onKapat} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="musaitlik-modal-title"
        className="relative bg-white border-[1.5px] border-[#325343] w-full max-w-lg"
        initial={prefersReduced ? {} : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="bg-[#F5F7F5] border-b-[1.5px] border-[#325343] px-5 py-3 flex items-center justify-between">
          <span id="musaitlik-modal-title" className="text-[12px] font-bold uppercase tracking-[1px]">
            Haftalık Müsaitlik Şablonu
          </span>
          <button
            onClick={onKapat}
            aria-label="Modalı kapat"
            className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <p className="text-[11px] text-[#4A4D4A] mb-4">
            Aktif günler için çalışma saatlerini belirleyin. Bu şablon her hafta tekrarlanır.
          </p>
          <div className="space-y-2.5 mb-4">
            {form.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={`w-7 h-3.5 rounded-[7px] border-[1.5px] relative flex-shrink-0 transition-colors ${
                    f.active
                      ? "bg-[#325343] border-[#325343]"
                      : "bg-white border-[#BDBDBD]"
                  }`}
                  aria-label={`${GUN_TAM[i] ?? ""} ${f.active ? "aktif" : "pasif"}`}
                >
                  <span
                    className={`absolute top-[1px] w-[10px] h-[10px] rounded-full transition-all ${
                      f.active
                        ? "right-[1.5px] bg-white"
                        : "left-[1.5px] bg-[#BDBDBD]"
                    }`}
                  />
                </button>
                {/* Gun adi */}
                <span
                  className={`text-[11px] font-bold w-[88px] flex-shrink-0 ${
                    f.active ? "text-[#252625]" : "text-[#4A4D4A]"
                  }`}
                >
                  {GUN_TAM[i] ?? ""}
                </span>
                {/* Saatler */}
                <input
                  type="time"
                  value={f.start}
                  disabled={!f.active}
                  onChange={(e) => setStart(i, e.target.value)}
                  className="border-[1.5px] border-[#325343] px-2 py-1 text-[12px] w-[88px] disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] disabled:bg-[#F5F7F5]"
                />
                <span className="text-[11px] text-[#4A4D4A]">—</span>
                <input
                  type="time"
                  value={f.end}
                  disabled={!f.active}
                  onChange={(e) => setEnd(i, e.target.value)}
                  className="border-[1.5px] border-[#325343] px-2 py-1 text-[12px] w-[88px] disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] disabled:bg-[#F5F7F5]"
                />
              </div>
            ))}
          </div>
          {hata && (
            <p className="text-[11px] text-[#252625] border-[1.5px] border-[#325343] px-3 py-2 mb-4 bg-[#F5F7F5]">
              ⚠ {hata}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#A6DE9B] text-[#325343] text-[12px] font-bold py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={onKapat}
              className="px-4 border-[1.5px] border-[#325343] text-[12px] font-bold hover:bg-[#F5F7F5]"
            >
              İptal
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── İzin Modalı ─────────────────────────────────────────────────
interface IzinModalProps {
  onEkle: (date: string, reason: string) => Promise<void>;
  onKapat: () => void;
}

function IzinModal({ onEkle, onKapat }: IzinModalProps) {
  const prefersReduced = useReducedMotion();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      setHata("Tarih seçiniz.");
      return;
    }
    setSaving(true);
    try {
      await onEkle(date, reason);
      onKapat();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "İzin kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onKapat} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="izin-modal-title"
        className="relative bg-white border-[1.5px] border-[#325343] w-full max-w-sm"
        initial={prefersReduced ? {} : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="bg-[#F5F7F5] border-b-[1.5px] border-[#325343] px-4 py-3 flex items-center justify-between">
          <span id="izin-modal-title" className="text-[12px] font-bold uppercase tracking-[1px]">
            Tatil / Kapalı Gün Ekle
          </span>
          <button
            onClick={onKapat}
            aria-label="Modalı kapat"
            className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              Tarih *
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[13px]"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
              Açıklama (isteğe bağlı)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tatil, özel gün vb."
              maxLength={200}
              className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[13px]"
            />
          </div>
          {hata && (
            <p className="text-[11px] text-[#252625] border-[1.5px] border-[#325343] px-3 py-2 bg-[#F5F7F5]">
              ⚠ {hata}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#A6DE9B] text-[#325343] text-[12px] font-bold py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
            >
              {saving ? "Ekleniyor…" : "Gün Ekle"}
            </button>
            <button
              type="button"
              onClick={onKapat}
              className="px-4 border-[1.5px] border-[#325343] text-[12px] font-bold hover:bg-[#F5F7F5]"
            >
              İptal
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Randevu Detay Modalı ─────────────────────────────────────────
interface RandevuDetayProps {
  randevu: Randevu;
  onKapat: () => void;
}

function RandevuDetayModal({ randevu, onKapat }: RandevuDetayProps) {
  const prefersReduced = useReducedMotion();
  const tarih = parseISO(randevu.scheduled_at);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onKapat} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="randevu-detay-modal-title"
        className="relative bg-white border-[1.5px] border-[#325343] w-full max-w-sm"
        initial={prefersReduced ? {} : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="bg-[#325343] px-4 py-3 flex items-center justify-between">
          <span id="randevu-detay-modal-title" className="text-[12px] font-bold uppercase tracking-[1px] text-white">
            Randevu Detayı
          </span>
          <button
            onClick={onKapat}
            aria-label="Modalı kapat"
            className="text-white/60 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              Tarih &amp; Saat
            </div>
            <div className="text-[13px] font-bold">
              {format(tarih, "d MMMM yyyy, HH:mm", { locale: tr })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              Seans Türü
            </div>
            <div className="text-[13px]">
              {SEANS_ETIKET[randevu.session_type] ?? randevu.session_type}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              Süre
            </div>
            <div className="text-[13px]">{randevu.duration_minutes ?? 50} dakika</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
              Durum
            </div>
            <span className="inline-block border-[1.5px] border-[#325343] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px]">
              {STATUS_ETIKET[randevu.status] ?? randevu.status}
            </span>
          </div>
          {randevu.price != null && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
                Ücret
              </div>
              <div className="text-[13px] font-bold">
                {randevu.price.toLocaleString("tr-TR")} TL
              </div>
            </div>
          )}
          <div className="pt-1">
            <a
              href={`/danisan/randevular/${randevu.id}`}
              className="block text-center bg-[#A6DE9B] text-[#325343] text-[12px] font-bold py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
            >
              Detaylı Görüntüle →
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────
export default function TakvimKlient({
  bufferMinutes,
  musaitlikBaslangic,
  izinlerBaslangic,
  googleBagili,
  outlookBagili,
}: TakvimKlientProps) {
  const prefersReduced = useReducedMotion();

  const [currentDate, setCurrentDate] = useState(() => haftaBaslangici(new Date()));
  const [viewMode, setViewMode] = useState<"aylik" | "haftalik" | "gunluk">("haftalik");
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(false);
  const [musaitlik, setMusaitlik] = useState<MusaitlikSlot[]>(musaitlikBaslangic);
  const [izinler, setIzinler] = useState<IzinKaydi[]>(izinlerBaslangic);

  const [seciliRandevu, setSeciliRandevu] = useState<Randevu | null>(null);
  const [musaitlikModal, setMusaitlikModal] = useState(false);
  const [izinModal, setIzinModal] = useState(false);

  const today = new Date();

  // ─── Data fetch ──────────────────────────────────────────────
  const randevularGetir = useCallback(
    async (baslangic: Date, bitis: Date) => {
      setLoading(true);
      try {
        const url = `/api/randevular?baslangic=${baslangic.toISOString()}&bitis=${bitis.toISOString()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { randevular?: Randevu[] };
          setRandevular(
            (json.randevular ?? []).filter(
              (r) => r.status !== "cancelled" && r.status !== "rejected"
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let baslangic: Date;
    let bitis: Date;
    if (viewMode === "aylik") {
      baslangic = startOfMonth(currentDate);
      bitis = endOfMonth(currentDate);
    } else if (viewMode === "gunluk") {
      baslangic = currentDate;
      bitis = addDays(currentDate, 1);
    } else {
      baslangic = currentDate;
      bitis = addDays(currentDate, 7);
    }
    randevularGetir(baslangic, bitis);
  }, [currentDate, viewMode, randevularGetir]);

  // ─── Navigation ──────────────────────────────────────────────
  function navGeri() {
    if (viewMode === "aylik")
      setCurrentDate((d) => startOfMonth(addDays(d, -1)));
    else if (viewMode === "gunluk")
      setCurrentDate((d) => addDays(d, -1));
    else setCurrentDate((d) => subWeeks(d, 1));
  }

  function navIleri() {
    if (viewMode === "aylik")
      setCurrentDate((d) => startOfMonth(addDays(endOfMonth(d), 1)));
    else if (viewMode === "gunluk")
      setCurrentDate((d) => addDays(d, 1));
    else setCurrentDate((d) => addWeeks(d, 1));
  }

  // ─── Cell state ───────────────────────────────────────────────
  function hucreDurumu(
    gun: Date,
    saat: number
  ): { kalip: HucreKalip; randevu?: Randevu } {
    const dayOfWeek = getDay(gun); // 0=Sun … 6=Sat
    const gunStr = format(gun, "yyyy-MM-dd");

    if (izinler.some((i) => i.date === gunStr)) return { kalip: "closed" };

    const saatMin = saat * 60;
    const inMusaitlik = musaitlik.some(
      (m) =>
        m.day_of_week === dayOfWeek &&
        m.is_active &&
        timeToMin(m.start_time) <= saatMin &&
        timeToMin(m.end_time) > saatMin
    );
    if (!inMusaitlik) return { kalip: "closed" };

    const randevuVar = randevular.find((r) => {
      const rD = parseISO(r.scheduled_at);
      return isSameDay(rD, gun) && getHours(rD) === saat;
    });
    if (randevuVar) return { kalip: "booked", randevu: randevuVar };

    const isBuffer = randevular.some((r) => {
      const rD = parseISO(r.scheduled_at);
      if (!isSameDay(rD, gun)) return false;
      const startMin = getHours(rD) * 60 + getMinutes(rD);
      const endMin = startMin + (r.duration_minutes ?? 50);
      const bufEndMin = endMin + bufferMinutes;
      const slotStart = saat * 60;
      const slotEnd = (saat + 1) * 60;
      return endMin < slotEnd && bufEndMin > slotStart && endMin <= slotStart;
    });
    if (isBuffer) return { kalip: "buffer" };

    return { kalip: "avail" };
  }

  // ─── Stats ────────────────────────────────────────────────────
  const haftaGunleri = Array.from({ length: 7 }, (_, i) =>
    addDays(currentDate, i)
  );

  const buHaftaRandevu = randevular.length;
  const musaitSlotSayisi = SAATLER.reduce(
    (acc, s) =>
      acc +
      haftaGunleri.filter((g) => hucreDurumu(g, s).kalip === "avail").length,
    0
  );

  // ─── Musaitlik kaydet ─────────────────────────────────────────
  async function musaitlikKaydet(yeni: Omit<MusaitlikSlot, "id">[]) {
    const res = await fetch("/api/danismanlar/musaitlik", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musaitlik: yeni }),
    });
    if (!res.ok) throw new Error("Kayıt başarısız");
    setMusaitlik(yeni.map((s, i) => ({ ...s, id: `local-${i}` })));
  }

  // ─── Izin yönetimi ────────────────────────────────────────────
  async function izinEkle(date: string, reason: string) {
    const res = await fetch("/api/danismanlar/izin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason: reason || undefined }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error ?? "İzin eklenemedi");
    }
    const body = (await res.json()) as {
      izin?: { id: string; date: string; reason: string | null };
    };
    if (body.izin) {
      setIzinler((prev) => [
        ...prev,
        { id: body.izin!.id, date: body.izin!.date, reason: body.izin!.reason },
      ]);
    }
  }

  async function izinSil(id: string) {
    const res = await fetch(`/api/danismanlar/izin/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setIzinler((prev) => prev.filter((i) => i.id !== id));
    }
  }

  // ─── Dönem etiketi ────────────────────────────────────────────
  const donemEtiketi =
    viewMode === "aylik"
      ? format(currentDate, "MMMM yyyy", { locale: tr })
      : viewMode === "gunluk"
      ? format(currentDate, "d MMMM yyyy, EEEE", { locale: tr })
      : `${format(currentDate, "d")} — ${format(addDays(currentDate, 6), "d MMMM yyyy", { locale: tr })}`;

  const haftaNo = getISOWeek(currentDate);

  // ─── Aylık görünüm ────────────────────────────────────────────
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = (getDay(monthStart) + 6) % 7; // Pzt=0

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col flex-1 min-w-0 min-h-0"
      style={{ fontFamily: "system-ui, Arial, sans-serif" }}
    >
      {/* Modals */}
      <AnimatePresence>
        {musaitlikModal && (
          <MusaitlikModal
            musaitlik={musaitlik}
            onKaydet={musaitlikKaydet}
            onKapat={() => setMusaitlikModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {izinModal && (
          <IzinModal
            onEkle={izinEkle}
            onKapat={() => setIzinModal(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {seciliRandevu && (
          <RandevuDetayModal
            randevu={seciliRandevu}
            onKapat={() => setSeciliRandevu(null)}
          />
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#D4E4D8] bg-white flex-wrap">
        <button
          onClick={navGeri}
          aria-label="Önceki"
          className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[13px] hover:border-[#325343] transition-colors flex-shrink-0"
        >
          ‹
        </button>
        <span className="text-[13px] font-bold text-[#252625] min-w-[160px]">
          {donemEtiketi}
        </span>
        <button
          onClick={navIleri}
          aria-label="Sonraki"
          className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[13px] hover:border-[#325343] transition-colors flex-shrink-0"
        >
          ›
        </button>
        {viewMode === "haftalik" && (
          <span className="text-[11px] text-[#4A4D4A] ml-1">
            Hafta {haftaNo}
          </span>
        )}
        {loading && (
          <span className="text-[10px] text-[#4A4D4A] ml-2">Yükleniyor…</span>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex">
            {(["aylik", "haftalik", "gunluk"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-[5px] text-[11.5px] font-semibold border-[1.5px] border-r-0 last:border-r-[1.5px] transition-colors ${
                  viewMode === mode
                    ? "bg-[#A6DE9B] text-[#325343] border-[#325343]"
                    : "bg-white text-[#4A4D4A] border-[#D4E4D8] hover:text-[#252625] hover:border-[#325343]"
                }`}
              >
                {mode === "aylik"
                  ? "Aylık"
                  : mode === "haftalik"
                  ? "Haftalık"
                  : "Günlük"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMusaitlikModal(true)}
            className="bg-[#A6DE9B] text-[#325343] text-[11.5px] font-bold px-3 py-[5px] whitespace-nowrap hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
          >
            + Müsaitlik Ekle
          </button>
          <button
            onClick={() => setIzinModal(true)}
            className="border-[1.5px] border-[#325343] text-[#252625] text-[11.5px] font-bold px-3 py-[5px] whitespace-nowrap hover:bg-[#F5F7F5] transition-colors"
          >
            Tatil Ekle
          </button>
        </div>
      </div>

      {/* Legend (haftalık) */}
      {viewMode === "haftalik" && (
        <div className="flex items-center gap-4 px-4 py-1.5 border-b border-[#D4E4D8] bg-[#F5F7F5] flex-wrap text-[10px] text-[#4A4D4A]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 bg-white border-[1.5px] border-[#325343]" />
            Müsait
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 bg-[#325343]" />
            Randevu var
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]" />
            Kapalı
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2.5 bg-[#F5F7F5] border-[1.5px] border-dashed border-[#BDBDBD]" />
            Tampon
          </div>
          {(googleBagili || outlookBagili) && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[#252625] font-bold">✓</span>
              {googleBagili && "Google"}
              {googleBagili && outlookBagili && " · "}
              {outlookBagili && "Outlook"} senkronize
            </div>
          )}
          <div className="ml-auto">
            Bu hafta:{" "}
            <strong className="text-[#252625]">{buHaftaRandevu} randevu</strong>
            {" · "}Müsait slot:{" "}
            <strong className="text-[#252625]">{musaitSlotSayisi}</strong>
          </div>
        </div>
      )}

      {/* Bu haftaki izin bildirimi */}
      {viewMode === "haftalik" &&
        izinler.filter((iz) =>
          haftaGunleri.some((g) => format(g, "yyyy-MM-dd") === iz.date)
        ).length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#F5F7F5] border-b border-[#D4E4D8] flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
              Bu hafta:
            </span>
            {izinler
              .filter((iz) =>
                haftaGunleri.some((g) => format(g, "yyyy-MM-dd") === iz.date)
              )
              .map((iz) => (
                <div
                  key={iz.id}
                  className="flex items-center gap-1 border-[1.5px] border-dashed border-[#BDBDBD] px-2 py-0.5"
                >
                  <span className="text-[10px] text-[#252625]">
                    {format(parseISO(iz.date), "d MMM", { locale: tr })} — İzin
                  </span>
                  {iz.reason && (
                    <span className="text-[10px] text-[#4A4D4A]">
                      ({iz.reason})
                    </span>
                  )}
                  <button
                    onClick={() => izinSil(iz.id)}
                    className="text-[#4A4D4A] hover:text-[#252625] text-[11px] ml-0.5 leading-none"
                    aria-label="İzni kaldır"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}

      {/* ─── HAFTALİK GÖRÜNÜM ───────────────────────────── */}
      {viewMode === "haftalik" && (
        <div className="flex-1 overflow-auto">
          <div className="min-w-[660px]">
            {/* Gün başlıkları */}
            <div
              className="grid sticky top-0 bg-white z-10"
              style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
            >
              <div className="border-b border-r border-[#D4E4D8]" />
              {haftaGunleri.map((gun, i) => {
                const isToday = isSameDay(gun, today);
                const dayIdx = getDay(gun);
                return (
                  <div
                    key={i}
                    className="border-b border-r border-[#D4E4D8] py-1.5 text-center"
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-[0.5px] ${
                        isToday ? "text-[#252625]" : "text-[#4A4D4A]"
                      }`}
                    >
                      {GUN_KISA[dayIdx] ?? ""}
                    </div>
                    <div
                      className={`text-[15px] font-bold mt-0.5 w-[26px] h-[26px] flex items-center justify-center mx-auto ${
                        isToday
                          ? "bg-[#A6DE9B] text-[#325343] rounded-full"
                          : "text-[#252625]"
                      }`}
                    >
                      {format(gun, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Saat satırları */}
            {SAATLER.map((saat) => (
              <div
                key={saat}
                className="grid"
                style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
              >
                <div className="text-[9.5px] text-[#4A4D4A] font-semibold text-right pr-1.5 pt-1 h-9 border-r border-[#D4E4D8] border-b border-b-[#F0F0F0] flex-shrink-0">
                  {String(saat).padStart(2, "0")}:00
                </div>
                {haftaGunleri.map((gun, j) => {
                  const { kalip, randevu: r } = hucreDurumu(gun, saat);
                  return (
                    <motion.div
                      key={j}
                      role={kalip === "booked" ? "button" : undefined}
                      tabIndex={kalip === "booked" ? 0 : undefined}
                      aria-label={
                        kalip === "booked" && r
                          ? `${SEANS_ETIKET[r.session_type] ?? "Seans"} — ${format(parseISO(r.scheduled_at), "HH:mm")}`
                          : undefined
                      }
                      className={`h-9 border-r border-[#D4E4D8] border-b border-b-[#F0F0F0] relative overflow-hidden ${
                        kalip === "booked"
                          ? "bg-[#325343] cursor-pointer"
                          : kalip === "buffer"
                          ? "bg-[#F5F7F5]"
                          : kalip === "closed"
                          ? "bg-[#D4E4D8]"
                          : "bg-white hover:bg-[#F5F7F5] cursor-default"
                      } ${
                        kalip === "buffer"
                          ? "border-[1.5px] border-dashed border-[#BDBDBD]"
                          : ""
                      }`}
                      onClick={() => {
                        if (kalip === "booked" && r) setSeciliRandevu(r);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && kalip === "booked" && r)
                          setSeciliRandevu(r);
                      }}
                      whileHover={
                        prefersReduced || kalip !== "booked"
                          ? {}
                          : { opacity: 0.85 }
                      }
                      transition={{ duration: 0.1 }}
                    >
                      {kalip === "booked" && r && (
                        <div className="px-1 pt-0.5 overflow-hidden h-full">
                          <div className="text-[9px] font-bold text-white leading-tight truncate">
                            {SEANS_ETIKET[r.session_type] ?? "Seans"}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── AYLIK GÖRÜNÜM ──────────────────────────────── */}
      {viewMode === "aylik" && (
        <motion.div
          key="aylik"
          className="flex-1 overflow-auto p-4"
          initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="grid gap-px bg-[#D4E4D8] border-[1.5px] border-[#D4E4D8]"
            style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <div
                key={d}
                className="bg-[#F5F7F5] text-center text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] py-2"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white h-24" />
            ))}
            {monthDays.map((gun) => {
              const gunStr = format(gun, "yyyy-MM-dd");
              const gunRandevular = randevular.filter((r) =>
                isSameDay(parseISO(r.scheduled_at), gun)
              );
              const izinli = izinler.some((i) => i.date === gunStr);
              const isToday = isSameDay(gun, today);
              const digerAy = !isSameMonth(gun, currentDate);
              return (
                <div
                  key={gunStr}
                  className={`bg-white h-24 p-1.5 border-t border-[#D4E4D8] ${
                    digerAy ? "opacity-30" : ""
                  } ${izinli ? "bg-[#F5F7F5]" : ""}`}
                >
                  <div
                    className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center ${
                      isToday
                        ? "bg-[#A6DE9B] text-[#325343] rounded-full"
                        : "text-[#252625]"
                    }`}
                  >
                    {format(gun, "d")}
                  </div>
                  {izinli && (
                    <div className="text-[9px] text-[#4A4D4A] mt-0.5">İzin</div>
                  )}
                  {gunRandevular.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="bg-[#A6DE9B] text-[#325343] text-[9px] px-1 mt-0.5 truncate cursor-pointer"
                      onClick={() => setSeciliRandevu(r)}
                    >
                      {format(parseISO(r.scheduled_at), "HH:mm")}{" "}
                      {SEANS_ETIKET[r.session_type] ?? ""}
                    </div>
                  ))}
                  {gunRandevular.length > 3 && (
                    <div className="text-[9px] text-[#4A4D4A] mt-0.5">
                      +{gunRandevular.length - 3} daha
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── GÜNLÜK GÖRÜNÜM ─────────────────────────────── */}
      {viewMode === "gunluk" && (
        <motion.div
          key="gunluk"
          className="flex-1 overflow-auto p-4"
          initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-[1.5px] border-[#D4E4D8]">
            {SAATLER.map((saat) => {
              const { kalip, randevu: r } = hucreDurumu(currentDate, saat);
              return (
                <div
                  key={saat}
                  className={`flex items-center border-b border-[#D4E4D8] last:border-b-0 h-16 ${
                    kalip === "booked"
                      ? "bg-[#325343]"
                      : kalip === "buffer"
                      ? "bg-[#F5F7F5]"
                      : kalip === "closed"
                      ? "bg-[#D4E4D8]"
                      : "bg-white"
                  }`}
                >
                  <div className="w-16 flex-shrink-0 text-[10px] text-[#4A4D4A] font-bold text-right pr-3">
                    {String(saat).padStart(2, "0")}:00
                  </div>
                  {kalip === "booked" && r && (
                    <div
                      className="flex-1 px-3 cursor-pointer"
                      onClick={() => setSeciliRandevu(r)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSeciliRandevu(r);
                      }}
                    >
                      <div className="text-[11px] font-bold text-white">
                        {SEANS_ETIKET[r.session_type] ?? "Seans"}
                      </div>
                      <div className="text-[10px] text-white/70">
                        {r.duration_minutes ?? 50} dk
                      </div>
                    </div>
                  )}
                  {kalip === "buffer" && (
                    <div className="flex-1 px-3 text-[10px] text-[#4A4D4A] italic">
                      Tampon süresi
                    </div>
                  )}
                  {kalip === "avail" && (
                    <div className="flex-1 px-3 text-[10px] text-[#4A4D4A]">
                      Müsait
                    </div>
                  )}
                  {kalip === "closed" && (
                    <div className="flex-1 px-3 text-[10px] text-[#4A4D4A]">
                      Kapalı
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
