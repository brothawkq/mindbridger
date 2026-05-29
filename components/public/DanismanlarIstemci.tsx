"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import { DanismanKarti } from "./DanismanKarti";
import type { DanismanKartiVeri } from "./DanismanKarti";

// ─── Tipler ───────────────────────────────────────────────────────
export interface DanismanlarMeta {
  toplam:        number;
  sayfa:         number;
  toplam_sayfa:  number;
  limit:         number;
  sonuc_var:     boolean;
}

interface ApiResponse {
  danismanlar: DanismanKartiVeri[];
  meta: DanismanlarMeta;
}

interface Props {
  initialDanismanlar:  DanismanKartiVeri[];
  initialMeta:         DanismanlarMeta;
  /** URL search param string'i (sayfa hariç) — filtre değişince anahtar olarak kullanılır */
  searchParamsString:  string;
}

// ─── Iskelet kart ─────────────────────────────────────────────────
function SkeletonKart({ index }: { index: number }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReduced ? 0 : index * 0.04, duration: prefersReduced ? 0.01 : 0.2 }}
      aria-hidden="true"
      style={{
        backgroundColor: "var(--mb-surface)",
        border: "1.5px solid var(--mb-border)",
        padding: 16,
        height: 224,
        boxSizing: "border-box",
      }}
    >
      {/* Avatar + isim bloğu */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 52,
            height: 52,
            flexShrink: 0,
            backgroundColor: "var(--mb-bg)",
            border: "1.5px solid var(--mb-border)",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 13, width: "62%", backgroundColor: "var(--mb-bg)" }} />
          <div style={{ height: 11, width: "42%", backgroundColor: "var(--mb-bg)" }} />
          <div style={{ height: 10, width: "50%", backgroundColor: "var(--mb-bg)" }} />
        </div>
      </div>
      {/* Etiketler */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[76, 64, 88].map((w) => (
          <div
            key={w}
            style={{
              height: 20,
              width: w,
              backgroundColor: "var(--mb-bg)",
              border: "1px solid var(--mb-border)",
            }}
          />
        ))}
      </div>
      {/* Ayırıcı */}
      <div style={{ height: 1, backgroundColor: "var(--mb-border)", margin: "auto 0 12px" }} />
      {/* Puan + fiyat */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ height: 12, width: 58, backgroundColor: "var(--mb-bg)" }} />
        <div style={{ height: 12, width: 78, backgroundColor: "var(--mb-bg)" }} />
      </div>
    </motion.div>
  );
}

// ─── Boş durum ────────────────────────────────────────────────────
function EmptyState() {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: "easeOut" }}
      style={{
        textAlign: "center",
        padding: "48px 24px",
        backgroundColor: "var(--mb-surface)",
        border: "1.5px solid var(--mb-border)",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden="true">
        🔍
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--mb-text)",
          marginBottom: 8,
        }}
      >
        Sonuç bulunamadı
      </div>
      <div
        style={{ fontSize: 12, color: "var(--mb-muted)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}
      >
        Seçili filtrelere uygun danışman bulunamadı. Filtreleri değiştirerek
        tekrar deneyin.
      </div>
    </motion.div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────
export function DanismanlarIstemci({
  initialDanismanlar,
  initialMeta,
  searchParamsString,
}: Props) {
  const [danismanlar, setDanismanlar] = useState<DanismanKartiVeri[]>(initialDanismanlar);
  const [currentPage, setCurrentPage]   = useState(initialMeta.sayfa);
  const [totalPages, setTotalPages]     = useState(initialMeta.toplam_sayfa);
  const [toplam, setToplam]             = useState(initialMeta.toplam);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Eş zamanlı fetch'i önlemek için ref — state'in stale closure sorununu çözer
  const fetchingRef = useRef(false);

  // Sonsuz scroll sentinel
  const { ref, inView } = useInView({ rootMargin: "200px", threshold: 0 });

  useEffect(() => {
    if (!inView || fetchingRef.current || currentPage >= totalPages) return;

    const controller = new AbortController();
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    const nextPage  = currentPage + 1;
    const separator = searchParamsString ? "&" : "";

    fetch(
      `/api/danismanlar?${searchParamsString}${separator}sayfa=${nextPage}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Sunucu hatası (${res.status})`);
        return res.json() as Promise<ApiResponse>;
      })
      .then((json) => {
        setDanismanlar((prev) => [...prev, ...json.danismanlar]);
        setCurrentPage(json.meta.sayfa);
        setTotalPages(json.meta.toplam_sayfa);
        setToplam(json.meta.toplam);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Danışmanlar yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.");
      })
      .finally(() => {
        fetchingRef.current = false;
        setLoading(false);
      });

    return () => { controller.abort(); };
  }, [inView, currentPage, totalPages, searchParamsString]);

  const hasMore = currentPage < totalPages;

  return (
    <section aria-label="Danışman listesi" style={{ flex: 1, minWidth: 0 }}>
      {/* Sonuç sayısı */}
      <div
        style={{
          fontSize: 11,
          color: "var(--mb-muted)",
          marginBottom: 12,
          minHeight: 16,
        }}
      >
        {toplam > 0
          ? `${toplam.toLocaleString("tr-TR")} danışman bulundu`
          : loading
          ? "Yükleniyor…"
          : null}
      </div>

      {/* Boş durum */}
      {danismanlar.length === 0 && !loading && <EmptyState />}

      {/* Kart ızgarası */}
      {(danismanlar.length > 0 || loading) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))",
            gap: 14,
          }}
        >
          {danismanlar.map((d, i) => (
            <DanismanKarti key={d.id} danisan={d} index={i} />
          ))}
          {/* Sayfa 2+ yüklenirken iskelet kartları */}
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonKart key={`sk-${i}`} index={i} />
            ))}
        </div>
      )}

      {/* Intersection observer sentinel — daha fazla sayfa varsa görünür */}
      {hasMore && (
        <div
          ref={ref}
          aria-hidden="true"
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          {loading && (
            <span style={{ fontSize: 11, color: "var(--mb-muted)" }}>
              Yükleniyor…
            </span>
          )}
        </div>
      )}

      {/* Hata mesajı */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: "10px 14px",
            backgroundColor: "var(--mb-surface)",
            border: "1.5px solid var(--mb-border)",
            fontSize: 12,
            color: "var(--mb-muted)",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </section>
  );
}
