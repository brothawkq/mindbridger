import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

type Donem = "bu_ay" | "gecen_ay" | "son_3_ay" | "son_6_ay"

function donemBaslangic(donem: Donem): Date {
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

export async function GET(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["affiliate"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, commission_rate, total_earned")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) {
    return Response.json({ error: "Affiliate kaydı bulunamadı" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const donem = (searchParams.get("donem") as Donem) ?? "bu_ay"
  const baslangic = donemBaslangic(donem).toISOString()

  const [tiklamaRes, donusumRes, bekleyenRes, aylikTikRes] = await Promise.all([
    // Dönem içi toplam tıklama
    supabase
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id)
      .gte("clicked_at", baslangic),

    // Dönem içi dönüşümler
    supabase
      .from("affiliate_conversions")
      .select("commission_amount")
      .eq("affiliate_id", affiliate.id)
      .gte("created_at", baslangic),

    // Bekleyen ödemeler (dönem bağımsız)
    supabase
      .from("affiliate_conversions")
      .select("commission_amount")
      .eq("affiliate_id", affiliate.id)
      .eq("status", "pending"),

    // Son 6 ay aylık tıklama dağılımı
    supabase
      .from("affiliate_clicks")
      .select("clicked_at")
      .eq("affiliate_id", affiliate.id)
      .gte(
        "clicked_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 6,
          1
        ).toISOString()
      )
      .order("clicked_at", { ascending: true }),
  ])

  const tiklamaAdedi = tiklamaRes.count ?? 0
  const donusumlar = donusumRes.data ?? []
  const toplamKomisyon = Math.round(
    donusumlar.reduce((s, d) => s + (Number(d.commission_amount) ?? 0), 0)
  )
  const bekleyenToplam = Math.round(
    (bekleyenRes.data ?? []).reduce(
      (s, d) => s + (Number(d.commission_amount) ?? 0),
      0
    )
  )

  // Aylık tıklama dağılımı (son 6 ay)
  const aylikMap: Record<string, number> = {}
  for (const t of aylikTikRes.data ?? []) {
    const d = new Date(t.clicked_at as string)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    aylikMap[key] = (aylikMap[key] ?? 0) + 1
  }

  const aylikTiklamalar = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return { ay: key, adet: aylikMap[key] ?? 0 }
  })

  return Response.json({
    donem,
    tiklamaAdedi,
    donusumAdedi: donusumlar.length,
    donemKomisyon: toplamKomisyon,
    donusumOrani:
      tiklamaAdedi > 0
        ? Math.round((donusumlar.length / tiklamaAdedi) * 1000) / 10
        : 0,
    bekleyenOdeme: bekleyenToplam,
    toplamKazanc: Math.round(Number(affiliate.total_earned ?? 0)),
    komisyonOrani: Number(affiliate.commission_rate),
    aylikTiklamalar,
  })
}
