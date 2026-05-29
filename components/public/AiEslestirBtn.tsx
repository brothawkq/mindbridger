"use client";

// "✦ AI ile Eşleştir" butonu — tıklanınca ChatbotWrapper'ı açar.
// Custom browser event aracılığıyla iletişim kurar (Zustand gerektirmez).
export function AiEslestirBtn() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("mindbridger:open-chatbot"));
      }}
      style={{
        flexShrink: 0,
        backgroundColor: "var(--mb-text)",
        color: "var(--mb-primary-text)",
        border: "none",
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      ✦ AI ile Eşleştir
    </button>
  );
}
