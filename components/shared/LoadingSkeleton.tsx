"use client";

import { motion, useReducedMotion } from "framer-motion";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

// Tek bir skeleton kutusu — shimmer animasyonlu
export function Skeleton({ width = "100%", height = 16, className }: SkeletonProps) {
  const prefersReduced = useReducedMotion();
  return (
    // [FIX #18] aria-hidden: ekran okuyuculara anlamsız placeholder içerik duyurulmuyor
    <motion.div
      aria-hidden="true"
      animate={prefersReduced ? { opacity: 0.6 } : { opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: prefersReduced ? 0 : Infinity, ease: "easeInOut" }}
      style={{
        width,
        height,
        backgroundColor: "var(--mb-border)",
        display: "block",
      }}
      className={className}
    />
  );
}

// ─── Hazır şablonlar ────────────────────────────────────────────

/** Danışman kart iskeleti */
export function DanismanKartiSkeleton() {
  return (
    <div
      style={{
        border: "1.5px solid var(--mb-border)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Avatar + isim */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Skeleton width={48} height={48} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width="60%" height={13} />
          <Skeleton width="40%" height={11} />
        </div>
      </div>
      {/* Etiketler */}
      <div style={{ display: "flex", gap: 6 }}>
        <Skeleton width={60} height={20} />
        <Skeleton width={80} height={20} />
        <Skeleton width={50} height={20} />
      </div>
      {/* Fiyat + buton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={80} height={13} />
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
}

/** Tablo satırı iskeleti */
export function TabloSatiriSkeleton({ kolonSayisi = 4 }: { kolonSayisi?: number }) {
  return (
    // [FIX #18] Tablo satırı da ekran okuyucudan gizlendi
    <tr aria-hidden="true">
      {/* [FIX #25] Index key yerine stable prefix+index key */}
      {Array.from({ length: kolonSayisi }).map((_, i) => (
        <td key={`col-${i}`} style={{ padding: "10px 12px", borderBottom: "1px solid var(--mb-border)" }}>
          <Skeleton height={12} width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}

/** Panel dashboard KPI kartı iskeleti */
export function KpiKartiSkeleton() {
  return (
    <div
      style={{
        border: "1.5px solid var(--mb-border)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Skeleton width="50%" height={10} />
      <Skeleton width="40%" height={28} />
      <Skeleton width="70%" height={10} />
    </div>
  );
}

/** Randevu listesi satırı iskeleti */
export function RandevuSatiriSkeleton() {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--mb-border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Skeleton width={40} height={40} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={72} height={24} />
    </div>
  );
}

/** Genel sayfa yükleme iskeleti */
export function SayfaIskeleti() {
  return (
    // [FIX #18] Sayfa yükleme iskeleti ekran okuyucudan gizlendi; aria-busy üst bileşende set edilmeli
    <div
      aria-hidden="true"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Skeleton width="30%" height={20} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {/* [FIX #25] Stable key prefix */}
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiKartiSkeleton key={`kpi-${i}`} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <RandevuSatiriSkeleton key={`randevu-${i}`} />
        ))}
      </div>
    </div>
  );
}

/** Varsayılan export — tek satır skeleton */
export default Skeleton;
