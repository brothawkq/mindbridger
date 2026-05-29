import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type RozetTetikTipi =
  | "session_count"
  | "test_count"
  | "journal_count"
  | "journal_streak"
  | "assignment_count"
  | "webinar_count"
  | "login_streak"
  | "review_count"

export interface KazanilanRozet {
  id: string
  code: string
  name: string
  icon: string
}

/**
 * Bugünden geriye ardışık günlük kayıt gün sayısını hesapla.
 * Bugün kaydı yoksa 0 döner.
 */
export async function gunlukSeriHesapla(musteriId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data: kayitlar } = await supabase
    .from("gunluk_kayitlar")
    .select("date")
    .eq("musteri_id", musteriId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(400) // 1 yıldan fazla takip etmemize gerek yok

  if (!kayitlar || kayitlar.length === 0) return 0

  const tarihSet = new Set(kayitlar.map((k) => String(k.date)))

  let seri = 0
  const d = new Date()

  while (seri < 400) {
    const tarih = d.toISOString().slice(0, 10)
    if (!tarihSet.has(tarih)) break
    seri++
    d.setDate(d.getDate() - 1)
  }

  return seri
}

/**
 * Belirtilen tetikleyici tipi ve miktara göre hak kazanılan
 * rozetleri kontrol edip verir.
 *
 * - Admin client kullanır (RLS bypass): `kullanici_rozetleri` INSERT
 *   politikası `is_admin()` gerektiriyor.
 * - Hata durumunda sessizce boş dizi döner; çağıran route etkilenmez.
 */
export async function rozetKontrolVeVer(
  musteriId: string,
  tetikTipi: RozetTetikTipi,
  miktar: number
): Promise<KazanilanRozet[]> {
  if (!musteriId || miktar < 1) return []

  const supabase = createAdminClient()

  // Tüm aktif rozet tanımlarını çek
  const { data: rozetler } = await supabase
    .from("rozetler_tanim")
    .select("id, code, name, icon, condition")
    .is("deleted_at", null)

  if (!rozetler || rozetler.length === 0) return []

  // Bu tip için eşiği geçen rozetleri filtrele
  const uygunRozetler = rozetler.filter((r) => {
    const cond = r.condition as { type: string; threshold: number } | null
    return cond?.type === tetikTipi && miktar >= cond.threshold
  })

  if (uygunRozetler.length === 0) return []

  // Kullanıcının zaten kazandığı rozetleri kontrol et
  const rozetIdler = uygunRozetler.map((r) => String(r.id))
  const { data: mevcutRozetler } = await supabase
    .from("kullanici_rozetleri")
    .select("rozet_id")
    .eq("musteri_id", musteriId)
    .in("rozet_id", rozetIdler)
    .is("deleted_at", null)

  const mevcutIdSet = new Set(
    (mevcutRozetler ?? []).map((r) => String(r.rozet_id))
  )
  const yeniRozetler = uygunRozetler.filter(
    (r) => !mevcutIdSet.has(String(r.id))
  )

  if (yeniRozetler.length === 0) return []

  // Yeni kazanılan rozetleri kaydet
  const { error } = await supabase.from("kullanici_rozetleri").insert(
    yeniRozetler.map((r) => ({
      musteri_id: musteriId,
      rozet_id: r.id,
      earned_at: new Date().toISOString(),
    }))
  )

  if (error) {
    console.error("[rozet] INSERT hatası:", error.message)
    return []
  }

  return yeniRozetler.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    icon: String(r.icon ?? ""),
  }))
}
