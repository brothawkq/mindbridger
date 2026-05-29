import "server-only"
import React from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { type SupabaseClient } from "@supabase/supabase-js"
import { faturaNumarasiUret, formatTarih } from "@/lib/fatura/numara"
import { KurumsalFaturaTemplate, type KurumsalFaturaVerisi } from "./fatura-template"

export interface KurumsalAylikFaturaOlusturSonucu {
  faturaId: string
  faturaNumarasi: string
  pdfUrl: string
  csvUrl: string
}

export async function kurumsalAylikFaturaOlustur(
  kurumsalId: string,
  periodStart: Date,
  periodEnd: Date,
  supabase: SupabaseClient
): Promise<KurumsalAylikFaturaOlusturSonucu> {
  const periodStartIso = periodStart.toISOString().slice(0, 10)
  const periodEndIso = periodEnd.toISOString().slice(0, 10)

  // Aynı dönem için fatura zaten oluşturulmuş mu?
  const { data: mevcutFatura } = await supabase
    .from("seans_faturalari")
    .select("id, invoice_number, pdf_url, xlsx_url")
    .eq("kurumsal_id", kurumsalId)
    .eq("invoice_type", "kurumsal_aylik")
    .eq("period_start", periodStartIso)
    .is("deleted_at", null)
    .maybeSingle()

  if (mevcutFatura?.pdf_url && mevcutFatura?.xlsx_url) {
    return {
      faturaId: mevcutFatura.id as string,
      faturaNumarasi: mevcutFatura.invoice_number as string,
      pdfUrl: mevcutFatura.pdf_url as string,
      csvUrl: mevcutFatura.xlsx_url as string,
    }
  }

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, company_name, contact_name, contact_email")
    .eq("id", kurumsalId)
    .single()

  if (!hesap) throw new Error("Kurumsal hesap bulunamadı")

  const { data: kullanicilar } = await supabase
    .from("kurumsal_kullanicilar")
    .select("musteri_id")
    .eq("kurumsal_id", kurumsalId)
    .is("deleted_at", null)

  const musteriIdler = (kullanicilar ?? []).map((k) => k.musteri_id as string)

  const [randevularRes, odemelerRes] = await Promise.all([
    musteriIdler.length > 0
      ? supabase
          .from("randevular")
          .select("status")
          .in("musteri_id", musteriIdler)
          .gte("scheduled_at", periodStart.toISOString())
          .lte("scheduled_at", periodEnd.toISOString())
      : Promise.resolve({ data: [] as Array<{ status: string }> }),
    musteriIdler.length > 0
      ? supabase
          .from("payments")
          .select("amount_gross")
          .in("musteri_id", musteriIdler)
          .eq("status", "captured")
          .gte("paid_at", periodStart.toISOString())
          .lte("paid_at", periodEnd.toISOString())
      : Promise.resolve({ data: [] as Array<{ amount_gross: number }> }),
  ])

  const randevular = randevularRes.data ?? []
  const odemeler = odemelerRes.data ?? []

  const toplamSeans = randevular.length
  const tamamlananSeans = randevular.filter((r) => r.status === "completed").length
  const iptalSeans = randevular.filter(
    (r) => r.status === "cancelled" || r.status === "no_show"
  ).length
  const toplamTutar = Math.round(
    odemeler.reduce((s, p) => s + (p.amount_gross ?? 0), 0)
  )

  const faturaNumarasi = await faturaNumarasiUret(supabase)
  const simdi = new Date()
  const faturaTarihiFormatli = formatTarih(simdi.toISOString())

  const veri: KurumsalFaturaVerisi = {
    faturaNumarasi,
    faturaTarihi: faturaTarihiFormatli,
    sirketAdi: (hesap.company_name as string) ?? "",
    sirketEmail: (hesap.contact_email as string) ?? "",
    sirketYetkilisi: (hesap.contact_name as string) ?? "",
    donemBaslangic: formatTarih(periodStart.toISOString()),
    donemBitis: formatTarih(periodEnd.toISOString()),
    toplamSeans,
    tamamlananSeans,
    iptalSeans,
    toplamTutar,
    aktifCalisanSayisi: musteriIdler.length,
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(KurumsalFaturaTemplate, { veri }) as React.ReactElement<DocumentProps>
  )

  const csvSatirlar = [
    ["Fatura No", faturaNumarasi],
    ["Fatura Tarihi", faturaTarihiFormatli],
    ["Şirket Adı", veri.sirketAdi],
    ["Yetkili", veri.sirketYetkilisi],
    ["Dönem Başlangıç", veri.donemBaslangic],
    ["Dönem Bitiş", veri.donemBitis],
    ["Aktif Çalışan", String(musteriIdler.length)],
    ["Toplam Seans", String(toplamSeans)],
    ["Tamamlanan Seans", String(tamamlananSeans)],
    ["İptal / No-show", String(iptalSeans)],
    ["Toplam Tutar (TL)", String(toplamTutar)],
  ]
  const csvIcerik =
    "﻿" + csvSatirlar.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
  const csvBuffer = Buffer.from(csvIcerik, "utf-8")

  const yil = periodStart.getFullYear()
  const ay = String(periodStart.getMonth() + 1).padStart(2, "0")
  const dosyaKoku = `kurumsal/${kurumsalId}/${yil}-${ay}`
  const pdfYol = `${dosyaKoku}/${faturaNumarasi}.pdf`
  const csvYol = `${dosyaKoku}/${faturaNumarasi}.csv`

  const [pdfYukle, csvYukle] = await Promise.all([
    supabase.storage
      .from("faturalar")
      .upload(pdfYol, pdfBuffer, { contentType: "application/pdf", upsert: true }),
    supabase.storage
      .from("faturalar")
      .upload(csvYol, csvBuffer, { contentType: "text/csv; charset=utf-8", upsert: true }),
  ])

  if (pdfYukle.error) throw new Error(`PDF yüklenemedi: ${pdfYukle.error.message}`)
  if (csvYukle.error) throw new Error(`CSV yüklenemedi: ${csvYukle.error.message}`)

  const pdfUrl = supabase.storage.from("faturalar").getPublicUrl(pdfYol).data.publicUrl
  const csvUrl = supabase.storage.from("faturalar").getPublicUrl(csvYol).data.publicUrl

  let faturaId: string

  if (mevcutFatura) {
    const { data: guncellendi, error: guncelleHata } = await supabase
      .from("seans_faturalari")
      .update({
        pdf_url: pdfUrl,
        xlsx_url: csvUrl,
        invoice_number: faturaNumarasi,
        amount: toplamTutar,
        updated_at: simdi.toISOString(),
      })
      .eq("id", mevcutFatura.id as string)
      .select("id")
      .single()

    if (guncelleHata || !guncellendi) throw new Error("Fatura kaydı güncellenemedi")
    faturaId = guncellendi.id as string
  } else {
    const { data: yeniFatura, error: kayitHata } = await supabase
      .from("seans_faturalari")
      .insert({
        kurumsal_id: kurumsalId,
        invoice_number: faturaNumarasi,
        invoice_type: "kurumsal_aylik",
        amount: toplamTutar,
        pdf_url: pdfUrl,
        xlsx_url: csvUrl,
        period_start: periodStartIso,
        period_end: periodEndIso,
      })
      .select("id")
      .single()

    if (kayitHata || !yeniFatura) throw new Error("Fatura kaydı oluşturulamadı")
    faturaId = yeniFatura.id as string
  }

  return { faturaId, faturaNumarasi, pdfUrl, csvUrl }
}
