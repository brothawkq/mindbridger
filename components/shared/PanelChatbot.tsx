"use client";

import { useState, useRef, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";

interface SohbetMesaj {
  rol: "user" | "assistant";
  icerik: string;
}

interface Props {
  userRole: "musteri" | "danisan";
}

const MUSTERI_HIZLI: { label: string; href?: string; mesaj?: string }[] = [
  { label: "📅 Randevu Al", href: "/danismanlar" },
  { label: "📋 Seanslarım", href: "/panelim/randevularim" },
  { label: "💳 Ödeme Geçmişi", href: "/panelim/finans" },
  { label: "💬 Soru Sor", mesaj: "Soru sormak istiyorum" },
];

const DANISAN_HIZLI: { label: string; href?: string; mesaj?: string }[] = [
  { label: "📅 Takvimim", href: "/danisan/takvim" },
  { label: "💰 Gelirlerim", href: "/danisan/finans" },
  { label: "💬 Hasta Mesajları", href: "/danisan/mesajlar" },
  { label: "❓ Soru Sor", mesaj: "Soru sormak istiyorum" },
];

const HISTORY_KEY = (role: string) => `mb_chatbot_history_${role}`;
const MAX_HISTORY = 30;

export default function PanelChatbot({ userRole }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [mesajlar, setMesajlar] = useState<SohbetMesaj[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");
  const [serbest, setSerbest] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hizliButonlar = userRole === "musteri" ? MUSTERI_HIZLI : DANISAN_HIZLI;

  // localStorage'dan geçmişi yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY(userRole));
      if (saved) {
        const parsed = JSON.parse(saved) as SohbetMesaj[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMesajlar(parsed);
          setSerbest(true);
        }
      }
    } catch { /* ignore */ }
  }, [userRole]);

  // Scroll to bottom
  useEffect(() => {
    if (!prefersReduced) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      bottomRef.current?.scrollIntoView();
    }
  }, [mesajlar, prefersReduced]);

  // localStorage'a kaydet
  function saveHistory(msgs: SohbetMesaj[]) {
    try {
      const slice = msgs.slice(-MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY(userRole), JSON.stringify(slice));
    } catch { /* ignore */ }
  }

  async function gonder(mesaj: string) {
    if (!mesaj.trim()) return;
    setHata("");
    setSerbest(true);

    const yeniMesajlar: SohbetMesaj[] = [
      ...mesajlar,
      { rol: "user", icerik: mesaj.trim() },
    ];
    setMesajlar(yeniMesajlar);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/panel-mesaj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesaj: mesaj.trim(),
          gecmis: mesajlar.slice(-10),
          rol: userRole,
        }),
      });

      const data: { yanit?: string; error?: string } = await res.json();

      if (!res.ok || !data.yanit) {
        if (res.status === 429) {
          setHata("Çok fazla mesaj gönderildi, lütfen bekleyin.");
        } else {
          setHata(data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.");
        }
        return;
      }

      const guncel: SohbetMesaj[] = [
        ...yeniMesajlar,
        { rol: "assistant", icerik: data.yanit },
      ];
      setMesajlar(guncel);
      saveHistory(guncel);
    } catch {
      setHata("Ağ hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  function handleHizliButon(btn: (typeof hizliButonlar)[number]) {
    if (btn.href) {
      router.push(btn.href);
      return;
    }
    if (btn.mesaj) {
      setSerbest(true);
    }
  }

  // Serbest sohbet modu değilse hızlı butonları göster
  if (!serbest) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 14px",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--mb-muted)" }}>
          Ne yapmak istersiniz?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hizliButonlar.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => handleHizliButon(btn)}
              style={{
                border: "1.5px solid var(--mb-border)",
                background: "var(--mb-surface)",
                color: "var(--mb-text)",
                fontSize: 12,
                fontWeight: 600,
                padding: "9px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--mb-border-strong)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--mb-border)";
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Serbest sohbet modu
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Mesaj listesi */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {mesajlar.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--mb-muted)", textAlign: "center", marginTop: 20 }}>
            Merhaba! Size nasıl yardımcı olabilirim?
          </div>
        )}
        {mesajlar.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.rol === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              backgroundColor: m.rol === "user" ? "var(--mb-primary)" : "var(--mb-bg)",
              color: m.rol === "user" ? "var(--mb-primary-text)" : "var(--mb-text)",
              border: "1.5px solid var(--mb-border-strong)",
              padding: "8px 10px",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {m.icerik}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "var(--mb-bg)",
              border: "1.5px solid var(--mb-border)",
              padding: "8px 10px",
              fontSize: 12,
              color: "var(--mb-muted)",
            }}
          >
            Yanıt yazılıyor...
          </div>
        )}
        {hata && (
          <div style={{ fontSize: 11, color: "#c62828", textAlign: "center" }}>{hata}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: "1.5px solid var(--mb-border)",
          padding: "8px 10px",
          display: "flex",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!loading && input.trim()) void gonder(input);
            }
          }}
          placeholder="Mesajınızı yazın..."
          disabled={loading}
          style={{
            flex: 1,
            border: "1.5px solid var(--mb-border)",
            backgroundColor: "var(--mb-surface)",
            color: "var(--mb-text)",
            fontSize: 12,
            padding: "7px 9px",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => { if (!loading && input.trim()) void gonder(input); }}
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: "var(--mb-primary)",
            color: "var(--mb-primary-text)",
            border: "none",
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
