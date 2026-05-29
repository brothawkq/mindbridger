"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Calisan {
  satirNo: number
  satirId: string // kurumsal_kullanicilar.id (internal, not exposed as name)
  monthlyBudgetLimit: number | null
  sessionsUsedThisMonth: number
  defaultBudget: number | null
}

interface Props {
  calisanlar: Calisan[]
  defaultBudget: number | null
}

export default function ButceKlient({ calisanlar: baslangic, defaultBudget }: Props) {
  const [calisanlar, setCalisanlar] = useState<Calisan[]>(baslangic)
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null)
  const [yeniButce, setYeniButce] = useState("")
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [basari, setBasari] = useState<string | null>(null)
  const reduced = useReducedMotion()

  function duzenlemeBaslat(satirId: string, mevcutLimit: number | null) {
    setDuzenlenen(satirId)
    setYeniButce(mevcutLimit !== null ? String(mevcutLimit) : "")
    setHata(null)
  }

  function duzenlemeIptal() {
    setDuzenlenen(null)
    setYeniButce("")
    setHata(null)
  }

  async function butceGuncelle(satirId: string) {
    const tutar = yeniButce === "" ? null : Number(yeniButce)
    if (tutar !== null && (isNaN(tutar) || tutar < 0)) {
      setHata("Geçerli bir tutar girin (0 = sınırsız)")
      return
    }

    setYukleniyor(true)
    setHata(null)
    try {
      const res = await fetch(`/api/kurumsal/butce/${satirId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudgetLimit: tutar }),
      })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? "Güncelleme başarısız")
      }
      setCalisanlar((prev) =>
        prev.map((c) =>
          c.satirId === satirId ? { ...c, monthlyBudgetLimit: tutar } : c
        )
      )
      setDuzenlenen(null)
      setBasari("Bütçe güncellendi.")
      setTimeout(() => setBasari(null), 3000)
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu")
    } finally {
      setYukleniyor(false)
    }
  }

  function butceGoster(calisan: Calisan): string {
    const limit = calisan.monthlyBudgetLimit ?? defaultBudget
    if (!limit || limit === 0) return "Sınırsız"
    return `₺${limit.toLocaleString("tr-TR")}`
  }

  function kullanim(calisan: Calisan): number {
    const limit = calisan.monthlyBudgetLimit ?? defaultBudget
    if (!limit || limit === 0) return 0
    return Math.min(100, (calisan.sessionsUsedThisMonth / limit) * 100)
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
        <span style={{ fontSize: 12, fontWeight: 700 }}>BÜTÇE YÖNETİMİ</span>
        <span style={{ fontSize: 10, color: "#4A4D4A", fontStyle: "italic" }}>
          Varsayılan:{" "}
          {defaultBudget && defaultBudget > 0
            ? `₺${defaultBudget.toLocaleString("tr-TR")}/ay`
            : "Sınırsız"}
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

      {calisanlar.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px dashed #BDBDBD",
            padding: "32px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#4A4D4A", marginBottom: 6 }}>
            Henüz çalışan yok
          </div>
          <div style={{ fontSize: 11, color: "#4A4D4A" }}>
            Davetler sayfasından çalışanlarınızı davet edin.
          </div>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #D4E4D8" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 140px 140px 120px",
              background: "#F5F7F5",
              borderBottom: "1px solid #D4E4D8",
              padding: "8px 14px",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "#252625",
              gap: 12,
            }}
          >
            <div>ÇALIŞAN</div>
            <div>BU AY KULLANIM</div>
            <div>AYLIK BÜTÇE</div>
            <div>KULLANILAN SEANS</div>
            <div></div>
          </div>

          {calisanlar.map((c, i) => (
            <motion.div
              key={c.satirId}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 140px 140px 120px",
                padding: "10px 14px",
                borderBottom: "1px solid #D4E4D8",
                alignItems: "center",
                gap: 12,
                background: duzenlenen === c.satirId ? "#F5F7F5" : "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700 }}>Çalışan {c.satirNo}</div>

              {/* Usage bar */}
              <div>
                <div
                  style={{
                    background: "#D4E4D8",
                    border: "1px solid #BDBDBD",
                    height: 6,
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: `${kullanim(c)}%`,
                      height: "100%",
                      background: kullanim(c) >= 80 ? "#252625" : "#4A4D4A",
                    }}
                  />
                </div>
                {kullanim(c) >= 80 && (
                  <div style={{ fontSize: 10, color: "#252625", fontWeight: 700 }}>
                    %{Math.round(kullanim(c))} — uyarı eşiği
                  </div>
                )}
              </div>

              {/* Budget cell */}
              <div>
                {duzenlenen === c.satirId ? (
                  <input
                    type="number"
                    value={yeniButce}
                    onChange={(e) => setYeniButce(e.target.value)}
                    placeholder="0 = sınırsız"
                    style={{
                      width: "100%",
                      border: "1.5px solid #325343",
                      padding: "5px 8px",
                      fontSize: 12,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 12 }}>{butceGoster(c)}</span>
                )}
              </div>

              <div style={{ fontSize: 12 }}>{c.sessionsUsedThisMonth} seans</div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                {duzenlenen === c.satirId ? (
                  <>
                    <button
                      onClick={() => butceGuncelle(c.satirId)}
                      disabled={yukleniyor}
                      style={{
                        padding: "5px 10px",
                        background: "#252625",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: yukleniyor ? "not-allowed" : "pointer",
                      }}
                    >
                      {yukleniyor ? "…" : "Kaydet"}
                    </button>
                    <button
                      onClick={duzenlemeIptal}
                      style={{
                        padding: "5px 8px",
                        background: "#FFFFFF",
                        border: "1.5px solid #BDBDBD",
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#4A4D4A",
                      }}
                    >
                      İptal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => duzenlemeBaslat(c.satirId, c.monthlyBudgetLimit)}
                    style={{
                      padding: "5px 10px",
                      background: "#FFFFFF",
                      border: "1.5px solid #325343",
                      fontSize: 11,
                      cursor: "pointer",
                      color: "#252625",
                    }}
                  >
                    Düzenle
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
              marginTop: 8,
            }}
          >
            ⚠ {hata}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ fontSize: 10, color: "#4A4D4A", marginTop: 12 }}>
        Çalışan isimleri KVKK kapsamında gizlidir. Bütçe sıfır girilirse varsayılan uygulanır.
      </div>
    </div>
  )
}
