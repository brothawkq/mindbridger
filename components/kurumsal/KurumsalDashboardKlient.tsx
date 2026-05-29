"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import type { Database } from "@/types/supabase"
import type { KurumsalRaporVeri } from "@/lib/kurumsal/rapor"

type KurumsalHesap = Database["public"]["Tables"]["kurumsal_hesaplar"]["Row"]

interface Props {
  hesap: KurumsalHesap
  raporVeri: KurumsalRaporVeri
}

export default function KurumsalDashboardKlient({ hesap, raporVeri }: Props) {
  const [veri, setVeri] = useState<KurumsalRaporVeri>(raporVeri)
  const reduced = useReducedMotion()

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/kurumsal/rapor?donem=bu_ay")
      if (res.ok) {
        const json = (await res.json()) as KurumsalRaporVeri
        setVeri(json)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const kpilar = [
    {
      baslik: "TOPLAM LİSANS",
      deger: (hesap.license_count ?? 0).toString(),
      alt: `${veri.aktifCalisanSayisi} aktif çalışan`,
    },
    {
      baslik: "BU AY SEANS",
      deger: veri.toplamSeans.toString(),
      alt: `${veri.tamamlananSeans} tamamlandı`,
    },
    {
      baslik: "BU AY HARCAMA",
      deger: `₺${veri.toplamHarcama.toLocaleString("tr-TR")}`,
      alt: "ödeme yapılan",
    },
    {
      baslik: "MEMNUNİYET",
      deger:
        veri.ortalamaMemnuniyet !== null ? `${veri.ortalamaMemnuniyet}/5` : "—",
      alt: "anonim ortalama",
    },
  ]

  const lisansDoluluk =
    (hesap.license_count ?? 0) > 0
      ? Math.min(100, (veri.aktifCalisanSayisi / (hesap.license_count ?? 1)) * 100)
      : 0

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
        <span style={{ fontSize: 12, fontWeight: 700 }}>DASHBOARD</span>
        <span
          style={{
            border: "1.5px solid #325343",
            padding: "1px 7px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {hesap.company_name}
        </span>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {kpilar.map((kpi, i) => (
          <motion.div
            key={kpi.baslik}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #D4E4D8",
              padding: "14px 16px",
            }}
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
            <div
              style={{ fontSize: 22, fontWeight: 700, color: "#252625", marginBottom: 4 }}
            >
              {kpi.deger}
            </div>
            <div style={{ fontSize: 11, color: "#4A4D4A" }}>{kpi.alt}</div>
          </motion.div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Subscription info */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #D4E4D8",
            padding: "14px 16px",
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
            ABONELİK
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                etiket: "Başlangıç",
                deger: hesap.subscription_start
                  ? new Date(hesap.subscription_start).toLocaleDateString("tr-TR")
                  : "—",
              },
              {
                etiket: "Bitiş",
                deger: hesap.subscription_end
                  ? new Date(hesap.subscription_end).toLocaleDateString("tr-TR")
                  : "—",
              },
              {
                etiket: "Kişi Başı / Ay",
                deger: hesap.price_per_user
                  ? `₺${hesap.price_per_user.toLocaleString("tr-TR")}`
                  : "—",
              },
              {
                etiket: "Varsayılan Bütçe",
                deger:
                  hesap.default_monthly_budget && hesap.default_monthly_budget > 0
                    ? `₺${hesap.default_monthly_budget.toLocaleString("tr-TR")}`
                    : "Sınırsız",
              },
            ].map((row) => (
              <div
                key={row.etiket}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #F5F7F5",
                  paddingBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, color: "#4A4D4A" }}>{row.etiket}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{row.deger}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee capacity */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #D4E4D8",
            padding: "14px 16px",
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
            ÇALIŞAN KATILIMI
          </div>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: "#252625" }}>Lisans kullanımı</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {veri.aktifCalisanSayisi} / {hesap.license_count ?? "—"}
              </span>
            </div>
            <div
              style={{
                background: "#D4E4D8",
                border: "1px solid #BDBDBD",
                height: 8,
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lisansDoluluk}%` }}
                transition={reduced ? { duration: 0 } : { duration: 0.6, ease: "easeInOut" }}
                style={{ height: "100%", background: "#252625" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              {
                etiket: "Tamamlanan seans",
                sayi: veri.tamamlananSeans,
                dolu: true,
              },
              {
                etiket: "İptal / No-show",
                sayi: veri.iptalSeans,
                dolu: false,
              },
              {
                etiket: "Bu ay yeni katılım",
                sayi: veri.buAyYeniCalisanlar,
                dolu: false,
              },
            ].map((s) => (
              <div
                key={s.etiket}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#252625" }}>{s.etiket}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: s.dolu ? "#252625" : "#FFFFFF",
                    color: s.dolu ? "#FFFFFF" : "#252625",
                    border: `1.5px solid ${s.dolu ? "#252625" : "#D4E4D8"}`,
                    padding: "1px 7px",
                  }}
                >
                  {s.sayi}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
