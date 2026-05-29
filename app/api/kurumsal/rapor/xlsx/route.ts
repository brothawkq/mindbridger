import "server-only"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/requireRole"
import { kurumsalRaporVeriAl, raporCSVOlustur, type RaporDonem } from "@/lib/kurumsal/rapor"

export async function GET(req: Request) {
  const supabase = await createClient()
  const user = await requireRole(supabase, ["kurumsal"])
  if (!user) return Response.json({ error: "Yetkisiz erişim" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const donemParam = searchParams.get("donem") ?? "bu_ay"

  const gecerliDonemler: RaporDonem[] = ["bu_ay", "gecen_ay", "son_3_ay", "son_6_ay"]
  const donem: RaporDonem = gecerliDonemler.includes(donemParam as RaporDonem)
    ? (donemParam as RaporDonem)
    : "bu_ay"

  const { data: authUser } = await supabase.auth.getUser()
  const email = authUser.user?.email ?? ""

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id, company_name")
    .eq("contact_email", email)
    .single()

  if (!hesap) return Response.json({ error: "Şirket bulunamadı" }, { status: 404 })

  try {
    const veri = await kurumsalRaporVeriAl(hesap.id, donem)
    const csv = raporCSVOlustur(veri)

    const donemEtiket: Record<RaporDonem, string> = {
      bu_ay: "bu-ay",
      gecen_ay: "gecen-ay",
      son_3_ay: "son-3-ay",
      son_6_ay: "son-6-ay",
    }
    const dosyaAdi = `mindbridger-rapor-${donemEtiket[donem]}.csv`

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
      },
    })
  } catch {
    return Response.json({ error: "Rapor oluşturulamadı" }, { status: 500 })
  }
}
