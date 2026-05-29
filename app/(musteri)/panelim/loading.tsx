import { SayfaIskeleti } from "@/components/shared/LoadingSkeleton";
import { Skeleton } from "@/components/shared/LoadingSkeleton";

export default function PanelimiLoading() {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        backgroundColor: "var(--mb-bg)",
        minHeight: "100vh",
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: 190,
          flexShrink: 0,
          borderRight: "1.5px solid var(--mb-border)",
          backgroundColor: "var(--mb-surface)",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        aria-hidden="true"
      >
        <Skeleton width="80%" height={28} />
        <Skeleton width="60%" height={12} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`nav-${i}`} width="90%" height={14} />
          ))}
        </div>
      </div>

      {/* İçerik skeleton */}
      <div style={{ flex: 1 }}>
        <SayfaIskeleti />
      </div>
    </div>
  );
}
