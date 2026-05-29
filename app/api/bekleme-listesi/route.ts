import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const postSchema = z.object({
  danisan_id:      z.string().uuid(),
  preferred_days:  z.array(z.number().int().min(0).max(6)).max(7).optional(),
  preferred_times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { danisan_id, preferred_days, preferred_times } = parsed.data;

  try {
    // Danışmanın var olduğunu ve aktif olduğunu kontrol et
    const { data: danisan } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("id", danisan_id)
      .eq("profile_published", true)
      .is("deleted_at", null)
      .single();

    if (!danisan) {
      return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });
    }

    // Zaten aktif bir bekleme kaydı var mı kontrol et
    const { data: mevcutKayit } = await supabase
      .from("bekleme_listesi")
      .select("id")
      .eq("musteri_id", user.id)
      .eq("danisan_id", danisan_id)
      .is("deleted_at", null)
      .is("accepted_at", null)
      .single();

    if (mevcutKayit) {
      return Response.json(
        { error: "Bu danışman için zaten bekleme listesinde kayıtlısınız" },
        { status: 409 },
      );
    }

    const { data: yeniKayit, error: insertErr } = await supabase
      .from("bekleme_listesi")
      .insert({
        musteri_id:      user.id,
        danisan_id:      danisan.id,
        preferred_days:  preferred_days ?? null,
        preferred_times: preferred_times ?? null,
      })
      .select("id, danisan_id, created_at")
      .single();

    if (insertErr || !yeniKayit) {
      return Response.json({ error: "Bekleme listesine eklenemedi" }, { status: 500 });
    }

    return Response.json({ bekleme: yeniKayit }, { status: 201 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("bekleme_listesi")
      .select("id, danisan_id, preferred_days, preferred_times, notified_at, expires_at, created_at")
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: "Bekleme listesi alınamadı" }, { status: 500 });

    return Response.json({ bekleme_listesi: data ?? [] });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
