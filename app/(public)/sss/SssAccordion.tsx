"use client";

import { useState } from "react";

interface SssItem {
  soru: string;
  cevap: string;
}

interface Props {
  sorular: SssItem[];
}

export default function SssAccordion({ sorular }: Props) {
  const [acik, setAcik] = useState<number | null>(null);

  return (
    <div
      style={{
        border: "1.5px solid var(--mb-border)",
        backgroundColor: "var(--mb-surface)",
      }}
    >
      {sorular.map((item, i) => {
        const isAcik = acik === i;
        return (
          <div
            key={i}
            style={{
              borderBottom: i < sorular.length - 1 ? "1.5px solid var(--mb-border)" : "none",
            }}
          >
            <button
              type="button"
              onClick={() => setAcik(isAcik ? null : i)}
              aria-expanded={isAcik}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "16px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--mb-text)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>{item.soru}</span>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 16,
                  color: "var(--mb-muted)",
                  transform: isAcik ? "rotate(45deg)" : "none",
                  transition: "transform 0.15s ease",
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            {isAcik && (
              <div
                style={{
                  padding: "0 20px 16px",
                  fontSize: 13,
                  color: "var(--mb-muted)",
                  lineHeight: 1.7,
                  borderTop: "1px solid var(--mb-border)",
                  paddingTop: 12,
                }}
              >
                {item.cevap}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
