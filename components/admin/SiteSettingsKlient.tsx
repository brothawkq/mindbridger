"use client";

import { useState, useCallback } from "react";
import SiteImageManager from "@/components/admin/SiteImageManager";

interface SiteSetting {
  key: string;
  value: string;
  description: string | null;
}

interface Props {
  settings: SiteSetting[];
}

type Tab = "icerik" | "gorseller";

const IMAGE_KEYS = new Set([
  "hero_image_url",
  "hero_image_alt",
  "why_section_image_url",
  "how_step1_image_url",
  "how_step2_image_url",
  "how_step3_image_url",
  "corporate_section_image_url",
  "og_image_url",
]);

export function SiteSettingsKlient({ settings }: Props) {
  const [tab, setTab] = useState<Tab>("icerik");

  const textSettings = settings.filter((s) => !IMAGE_KEYS.has(s.key));
  const imageSettings = settings.filter((s) => IMAGE_KEYS.has(s.key));

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [original] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const hasChanges = textSettings.some((s) => values[s.key] !== original[s.key]);

  const handleChange = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  async function handleKaydet() {
    if (!hasChanges) return;
    setLoading(true);
    setToast(null);

    const changed = textSettings
      .filter((s) => values[s.key] !== original[s.key])
      .map((s) => ({ key: s.key, value: values[s.key] ?? "" }));

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });

      if (!res.ok) {
        const data = (await res.json()) as { hata?: string };
        setToast({ type: "err", msg: data.hata ?? "Kayıt başarısız" });
      } else {
        setToast({ type: "ok", msg: "İçerik güncellendi" });
      }
    } catch {
      setToast({ type: "err", msg: "Bağlantı hatası" });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "icerik",    label: "İçerik"   },
    { key: "gorseller", label: "Görseller" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      {/* Başlık */}
      <div
        className="mb-5 pb-3 flex items-center justify-between"
        style={{ borderBottom: "1.5px solid #325343" }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#4A4D4A", marginBottom: 4 }}>
            Admin
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#252625" }}>
            SİTE İÇERİK YÖNETİMİ
          </h1>
        </div>

        {tab === "icerik" && (
          <button
            onClick={handleKaydet}
            disabled={!hasChanges || loading}
            style={{
              background: hasChanges && !loading ? "#A6DE9B" : "transparent",
              color: hasChanges && !loading ? "#325343" : "#4A4D4A",
              border: hasChanges && !loading ? "none" : "1.5px dashed #D4E4D8",
              padding: "9px 20px",
              fontSize: 12,
              fontWeight: 700,
              cursor: hasChanges && !loading ? "pointer" : "not-allowed",
              borderRadius: 100,
            }}
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="mb-4 px-4 py-3"
          style={{
            border: `1.5px solid ${toast.type === "ok" ? "#325343" : "#D4E4D8"}`,
            background: toast.type === "ok" ? "#325343" : "#F5F7F5",
            color: toast.type === "ok" ? "#F5F7F5" : "#252625",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Sekme çubuğu */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #D4E4D8", marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: tab === t.key ? "2.5px solid #325343" : "2.5px solid transparent",
              color: tab === t.key ? "#252625" : "#4A4D4A",
              background: "transparent",
              cursor: "pointer",
              marginBottom: -1.5,
              transition: "color 0.1s, border-color 0.1s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* İçerik sekmesi */}
      {tab === "icerik" && (
        <>
          <div style={{ border: "1.5px solid #D4E4D8", borderRadius: 8, overflow: "hidden" }}>
            {/* Header */}
            <div
              className="grid grid-cols-[200px_1fr_2fr]"
              style={{
                background: "#F5F7F5",
                borderBottom: "1px solid #D4E4D8",
                padding: "8px 12px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#4A4D4A",
              }}
            >
              <span>Anahtar</span>
              <span>Açıklama</span>
              <span>Değer</span>
            </div>

            {/* Satırlar */}
            {textSettings.map((s, i) => {
              const changed = values[s.key] !== original[s.key];
              return (
                <div
                  key={s.key}
                  className="grid grid-cols-[200px_1fr_2fr] items-center"
                  style={{
                    borderBottom: i < textSettings.length - 1 ? "1px solid #D4E4D8" : "none",
                    padding: "10px 12px",
                    background: changed ? "#FFFBF0" : "#FFFFFF",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#252625", fontFamily: "ui-monospace, monospace" }}>
                    {s.key}
                  </span>
                  <span style={{ fontSize: 11, color: "#4A4D4A", paddingRight: 12 }}>
                    {s.description ?? "—"}
                  </span>
                  <input
                    type="text"
                    value={values[s.key] ?? ""}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    maxLength={500}
                    style={{
                      width: "100%",
                      border: "1px solid #D4E4D8",
                      borderRadius: 6,
                      padding: "7px 10px",
                      fontSize: 12,
                      color: "#252625",
                      background: "#FFFFFF",
                      outline: "none",
                      fontFamily: "system-ui, Arial, sans-serif",
                      transition: "border-color 0.1s",
                    }}
                    onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#325343"; }}
                    onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#D4E4D8"; }}
                  />
                </div>
              );
            })}
          </div>

          {textSettings.length === 0 && (
            <p style={{ fontSize: 12, color: "#4A4D4A", marginTop: 16 }}>
              Henüz metin ayarı bulunamadı. Migration çalıştırıldı mı?
            </p>
          )}
        </>
      )}

      {/* Görseller sekmesi */}
      {tab === "gorseller" && (
        <SiteImageManager settings={imageSettings.map((s) => ({ key: s.key, value: s.value }))} />
      )}
    </div>
  );
}
