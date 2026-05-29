import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const yorumSchema = z.object({
  randevu_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = yorumSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { randevu_id, rating, comment } = parsed.data;

    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, musteri_id, danisan_id, status")
      .eq("id", randevu_id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    if (randevu.musteri_id !== user.id)
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (randevu.status !== "completed")
      return Response.json(
        { error: "Yalnızca tamamlanan randevular değerlendirilebilir" },
        { status: 400 }
      );

    const { data: mevcutYorum } = await supabase
      .from("degerlendirmeler")
      .select("id")
      .eq("randevu_id", randevu_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (mevcutYorum)
      return Response.json(
        { error: "Bu randevu için zaten bir değerlendirme yapıldı" },
        { status: 409 }
      );

    const { data: yeniYorum, error: insertError } = await supabase
      .from("degerlendirmeler")
      .insert({
        randevu_id,
        musteri_id: user.id,
        danisan_id: randevu.danisan_id,
        rating,
        comment: comment ?? null,
        is_visible: true,
      })
      .select("id, rating, comment, created_at")
      .single();

    if (insertError)
      return Response.json({ error: "Değerlendirme kaydedilemedi" }, { status: 500 });

    const { data: ortalama } = await supabase
      .from("degerlendirmeler")
      .select("rating")
      .eq("danisan_id", randevu.danisan_id)
      .eq("is_visible", true)
      .is("deleted_at", null);

    if (ortalama && ortalama.length > 0) {
      const avg =
        ortalama.reduce((s, r) => s + r.rating, 0) / ortalama.length;
      await supabase
        .from("danisanlar")
        .update({
          average_rating: Math.round(avg * 10) / 10,
          total_reviews: ortalama.length,
        })
        .eq("id", randevu.danisan_id);
    }

    return Response.json({ yorum: yeniYorum }, { status: 201 });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
