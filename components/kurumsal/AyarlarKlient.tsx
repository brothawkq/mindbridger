"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface HesapBilgisi {
  companyName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  licenseCount: number | null
  status: string | null
}

interface Props {
  hesap: HesapBilgisi
}

export default function AyarlarKlient({ hesap }: Props) {
  const [lisansTalepAcik, setLisansTalepAcik] = useState(false)
  const [yeniLisans, setYeniLisans] = useState(String(hesap.licenseCount ?? 1))
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [basari, setBasari] = useState<string | null>(null)
  const reduced = useReducedMotion()

  async function lisansGuncelle() {
    const sayi = Number(yeniLisans)
    if (isNaN(sayi) || sayi < 1) {
      setHata("Geçerli bir lisans sayısı girin (min 1)")
      return
    }
    setYukleniyor(true)
    setHata(null)
    try {
      const res = await fetch("/api/kurumsal/lisans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lisansSayisi: sayi }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? "Güncelleme başarısız")
      }
      setLisansTalepAcik(false)
      setBasari("Lisans sayısı güncellendi.")
      setTimeout(() => setBasari(null), 3000)
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu")
    } finally {
      setYukleniyor(false)
    }
  }

  const durumEtiket: Record<string, string> = {
    active: "Aktif",
    pending: "Beklemede",
    suspended: "Askıya Alındı",
  }

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
        <span style={{ fontSize: 12, fontWeight: 700 }}>AYARLAR</span>
        <span
          style={{
            border: "1.5px solid #325343",
            padding: "1px 7px",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {durumEtiket[hesap.status ?? ""] ?? hesap.status ?? "—"}
        </span>
      </div>

      <AnimatePresence>
        {basari && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: "#252625",
              color: "#FFFFFF",
              padding: "9px 12px",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            ✓ {basari}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company info */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #D4E4D8",
          padding: "16px",
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
          ŞİRKET BİLGİLERİ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { etiket: "Şirket Adı", deger: hesap.companyName },
            { etiket: "İletişim Kişisi", deger: hesap.contactName },
            { etiket: "E-posta", deger: hesap.contactEmail },
            { etiket: "Telefon", deger: hesap.contactPhone ?? "—" },
          ].map((row) => (
            <div
              key={row.etiket}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #F5F7F5",
                paddingBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "#4A4D4A" }}>{row.etiket}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#252625" }}>
                {row.deger}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#4A4D4A", marginTop: 10 }}>
          Şirket bilgilerini güncellemek için destek@mindbridger.com ile iletişime geçin.
        </div>
      </div>

      {/* License management */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #D4E4D8",
          padding: "16px",
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
          LİSANS YÖNETİMİ
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#4A4D4A", marginBottom: 2 }}>
              Mevcut Lisans Sayısı
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {hesap.licenseCount ?? "—"}
            </div>
          </div>
          {!lisansTalepAcik && (
            <button
              onClick={() => setLisansTalepAcik(true)}
              style={{
                padding: "9px 16px",
                background: "#FFFFFF",
                border: "1.5px solid #325343",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                color: "#252625",
              }}
            >
              Güncelle
            </button>
          )}
        </div>

        <AnimatePresence>
          {lisansTalepAcik && (
            <motion.div
              initial={reduced ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ borderTop: "1px solid #D4E4D8", paddingTop: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: "#4A4D4A",
                    marginBottom: 6,
                  }}
                >
                  YENİ LİSANS SAYISI
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    type="number"
                    value={yeniLisans}
                    onChange={(e) => setYeniLisans(e.target.value)}
                    min={1}
                    style={{
                      flex: 1,
                      border: "1.5px solid #325343",
                      padding: "9px 12px",
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={lisansGuncelle}
                    disabled={yukleniyor}
                    style={{
                      padding: "9px 16px",
                      background: yukleniyor ? "#FFFFFF" : "#252625",
                      color: yukleniyor ? "#4A4D4A" : "#FFFFFF",
                      border: yukleniyor ? "1.5px dashed #BDBDBD" : "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: yukleniyor ? "not-allowed" : "pointer",
                    }}
                  >
                    {yukleniyor ? "…" : "Kaydet"}
                  </button>
                  <button
                    onClick={() => {
                      setLisansTalepAcik(false)
                      setHata(null)
                    }}
                    style={{
                      padding: "9px 12px",
                      background: "#FFFFFF",
                      border: "1.5px solid #BDBDBD",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#4A4D4A",
                    }}
                  >
                    İptal
                  </button>
                </div>
                {hata && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#252625",
                      background: "#F5F7F5",
                      border: "1.5px solid #325343",
                      padding: "6px 10px",
                    }}
                  >
                    ⚠ {hata}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
