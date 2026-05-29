import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan", "admin"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const limitStr = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (sayfa - 1) * limitStr;

  try {
    let query = supabase
      .from("payments")
      .select(
        "id, amount_gross, amount_net, commission_rate, commission_amount, status, payment_method, paid_at, created_at, randevu_id, musteri_id, danisan_id",
        { count: "exact" },
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitStr - 1);

    if (user.role === "musteri") {
      query = query.eq("musteri_id", user.id);
    } else if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow) {
        return Response.json({ odemeler: [], toplam: 0 });
      }
      query = query.eq("danisan_id", danisanRow.id);
    }
    // admin tüm ödemeleri görür — ek filtre yok

    const { data, count, error } = await query;

    if (error) {
      return Response.json({ error: "Ödeme geçmişi alınamadı" }, { status: 500 });
    }

    // Danışman için iyzico_token ve finansal detaylar gösterilir; musteri için commission gizlenir
    const odemeler = (data ?? []).map((o) => ({
      id: o.id,
      tutar: o.amount_gross,
      ...(user.role !== "musteri" && {
        net_tutar: o.amount_net,
        komisyon_orani: o.commission_rate,
        komisyon_tutari: o.commission_amount,
      }),
      durum: o.status,
      odeme_yontemi: o.payment_method,
      odeme_tarihi: o.paid_at,
      olusturma_tarihi: o.created_at,
      randevu_id: o.randevu_id,
    }));

    return Response.json({
      odemeler,
      toplam: count ?? 0,
      sayfa,
      limit: limitStr,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
