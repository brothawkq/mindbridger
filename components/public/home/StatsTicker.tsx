"use client";

interface StatsTickerProps {
  settings: Record<string, string>;
}

const DEFAULT_TICKER =
  "500+ Onaylı Danışman · İlk 15 dk Ücretsiz Tanışma · KVKK Uyumlu · Lisanslı Uzmanlar · Güvenli Ödeme (iyzico) · 7/24 Erişim · ";

export function StatsTicker({ settings }: StatsTickerProps) {
  const tickerText = settings.ticker_text ?? DEFAULT_TICKER;
  const doubled = `${tickerText}${tickerText}`;

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return (
    <div
      style={{
        backgroundColor: "#325343",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "inline-block",
          paddingTop: 12,
          paddingBottom: 12,
          fontFamily: "var(--font-inter)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.6px",
          color: "rgba(166,222,155,0.9)",
          animation: prefersReduced ? "none" : "ticker-scroll 32s linear infinite",
        }}
      >
        {doubled}
      </div>

      {!prefersReduced && (
        <style>{`
          @keyframes ticker-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      )}
    </div>
  );
}
