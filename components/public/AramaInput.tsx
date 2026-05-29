"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── İç bileşen ───────────────────────────────────────────────────
function AramaInputInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  // Yerel state — her tuş vuruşunda URL değil, state güncellenir.
  // 400 ms debounce sonrası URL'ye yazılır.
  const [value, setValue] = useState(initialQ);

  // URL dışarıdan değişirse (ör. "Temizle" ile) senkronize et
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  const commit = useCallback(
    (q: string) => {
      const sp = new URLSearchParams(params.toString());
      if (q.trim()) {
        sp.set("q", q.trim());
      } else {
        sp.delete("q");
      }
      sp.delete("sayfa");
      router.push(`/danismanlar?${sp.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // Debounce: 400 ms bekle, sonra URL güncelle
  useEffect(() => {
    const timer = setTimeout(() => commit(value), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      style={{
        flex: 1,
        border: "1.5px solid var(--mb-border-strong)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        backgroundColor: "var(--mb-surface)",
      }}
    >
      <span aria-hidden="true" style={{ color: "var(--mb-muted)", fontSize: 14, flexShrink: 0 }}>
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Danışman adı, uzmanlık alanı veya yöntem ara..."
        aria-label="Danışman ara"
        maxLength={100}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: 13,
          color: "var(--mb-text)",
          backgroundColor: "transparent",
          fontFamily: "inherit",
        }}
      />
      {value && (
        <button
          onClick={() => setValue("")}
          aria-label="Aramayı temizle"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--mb-muted)",
            fontSize: 14,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Dışa aktarılan bileşen — Suspense zorunlu ───────────────────
export function AramaInput() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            flex: 1,
            border: "1.5px solid var(--mb-border)",
            padding: "8px 12px",
            backgroundColor: "var(--mb-surface)",
            height: 40,
          }}
        />
      }
    >
      <AramaInputInner />
    </Suspense>
  );
}
