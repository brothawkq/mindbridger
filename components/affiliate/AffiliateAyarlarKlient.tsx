"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Props {
  ad: string
  soyad: string
  email: string
  referralKod: string
  komisyonOrani: number
  durum: string
  platformBilgi: string
  affiliateId: string
}

function durumEtiket(d: string): { metin: string; vurgu: boolean } {
  if (d === "active") return { metin: "Aktif", vurgu: true }
  if (d === "suspended") return { metin: "Askıya Alındı", vurgu: false }
  return { metin: "Onay Bekliyor", vurgu: false }
}

export default function AffiliateAyarlarKlient({
  ad,
  soyad,
  email,
  referralKod,
  komisyonOrani,
  durum,
  platformBilgi,
  affiliateId,
}: Props) {
  const [platformDuzenle, setPlatformDuzenle] = useState(false)
  const [platformDeger, setPlatformDeger] = useState(platformBilgi)
  const [hata, setHata] = useState("")
  const [basari, setBasari] = useState("")
  const [isPending, startTransition] = useTransition()
  const azaltilmisHareket = useReducedMotion()

  const durumInfo = durumEtiket(durum)

  function platformGuncelle() {
    setHata("")
    setBasari("")
    startTransition(async () => {
      try {
        const res = await fetch("/api/affiliate/ayarlar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateId,
            platformInfo: platformDeger,
          }),
        })
        const json = (await res.json()) as { ok?: boolean; error?: string }
        if (!res.ok || !json.ok) {
          setHata(json.error ?? "Güncelleme başarısız oldu.")
          return
        }
        setBasari("Platform bilgisi güncellendi.")
        setPlatformDuzenle(false)
      } catch {
        setHata("Sunucuya bağlanılamadı.")
      }
    })
  }

  const satirStil: React.CSSProperties = {
    display: "flex",
    borderBottom: "1px solid #E0E0E0",
    padding: "10px 0",
    fontSize: 13,
  }
  const etiketStil: React.CSSProperties = {
    width: 160,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#BDBDBD",
    paddingTop: 2,
  }
  const degerStil: React.CSSProperties = {
    flex: 1,
    color: "#212121",
    wordBreak: "break-word",
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          background: "#F5F5F5",
          borderBottom: "1.5px solid #212121",
          padding: "12px 16px",
          margin: "-24px -24px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>
          Ayarlar
        </div>
        <span
          style={{
            border: durumInfo.vurgu ? "none" : "1.5px dashed #BDBDBD",
            background: durumInfo.vurgu ? "#212121" : "#FFFFFF",
            color: durumInfo.vurgu ? "#FFFFFF" : "#BDBDBD",
            padding: "2px 10px",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {durumInfo.metin}
        </span>
      </div>

      {/* Profil bilgileri */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2 }}
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
            marginBottom: 10,
            borderBottom: "1px solid #E0E0E0",
            paddingBottom: 8,
          }}
        >
          KİŞİSEL BİLGİLER
        </div>
        <div style={satirStil}>
          <div style={etiketStil}>Ad Soyad</div>
          <div style={degerStil}>
            {ad || soyad ? `${ad} ${soyad}`.trim() : "—"}
          </div>
        </div>
        <div style={satirStil}>
          <div style={etiketStil}>E-posta</div>
          <div style={degerStil}>{email}</div>
        </div>
      </motion.div>

      {/* Affiliate bilgileri */}
      <motion.div
        {...(azaltilmisHareket
          ? {}
          : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } })}
        transition={{ duration: 0.2, delay: 0.05 }}
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
            marginBottom: 10,
            borderBottom: "1px solid #E0E0E0",
            paddingBottom: 8,
          }}
        >
          AFFİLİATE BİLGİLERİ
        </div>
        <div style={satirStil}>
          <div style={etiketStil}>Referral Kod</div>
          <div
            style={{
              ...degerStil,
              fontWeight: 700,
              letterSpacing: 3,
              fontSize: 14,
            }}
          >
            {referralKod}
          </div>
        </div>
        <div style={satirStil}>
          <div style={etiketStil}>Komisyon Oranı</div>
          <div style={degerStil}>%{komisyonOrani}</div>
        </div>
        <div style={{ ...satirStil, borderBottom: "none" }}>
          <div style={etiketStil}>Kanal / Platform</div>
          <div style={{ ...degerStil, display: "flex", flexDirection: "column", gap: 6 }}>
            <span>{platformDeger || "—"}</span>
            <button
              onClick={() => {
                setPlatformDuzenle(!platformDuzenle)
                setHata("")
                setBasari("")
              }}
              style={{
                alignSelf: "flex-start",
                fontSize: 11,
                color: "#212121",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {platformDuzenle ? "İptal" : "Düzenle"}
            </button>
          </div>
        </div>

        {/* Platform güncelle formu */}
        <AnimatePresence>
          {platformDuzenle && (
            <motion.div
              initial={azaltilmisHareket ? {} : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={azaltilmisHareket ? {} : { height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  borderTop: "1px solid #E0E0E0",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#BDBDBD",
                    marginBottom: 6,
                  }}
                >
                  Blog URL, sosyal medya sayfanız veya platform adınız
                </div>
                <input
                  type="text"
                  value={platformDeger}
                  onChange={(e) => setPlatformDeger(e.target.value)}
                  placeholder="https://blogum.com"
                  style={{
                    width: "100%",
                    border: "1.5px solid #212121",
                    padding: "9px 12px",
                    fontSize: 13,
                    boxSizing: "border-box",
                    marginBottom: 10,
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={platformGuncelle}
                    disabled={isPending}
                    style={{
                      background: "#212121",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "9px 18px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isPending ? "not-allowed" : "pointer",
                      opacity: isPending ? 0.6 : 1,
                    }}
                  >
                    {isPending ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                  <button
                    onClick={() => {
                      setPlatformDuzenle(false)
                      setPlatformDeger(platformBilgi)
                      setHata("")
                    }}
                    style={{
                      background: "#FFFFFF",
                      color: "#212121",
                      border: "1.5px solid #212121",
                      padding: "9px 18px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    İptal
                  </button>
                </div>

                <AnimatePresence>
                  {hata && (
                    <motion.div
                      initial={azaltilmisHareket ? {} : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "#D32F2F",
                        background: "#FFF3F3",
                        border: "1px solid #FFCDD2",
                        padding: "6px 10px",
                      }}
                    >
                      ⚠ {hata}
                    </motion.div>
                  )}
                  {basari && (
                    <motion.div
                      initial={azaltilmisHareket ? {} : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "#388E3C",
                        background: "#F1F8E9",
                        border: "1px solid #C8E6C9",
                        padding: "6px 10px",
                      }}
                    >
                      ✓ {basari}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        Komisyon oranı ve referral kodunuz platform yöneticisi tarafından
        belirlenir. Değişiklik talebi için: platform@mindbridger.com
      </div>
    </div>
  )
}
