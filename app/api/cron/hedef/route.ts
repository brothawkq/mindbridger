/**
 * Cron: Haftalık Hedef Sıfırlama
 * Schedule: Her Pazartesi gece yarısı (vercel.json: "0 0 * * 1")
 *
 * Aktif müşteri kullanıcıları için yeni hafta kaydı oluşturur.
 * Önceki haftanın hedef değerlerini taşır; completed sayaçları sıfırdan başlar.
 * Hedef kaydı olmayan müşteriler için varsayılan hedeflerle (1 seans, 7 ruh hali)
 * yeni kayıt oluşturur.
 */
import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

/** Pazartesi = haftanın başlangıcı (ISO 8601) */
function haftaBaslangici(d: Date = new Date()): string {
  const gun = d.getDay() // 0=Pazar ... 6=Cumartesi
  const pazartesiOffset = gun === 0 ? -6 : 1 - gun
  const pazartesi = new Date(d)
  pazartesi.setDate(d.getDate() + pazartesiOffset)
  return pazartesi.toISOString().slice(0, 10)
}

function oncekiHaftaBaslangici(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return haftaBaslangici(d)
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const buHafta = haftaBaslangici()
    const gecenHafta = oncekiHaftaBaslangici()

    // Aktif müşteri listesi
    const { data: musteriler } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "musteri")
      .eq("status", "active")
      .is("deleted_at", null)

    if (!musteriler || musteriler.length === 0) {
      return Response.json({ ok: true, olusturulan: 0, zaman: new Date().toISOString() })
    }

    const musteriIdler = musteriler.map((m) => String(m.id))

    // Geçen haftanın hedeflerini al (target değerleri taşımak için)
    const { data: gecenHaftaHedefler } = await supabase
      .from("haftalik_hedefler")
      .select("musteri_id, target_sessions, target_mood_logs")
      .in("musteri_id", musteriIdler)
      .eq("week_start", gecenHafta)
      .is("deleted_at", null)

    const gecenHaftaMap = new Map(
      (gecenHaftaHedefler ?? []).map((h) => [
        String(h.musteri_id),
        {
          target_sessions: (h.target_sessions as number) ?? 1,
          target_mood_logs: (h.target_mood_logs as number) ?? 7,
        },
      ])
    )

    // Bu hafta için zaten kaydı olanları bul (tekrar oluşturma)
    const { data: buHaftaMevcut } = await supabase
      .from("haftalik_hedefler")
      .select("musteri_id")
      .in("musteri_id", musteriIdler)
      .eq("week_start", buHafta)
      .is("deleted_at", null)

    const mevcutIdSet = new Set(
      (buHaftaMevcut ?? []).map((h) => String(h.musteri_id))
    )

    // Sadece bu hafta kaydı olmayanlar için INSERT
    const yeniKayitlar = musteriIdler
      .filter((id) => !mevcutIdSet.has(id))
      .map((id) => {
        const gecen = gecenHaftaMap.get(id)
        return {
          musteri_id: id,
          week_start: buHafta,
          target_sessions: gecen?.target_sessions ?? 1,
          completed_sessions: 0,
          target_mood_logs: gecen?.target_mood_logs ?? 7,
          completed_mood_logs: 0,
        }
      })

    let olusturulan = 0
    if (yeniKayitlar.length > 0) {
      const { error, data } = await supabase
        .from("haftalik_hedefler")
        .insert(yeniKayitlar)
        .select("id")

      if (error) throw error
      olusturulan = data?.length ?? 0
    }

    return Response.json({
      ok: true,
      buHafta,
      olusturulan,
      toplam: musteriIdler.length,
      zaman: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[cron/hedef] hata:", err)
    return Response.json({ error: "Cron hatası" }, { status: 500 })
  }
}
