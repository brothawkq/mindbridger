"use client";

import { useInView } from "react-intersection-observer";
import { useCountUp } from "@/hooks/useCountUp";

interface StatsSectionProps {
  settings: Record<string, string>;
}

interface StatRowProps {
  value: string;
  label: string;
  trigger: boolean;
}

function StatRow({ value, label, trigger }: StatRowProps) {
  const numMatch = value.match(/[\d.,]+/);
  const numStr = numMatch ? numMatch[0].replace(/[.,]/g, "") : null;
  const numericPart = numStr ? parseInt(numStr, 10) : null;
  const prefix = numericPart !== null ? value.slice(0, value.indexOf(numMatch![0])) : "";
  const matchEnd = numMatch ? value.indexOf(numMatch[0]) + numMatch[0].length : 0;
  const suffix = numericPart !== null ? value.slice(matchEnd) : "";

  const animated = useCountUp(numericPart ?? 0, 900, trigger);
  const display =
    numericPart !== null ? `${prefix}${animated.toLocaleString("tr-TR")}${suffix}` : value;

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(245,247,245,0.12)" }}>
      <p
        style={{
          fontFamily: "var(--font-overpass)",
          fontSize: 40,
          fontWeight: 700,
          color: "#F5F7F5",
          lineHeight: 1.1,
          letterSpacing: "-0.5px",
        }}
      >
        {display}
      </p>
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          color: "rgba(245,247,245,0.6)",
          marginTop: 4,
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function StatsSection({ settings }: StatsSectionProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} style={{ backgroundColor: "#325343" }}>
      <div className="mx-auto max-w-6xl px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Sol */}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-overpass)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 300,
              color: "#F5F7F5",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            Türkiye&apos;nin en güvenilir
            <br />
            <strong style={{ fontWeight: 700, color: "#A6DE9B" }}>
              terapi platformu.
            </strong>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 16,
              color: "rgba(245,247,245,0.65)",
              lineHeight: 1.7,
            }}
          >
            Uzman psikolog ve PDR danışmanlarıyla video, ses veya mesaj
            üzerinden iletişim kurun. Kendi programınıza uygun, güvenli ve
            gizli.
          </p>
        </div>

        {/* Sağ */}
        <div>
          <StatRow
            value={settings.stat_1_value ?? "500+"}
            label={settings.stat_1_label ?? "Onaylı danışman"}
            trigger={inView}
          />
          <StatRow
            value={settings.stat_2_value ?? "15.000+"}
            label={settings.stat_2_label ?? "Tamamlanan seans"}
            trigger={inView}
          />
          <StatRow
            value={settings.stat_3_value ?? "%97"}
            label={settings.stat_3_label ?? "Kullanıcı memnuniyeti"}
            trigger={inView}
          />
        </div>
      </div>

      {/* Dalga: koyu yeşilden kremlere — fill hardcoded! */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: "100%", display: "block" }}>
          <path d="M0,30 C480,0 960,60 1440,20 L1440,60 L0,60 Z" fill="#FFFCF6" />
        </svg>
      </div>
    </section>
  );
}
