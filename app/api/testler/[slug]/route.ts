import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsesorular, parseScoringLogic, parseResultRanges } from "@/lib/testler/scoring";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/testler/[slug] — public: test detayı + sorular */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: test, error } = await supabase
    .from("psikolojik_testler")
    .select(
      "id, title, slug, description, estimated_minutes, questions, scoring_logic, result_ranges"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !test) {
    return NextResponse.json({ hata: "Test bulunamadı." }, { status: 404 });
  }

  const sorular = parsesorular(test.questions);
  const scoringLogic = parseScoringLogic(test.scoring_logic);
  const resultRanges = parseResultRanges(test.result_ranges);

  return NextResponse.json({
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      description: test.description,
      estimated_minutes: test.estimated_minutes,
    },
    sorular,
    scoringLogic,
    resultRanges,
  });
}
