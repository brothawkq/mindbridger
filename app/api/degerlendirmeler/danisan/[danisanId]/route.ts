import "server-only"
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ danisanId: string }> }
) {
  const supabase = await createClient();
  const { danisanId } = await params;
  const { searchParams } = new URL(req.url);
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1"));

  const { data: danisan } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("id", danisanId)
    .is("deleted_at", null)
    .single();

  if (!danisan) return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });

  const from = (sayfa - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: yorumlar, count } = await supabase
    .from("degerlendirmeler")
    .select(
      "id, rating, comment, created_at, review_reply, reply_at, profiles:musteri_id(first_name, last_name)",
      { count: "exact" }
    )
    .eq("danisan_id", danisanId)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: danisanKPI } = await supabase
    .from("danisanlar")
    .select("average_rating, total_reviews")
    .eq("id", danisanId)
    .single();

  type Yorum = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    review_reply: string | null;
    reply_at: string | null;
    profiles: { first_name: string | null; last_name: string | null } | null;
  };

  const maskeli = (yorumlar as unknown as Yorum[]).map((y) => ({
    id: y.id,
    rating: y.rating,
    comment: y.comment,
    created_at: y.created_at,
    review_reply: y.review_reply,
    reply_at: y.reply_at,
    musteriIsim: y.profiles?.first_name
      ? `${y.profiles.first_name} ${y.profiles.last_name?.charAt(0) ?? ""}.`
      : "Anonim",
  }));

  return Response.json({
    yorumlar: maskeli,
    toplam: count ?? 0,
    sayfa,
    toplamSayfa: Math.ceil((count ?? 0) / PAGE_SIZE),
    ortalamaPuan: danisanKPI?.average_rating ?? 0,
    toplamYorum: danisanKPI?.total_reviews ?? 0,
  });
}
