"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────

interface OneriDanisan {
  id: string;
  slug: string;
  title: string | null;
  specialties: string[] | null;
  city: string | null;
  is_online: boolean;
  is_in_person: boolean;
  intro_session_enabled: boolean;
  price_individual: number | null;
  sliding_scale: boolean;
  sliding_scale_price: number | null;
  average_rating: number;
  total_reviews: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface TercihProfili {
  uzmanliklar: string[];
  online:      boolean | null;
  yuz_yuze:    boolean | null;
  max_fiyat:   number  | null;
  cinsiyet:    string  | null;
  dil:         string  | null;
}

const BOSLUK_TERCIH: TercihProfili = {
  uzmanliklar: [],
  online:      null,
  yuz_yuze:    null,
  max_fiyat:   null,
  cinsiyet:    null,
  dil:         null,
};

interface Secenek {
  etiket: string;
  uygula: (prev: TercihProfili) => TercihProfili;
}

interface Adim {
  soru:      string;
  secenekler: Secenek[];
}

const ADIMLAR: Adim[] = [
  {
    soru: "Merhaba! 👋 Size en uygun danışmanı bulmak için 6 kısa sorum var.\n\nNasıl bir destek arıyorsunuz?",
    secenekler: [
      { etiket: "Bireysel Terapi",      uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Bireysel Terapi"]  }) },
      { etiket: "Çift / Aile",          uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Çift Terapisi"]   }) },
      { etiket: "Kariyer Desteği",      uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Kariyer"]          }) },
      { etiket: "Travma Terapisi",      uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Travma"]           }) },
    ],
  },
  {
    soru: "Hangi konularda destek almak istiyorsunuz?",
    secenekler: [
      { etiket: "Anksiyete / Depresyon", uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Anksiyete"]       }) },
      { etiket: "İlişki Sorunları",      uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "İlişkiler"]       }) },
      { etiket: "Kişisel Gelişim",       uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Kişisel Gelişim"] }) },
      { etiket: "Stres Yönetimi",        uygula: (p) => ({ ...p, uzmanliklar: [...p.uzmanliklar, "Stres"]           }) },
    ],
  },
  {
    soru: "Seans türü tercihiniz?",
    secenekler: [
      { etiket: "Online",    uygula: (p) => ({ ...p, online: true,  yuz_yuze: false }) },
      { etiket: "Yüz Yüze", uygula: (p) => ({ ...p, online: false, yuz_yuze: true  }) },
      { etiket: "Farketmez", uygula: (p) => ({ ...p, online: null,  yuz_yuze: null  }) },
    ],
  },
  {
    soru: "Seans başına bütçe aralığınız?",
    secenekler: [
      { etiket: "300₺'ye kadar", uygula: (p) => ({ ...p, max_fiyat: 300  }) },
      { etiket: "300–500₺",      uygula: (p) => ({ ...p, max_fiyat: 500  }) },
      { etiket: "500₺ üzeri",    uygula: (p) => ({ ...p, max_fiyat: null }) },
      { etiket: "Farketmez",     uygula: (p) => ({ ...p, max_fiyat: null }) },
    ],
  },
  {
    soru: "Danışman cinsiyeti tercihiniz?",
    secenekler: [
      { etiket: "Kadın Danışman", uygula: (p) => ({ ...p, cinsiyet: "kadin" }) },
      { etiket: "Erkek Danışman", uygula: (p) => ({ ...p, cinsiyet: "erkek" }) },
      { etiket: "Farketmez",      uygula: (p) => ({ ...p, cinsiyet: null   }) },
    ],
  },
  {
    soru: "Seans dili tercihiniz?",
    secenekler: [
      { etiket: "Türkçe",    uygula: (p) => ({ ...p, dil: "Türkçe"    }) },
      { etiket: "İngilizce", uygula: (p) => ({ ...p, dil: "İngilizce" }) },
      { etiket: "Farketmez", uygula: (p) => ({ ...p, dil: null        }) },
    ],
  },
];

type Faz = "akis" | "yukleniyor" | "oneri" | "sohbet";

interface MesajItem {
  id:   string;
  rol:  "asistan" | "kullanici";
  icerik: string;
}

interface SohbetGecmisItem {
  rol:    "user" | "assistant";
  icerik: string;
}

// ─── URL builder ──────────────────────────────────────────────────

function buildSearchUrl(t: TercihProfili): string {
  const p = new URLSearchParams();
  if (t.uzmanliklar.length > 0) p.set("uzmanlik",  t.uzmanliklar.join(","));
  if (t.online  === true)       p.set("online",    "true");
  if (t.yuz_yuze === true)      p.set("yuz_yuze",  "true");
  if (t.max_fiyat !== null)     p.set("max_fiyat", String(t.max_fiyat));
  if (t.cinsiyet)               p.set("cinsiyet",  t.cinsiyet);
  if (t.dil)                    p.set("dil",       t.dil);
  const q = p.toString();
  return `/danismanlar${q ? `?${q}` : ""}`;
}

let _msgCounter = 0;
function nextMsgId(): string { return String(++_msgCounter); }

// ─── Mini recommendation card ─────────────────────────────────────

function OneriKarti({ danisan }: { danisan: OneriDanisan }) {
  const adSoyad = [danisan.profiles?.first_name, danisan.profiles?.last_name]
    .filter(Boolean)
    .join(" ") || "—";
  const initial = (danisan.profiles?.first_name?.[0] ?? "?").toUpperCase();

  return (
    <Link
      href={`/danismanlar/${danisan.slug}`}
      style={{
        display: "flex",
        gap: 8,
        border: "1.5px solid var(--mb-border)",
        padding: "8px 10px",
        textDecoration: "none",
        color: "var(--mb-text)",
        backgroundColor: "var(--mb-surface)",
        alignSelf: "stretch",
      }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        border: "1.5px solid var(--mb-border)",
        overflow: "hidden", position: "relative",
        backgroundColor: "var(--mb-bg)",
      }}>
        {danisan.profiles?.avatar_url ? (
          <Image
            src={danisan.profiles.avatar_url}
            alt={adSoyad}
            fill
            sizes="40px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "var(--mb-muted)",
          }}>
            {initial}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {adSoyad}
        </div>
        {danisan.title && (
          <div style={{ fontSize: 10, color: "var(--mb-muted)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {danisan.title}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "var(--mb-text)", fontWeight: 700 }}>
            ★ {danisan.average_rating.toFixed(1)}
          </span>
          {danisan.price_individual !== null && (
            <span style={{ fontSize: 10, color: "var(--mb-muted)" }}>
              {danisan.price_individual.toLocaleString("tr-TR")}₺/seans
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--mb-muted)", flexShrink: 0, alignSelf: "center" }}>›</div>
    </Link>
  );
}

// ─── Main chatbot component ───────────────────────────────────────

export function Chatbot() {
  const ilkAdimSoru = ADIMLAR[0]?.soru ?? "";

  const [faz,          setFaz]          = useState<Faz>("akis");
  const [adimIndex,    setAdimIndex]    = useState(0);
  const [tercih,       setTercih]       = useState<TercihProfili>(BOSLUK_TERCIH);
  const [mesajlar,     setMesajlar]     = useState<MesajItem[]>([
    { id: nextMsgId(), rol: "asistan", icerik: ilkAdimSoru },
  ]);
  const [oneriler,     setOneriler]     = useState<OneriDanisan[]>([]);
  const [sohbetInput,  setSohbetInput]  = useState("");
  const [sohbetGecmis, setSohbetGecmis] = useState<SohbetGecmisItem[]>([]);
  const [sohbetYuk,    setSohbetYuk]    = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mesajlar, oneriler]);

  const secimYap = useCallback(async (secenek: Secenek) => {
    const yeniTercih      = secenek.uygula(tercih);
    const sonrakiIdx      = adimIndex + 1;
    const sonrakiAdim     = ADIMLAR[sonrakiIdx];
    const kullaniciMesaj: MesajItem = {
      id: nextMsgId(), rol: "kullanici", icerik: secenek.etiket,
    };

    if (sonrakiAdim) {
      const asistanMesaj: MesajItem = {
        id: nextMsgId(), rol: "asistan", icerik: sonrakiAdim.soru,
      };
      setMesajlar((prev) => [...prev, kullaniciMesaj, asistanMesaj]);
      setAdimIndex(sonrakiIdx);
      setTercih(yeniTercih);
    } else {
      // Tüm sorular cevaplandı — öneri çek
      setMesajlar((prev) => [...prev, kullaniciMesaj]);
      setTercih(yeniTercih);
      setFaz("yukleniyor");

      try {
        const res = await fetch("/api/chatbot/oneri", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(yeniTercih),
        });
        if (!res.ok) throw new Error("oneri hata");
        const json = (await res.json()) as { danismanlar: OneriDanisan[] };
        const bulunanlar = json.danismanlar;
        setOneriler(bulunanlar);
        setFaz("oneri");
        const oneriMesaj: MesajItem = {
          id: nextMsgId(),
          rol: "asistan",
          icerik: bulunanlar.length > 0
            ? `Size uygun ${bulunanlar.length} danışman buldum! ✨ Profilleri inceleyebilir veya hemen randevu alabilirsiniz.`
            : "Şu an kriterlerinize tam uyan danışman bulunamadı. Arama sayfasında daha geniş filtreler deneyebilirsiniz.",
        };
        setMesajlar((prev) => [...prev, oneriMesaj]);
      } catch {
        setFaz("oneri");
        setMesajlar((prev) => [
          ...prev,
          { id: nextMsgId(), rol: "asistan", icerik: "Öneri alınamadı. Lütfen tekrar deneyin." },
        ]);
      }
    }
  }, [adimIndex, tercih]);

  const sohbetGonder = useCallback(async () => {
    const input = sohbetInput.trim();
    if (!input || sohbetYuk) return;
    setSohbetInput("");
    setSohbetYuk(true);
    setMesajlar((prev) => [...prev, { id: nextMsgId(), rol: "kullanici", icerik: input }]);

    try {
      const res = await fetch("/api/chatbot/mesaj", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mesaj: input, gecmis: sohbetGecmis }),
      });
      if (!res.ok) throw new Error("mesaj hata");
      const json = (await res.json()) as { icerik: string };
      const yanit = json.icerik;
      setMesajlar((prev) => [...prev, { id: nextMsgId(), rol: "asistan", icerik: yanit }]);
      const newItems: SohbetGecmisItem[] = [
        { rol: "user",      icerik: input },
        { rol: "assistant", icerik: yanit },
      ];
      setSohbetGecmis((prev) => [...prev, ...newItems].slice(-20));
    } catch {
      setMesajlar((prev) => [
        ...prev,
        { id: nextMsgId(), rol: "asistan", icerik: "Yanıt alınamadı. Lütfen tekrar deneyin." },
      ]);
    } finally {
      setSohbetYuk(false);
    }
  }, [sohbetInput, sohbetGecmis, sohbetYuk]);

  const mevcutAdim = ADIMLAR[adimIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Adım göstergesi (akış fazında) ── */}
      {faz === "akis" && (
        <div style={{ padding: "6px 14px 0", display: "flex", gap: 3, flexShrink: 0 }}>
          {ADIMLAR.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3, flex: 1,
                background: i <= adimIndex ? "var(--mb-text)" : "var(--mb-border)",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Mesaj akışı ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {mesajlar.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.rol === "kullanici" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth: "82%",
              padding: "7px 10px",
              fontSize: 12,
              lineHeight: 1.55,
              border: msg.rol === "kullanici" ? "none" : "1.5px solid var(--mb-border)",
              background: msg.rol === "kullanici" ? "var(--mb-text)" : "var(--mb-surface)",
              color:      msg.rol === "kullanici" ? "var(--mb-primary-text)" : "var(--mb-text)",
              whiteSpace: "pre-line",
            }}>
              {msg.icerik}
            </div>
          </div>
        ))}

        {/* Yükleniyor */}
        {faz === "yukleniyor" && (
          <div style={{ display: "flex" }}>
            <div style={{
              border: "1.5px solid var(--mb-border)",
              padding: "7px 12px",
              fontSize: 12,
              color: "var(--mb-muted)",
            }}>
              Eşleşmeler aranıyor…
            </div>
          </div>
        )}

        {/* Öneri kartları */}
        {(faz === "oneri" || faz === "sohbet") && oneriler.map((d) => (
          <OneriKarti key={d.id} danisan={d} />
        ))}

        {/* Sohbete geç butonu */}
        {faz === "oneri" && (
          <button
            type="button"
            onClick={() => setFaz("sohbet")}
            style={{
              alignSelf: "flex-start",
              fontSize: 11,
              color: "var(--mb-muted)",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            Başka sorularınız için buraya tıklayın
          </button>
        )}

        {/* Filtreli listeye link */}
        {(faz === "oneri" || faz === "sohbet") && (
          <Link
            href={buildSearchUrl(tercih)}
            style={{
              alignSelf: "center",
              fontSize: 11,
              color: "var(--mb-muted)",
              textDecoration: "underline",
              marginTop: 4,
            }}
          >
            Tüm filtrelenmiş sonuçları gör →
          </Link>
        )}
      </div>

      {/* ── Seçenek butonları (akış fazında) ── */}
      {faz === "akis" && mevcutAdim && (
        <div style={{
          padding: "8px 14px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          flexShrink: 0,
          borderTop: "1px solid var(--mb-border)",
        }}>
          {mevcutAdim.secenekler.map((s) => (
            <button
              key={s.etiket}
              type="button"
              onClick={() => { void secimYap(s); }}
              style={{
                fontSize: 11,
                padding: "6px 10px",
                border: "1.5px solid var(--mb-text)",
                background: "var(--mb-surface)",
                color: "var(--mb-text)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              {s.etiket}
            </button>
          ))}
        </div>
      )}

      {/* ── Metin girişi — her fazda görünür ── */}
      <div style={{
        borderTop: "1px solid var(--mb-border)",
        padding: "10px 14px",
        display: "flex",
        gap: 8,
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={sohbetInput}
          onChange={(e) => setSohbetInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (faz !== "yukleniyor") {
                if (faz === "akis" || faz === "oneri") setFaz("sohbet");
                void sohbetGonder();
              }
            }
          }}
          placeholder={faz === "akis" ? "Seçenek seçin veya sorun yazın…" : "Sorunuzu yazın…"}
          disabled={sohbetYuk || faz === "yukleniyor"}
          aria-label="Mesajınızı yazın"
          style={{
            flex: 1,
            border: "1.5px solid var(--mb-border)",
            padding: "7px 10px",
            fontSize: 12,
            outline: "none",
            fontFamily: "inherit",
            backgroundColor: "var(--mb-surface)",
            opacity: faz === "yukleniyor" ? 0.5 : 1,
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (faz === "akis" || faz === "oneri") setFaz("sohbet");
            void sohbetGonder();
          }}
          disabled={!sohbetInput.trim() || sohbetYuk || faz === "yukleniyor"}
          aria-label="Gönder"
          style={{
            padding: "7px 12px",
            fontSize: 13,
            fontWeight: 700,
            background: "var(--mb-text)",
            color: "var(--mb-primary-text)",
            border: "none",
            cursor: sohbetInput.trim() && !sohbetYuk && faz !== "yukleniyor" ? "pointer" : "default",
            fontFamily: "inherit",
            opacity: sohbetInput.trim() && !sohbetYuk && faz !== "yukleniyor" ? 1 : 0.4,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
