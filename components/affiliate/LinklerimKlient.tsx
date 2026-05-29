"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { AylikTiklama } from "@/app/(affiliate)/affiliate-panel/linklerim/page"

interface Props {
  referralKod: string
  referralLink: string
  komisyonOrani: number
  toplamTiklama: number
  aylikTiklamalar: AylikTiklama[]
}

function ayEtiket(ayStr: string): string {
  const [yil, ay] = ayStr.split("-")
  const d = new Date(Number(yil), Number(ay) - 1, 1)
  return d.toLocaleDateString("tr-TR", { month: "short" })
}

const simdikiAy = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

export default function LinklerimKlient({
  referralKod,
  referralLink,
  komisyonOrani,
  toplamTiklama,
  aylikTiklamalar,
}: Props) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const [kodKopyalandi, setKodKopyalandi] = useState(false)
  const azaltilmisHareket = useReducedMotion()

  async function kopyala(metin: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(metin)
    } catch {
      const el = document.createElement("textarea")
      el.value = metin
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const grafVeri = aylikTiklamalar.map((a) => ({
    ay: ayEtiket(a.ay),
    adet: a.adet,
    simdiki: a.ay === simdikiAy,
  }))

  const cardAnim = azaltilmisHareket
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
          background: "#F5F5F5",
          borderBottom: "1.5px solid #212121",
          padding: "12px 16px",
          margin: "-24px -24px 24px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>
          Linklerim
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

      {/* Referral Link Kartı */}
      <motion.div
        {...cardAnim}
        transition={{ duration: 0.2 }}
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #212121",
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#212121",
            marginBottom: 12,
          }}
        >
          REFERRAL LİNKİNİZ
        </div>

        {/* Link satırı */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
        >
          <code
            style={{
              flex: 1,
              fontSize: 12,
              background: "#F5F5F5",
              border: "1px solid #E0E0E0",
              padding: "9px 12px",
              wordBreak: "break-all",
              color: "#212121",
              minWidth: 0,
            }}
          >
            {referralLink}
          </code>
          <button
            onClick={() => kopyala(referralLink, setKopyalandi)}
            style={{
              background: kopyalandi ? "#F5F5F5" : "#212121",
              color: kopyalandi ? "#212121" : "#FFFFFF",
              border: kopyalandi ? "1.5px solid #212121" : "none",
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {kopyalandi ? "✓ Kopyalandı" : "Linki Kopyala"}
          </button>
        </div>

        {/* Kod satırı */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F5F5F5",
              border: "1px solid #E0E0E0",
              padding: "7px 12px",
            }}
          >
            <span style={{ fontSize: 10, color: "#BDBDBD", fontWeight: 700 }}>
              REFERRAL KOD:
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#212121",
              }}
            >
              {referralKod}
            </span>
          </div>
          <button
            onClick={() => kopyala(referralKod, setKodKopyalandi)}
            style={{
              background: "#FFFFFF",
              color: "#212121",
              border: "1.5px solid #212121",
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {kodKopyalandi ? "✓" : "Kodu Kopyala"}
          </button>
        </div>
      </motion.div>

      {/* İstatistik Özet */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.05 }}
        style={{ display: "flex", gap: 12, marginBottom: 16 }}
      >
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            border: "1.5px solid #E0E0E0",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#BDBDBD",
              marginBottom: 6,
            }}
          >
            SON 6 AY TOPLAM TIKLAMA
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#212121" }}>
            {toplamTiklama.toLocaleString("tr-TR")}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            border: "1.5px solid #E0E0E0",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#BDBDBD",
              marginBottom: 6,
            }}
          >
            BU AY TIKLAMA
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#212121" }}>
            {(aylikTiklamalar.find((a) => a.ay === simdikiAy)?.adet ?? 0).toLocaleString("tr-TR")}
          </div>
        </div>
      </motion.div>

      {/* Grafik */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.1 }}
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E0E0E0",
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#BDBDBD",
            marginBottom: 12,
          }}
        >
          AYLIK TIKLAMA GRAFİĞİ (SON 6 AY)
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={grafVeri} barSize={28}>
            <XAxis
              dataKey="ay"
              tick={{ fontSize: 10, fill: "#BDBDBD" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#BDBDBD" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E0E0E0",
                fontSize: 12,
                borderRadius: 0,
              }}
              formatter={(v) => [`${v ?? 0} tıklama`, ""]}
            />
            <Bar dataKey="adet">
              {grafVeri.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.simdiki ? "#212121" : "#BDBDBD"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Kullanım notu */}
      <div
        style={{
          fontSize: 10,
          color: "#BDBDBD",
          borderTop: "1px solid #E0E0E0",
          paddingTop: 12,
        }}
      >
        Referral linkinizi blog yazılarınıza, sosyal medyaya veya web sitenize
        ekleyin. Linke tıklayıp kayıt olan her kullanıcının ödeme yaptığı
        seanslardan <strong>%{komisyonOrani} komisyon</strong> kazanırsınız.
      </div>
    </div>
  )
}
