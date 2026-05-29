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
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (sayfa - 1) * limit;

  try {
    let query = supabase
      .from("seans_faturalari")
      .select(
        "id, invoice_number, invoice_type, amount, pdf_url, sent_at, created_at, randevu_id, musteri_id, danisan_id",
        { count: "exact" },
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (user.role === "musteri") {
      query = query.eq("musteri_id", user.id);
    } else if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow) return Response.json({ faturalar: [], toplam: 0 });
      query = query.eq("danisan_id", danisanRow.id);
    }
    // admin tümünü görür

    const { data, count, error } = await query;

    if (error) return Response.json({ error: "Faturalar alınamadı" }, { status: 500 });

    return Response.json({ faturalar: data ?? [], toplam: count ?? 0, sayfa, limit });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
