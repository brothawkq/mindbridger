"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Mesaj {
  id: string;
  sender_id: string;
  benimMesajim: boolean;
  content: string | null;
  audio_url: string | null;
  is_session_response: boolean;
  read_at: string | null;
  created_at: string;
}

interface KarsiTaraf {
  slug: string;
  isim: string;
  avatarUrl: string | null;
}

interface Props {
  konusmaId: string;
  konusmaTip: string;
  benimId: string;
  karsiTaraf: KarsiTaraf;
  mesajlarBaslangic: Mesaj[];
}

function formatZaman(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const bugun = now.toISOString().substring(0, 10);
  const tarih = d.toISOString().substring(0, 10);

  if (tarih === bugun) {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const POLL_MS = 8000;

export default function MusteriMesajlasmaKlient({
  konusmaId,
  konusmaTip,
  benimId,
  karsiTaraf,
  mesajlarBaslangic,
}: Props) {
  const prefersReduced = useReducedMotion();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>(mesajlarBaslangic);
  const [icerik, setIcerik] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const listeSonuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listeyiKaydır = useCallback(() => {
    listeSonuRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    listeyiKaydır();
  }, [mesajlar, listeyiKaydır]);

  const mesajlariYenile = useCallback(async () => {
    try {
      const res = await fetch(`/api/mesajlar/${konusmaId}`);
      if (!res.ok) return;
      const data = await res.json() as { mesajlar: Mesaj[] };
      setMesajlar(data.mesajlar);
    } catch {
      // sessiz hata
    }
  }, [konusmaId]);

  useEffect(() => {
    pollRef.current = setInterval(mesajlariYenile, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mesajlariYenile]);

  async function mesajGonder() {
    const metin = icerik.trim();
    if (!metin || gonderiliyor) return;

    setGonderiliyor(true);
    setHata(null);

    try {
      const res = await fetch("/api/mesajlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: konusmaId, icerik: metin }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Mesaj gönderilemedi");
      }

      setIcerik("");
      await mesajlariYenile();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Mesaj gönderilemedi.");
    } finally {
      setGonderiliyor(false);
      textareaRef.current?.focus();
    }
  }

  function keydownHandler(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void mesajGonder();
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-60px)]">
      {/* Başlık */}
      <div className="shrink-0 border-b border-[#D4E4D8] dark:border-[#333] bg-[#F5F7F5] dark:bg-[#111] px-4 py-3 flex items-center gap-3">
        <Link
          href="/panelim/mesajlar"
          className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white mr-1"
        >
          ←
        </Link>
        <div className="w-8 h-8 shrink-0 bg-[#D4E4D8] dark:bg-[#333] flex items-center justify-center text-[12px] font-bold text-[#252625] dark:text-white">
          {karsiTaraf.isim.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#252625] dark:text-white truncate">
            {karsiTaraf.isim}
          </div>
          <div className="text-[10px] text-[#4A4D4A]">
            {konusmaTip === "lojistik" ? "Lojistik Konuşma" : "Asenkron Seans"}
          </div>
        </div>
        <Link
          href={`/danismanlar/${karsiTaraf.slug}`}
          className="text-[10px] underline text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white shrink-0"
        >
          Profil
        </Link>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F5F7F5] dark:bg-[#0a0a0a]">
        {mesajlar.length === 0 ? (
          <div className="text-center text-[#4A4D4A] text-[12px] mt-8">
            Henüz mesaj yok. İlk mesajı siz gönderin.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {mesajlar.map((m) => (
              <motion.div
                key={m.id}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
                className={`flex ${m.benimMesajim ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] ${
                    m.benimMesajim
                      ? "bg-[#A6DE9B] text-[#325343]"
                      : "bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#252625] dark:text-white"
                  } px-3 py-2`}
                >
                  {m.is_session_response && (
                    <div className="text-[9px] font-bold uppercase tracking-[0.8px] mb-1 opacity-60">
                      SEANS YANITI
                    </div>
                  )}
                  {m.audio_url ? (
                    <div>
                      <div className="text-[11px] mb-1 opacity-70">Ses kaydı</div>
                      <audio controls src={m.audio_url} className="max-w-full h-8" />
                    </div>
                  ) : (
                    <p className="text-[13px] whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  )}
                  <div
                    className={`text-[9px] mt-1 ${
                      m.benimMesajim ? "text-white/50" : "text-[#4A4D4A]"
                    } flex items-center gap-1 justify-end`}
                  >
                    {formatZaman(m.created_at)}
                    {m.benimMesajim && <span>{m.read_at ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={listeSonuRef} />
      </div>

      {/* Mesaj Yazma Alanı */}
      <div className="shrink-0 border-t border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-4 py-3">
        <AnimatePresence>
          {hata && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[11px] text-[#4A4D4A] mb-2"
            >
              {hata}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            onKeyDown={keydownHandler}
            rows={2}
            maxLength={5000}
            placeholder="Mesaj yaz... (Enter ile gönder, Shift+Enter yeni satır)"
            className="flex-1 border-[1.5px] border-[#325343] dark:border-[#555] bg-white dark:bg-[#0a0a0a] text-[13px] text-[#252625] dark:text-white px-3 py-2 resize-none outline-none"
          />
          <button
            onClick={() => void mesajGonder()}
            disabled={!icerik.trim() || gonderiliyor}
            className="bg-[#A6DE9B] text-[#325343] text-[11px] font-bold uppercase tracking-[0.5px] px-4 py-2 h-[56px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {gonderiliyor ? "..." : "Gönder"}
          </button>
        </div>
        <div className="text-[9px] text-[#4A4D4A] mt-1 text-right">
          {icerik.length}/5000
        </div>
      </div>
    </div>
  );
}
