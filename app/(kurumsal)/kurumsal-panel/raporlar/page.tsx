import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { kurumsalRaporVeriAl, type RaporDonem } from "@/lib/kurumsal/rapor"

export const metadata = { title: "Raporlar — MindBridger Kurumsal" }

const DONEM_ETIKET: Record<RaporDonem, string> = {
  bu_ay: "Bu Ay",
  gecen_ay: "Geçen Ay",
  son_3_ay: "Son 3 Ay",
  son_6_ay: "Son 6 Ay",
}

interface Props {
  searchParams: Promise<{ donem?: string }>
}

export default async function RaporlarPage({ searchParams }: Props) {
  const { donem: donemParam } = await searchParams
  const gecerliDonemler: RaporDonem[] = ["bu_ay", "gecen_ay", "son_3_ay", "son_6_ay"]
  const donem: RaporDonem = gecerliDonemler.includes(donemParam as RaporDonem)
    ? (donemParam as RaporDonem)
    : "bu_ay"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, company_name")
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  const veri = await kurumsalRaporVeriAl(hesap.id, donem)

  const istatistikler = [
    { etiket: "Aktif Çalışan", deger: veri.aktifCalisanSayisi.toString() },
    { etiket: "Bu Ay Yeni Katılım", deger: veri.buAyYeniCalisanlar.toString() },
    { etiket: "Toplam Seans", deger: veri.toplamSeans.toString() },
    { etiket: "Tamamlanan Seans", deger: veri.tamamlananSeans.toString() },
    { etiket: "İptal / No-show", deger: veri.iptalSeans.toString() },
    {
      etiket: "Toplam Harcama",
      deger: `₺${veri.toplamHarcama.toLocaleString("tr-TR")}`,
    },
    {
      etiket: "Anonim Memnuniyet",
      deger:
        veri.ortalamaMemnuniyet !== null ? `${veri.ortalamaMemnuniyet}/5` : "Veri yok",
    },
  ]

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
        <span style={{ fontSize: 12, fontWeight: 700 }}>RAPORLAR</span>
        <span style={{ fontSize: 10, color: "#4A4D4A", fontStyle: "italic" }}>
          Tüm veriler anonimdir — KVKK
        </span>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {gecerliDonemler.map((d) => (
          <a
            key={d}
            href={`/kurumsal-panel/raporlar?donem=${d}`}
            style={{
              padding: "7px 14px",
              border: d === donem ? "1.5px solid #325343" : "1.5px solid #D4E4D8",
              background: d === donem ? "#252625" : "#FFFFFF",
              color: d === donem ? "#FFFFFF" : "#252625",
              fontSize: 12,
              fontWeight: d === donem ? 700 : 400,
              textDecoration: "none",
            }}
          >
            {DONEM_ETIKET[d]}
          </a>
        ))}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {istatistikler.map((s) => (
          <div
            key={s.etiket}
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
              {s.etiket}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#252625" }}>
              {s.deger}
            </div>
          </div>
        ))}
      </div>

      {/* Download section */}
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
          RAPOR İNDİR
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href={`/api/kurumsal/rapor?donem=${donem}&format=pdf`}
            style={{
              padding: "9px 18px",
              background: "#252625",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            PDF İndir
          </a>
          <a
            href={`/api/kurumsal/rapor/xlsx?donem=${donem}`}
            style={{
              padding: "9px 18px",
              background: "#FFFFFF",
              border: "1.5px solid #325343",
              color: "#252625",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            CSV / Excel İndir
          </a>
        </div>
        <div style={{ fontSize: 11, color: "#4A4D4A", marginTop: 10 }}>
          Raporlar anonim veriler içerir. Bireysel çalışan bilgisi bulunmaz.
        </div>
      </div>
    </div>
  )
}
