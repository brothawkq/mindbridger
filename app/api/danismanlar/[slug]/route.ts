import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/danismanlar/[slug] ─────────────────────────────────
//
// Public endpoint — kimlik doğrulama gerekmez.
// Yalnızca profile_published=true ve profile_completion_percent=100
// olan danışman profillerini döndürür.
//
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = await createClient();

  // ── 1. Profil ────────────────────────────────────────────────
  const { data: danisan, error } = await supabase
    .from("danisanlar")
    .select(
      `
      id,
      slug,
      bio,
      title,
      approach,
      specialties,
      age_groups,
      languages,
      gender,
      city,
      district,
      is_online,
      is_in_person,
      is_supervisor,
      intro_session_enabled,
      intro_session_duration,
      session_duration,
      buffer_minutes,
      price_individual,
      price_group,
      price_async,
      sliding_scale,
      sliding_scale_price,
      average_rating,
      total_reviews,
      total_sessions,
      profiles!danisanlar_profile_id_fkey (
        first_name,
        last_name,
        avatar_url
      )
      `,
    )
    .eq("slug", slug)
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null)
    .single();

  if (error || !danisan) {
    return NextResponse.json(
      { error: "Danışman bulunamadı." },
      { status: 404 },
    );
  }

  // ── 2. Aktif paketler ─────────────────────────────────────────
  const { data: paketler, error: paketlerError } = await supabase
    .from("danisan_paketler")
    .select("id, name, session_count, price, discount_percent, validity_days")
    .eq("danisan_id", danisan.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price", { ascending: true });

  if (paketlerError) {
    console.error("[danismanlar/slug] paket hatası:", paketlerError.message);
  }

  // ── 3. Görünür değerlendirmeler (son 10) ──────────────────────
  const { data: degerlendirmeler, error: degError } = await supabase
    .from("degerlendirmeler")
    .select("id, rating, comment, review_reply, reply_at, created_at")
    .eq("danisan_id", danisan.id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (degError) {
    console.error("[danismanlar/slug] değerlendirme hatası:", degError.message);
  }

  return NextResponse.json(
    {
      danisan,
      paketler:         paketler         ?? [],
      degerlendirmeler: degerlendirmeler ?? [],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
