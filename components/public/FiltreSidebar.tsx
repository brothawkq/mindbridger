"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Filtre seçenekleri ───────────────────────────────────────────
const UZMANLIKLAR = [
  "Anksiyete", "Depresyon", "Travma", "Yas", "Fobiler",
  "Öfke Yönetimi", "Bağımlılık", "Yeme Bozuklukları", "OKB",
  "Kariyer Danışmanlığı", "İlişki Sorunları", "Stres Yönetimi",
  "Panik Atak", "TSSB", "Çift Terapisi",
] as const;

const YAKLASIMLAR = [
  "BDT", "EMDR", "Psikoanaliz", "Varoluşçu Terapi", "Gestalt",
  "ACT", "Mindfulness", "Şema Terapi", "DBT", "Çözüm Odaklı",
] as const;

const YAS_GRUPLARI = ["Çocuk", "Ergen", "Yetişkin", "Yaşlı"] as const;

const DILLER = ["Türkçe", "İngilizce", "Almanca", "Arapça", "Fransızca"] as const;

const SIRALAMA_SECENEKLERI = [
  { value: "puan",         label: "En Yüksek Puan"  },
  { value: "fiyat_artan",  label: "Fiyat: Artan"    },
  { value: "fiyat_azalan", label: "Fiyat: Azalan"   },
  { value: "seans_sayisi", label: "Seans Sayısı"    },
] as const;

const CINSIYET_SECENEKLERI = [
  { value: "",       label: "Fark Etmez" },
  { value: "kadin",  label: "Kadın"      },
  { value: "erkek",  label: "Erkek"      },
] as const;

// Filtre tuşları — bunlardan herhangi biri varsa "Temizle" gösterilir
const FILTER_KEYS = [
  "uzmanlik", "yaklasim", "yas_grubu", "dil", "sehir", "cinsiyet",
  "online", "yuz_yuze", "ucretsiz_gorusme", "sliding_scale",
  "min_fiyat", "max_fiyat",
] as const;

// ─── Yardımcılar ──────────────────────────────────────────────────
function parseCsvSet(v: string | null): Set<string> {
  if (!v) return new Set();
  return new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
}

// ─── Bölüm başlığı ───────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "var(--mb-muted)",
        paddingBottom: 6,
        borderBottom: "1px dotted var(--mb-border)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ─── Checkbox satırı ─────────────────────────────────────────────
function CheckboxItem({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        fontSize: 12,
        color: "var(--mb-text)",
        padding: "3px 0",
        userSelect: "none",
      }}
    >
      {/* Görsel checkbox — CSS variables ile tema uyumlu */}
      <div
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          flexShrink: 0,
          border: `1.5px solid ${checked ? "var(--mb-border-strong)" : "var(--mb-border)"}`,
          backgroundColor: checked ? "var(--mb-text)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
            <path
              d="M1 3L3 5L7 1"
              stroke="var(--mb-primary-text)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {/* Erişilebilir gerçek input */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      {label}
    </label>
  );
}

// ─── Radio satırı ────────────────────────────────────────────────
function RadioItem({
  id,
  name,
  value,
  checked,
  label,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        fontSize: 12,
        color: "var(--mb-text)",
        padding: "3px 0",
        userSelect: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          flexShrink: 0,
          border: `1.5px solid ${checked ? "var(--mb-border-strong)" : "var(--mb-border)"}`,
          borderRadius: "50%",
          backgroundColor: checked ? "var(--mb-text)" : "transparent",
        }}
      />
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      {label}
    </label>
  );
}

// ─── İç bileşen (useSearchParams burada) ─────────────────────────
function FiltreSidebarInner() {
  const router   = useRouter();
  const params   = useSearchParams();

  // Mevcut filtre değerlerini oku
  const uzmanlikSet  = parseCsvSet(params.get("uzmanlik"));
  const yaklasimSet  = parseCsvSet(params.get("yaklasim"));
  const yasGrubuSet  = parseCsvSet(params.get("yas_grubu"));
  const dilSet       = parseCsvSet(params.get("dil"));
  const cinsiyet     = params.get("cinsiyet")  ?? "";
  const siralama     = params.get("siralama")  ?? "puan";
  const minPuan      = params.get("min_puan")  ? Number(params.get("min_puan")) : 0;
  const online       = params.get("online")             === "true";
  const yuzYuze      = params.get("yuz_yuze")           === "true";
  const ucretsiz     = params.get("ucretsiz_gorusme")   === "true";
  const sliding      = params.get("sliding_scale")      === "true";
  const minFiyat     = params.get("min_fiyat")  ?? "";
  const maxFiyat     = params.get("max_fiyat")  ?? "";
  const sehir        = params.get("sehir")      ?? "";

  // Fiyat inputları: yerel state + 500 ms debounce (her tuş vuruşunda URL güncellenmez)
  const [localMinFiyat, setLocalMinFiyat] = useState(minFiyat);
  const [localMaxFiyat, setLocalMaxFiyat] = useState(maxFiyat);

  useEffect(() => { setLocalMinFiyat(params.get("min_fiyat") ?? ""); }, [params]);
  useEffect(() => { setLocalMaxFiyat(params.get("max_fiyat") ?? ""); }, [params]);

  useEffect(() => {
    const t = setTimeout(() => updateParam("min_fiyat", localMinFiyat || null), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMinFiyat]);

  useEffect(() => {
    const t = setTimeout(() => updateParam("max_fiyat", localMaxFiyat || null), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMaxFiyat]);

  const hasFilters = FILTER_KEYS.some((k) => params.has(k)) || params.has("min_puan");

  // URL güncelleme yardımcısı
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(params.toString());
      if (value === null || value === "") {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
      sp.delete("sayfa"); // filtre değişince 1. sayfaya dön
      router.push(`/danismanlar?${sp.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // CSV param'ında tek değeri toggle et
  const toggleCsv = useCallback(
    (key: string, current: Set<string>, value: string) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      updateParam(key, next.size > 0 ? Array.from(next).join(",") : null);
    },
    [updateParam],
  );

  const resetAll = useCallback(() => {
    router.push("/danismanlar", { scroll: false });
  }, [router]);

  return (
    <aside
      aria-label="Filtreler"
      style={{
        width: 220,
        flexShrink: 0,
        backgroundColor: "var(--mb-surface)",
        border: "1.5px solid var(--mb-border)",
        padding: "14px 12px",
        alignSelf: "flex-start",
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 32px)",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* ── Başlık ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-text)" }}>
          Filtreler
        </div>
        {hasFilters && (
          <button
            onClick={resetAll}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 10,
              color: "var(--mb-muted)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Temizle
          </button>
        )}
      </div>

      {/* ── Sıralama ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Sıralama</SectionHeader>
        {SIRALAMA_SECENEKLERI.map((opt) => (
          <RadioItem
            key={opt.value}
            id={`siralama-${opt.value}`}
            name="siralama"
            value={opt.value}
            checked={siralama === opt.value}
            label={opt.label}
            onChange={() => updateParam("siralama", opt.value)}
          />
        ))}
      </div>

      {/* ── Seans Türü ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Seans Türü</SectionHeader>
        <CheckboxItem
          id="online-filter"
          label="Online"
          checked={online}
          onChange={() => updateParam("online", online ? null : "true")}
        />
        <CheckboxItem
          id="yuz-yuze-filter"
          label="Yüz Yüze"
          checked={yuzYuze}
          onChange={() => updateParam("yuz_yuze", yuzYuze ? null : "true")}
        />
      </div>

      {/* ── Özel Seçenekler ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Özel Seçenekler</SectionHeader>
        <CheckboxItem
          id="ucretsiz-filter"
          label="Ücretsiz Ön Görüşme"
          checked={ucretsiz}
          onChange={() =>
            updateParam("ucretsiz_gorusme", ucretsiz ? null : "true")
          }
        />
        <CheckboxItem
          id="sliding-filter"
          label="Esnek Fiyat"
          checked={sliding}
          onChange={() =>
            updateParam("sliding_scale", sliding ? null : "true")
          }
        />
      </div>

      {/* ── Fiyat Aralığı ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Fiyat Aralığı (₺)</SectionHeader>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="number"
            aria-label="Minimum fiyat"
            placeholder="Min"
            value={localMinFiyat}
            min={0}
            max={100000}
            onChange={(e) => setLocalMinFiyat(e.target.value)}
            style={{
              width: "100%",
              border: "1.5px solid var(--mb-border)",
              backgroundColor: "var(--mb-bg)",
              padding: "5px 7px",
              fontSize: 11,
              color: "var(--mb-text)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span
            aria-hidden="true"
            style={{ fontSize: 10, color: "var(--mb-muted)", flexShrink: 0 }}
          >
            —
          </span>
          <input
            type="number"
            aria-label="Maksimum fiyat"
            placeholder="Maks"
            value={localMaxFiyat}
            min={0}
            max={100000}
            onChange={(e) => setLocalMaxFiyat(e.target.value)}
            style={{
              width: "100%",
              border: "1.5px solid var(--mb-border)",
              backgroundColor: "var(--mb-bg)",
              padding: "5px 7px",
              fontSize: 11,
              color: "var(--mb-text)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Şehir ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Şehir</SectionHeader>
        <input
          type="text"
          aria-label="Şehir filtrele"
          placeholder="Örn: İstanbul"
          value={sehir}
          maxLength={80}
          onChange={(e) => updateParam("sehir", e.target.value || null)}
          style={{
            width: "100%",
            border: "1.5px solid var(--mb-border)",
            backgroundColor: "var(--mb-bg)",
            padding: "5px 7px",
            fontSize: 11,
            color: "var(--mb-text)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── Cinsiyet ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Danışman Cinsiyeti</SectionHeader>
        {CINSIYET_SECENEKLERI.map((opt) => (
          <RadioItem
            key={opt.value || "hepsi"}
            id={`cinsiyet-${opt.value || "hepsi"}`}
            name="cinsiyet"
            value={opt.value}
            checked={cinsiyet === opt.value}
            label={opt.label}
            onChange={() => updateParam("cinsiyet", opt.value || null)}
          />
        ))}
      </div>

      {/* ── Minimum Puan ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Minimum Puan</SectionHeader>
        <div
          style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 4 }}
          role="group"
          aria-label="Minimum puan seç"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() =>
                updateParam("min_puan", minPuan === star ? null : String(star))
              }
              aria-label={`${star} yıldız ve üzeri`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 1px",
                fontSize: 18,
                color: star <= minPuan ? "var(--mb-text)" : "var(--mb-border)",
                lineHeight: 1,
              }}
            >
              ★
            </button>
          ))}
          {minPuan > 0 && (
            <span style={{ fontSize: 10, color: "var(--mb-muted)", marginLeft: 4 }}>
              {minPuan}+ puan
            </span>
          )}
        </div>
      </div>

      {/* ── Uzmanlık ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Uzmanlık Alanı</SectionHeader>
        {UZMANLIKLAR.map((u) => (
          <CheckboxItem
            key={u}
            id={`uzmanlik-${u}`}
            label={u}
            checked={uzmanlikSet.has(u)}
            onChange={() => toggleCsv("uzmanlik", uzmanlikSet, u)}
          />
        ))}
      </div>

      {/* ── Terapi Yaklaşımı ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Terapi Yaklaşımı</SectionHeader>
        {YAKLASIMLAR.map((y) => (
          <CheckboxItem
            key={y}
            id={`yaklasim-${y}`}
            label={y}
            checked={yaklasimSet.has(y)}
            onChange={() => toggleCsv("yaklasim", yaklasimSet, y)}
          />
        ))}
      </div>

      {/* ── Yaş Grubu ── */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader>Yaş Grubu</SectionHeader>
        {YAS_GRUPLARI.map((y) => (
          <CheckboxItem
            key={y}
            id={`yas-${y}`}
            label={y}
            checked={yasGrubuSet.has(y)}
            onChange={() => toggleCsv("yas_grubu", yasGrubuSet, y)}
          />
        ))}
      </div>

      {/* ── Seans Dili ── */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader>Seans Dili</SectionHeader>
        {DILLER.map((d) => (
          <CheckboxItem
            key={d}
            id={`dil-${d}`}
            label={d}
            checked={dilSet.has(d)}
            onChange={() => toggleCsv("dil", dilSet, d)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─── Dışa aktarılan bileşen — Suspense zorunlu (useSearchParams) ─
export function FiltreSidebar() {
  return (
    <Suspense
      fallback={
        <aside
          aria-hidden="true"
          style={{
            width: 220,
            flexShrink: 0,
            backgroundColor: "var(--mb-surface)",
            border: "1.5px solid var(--mb-border)",
            padding: "14px 12px",
            alignSelf: "flex-start",
            boxSizing: "border-box",
          }}
        >
          {/* Iskelet yükleyici */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 60,
                backgroundColor: "var(--mb-bg)",
                marginBottom: 14,
                border: "1px solid var(--mb-border)",
              }}
            />
          ))}
        </aside>
      }
    >
      <FiltreSidebarInner />
    </Suspense>
  );
}
