import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type GenderType = Database["public"]["Enums"]["gender_type"];

// ─── Validation ───────────────────────────────────────────────────

const BodySchema = z.object({
  uzmanliklar: z.array(z.string().max(100)).max(10).default([]),
  online:      z.boolean().nullable().default(null),
  yuz_yuze:    z.boolean().nullable().default(null),
  max_fiyat:   z.number().min(0).max(100_000).nullable().default(null),
  cinsiyet:    z.enum(["kadin", "erkek"]).nullable().default(null),
  dil:         z.string().max(50).nullable().default(null),
});

// ─── Response type ────────────────────────────────────────────────

interface OneriDanisanRow {
  id: string;
  slug: string;
  title: string | null;
  specialties: string[] | null;
  city: string | null;
  is_online: boolean;
  is_in_person: boolean;
  intro_session_enabled: boolean;
  price_individual: number | null;
  sliding_scale: boolean;
  sliding_scale_price: number | null;
  average_rating: number;
  total_reviews: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── POST /api/chatbot/oneri ──────────────────────────────────────
//
// Chatbot akışından toplanan tercihlere göre Supabase'i sorgular,
// en iyi 3 danışmanı döndürür. Public endpoint.
//
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { uzmanliklar, online, yuz_yuze, max_fiyat, cinsiyet, dil } = parsed.data;

  const supabase = await createClient();

  let query = supabase
    .from("danisanlar")
    .select(
      `
      id, slug, title, specialties, city,
      is_online, is_in_person, intro_session_enabled,
      price_individual, sliding_scale, sliding_scale_price,
      average_rating, total_reviews,
      profiles!danisanlar_profile_id_fkey (
        first_name, last_name, avatar_url
      )
      `,
    )
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null);

  if (uzmanliklar.length > 0) {
    query = query.overlaps("specialties", uzmanliklar);
  }
  if (online === true)    query = query.eq("is_online",    true);
  if (yuz_yuze === true)  query = query.eq("is_in_person", true);
  if (max_fiyat !== null) query = query.lte("price_individual", max_fiyat);
  if (cinsiyet)           query = query.eq("gender", cinsiyet as GenderType);
  if (dil)                query = query.overlaps("languages", [dil]);

  const { data, error } = await query
    .order("average_rating", { ascending: false })
    .order("total_reviews",  { ascending: false })
    .limit(3);

  if (error) {
    console.error("[chatbot/oneri]", error.message);
    return NextResponse.json({ error: "Öneri alınamadı." }, { status: 500 });
  }

  const danismanlar = (data ?? []) as unknown as OneriDanisanRow[];
  return NextResponse.json({ danismanlar }, { status: 200 });
}
