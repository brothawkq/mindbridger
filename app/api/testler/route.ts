import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/testler — public: aktif psikolojik test listesi */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("psikolojik_testler")
    .select("id, title, slug, description, estimated_minutes, is_active")
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ hata: "Testler yüklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ testler: data ?? [] });
}
