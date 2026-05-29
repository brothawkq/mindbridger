import { SayfaIskeleti } from "@/components/shared/LoadingSkeleton";

export default function RootLoading() {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "var(--mb-bg)",
        minHeight: "100vh",
      }}
    >
      <SayfaIskeleti />
    </div>
  );
}
