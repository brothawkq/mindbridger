"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

interface Props {
  referralKod: string
  referralLink: string
  komisyonOrani: number
  toplamKazanc: number
  bekleyenOdeme: number
  toplamTiklama: number
  buAyTiklama: number
  toplamDonusum: number
  donusumOrani: number
}

const kpiStil: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1.5px solid #E0E0E0",
  padding: "14px 16px",
  flex: 1,
  minWidth: 0,
}

const etiketStil: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#BDBDBD",
  marginBottom: 6,
}

const degerStil: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#212121",
}

const altEtiketStil: React.CSSProperties = {
  fontSize: 10,
  color: "#BDBDBD",
  marginTop: 2,
}

export default function AffiliateDashboardKlient({
  referralKod,
  referralLink,
  komisyonOrani,
  toplamKazanc,
  bekleyenOdeme,
  toplamTiklama,
  buAyTiklama,
  toplamDonusum,
  donusumOrani,
}: Props) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const azaltilmisHareket = useReducedMotion()

  async function linkKopyala() {
    try {
      await navigator.clipboard.writeText(referralLink)
    } catch {
      const el = document.createElement("textarea")
      el.value = referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }

  const satirGecis = azaltilmisHareket
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          background: "#F5F5F5",
          borderBottom: "1.5px solid #212121",
          padding: "12px 16px",
          margin: "-24px -24px 24px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>
          Affiliate Dashboard
        </div>
        <div
          style={{
            border: "1.5px solid #212121",
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          KOMİSYON %{komisyonOrani}
        </div>
      </div>

      {/* Referral Link */}
      <motion.div
        {...satirGecis}
        transition={{ duration: 0.2 }}
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #212121",
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div style={{ ...etiketStil, color: "#212121" }}>REFERRAL LİNKİNİZ</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: 12,
              color: "#212121",
              background: "#F5F5F5",
              padding: "7px 10px",
              border: "1px solid #E0E0E0",
              wordBreak: "break-all",
              minWidth: 0,
            }}
          >
            {referralLink}
          </code>
          <button
            onClick={linkKopyala}
            style={{
              background: kopyalandi ? "#F5F5F5" : "#212121",
              color: kopyalandi ? "#212121" : "#FFFFFF",
              border: kopyalandi ? "1.5px solid #212121" : "none",
              padding: "9px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {kopyalandi ? "✓ Kopyalandı" : "Kopyala"}
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "#BDBDBD" }}>
          Referral kod:{" "}
          <span style={{ fontWeight: 700, color: "#212121", letterSpacing: 2 }}>
            {referralKod}
          </span>
        </div>
      </motion.div>

      {/* KPI Grid - Tıklama + Dönüşüm */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.05 }}
        style={{ display: "flex", gap: 12, marginBottom: 12 }}
      >
        <div style={kpiStil}>
          <div style={etiketStil}>TOPLAM TIKLAMA</div>
          <div style={degerStil}>{toplamTiklama.toLocaleString("tr-TR")}</div>
          <div style={altEtiketStil}>Tüm zamanlar</div>
        </div>
        <div style={kpiStil}>
          <div style={etiketStil}>BU AY TIKLAMA</div>
          <div style={degerStil}>{buAyTiklama.toLocaleString("tr-TR")}</div>
          <div style={altEtiketStil}>
            {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={kpiStil}>
          <div style={etiketStil}>TOPLAM DÖNÜŞÜM</div>
          <div style={degerStil}>{toplamDonusum.toLocaleString("tr-TR")}</div>
          <div style={altEtiketStil}>Kayıt olan kullanıcı</div>
        </div>
        <div style={kpiStil}>
          <div style={etiketStil}>DÖNÜŞÜM ORANI</div>
          <div style={degerStil}>%{donusumOrani}</div>
          <div style={altEtiketStil}>Tıklama / kayıt</div>
        </div>
      </motion.div>

      {/* Kazanç kartları */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.1 }}
        style={{ display: "flex", gap: 12, marginBottom: 24 }}
      >
        <div style={{ ...kpiStil, border: "1.5px solid #212121" }}>
          <div style={{ ...etiketStil, color: "#212121" }}>TOPLAM KAZANÇ</div>
          <div style={degerStil}>
            {toplamKazanc.toLocaleString("tr-TR")} TL
          </div>
          <div style={altEtiketStil}>Onaylı + ödenmiş</div>
        </div>
        <div style={kpiStil}>
          <div style={etiketStil}>BEKLEYEN ÖDEME</div>
          <div style={{ ...degerStil, fontSize: 20 }}>
            {bekleyenOdeme.toLocaleString("tr-TR")} TL
          </div>
          <div style={altEtiketStil}>Henüz ödenmedi</div>
        </div>
      </motion.div>

      {/* Bilgi notu */}
      <div
        style={{
          fontSize: 10,
          color: "#BDBDBD",
          borderTop: "1px solid #E0E0E0",
          paddingTop: 12,
        }}
      >
        Ödemeler her ayın 1'inde otomatik olarak hesabınıza aktarılır.
        Komisyon oranınız şu an{" "}
        <strong>%{komisyonOrani}</strong>&apos;dir.
        Sorularınız için: platform@mindbridger.com
      </div>
    </div>
  )
}
