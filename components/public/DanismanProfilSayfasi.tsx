"use client";

import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────

export interface DanismanProfilVeri {
  id: string;
  slug: string;
  bio: string | null;
  title: string | null;
  approach: string[] | null;
  specialties: string[] | null;
  age_groups: string[] | null;
  languages: string[] | null;
  gender: string | null;
  city: string | null;
  district: string | null;
  is_online: boolean;
  is_in_person: boolean;
  is_supervisor: boolean;
  intro_session_enabled: boolean;
  intro_session_duration: number | null;
  session_duration: number | null;
  buffer_minutes: number | null;
  price_individual: number | null;
  price_group: number | null;
  price_async: number | null;
  sliding_scale: boolean;
  sliding_scale_price: number | null;
  average_rating: number;
  total_reviews: number;
  total_sessions: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PaketVeri {
  id: string;
  name: string | null;
  session_count: number | null;
  price: number | null;
  discount_percent: number | null;
  validity_days: number | null;
}

export interface DegerlendirmeVeri {
  id: string;
  rating: number | null;
  comment: string | null;
  review_reply: string | null;
  reply_at: string | null;
  created_at: string | null;
}

type TakvimGun = {
  tarih: string;
  musait: boolean;
  slotlar: string[];
};

type CalCellType = "empty" | "past" | "today" | "today-full" | "available" | "full" | "outside";

interface CalCell {
  type: CalCellType;
  day: number;
  tarih: string;
}

// ─── Constants ───────────────────────────────────────────────────

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;

const TR_DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

// ─── Calendar helpers ─────────────────────────────────────────────

function todayTRStr(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseDateStr(dateStr: string): { year: number; month: number } {
  const [y = "0", m = "0"] = dateStr.split("-");
  return { year: Number(y), month: Number(m) - 1 };
}

function buildMonthCalendar(
  year: number,
  month: number,
  todayStr: string,
  rangeEndStr: string,
  gunMap: Map<string, TakvimGun>,
): CalCell[][] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (firstDay.getUTCDay() + 6) % 7; // Mon = 0

  const weeks: CalCell[][] = [];
  let week: CalCell[] = [];

  for (let i = 0; i < offset; i++) {
    week.push({ type: "empty", day: 0, tarih: "" });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm  = String(month + 1).padStart(2, "0");
    const dd  = String(d).padStart(2, "0");
    const tarih = `${year}-${mm}-${dd}`;

    let type: CalCellType;
    if (tarih < todayStr) {
      type = "past";
    } else if (tarih > rangeEndStr) {
      type = "outside";
    } else {
      const gun    = gunMap.get(tarih);
      const musait = gun?.musait ?? false;
      if (tarih === todayStr) {
        type = musait ? "today" : "today-full";
      } else {
        type = musait ? "available" : "full";
      }
    }

    week.push({ type, day: d, tarih });
    if (week.length === 7) { weeks.push(week); week = []; }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push({ type: "empty", day: 0, tarih: "" });
    weeks.push(week);
  }

  return weeks;
}

function calDayStyle(cell: CalCell, isSelected: boolean): CSSProperties {
  const base: CSSProperties = {
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    cursor: "default",
    userSelect: "none",
  };

  if (isSelected) {
    return { ...base, background: "var(--mb-text)", color: "var(--mb-primary-text)", border: "1.5px solid var(--mb-text)" };
  }

  switch (cell.type) {
    case "available":
      return { ...base, border: "1.5px solid var(--mb-text)", background: "var(--mb-surface)", color: "var(--mb-text)", cursor: "pointer" };
    case "today":
      return { ...base, border: "2px solid var(--mb-text)", background: "var(--mb-surface)", color: "var(--mb-text)", cursor: "pointer", fontWeight: 700 };
    case "today-full":
      return { ...base, border: "2px solid var(--mb-border)", background: "var(--mb-bg)", color: "var(--mb-muted)", fontWeight: 700 };
    case "past":
    case "full":
    case "outside":
      return { ...base, border: "1.5px solid var(--mb-border)", background: "var(--mb-bg)", color: "var(--mb-muted)" };
    case "empty":
      return { ...base, border: "1.5px solid transparent", background: "transparent" };
  }
}

// ─── Section heading shared helper ───────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1,
      textTransform: "uppercase", color: "var(--mb-text)",
      marginBottom: 8, paddingBottom: 4,
      borderBottom: "1px dotted var(--mb-border)",
    }}>
      {children}
    </div>
  );
}

// ─── Tab content components ───────────────────────────────────────

function HakkimdaTab({ danisan }: { danisan: DanismanProfilVeri }) {
  const uzmanliklar = danisan.specialties ?? [];
  const yaklasimlar = danisan.approach ?? [];

  return (
    <>
      <SectionHeading>Hakkımda</SectionHeading>
      <div style={{ marginBottom: 20 }}>
        {danisan.bio ? (
          <p style={{ fontSize: 13, color: "var(--mb-text)", lineHeight: 1.6, margin: 0 }}>
            {danisan.bio}
          </p>
        ) : (
          <p style={{ fontSize: 11, color: "var(--mb-muted)", margin: 0 }}>
            Henüz bir tanıtım metni eklenmemiş.
          </p>
        )}
      </div>

      {uzmanliklar.length > 0 && (
        <>
          <SectionHeading>Uzmanlık Alanları</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {uzmanliklar.slice(0, 4).map((u) => (
              <span key={u} style={{
                fontSize: 11, padding: "4px 10px",
                border: "1.5px solid var(--mb-text)",
                background: "var(--mb-surface)",
                color: "var(--mb-text)", fontWeight: 600,
              }}>
                {u}
              </span>
            ))}
            {uzmanliklar.slice(4).map((u) => (
              <span key={u} style={{
                fontSize: 11, padding: "4px 10px",
                border: "1.5px solid var(--mb-border)",
                background: "var(--mb-surface)",
                color: "var(--mb-muted)", fontWeight: 400,
              }}>
                {u}
              </span>
            ))}
          </div>
        </>
      )}

      {yaklasimlar.length > 0 && (
        <>
          <SectionHeading>Çalışma Yöntemleri</SectionHeading>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {yaklasimlar.map((a) => (
              <div key={a} style={{
                border: "1.5px solid var(--mb-border)",
                padding: "8px 12px",
                background: "var(--mb-bg)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)" }}>{a}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function UzmanlikTab({ danisan }: { danisan: DanismanProfilVeri }) {
  const uzmanliklar = danisan.specialties ?? [];
  const yaklasimlar = danisan.approach    ?? [];
  const yasGruplari = danisan.age_groups  ?? [];

  if (uzmanliklar.length === 0 && yaklasimlar.length === 0) {
    return <p style={{ fontSize: 11, color: "var(--mb-muted)" }}>Bilgi henüz eklenmemiş.</p>;
  }

  return (
    <>
      {uzmanliklar.length > 0 && (
        <>
          <SectionHeading>Uzmanlık Alanları</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {uzmanliklar.map((u) => (
              <span key={u} style={{
                fontSize: 11, padding: "4px 10px",
                border: "1.5px solid var(--mb-text)",
                background: "var(--mb-surface)",
                color: "var(--mb-text)", fontWeight: 600,
              }}>
                {u}
              </span>
            ))}
          </div>
        </>
      )}
      {yaklasimlar.length > 0 && (
        <>
          <SectionHeading>Çalışma Yöntemleri</SectionHeading>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            {yaklasimlar.map((a) => (
              <div key={a} style={{
                border: "1.5px solid var(--mb-border)",
                padding: "8px 12px",
                background: "var(--mb-bg)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)" }}>{a}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {yasGruplari.length > 0 && (
        <>
          <SectionHeading>Çalışılan Yaş Grupları</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {yasGruplari.map((y) => (
              <span key={y} style={{
                fontSize: 11, padding: "4px 10px",
                border: "1.5px solid var(--mb-border)",
                background: "var(--mb-surface)",
                color: "var(--mb-text)", fontWeight: 400,
              }}>
                {y}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function EgitimTab() {
  return (
    <p style={{ fontSize: 11, color: "var(--mb-muted)", margin: 0 }}>
      Eğitim ve CV bilgileri yakında eklenecek.
    </p>
  );
}

function DegerlendirmeTab({ degerlendirmeler }: { degerlendirmeler: DegerlendirmeVeri[] }) {
  if (degerlendirmeler.length === 0) {
    return <p style={{ fontSize: 11, color: "var(--mb-muted)", margin: 0 }}>Henüz değerlendirme bulunmuyor.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {degerlendirmeler.map((d) => (
        <div key={d.id} style={{
          border: "1.5px solid var(--mb-border)",
          padding: "12px 14px",
          backgroundColor: "var(--mb-surface)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>
              {"★".repeat(Math.max(0, Math.min(5, d.rating ?? 0)))}
            </span>
            <span style={{ fontSize: 10, color: "var(--mb-muted)" }}>
              {d.created_at ? new Date(d.created_at).toLocaleDateString("tr-TR") : ""}
            </span>
          </div>
          {d.comment && (
            <p style={{ fontSize: 12, color: "var(--mb-text)", margin: "0 0 8px", lineHeight: 1.5 }}>
              {d.comment}
            </p>
          )}
          {d.review_reply && (
            <div style={{ borderLeft: "2px solid var(--mb-border)", paddingLeft: 10, marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mb-muted)", marginBottom: 4 }}>
                Danışman yanıtı
              </div>
              <p style={{ fontSize: 11, color: "var(--mb-muted)", margin: 0 }}>
                {d.review_reply}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Booking panel ────────────────────────────────────────────────

interface BookingPanelProps {
  danisan: DanismanProfilVeri;
  ilkPaket: PaketVeri | null;
  randevuUrl: string;
  introUrl: string;
}

function BookingPanel({ danisan, ilkPaket, randevuUrl, introUrl }: BookingPanelProps) {
  const seansuresi  = danisan.session_duration         ?? 50;
  const introSuresi = danisan.intro_session_duration   ?? 15;

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      padding: "18px 16px",
      position: "sticky",
      top: 20,
      alignSelf: "flex-start",
    }}>
      {danisan.price_individual !== null ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--mb-text)", marginBottom: 2 }}>
            {danisan.price_individual.toLocaleString("tr-TR")}₺
          </div>
          <div style={{ fontSize: 11, color: "var(--mb-muted)", marginBottom: 10 }}>
            / seans ({seansuresi} dakika)
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--mb-muted)", marginBottom: 10 }}>
          Fiyat belirtilmemiş
        </div>
      )}

      {danisan.sliding_scale && (
        <div style={{
          border: "1.5px dashed var(--mb-muted)",
          padding: "8px 10px",
          marginBottom: 8,
          background: "var(--mb-bg)",
        }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5,
            textTransform: "uppercase", color: "var(--mb-muted)", marginBottom: 3,
          }}>
            ⬡ Sliding Scale
          </div>
          {danisan.sliding_scale_price !== null && (
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--mb-text)" }}>
              {danisan.sliding_scale_price.toLocaleString("tr-TR")}₺
            </div>
          )}
          <div style={{ fontSize: 10, color: "var(--mb-muted)" }}>
            Gelir durumuna göre esnek fiyat
          </div>
        </div>
      )}

      {ilkPaket && ilkPaket.price !== null && (
        <div style={{
          border: "1.5px solid var(--mb-border)",
          padding: "8px 10px",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5,
            textTransform: "uppercase", color: "var(--mb-muted)",
            marginBottom: 4,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Paket Fiyatı</span>
            {(ilkPaket.discount_percent ?? 0) > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                background: "var(--mb-text)", color: "var(--mb-primary-text)",
                padding: "1px 5px",
              }}>
                %{ilkPaket.discount_percent} İndirim
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mb-text)" }}>
            {ilkPaket.price.toLocaleString("tr-TR")}₺
          </div>
          {ilkPaket.session_count !== null && ilkPaket.session_count > 0 && (
            <div style={{ fontSize: 10, color: "var(--mb-muted)", marginTop: 2 }}>
              {ilkPaket.session_count} seans ·{" "}
              {Math.round(ilkPaket.price / ilkPaket.session_count).toLocaleString("tr-TR")}₺/seans
            </div>
          )}
        </div>
      )}

      <div style={{ height: 1, background: "var(--mb-border)", margin: "10px 0" }} />

      {danisan.intro_session_enabled && (
        <Link
          href={introUrl}
          style={{
            display: "block",
            border: "1.5px solid var(--mb-text)",
            background: "var(--mb-surface)",
            color: "var(--mb-text)",
            padding: "9px",
            fontSize: 12, fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
            marginBottom: 8,
          }}
        >
          Ücretsiz Ön Görüşme ({introSuresi} dk)
        </Link>
      )}

      <Link
        href={randevuUrl}
        style={{
          display: "block",
          border: "none",
          background: "var(--mb-text)",
          color: "var(--mb-primary-text)",
          padding: "10px",
          fontSize: 13, fontWeight: 700,
          textAlign: "center",
          textDecoration: "none",
          marginBottom: 8,
          letterSpacing: 0.3,
        }}
      >
        Randevu Al
      </Link>

      <button
        type="button"
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          fontSize: 11, color: "var(--mb-muted)",
          textDecoration: "underline",
          cursor: "pointer",
          padding: "4px 0",
          background: "none",
          border: "none",
          fontFamily: "inherit",
        }}
      >
        Bekleme Listesine Gir
      </button>

      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: "1px solid var(--mb-border)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {[
          "Ücretsiz iptal (24 saat öncesine kadar)",
          "Güvenli ödeme · iyzico",
          "Ortalama yanıt: 2 saat",
        ].map((info) => (
          <div key={info} style={{
            fontSize: 10.5, color: "var(--mb-muted)",
            display: "flex", gap: 5, alignItems: "flex-start",
          }}>
            <span style={{ color: "var(--mb-text)", fontWeight: 700, flexShrink: 0 }}>✓</span>
            {info}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

interface Props {
  danisan: DanismanProfilVeri;
  paketler: PaketVeri[];
  degerlendirmeler: DegerlendirmeVeri[];
}

const SEKMELER = ["Hakkımda", "Uzmanlık & Yöntem", "Eğitim / CV"] as const;

export function DanismanProfilSayfasi({ danisan, paketler, degerlendirmeler }: Props) {
  const shouldReduceMotion = useReducedMotion();

  const [aktifSekme,   setAktifSekme]   = useState(0);
  const [takvimData,   setTakvimData]   = useState<TakvimGun[] | null>(null);
  const [secilenTarih, setSecilenTarih] = useState<string | null>(null);
  const [secilenSlot,  setSecilenSlot]  = useState<string | null>(null);

  const todayStr    = useMemo(() => todayTRStr(), []);
  const rangeEndStr = useMemo(() => addDaysToStr(todayStr, 29), [todayStr]);

  const { year: initYear, month: initMonth } = useMemo(() => parseDateStr(todayStr), [todayStr]);
  const [displayYear,  setDisplayYear]  = useState(initYear);
  const [displayMonth, setDisplayMonth] = useState(initMonth);

  useEffect(() => {
    let cancelled = false;
    async function doFetch() {
      try {
        const res = await fetch(`/api/danismanlar/${danisan.slug}/takvim`);
        if (!res.ok) throw new Error("takvim hata");
        const json = (await res.json()) as { gunler: TakvimGun[] };
        if (!cancelled) setTakvimData(json.gunler);
      } catch {
        if (!cancelled) setTakvimData([]);
      }
    }
    void doFetch();
    return () => { cancelled = true; };
  }, [danisan.slug]);

  const gunMap = useMemo(() => {
    const m = new Map<string, TakvimGun>();
    for (const g of takvimData ?? []) m.set(g.tarih, g);
    return m;
  }, [takvimData]);

  const calendarWeeks = useMemo(
    () => buildMonthCalendar(displayYear, displayMonth, todayStr, rangeEndStr, gunMap),
    [displayYear, displayMonth, todayStr, rangeEndStr, gunMap],
  );

  const rangeStart = useMemo(() => parseDateStr(todayStr),    [todayStr]);
  const rangeEnd   = useMemo(() => parseDateStr(rangeEndStr), [rangeEndStr]);

  const canGoPrev = displayYear > rangeStart.year || (displayYear === rangeStart.year && displayMonth > rangeStart.month);
  const canGoNext = displayYear < rangeEnd.year   || (displayYear === rangeEnd.year   && displayMonth < rangeEnd.month);

  function prevMonth() {
    if (!canGoPrev) return;
    if (displayMonth === 0) { setDisplayYear((y) => y - 1); setDisplayMonth(11); }
    else setDisplayMonth((m) => m - 1);
  }
  function nextMonth() {
    if (!canGoNext) return;
    if (displayMonth === 11) { setDisplayYear((y) => y + 1); setDisplayMonth(0); }
    else setDisplayMonth((m) => m + 1);
  }

  function handleDayClick(cell: CalCell) {
    if (cell.type !== "available" && cell.type !== "today") return;
    if (secilenTarih === cell.tarih) { setSecilenTarih(null); setSecilenSlot(null); }
    else { setSecilenTarih(cell.tarih); setSecilenSlot(null); }
  }

  const secilenGunSlotlar = secilenTarih ? (gunMap.get(secilenTarih)?.slotlar ?? []) : [];

  const adSoyad   = [danisan.profiles?.first_name, danisan.profiles?.last_name].filter(Boolean).join(" ") || "—";
  const initials  = (danisan.profiles?.first_name?.[0] ?? "?").toUpperCase();
  const sesTipi   = danisan.is_online && danisan.is_in_person
    ? "Online & Yüz Yüze"
    : danisan.is_online ? "Online"
    : danisan.is_in_person ? "Yüz Yüze"
    : null;
  const heroAlt   = [danisan.title, danisan.city, sesTipi].filter(Boolean).join(" · ");

  const ilkPaket  = paketler[0] ?? null;
  const randevuUrl = `/panelim/randevu-al/${danisan.slug}${
    secilenTarih ? `?tarih=${secilenTarih}${secilenSlot ? `&saat=${secilenSlot}` : ""}` : ""}`;
  const introUrl   = `/panelim/randevu-al/${danisan.slug}?tip=intro`;
  const monthLabel = `${TR_MONTHS[displayMonth] ?? ""} ${displayYear}`;

  const sekmeAdlari = [
    ...SEKMELER,
    `Değerlendirmeler (${danisan.total_reviews})`,
  ] as const;

  return (
    <main style={{ backgroundColor: "var(--mb-bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <div style={{
          backgroundColor: "var(--mb-bg)",
          borderBottom: "1.5px solid var(--mb-border)",
          padding: "20px 24px 16px",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}>
          {/* Avatar */}
          <div style={{
            width: 96, height: 96, flexShrink: 0,
            border: "1.5px solid var(--mb-border)",
            overflow: "hidden", position: "relative",
            backgroundColor: "var(--mb-surface)",
          }}>
            {danisan.profiles?.avatar_url ? (
              <Image
                src={danisan.profiles.avatar_url}
                alt={adSoyad}
                fill
                sizes="96px"
                style={{ objectFit: "cover" }}
                priority
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: "var(--mb-muted)",
              }}>
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--mb-text)", margin: "0 0 2px" }}>
              {adSoyad}
            </h1>
            {heroAlt && (
              <div style={{ fontSize: 13, color: "var(--mb-muted)", marginBottom: 8 }}>
                {heroAlt}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>
                <span style={{ fontSize: 14, letterSpacing: 1 }}>★★★★★</span>
                <span>{danisan.average_rating.toFixed(1)}</span>
              </div>
              {danisan.total_reviews > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--mb-muted)", paddingLeft: 14, borderLeft: "1px solid var(--mb-border)" }}>
                  <strong style={{ color: "var(--mb-text)" }}>{danisan.total_reviews}</strong> değerlendirme
                </div>
              )}
              {danisan.total_sessions > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--mb-muted)", paddingLeft: 14, borderLeft: "1px solid var(--mb-border)" }}>
                  <strong style={{ color: "var(--mb-text)" }}>{danisan.total_sessions}</strong> seans
                </div>
              )}
              {(danisan.languages ?? []).length > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--mb-muted)", paddingLeft: 14, borderLeft: "1px solid var(--mb-border)" }}>
                  {(danisan.languages ?? []).join(", ")}
                </div>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                border: "1.5px solid var(--mb-text)",
                padding: "2px 8px",
                backgroundColor: "var(--mb-surface)",
              }}>
                🏅 Doğrulanmış Üye
              </span>
              {danisan.is_supervisor && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  border: "1.5px solid var(--mb-text)",
                  padding: "2px 8px",
                  backgroundColor: "var(--mb-surface)",
                }}>
                  ⭐ Süper Danışman
                </span>
              )}
              {danisan.sliding_scale && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  border: "1.5px dashed var(--mb-muted)",
                  padding: "2px 8px",
                  color: "var(--mb-muted)",
                }}>
                  ⬡ Sliding Scale
                </span>
              )}
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/danismanlar"
            style={{
              fontSize: 11, color: "var(--mb-muted)",
              textDecoration: "underline",
              alignSelf: "flex-start",
              paddingTop: 4, flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            ← Danışman Listesi
          </Link>
        </div>

        {/* ── Tab bar ──────────────────────────────────── */}
        <div style={{
          display: "flex",
          borderBottom: "1.5px solid var(--mb-border)",
          backgroundColor: "var(--mb-surface)",
          overflowX: "auto",
        }}>
          {sekmeAdlari.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setAktifSekme(i)}
              style={{
                padding: "10px 18px",
                fontSize: 12, fontWeight: 600,
                color: aktifSekme === i ? "var(--mb-text)" : "var(--mb-muted)",
                cursor: "pointer",
                border: "none",
                background: "none",
                borderBottom: aktifSekme === i
                  ? "2.5px solid var(--mb-text)"
                  : "2.5px solid transparent",
                marginBottom: -1.5,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Content area ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", backgroundColor: "var(--mb-surface)" }}>

          {/* Left main */}
          <div style={{
            flex: 1,
            padding: "20px 22px",
            borderRight: "1.5px solid var(--mb-border)",
            minWidth: 0,
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={aktifSekme}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {aktifSekme === 0 && <HakkimdaTab danisan={danisan} />}
                {aktifSekme === 1 && <UzmanlikTab danisan={danisan} />}
                {aktifSekme === 2 && <EgitimTab />}
                {aktifSekme === 3 && <DegerlendirmeTab degerlendirmeler={degerlendirmeler} />}
              </motion.div>
            </AnimatePresence>

            {/* Calendar — Hakkımda sekmesinde göster */}
            {aktifSekme === 0 && (
              <div style={{ marginTop: 24 }}>
                <SectionHeading>Müsaitlik Takvimi</SectionHeading>

                {/* Calendar nav + legend */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={!canGoPrev}
                      aria-label="Önceki ay"
                      style={{
                        width: 24, height: 24,
                        border: "1.5px solid var(--mb-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11,
                        color: canGoPrev ? "var(--mb-text)" : "var(--mb-muted)",
                        cursor: canGoPrev ? "pointer" : "default",
                        background: "var(--mb-surface)",
                      }}
                    >
                      ‹
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)", minWidth: 110, textAlign: "center" }}>
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      disabled={!canGoNext}
                      aria-label="Sonraki ay"
                      style={{
                        width: 24, height: 24,
                        border: "1.5px solid var(--mb-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11,
                        color: canGoNext ? "var(--mb-text)" : "var(--mb-muted)",
                        cursor: canGoNext ? "pointer" : "default",
                        background: "var(--mb-surface)",
                      }}
                    >
                      ›
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[
                      { label: "Müsait", borderColor: "var(--mb-text)", bg: "var(--mb-surface)" },
                      { label: "Dolu",   borderColor: "var(--mb-muted)", bg: "var(--mb-bg)" },
                    ].map(({ label, borderColor, bg }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--mb-muted)" }}>
                        <div style={{ width: 10, height: 10, border: `1px solid ${borderColor}`, background: bg }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                  {TR_DAYS_SHORT.map((d) => (
                    <div key={d} style={{
                      textAlign: "center", fontSize: 9.5, fontWeight: 700,
                      letterSpacing: 0.5, color: "var(--mb-muted)",
                      textTransform: "uppercase", padding: "4px 0",
                    }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                {takvimData === null ? (
                  <div style={{ padding: "20px 0", textAlign: "center", fontSize: 11, color: "var(--mb-muted)" }}>
                    Takvim yükleniyor…
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {calendarWeeks.map((week, wi) => (
                      <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                        {week.map((cell, ci) => {
                          const isSelected  = cell.tarih === secilenTarih;
                          const isClickable = cell.type === "available" || cell.type === "today";
                          return (
                            <div
                              key={ci}
                              onClick={() => handleDayClick(cell)}
                              onKeyDown={(e) => {
                                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                                  e.preventDefault();
                                  handleDayClick(cell);
                                }
                              }}
                              role={isClickable ? "button" : undefined}
                              tabIndex={isClickable ? 0 : undefined}
                              aria-label={isClickable ? `${cell.tarih} tarihini seç` : undefined}
                              aria-pressed={isClickable ? isSelected : undefined}
                              style={calDayStyle(cell, isSelected)}
                            >
                              {cell.type !== "empty" ? cell.day : ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected day slots */}
                <AnimatePresence>
                  {secilenTarih && (
                    <motion.div
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? {} : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      style={{ marginTop: 16 }}
                    >
                      <div style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 1,
                        textTransform: "uppercase", color: "var(--mb-text)",
                        marginBottom: 8, paddingBottom: 4,
                        borderBottom: "1px dotted var(--mb-border)",
                      }}>
                        {secilenTarih} — Müsait Saatler
                      </div>
                      {secilenGunSlotlar.length === 0 ? (
                        <p style={{ fontSize: 11, color: "var(--mb-muted)", margin: 0 }}>
                          Bu gün için müsait saat bulunamadı.
                        </p>
                      ) : (
                        <>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {secilenGunSlotlar.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSecilenSlot(secilenSlot === slot ? null : slot)}
                                style={{
                                  padding: "5px 12px",
                                  fontSize: 12, fontWeight: 600,
                                  border: secilenSlot === slot
                                    ? "1.5px solid var(--mb-text)"
                                    : "1.5px solid var(--mb-border)",
                                  background: secilenSlot === slot
                                    ? "var(--mb-text)"
                                    : "var(--mb-surface)",
                                  color: secilenSlot === slot
                                    ? "var(--mb-primary-text)"
                                    : "var(--mb-text)",
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                }}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          <p style={{ fontSize: 10.5, color: "var(--mb-muted)", marginTop: 8, marginBottom: 0 }}>
                            * Saat seçtikten sonra sağdaki "Randevu Al" butonunu kullanın
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right booking panel */}
          <BookingPanel
            danisan={danisan}
            ilkPaket={ilkPaket}
            randevuUrl={randevuUrl}
            introUrl={introUrl}
          />
        </div>
      </div>
    </main>
  );
}
