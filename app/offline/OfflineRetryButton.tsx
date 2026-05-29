"use client"

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        background: "#212121",
        color: "#FFFFFF",
        border: "none",
        padding: "11px 24px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Tekrar Dene
    </button>
  )
}
