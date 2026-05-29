import "server-only"
import { createClient } from "@/lib/supabase/server"

export type RaporDonem = "bu_ay" | "gecen_ay" | "son_3_ay" | "son_6_ay"

export interface KurumsalRaporVeri {
  donem: RaporDonem
  toplamSeans: number
  tamamlananSeans: number
  iptalSeans: number
  toplamHarcama: number
  ortalamaMemnuniyet: number | null
  aktifCalisanSayisi: number
  buAyYeniCalisanlar: number
}

function donemBaslangic(donem: RaporDonem): Date {
  const now = new Date()
  switch (donem) {
    case "gecen_ay":
      return new Date(now.getFullYear(), now.getMonth() - 1, 1)
    case "son_3_ay":
      return new Date(now.getFullYear(), now.getMonth() - 3, 1)
    case "son_6_ay":
      return new Date(now.getFullYear(), now.getMonth() - 6, 1)
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

export async function kurumsalRaporVeriAl(
  kurumsalId: string,
  donem: RaporDonem = "bu_ay"
): Promise<KurumsalRaporVeri> {
  const supabase = await createClient()
  const baslangic = donemBaslangic(donem).toISOString()

  const { data: kullanicilar } = await supabase
    .from("kurumsal_kullanicilar")
    .select("musteri_id, joined_at")
    .eq("kurumsal_id", kurumsalId)
    .is("deleted_at", null)

  const musteriIdler = kullanicilar?.map((k) => k.musteri_id) ?? []

  if (musteriIdler.length === 0) {
    return {
      donem,
      toplamSeans: 0,
      tamamlananSeans: 0,
      iptalSeans: 0,
      toplamHarcama: 0,
      ortalamaMemnuniyet: null,
      aktifCalisanSayisi: 0,
      buAyYeniCalisanlar: 0,
    }
  }

  const [randevularRes, odemelerRes, degRes] = await Promise.all([
    supabase
      .from("randevular")
      .select("status")
      .in("musteri_id", musteriIdler)
      .gte("scheduled_at", baslangic),
    supabase
      .from("payments")
      .select("amount_gross")
      .in("musteri_id", musteriIdler)
      .eq("status", "captured")
      .gte("paid_at", baslangic),
    supabase
      .from("degerlendirmeler")
      .select("rating")
      .in("musteri_id", musteriIdler)
      .gte("created_at", baslangic),
  ])

  const randevular = randevularRes.data ?? []
  const odemeler = odemelerRes.data ?? []
  const deg = degRes.data ?? []

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const buAyYeniCalisanlar =
    kullanicilar?.filter((k) => k.joined_at && new Date(k.joined_at) >= monthStart).length ?? 0

  const ortalamaMemnuniyet =
    deg.length > 0
      ? Math.round((deg.reduce((s, d) => s + (d.rating ?? 0), 0) / deg.length) * 10) / 10
      : null

  return {
    donem,
    toplamSeans: randevular.length,
    tamamlananSeans: randevular.filter((r) => r.status === "completed").length,
    iptalSeans: randevular.filter(
      (r) => r.status === "cancelled" || r.status === "no_show"
    ).length,
    toplamHarcama: Math.round(odemeler.reduce((s, p) => s + (p.amount_gross ?? 0), 0)),
    ortalamaMemnuniyet,
    aktifCalisanSayisi: musteriIdler.length,
    buAyYeniCalisanlar,
  }
}

export function raporCSVOlustur(veri: KurumsalRaporVeri): string {
  const donemEtiket: Record<RaporDonem, string> = {
    bu_ay: "Bu Ay",
    gecen_ay: "Geçen Ay",
    son_3_ay: "Son 3 Ay",
    son_6_ay: "Son 6 Ay",
  }
  const satirlar = [
    ["Dönem", donemEtiket[veri.donem]],
    ["Aktif Çalışan Sayısı", String(veri.aktifCalisanSayisi)],
    ["Bu Ay Yeni Çalışan", String(veri.buAyYeniCalisanlar)],
    ["Toplam Seans", String(veri.toplamSeans)],
    ["Tamamlanan Seans", String(veri.tamamlananSeans)],
    ["İptal / No-show", String(veri.iptalSeans)],
    ["Toplam Harcama (TL)", String(veri.toplamHarcama)],
    ["Anonim Memnuniyet Ortalaması", veri.ortalamaMemnuniyet !== null ? String(veri.ortalamaMemnuniyet) : "Veri yok"],
  ]
  return "﻿" + satirlar.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
}
