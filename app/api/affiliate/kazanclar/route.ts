import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"

const LIMIT = 20

export async function GET(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["affiliate"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id")
    .eq("profile_id", user.id)
    .single()

  if (!affiliate) {
    return Response.json({ error: "Affiliate kaydı bulunamadı" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const durum = searchParams.get("durum") ?? "hepsi"
  const sayfaNo = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10))

  try {
    let sorgu = supabase
      .from("affiliate_conversions")
      .select("id, commission_amount, status, created_at", { count: "exact" })
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .range((sayfaNo - 1) * LIMIT, sayfaNo * LIMIT - 1)

    if (durum === "bekleyen") sorgu = sorgu.eq("status", "pending")
    else if (durum === "odendi") sorgu = sorgu.eq("status", "paid")

    const { data, count, error } = await sorgu

    if (error) throw error

    // Özet toplamlar (dönem bağımsız)
    const [bekleyenRes, odenenRes] = await Promise.all([
      supabase
        .from("affiliate_conversions")
        .select("commission_amount")
        .eq("affiliate_id", affiliate.id)
        .eq("status", "pending"),
      supabase
        .from("affiliate_conversions")
        .select("commission_amount")
        .eq("affiliate_id", affiliate.id)
        .eq("status", "paid"),
    ])

    const bekleyenToplam = Math.round(
      (bekleyenRes.data ?? []).reduce(
        (s, c) => s + (Number(c.commission_amount) ?? 0),
        0
      )
    )
    const odenenToplam = Math.round(
      (odenenRes.data ?? []).reduce(
        (s, c) => s + (Number(c.commission_amount) ?? 0),
        0
      )
    )

    return Response.json({
      kazanclar: (data ?? []).map((d) => ({
        id: d.id,
        commissionAmount: Number(d.commission_amount ?? 0),
        status: d.status,
        createdAt: d.created_at,
      })),
      toplamKayit: count ?? 0,
      toplamSayfa: Math.ceil((count ?? 0) / LIMIT),
      sayfaNo,
      bekleyenToplam,
      odenenToplam,
    })
  } catch {
    return Response.json({ error: "Kazançlar alınamadı" }, { status: 500 })
  }
}
