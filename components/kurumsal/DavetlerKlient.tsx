"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Props {
  davetKodu: string
  davetLinki: string
  calisanSayisi: number
  lisansSayisi: number
}

export default function DavetlerKlient({
  davetKodu: baslangicKod,
  davetLinki: baslangicLink,
  calisanSayisi,
  lisansSayisi,
}: Props) {
  const [kod, setKod] = useState(baslangicKod)
  const [link, setLink] = useState(baslangicLink)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kopyalandi, setKopyalandi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const reduced = useReducedMotion()

  async function koduYenile() {
    setYukleniyor(true)
    setHata(null)
    try {
      const res = await fetch("/api/kurumsal/davet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksiyon: "yenile" }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? "Yenileme başarısız")
      }
      const j = (await res.json()) as { kod: string; link: string }
      setKod(j.kod)
      setLink(j.link)
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu")
    } finally {
      setYukleniyor(false)
    }
  }

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(link)
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea")
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    }
  }

  const bosLisans = Math.max(0, lisansSayisi - calisanSayisi)

  return (
    <div style={{ padding: 24 }}>
      {/* Frame header */}
      <div
        style={{
          background: "#F5F7F5",
          borderBottom: "1.5px solid #325343",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "-24px -24px 24px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>DAVETLER</span>
        <span style={{ fontSize: 10, color: "#4A4D4A", fontStyle: "italic" }}>
          Kişisel veriler KVKK kapsamında gizlidir
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { baslik: "AKTİF ÇALIŞAN", deger: calisanSayisi.toString(), alt: "platforma katıldı" },
          { baslik: "BOŞ LİSANS", deger: bosLisans.toString(), alt: "kullanılabilir" },
        ].map((kpi) => (
          <div
            key={kpi.baslik}
            style={{ background: "#FFFFFF", border: "1.5px solid #D4E4D8", padding: "14px 16px" }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#4A4D4A",
                marginBottom: 8,
              }}
            >
              {kpi.baslik}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{kpi.deger}</div>
            <div style={{ fontSize: 11, color: "#4A4D4A" }}>{kpi.alt}</div>
          </div>
        ))}
      </div>

      {/* Invite code card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #D4E4D8",
          padding: "16px 16px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#252625",
            marginBottom: 12,
          }}
        >
          DAVET KODU
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1.5px solid #325343",
              padding: "9px 12px",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              background: "#F5F7F5",
            }}
          >
            {kod}
          </div>
          <button
            onClick={koduYenile}
            disabled={yukleniyor}
            style={{
              padding: "9px 16px",
              background: yukleniyor ? "#FFFFFF" : "#252625",
              color: yukleniyor ? "#4A4D4A" : "#FFFFFF",
              border: yukleniyor ? "1.5px dashed #BDBDBD" : "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: yukleniyor ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {yukleniyor ? "Yenileniyor…" : "Kodu Yenile"}
          </button>
        </div>

        <div style={{ fontSize: 11, color: "#4A4D4A", marginBottom: 8 }}>
          ⚠ Kodu yenilemek eski linki geçersiz kılar.
        </div>

        <AnimatePresence>
          {hata && (
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                fontSize: 11,
                color: "#252625",
                background: "#F5F7F5",
                border: "1.5px solid #325343",
                padding: "7px 10px",
                marginBottom: 8,
              }}
            >
              ⚠ {hata}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite link card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #D4E4D8",
          padding: "16px 16px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#252625",
            marginBottom: 12,
          }}
        >
          DAVET LİNKİ
        </div>

        <div
          style={{
            border: "1.5px solid #D4E4D8",
            padding: "9px 12px",
            fontSize: 12,
            color: "#4A4D4A",
            background: "#F5F7F5",
            marginBottom: 10,
            wordBreak: "break-all",
          }}
        >
          {link}
        </div>

        <button
          onClick={kopyala}
          style={{
            width: "100%",
            padding: "11px",
            background: "#252625",
            color: "#FFFFFF",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {kopyalandi ? "✓ Kopyalandı" : "Linki Kopyala"}
        </button>

        <div style={{ fontSize: 11, color: "#4A4D4A", marginTop: 10 }}>
          Çalışanlarınız bu linke tıklayarak platforma kaydolabilir.
          Kişisel seans bilgileri size görünmez.
        </div>
      </div>
    </div>
  )
}
