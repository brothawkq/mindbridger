"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Fatura {
  id: string
  invoiceNumber: string
  periodStart: string | null
  periodEnd: string | null
  amount: number
  pdfUrl: string | null
  sentAt: string | null
}

interface Props {
  faturalar: Fatura[]
}

export default function FaturalarKlient({ faturalar }: Props) {
  const [filtre, setFiltre] = useState<"hepsi" | "var" | "yok">("hepsi")
  const reduced = useReducedMotion()

  const filtrelendi = faturalar.filter((f) => {
    if (filtre === "var") return f.pdfUrl !== null
    if (filtre === "yok") return f.pdfUrl === null
    return true
  })

  function donemGoster(f: Fatura): string {
    if (!f.periodStart || !f.periodEnd) return "—"
    const bas = new Date(f.periodStart).toLocaleDateString("tr-TR", {
      month: "long",
      year: "numeric",
    })
    return bas
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
        <span style={{ fontSize: 12, fontWeight: 700 }}>FATURALAR</span>
        <span style={{ fontSize: 10, color: "#4A4D4A" }}>
          {faturalar.length} fatura
        </span>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(
          [
            { val: "hepsi", label: "Tümü" },
            { val: "var", label: "PDF Var" },
            { val: "yok", label: "PDF Yok" },
          ] as const
        ).map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            style={{
              padding: "5px 12px",
              border:
                filtre === f.val ? "1.5px solid #325343" : "1.5px solid #D4E4D8",
              background: filtre === f.val ? "#252625" : "#FFFFFF",
              color: filtre === f.val ? "#FFFFFF" : "#252625",
              fontSize: 11,
              fontWeight: filtre === f.val ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtrelendi.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px dashed #BDBDBD",
            padding: "32px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#4A4D4A" }}>Fatura bulunamadı</div>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #D4E4D8" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 120px 120px 100px",
              background: "#F5F7F5",
              borderBottom: "1px solid #D4E4D8",
              padding: "8px 14px",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              gap: 12,
            }}
          >
            <div>FATURA NO</div>
            <div>DÖNEM</div>
            <div>TUTAR</div>
            <div>GÖNDERIM</div>
            <div></div>
          </div>

          <AnimatePresence mode="wait">
            {filtrelendi.map((f, i) => (
              <motion.div
                key={f.id}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 120px 120px 100px",
                  padding: "10px 14px",
                  borderBottom: "1px solid #D4E4D8",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{f.invoiceNumber}</div>
                <div style={{ fontSize: 12 }}>{donemGoster(f)}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  ₺{f.amount.toLocaleString("tr-TR")}
                </div>
                <div style={{ fontSize: 11, color: "#4A4D4A" }}>
                  {f.sentAt
                    ? new Date(f.sentAt).toLocaleDateString("tr-TR")
                    : "—"}
                </div>
                <div>
                  {f.pdfUrl ? (
                    <a
                      href={`/api/fatura/${f.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "5px 10px",
                        background: "#FFFFFF",
                        border: "1.5px solid #325343",
                        color: "#252625",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      PDF
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#4A4D4A",
                        border: "1.5px dashed #BDBDBD",
                        padding: "5px 10px",
                      }}
                    >
                      Yok
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
