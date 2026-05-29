"use client";

import { useState, useRef, useCallback } from "react";

interface Setting {
  key: string;
  value: string;
}

interface Props {
  settings: Setting[];
}

const IMAGE_KEYS = [
  { key: "hero_image_url",              label: "Hero Görseli",    desc: "Ana sayfa — hero bölümü" },
  { key: "why_section_image_url",       label: "Neden Biz",       desc: "Neden Biz bölümü" },
  { key: "how_step1_image_url",         label: "Adım 1",          desc: "Nasıl çalışır — Adım 1" },
  { key: "how_step2_image_url",         label: "Adım 2",          desc: "Nasıl çalışır — Adım 2" },
  { key: "how_step3_image_url",         label: "Adım 3",          desc: "Nasıl çalışır — Adım 3" },
  { key: "corporate_section_image_url", label: "Kurumsal",        desc: "Kurumsal CTA bölümü" },
  { key: "og_image_url",               label: "OG Görseli",      desc: "Sosyal medya 1200×630px" },
] as const;

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_MB = 10;

export default function SiteImageManager({ settings }: Props) {
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const [urls,    setUrls]    = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    IMAGE_KEYS.forEach(({ key }) => { m[key] = settingsMap.get(key) ?? ""; });
    return m;
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [drag,    setDrag]    = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const upload = useCallback(async (imgKey: string, file: File) => {
    if (!ALLOWED.includes(file.type)) {
      showToast("Geçersiz dosya türü. JPEG, PNG, WebP, GIF, SVG kabul edilir.", false);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`Dosya ${MAX_MB} MB limitini aşıyor.`, false);
      return;
    }

    setLoading((p) => ({ ...p, [imgKey]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", imgKey);

      const res = await fetch("/api/admin/site-images", { method: "POST", body: fd });
      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        showToast(data.error ?? "Yükleme başarısız.", false);
        return;
      }
      setUrls((p) => ({ ...p, [imgKey]: data.url! }));
      showToast("Görsel başarıyla yüklendi.", true);
    } catch {
      showToast("Ağ hatası.", false);
    } finally {
      setLoading((p) => ({ ...p, [imgKey]: false }));
    }
  }, []);

  const remove = useCallback(async (imgKey: string) => {
    setLoading((p) => ({ ...p, [imgKey]: true }));
    try {
      const res = await fetch(`/api/admin/site-images?key=${imgKey}`, { method: "DELETE" });
      if (!res.ok) { showToast("Kaldırma başarısız.", false); return; }
      setUrls((p) => ({ ...p, [imgKey]: "" }));
      showToast("Görsel kaldırıldı.", true);
    } catch {
      showToast("Ağ hatası.", false);
    } finally {
      setLoading((p) => ({ ...p, [imgKey]: false }));
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 200,
            padding: "10px 18px",
            backgroundColor: toast.ok ? "#325343" : "#c0392b",
            color: "#F5F7F5",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {IMAGE_KEYS.map(({ key: imgKey, label, desc }) => {
          const currentUrl = urls[imgKey] ?? "";
          const isLoading  = loading[imgKey] ?? false;
          const isDragging = drag === imgKey;

          return (
            <div
              key={imgKey}
              onDragOver={(e) => { e.preventDefault(); setDrag(imgKey); }}
              onDragLeave={() => setDrag(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(null);
                const file = e.dataTransfer.files[0];
                if (file) void upload(imgKey, file);
              }}
              style={{
                border: isDragging
                  ? "2px dashed #A6DE9B"
                  : "1px solid #D4E4D8",
                borderRadius: 12,
                padding: 14,
                backgroundColor: isDragging ? "rgba(166,222,155,0.06)" : "#FFFFFF",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
            >
              {/* Başlık */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#252625" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#4A4D4A", marginTop: 2 }}>{desc}</div>
              </div>

              {/* Önizleme */}
              {currentUrl ? (
                <div style={{ marginBottom: 10 }}>
                  <img
                    src={currentUrl}
                    alt={label}
                    style={{
                      width: "100%",
                      maxHeight: 140,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #D4E4D8",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F5F7F5",
                    borderRadius: 8,
                    border: "1px dashed #D4E4D8",
                    marginBottom: 10,
                    fontSize: 12,
                    color: "#4A4D4A",
                  }}
                >
                  {isDragging ? "Bırak" : "Görsel yok"}
                </div>
              )}

              {/* Gizli file input */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                style={{ display: "none" }}
                ref={(el) => { inputRefs.current[imgKey] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(imgKey, file);
                  e.target.value = "";
                }}
              />

              {/* Aksiyonlar */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => inputRefs.current[imgKey]?.click()}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: "#A6DE9B",
                    color: "#325343",
                    border: "none",
                    borderRadius: 100,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8ED485";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A6DE9B";
                  }}
                >
                  {isLoading ? "Yükleniyor…" : currentUrl ? "Değiştir" : "Yükle"}
                </button>

                {currentUrl && (
                  <button
                    onClick={() => void remove(imgKey)}
                    disabled={isLoading}
                    style={{
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: "transparent",
                      color: "#4A4D4A",
                      border: "1.5px solid #D4E4D8",
                      borderRadius: 100,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1,
                      transition: "border-color 0.1s, color 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#325343";
                      (e.currentTarget as HTMLButtonElement).style.color = "#252625";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4E4D8";
                      (e.currentTarget as HTMLButtonElement).style.color = "#4A4D4A";
                    }}
                  >
                    Kaldır
                  </button>
                )}
              </div>

              <p style={{ fontSize: 10, color: "#4A4D4A", marginTop: 8 }}>
                Sürükle-bırak veya tıkla · Maks {MAX_MB} MB · JPEG PNG WebP GIF SVG
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
