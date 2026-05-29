"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import type { AffiliateKazanc } from "@/app/(affiliate)/affiliate-panel/kazanclar/page"

interface Props {
  kazanclar: AffiliateKazanc[]
  toplamKazanc: number
  bekleyenToplam: number
  odenenToplam: number
  aktifDurum: string
  sayfaNo: number
  toplamSayfa: number
}

function tarihFormatla(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}.${d.getFullYear()}`
}

const DURUMLAR = [
  { key: "hepsi", label: "Hepsi" },
  { key: "bekleyen", label: "Bekleyen" },
  { key: "odendi", label: "Ödendi" },
]

export default function KazanclarKlient({
  kazanclar,
  toplamKazanc,
  bekleyenToplam,
  odenenToplam,
  aktifDurum,
  sayfaNo,
  toplamSayfa,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const azaltilmisHareket = useReducedMotion()

  function durumDegistir(d: string) {
    router.push(`${pathname}?durum=${d}&sayfa=1`)
  }

  function sayfaDegistir(s: number) {
    router.push(`${pathname}?durum=${aktifDurum}&sayfa=${s}`)
  }

  const cardAnim = azaltilmisHareket
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          background: "#F5F5F5",
          borderBottom: "1.5px solid #212121",
          padding: "12px 16px",
          margin: "-24px -24px 24px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>
          Kazançlar
        </div>
      </div>

      {/* Özet */}
      <motion.div
        {...cardAnim}
        transition={{ duration: 0.2 }}
        style={{ display: "flex", gap: 12, marginBottom: 20 }}
      >
        {[
          { label: "TOPLAM KAZANÇ", tutar: toplamKazanc, vurgu: true },
          { label: "BEKLEYEN ÖDEME", tutar: bekleyenToplam, vurgu: false },
          { label: "ÖDENEN TOPLAM", tutar: odenenToplam, vurgu: false },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              flex: 1,
              background: "#FFFFFF",
              border: k.vurgu ? "1.5px solid #212121" : "1.5px solid #E0E0E0",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: k.vurgu ? "#212121" : "#BDBDBD",
                marginBottom: 6,
              }}
            >
              {k.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#212121" }}>
              {k.tutar.toLocaleString("tr-TR")} TL
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filtre */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {DURUMLAR.map((d) => (
          <button
            key={d.key}
            onClick={() => durumDegistir(d.key)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              background: aktifDurum === d.key ? "#212121" : "#FFFFFF",
              color: aktifDurum === d.key ? "#FFFFFF" : "#212121",
              border:
                aktifDurum === d.key
                  ? "none"
                  : "1.5px solid #212121",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.05 }}
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E0E0E0",
          overflow: "hidden",
        }}
      >
        {/* Tablo başlığı */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 120px",
            background: "#F5F5F5",
            borderBottom: "1px solid #E0E0E0",
            padding: "8px 14px",
          }}
        >
          {["TARİH", "KOMİSYON TUTARI", "DURUM"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#BDBDBD",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {kazanclar.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              fontSize: 13,
              color: "#BDBDBD",
            }}
          >
            Bu filtrede kazanç kaydı bulunamadı.
          </div>
        ) : (
          kazanclar.map((k, i) => (
            <motion.div
              key={k.id}
              {...(azaltilmisHareket
                ? {}
                : {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { delay: i * 0.03 },
                  })}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 120px",
                padding: "10px 14px",
                borderBottom: "1px solid #E0E0E0",
                fontSize: 13,
                color: "#212121",
              }}
            >
              <div>{tarihFormatla(k.createdAt)}</div>
              <div style={{ fontWeight: 600 }}>
                {k.commissionAmount.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                TL
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    background:
                      k.status === "paid" ? "#212121" : "#FFFFFF",
                    color: k.status === "paid" ? "#FFFFFF" : "#212121",
                    border:
                      k.status === "paid"
                        ? "none"
                        : "1.5px dashed #BDBDBD",
                  }}
                >
                  {k.status === "paid" ? "Ödendi" : "Bekliyor"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Sayfalama */}
      {toplamSayfa > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 16,
            justifyContent: "center",
          }}
        >
          {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              onClick={() => sayfaDegistir(s)}
              style={{
                width: 32,
                height: 32,
                fontSize: 12,
                fontWeight: sayfaNo === s ? 700 : 400,
                background: sayfaNo === s ? "#212121" : "#FFFFFF",
                color: sayfaNo === s ? "#FFFFFF" : "#212121",
                border:
                  sayfaNo === s
                    ? "none"
                    : "1.5px solid #E0E0E0",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Not */}
      <div
        style={{
          fontSize: 10,
          color: "#BDBDBD",
          marginTop: 16,
          borderTop: "1px solid #E0E0E0",
          paddingTop: 12,
        }}
      >
        Bekleyen komisyonlar her ayın 1&apos;inde IBAN hesabınıza aktarılır.
        Ödemeler için geçerli IBAN bilginizin Ayarlar bölümünde kayıtlı olması
        gerekir.
      </div>
    </div>
  )
}
