import "server-only";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { rozetKontrolVeVer } from "@/lib/gamification/rozet";

const PostSchema = z.object({
  test_id: z.string().uuid(),
  answers: z.record(z.string(), z.number()),
  shared_with_danisan: z.boolean().default(false),
});

type ScoringLogic = { type: "sum" | "average" };
type ResultRange = {
  min: number;
  max: number;
  label: string;
  description?: string;
  recommendation?: string;
};

function hesaplaSkoru(
  answers: Record<string, number>,
  logic: ScoringLogic
): number {
  const values = Object.values(answers);
  if (values.length === 0) return 0;
  const toplam = values.reduce((a, b) => a + b, 0);
  if (logic.type === "average") {
    return Math.round((toplam / values.length) * 10) / 10;
  }
  return toplam;
}

function sonucBul(score: number, ranges: ResultRange[]): ResultRange | null {
  return ranges.find((r) => score >= r.min && score <= r.max) ?? null;
}

function parseScoringLogic(raw: unknown): ScoringLogic {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    ((raw as { type?: unknown }).type === "sum" ||
      (raw as { type?: unknown }).type === "average")
  ) {
    return { type: (raw as { type: "sum" | "average" }).type };
  }
  return { type: "sum" };
}

function parseResultRanges(raw: unknown): ResultRange[] {
  if (!Array.isArray(raw)) return [];
  const ranges: ResultRange[] = [];
  for (const r of raw) {
    if (
      r &&
      typeof r === "object" &&
      typeof (r as { min?: unknown }).min === "number" &&
      typeof (r as { max?: unknown }).max === "number" &&
      typeof (r as { label?: unknown }).label === "string"
    ) {
      const row = r as {
        min: number;
        max: number;
        label: string;
        description?: unknown;
        recommendation?: unknown;
      };
      ranges.push({
        min: row.min,
        max: row.max,
        label: row.label,
        description:
          typeof row.description === "string" ? row.description : undefined,
        recommendation:
          typeof row.recommendation === "string"
            ? row.recommendation
            : undefined,
      });
    }
  }
  return ranges;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 422 });
  }

  const { test_id, answers, shared_with_danisan } = parsed.data;

  const { data: test } = await supabase
    .from("psikolojik_testler")
    .select("id, scoring_logic, result_ranges")
    .eq("id", test_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!test) {
    return NextResponse.json({ error: "Test bulunamadı" }, { status: 404 });
  }

  const scoringLogic = parseScoringLogic(test.scoring_logic);
  const resultRanges = parseResultRanges(test.result_ranges);

  const score = hesaplaSkoru(answers, scoringLogic);
  const sonuc = sonucBul(score, resultRanges);

  const { data: kayit, error } = await supabase
    .from("test_sonuclari")
    .insert({
      musteri_id: user.id,
      test_id,
      answers,
      score,
      result_label: sonuc?.label ?? null,
      shared_with_danisan,
    })
    .select()
    .single();

  if (error || !kayit) {
    return NextResponse.json(
      { error: "Sonuç kaydedilemedi" },
      { status: 500 }
    );
  }

  // Rozet tetikleyici: toplam tamamlanan test sayısı (fire-and-forget)
  void (async () => {
    try {
      const { count } = await supabase
        .from("test_sonuclari")
        .select("id", { count: "exact", head: true })
        .eq("musteri_id", user.id)
        .is("deleted_at", null);
      await rozetKontrolVeVer(user.id, "test_count", count ?? 1);
    } catch {
      // Rozet hatası yanıtı etkilemez
    }
  })();

  return NextResponse.json({
    kayit,
    sonuc: {
      score,
      label: sonuc?.label ?? null,
      description: sonuc?.description ?? null,
      recommendation: sonuc?.recommendation ?? null,
    },
  });
}
