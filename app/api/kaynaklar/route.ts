import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  file_url: z.string().url().max(500),
  type: z.enum(["pdf", "video", "link"]),
  category: z.array(z.string()).optional(),
  is_active: z.boolean().optional().default(true),
});

/** GET /api/kaynaklar — public: aktif kaynak listesi */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  let query = supabase
    .from("kaynaklar")
    .select("id, title, description, file_url, type, category, created_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.contains("category", [category]);
  }

  if (type && ["pdf", "video", "link"].includes(type)) {
    query = query.eq("type", type as "pdf" | "video" | "link");
  }

  if (q && q.trim()) {
    const safe = q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ hata: "Kaynaklar yüklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ kaynaklar: data ?? [] });
}

/** POST /api/kaynaklar — admin: yeni kaynak ekle */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ hata: "Eksik veya hatalı alan.", detay: parsed.error.flatten() }, { status: 422 });
  }

  const { title, description, file_url, type, category, is_active } = parsed.data;

  const { data, error } = await supabase
    .from("kaynaklar")
    .insert({
      title,
      description: description ?? null,
      file_url,
      type,
      category: category ?? null,
      is_active,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ hata: "Kaynak eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
