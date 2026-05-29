import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: sonuclar } = await supabase
    .from("test_sonuclari")
    .select(
      "id, test_id, score, result_label, shared_with_danisan, created_at"
    )
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!sonuclar || sonuclar.length === 0) {
    return NextResponse.json({ sonuclar: [] });
  }

  const testIds = [...new Set(sonuclar.map((s) => s.test_id))];
  const { data: testler } = await supabase
    .from("psikolojik_testler")
    .select("id, title, slug")
    .in("id", testIds);

  const testMap = new Map(
    (testler ?? []).map((t) => [t.id, { title: t.title, slug: t.slug }])
  );

  const zenginSonuclar = sonuclar.map((s) => ({
    id: s.id,
    test_id: s.test_id,
    score: s.score,
    result_label: s.result_label,
    shared_with_danisan: s.shared_with_danisan,
    created_at: s.created_at,
    test_title: testMap.get(s.test_id)?.title ?? "Bilinmeyen Test",
    test_slug: testMap.get(s.test_id)?.slug ?? "",
  }));

  return NextResponse.json({ sonuclar: zenginSonuclar });
}
