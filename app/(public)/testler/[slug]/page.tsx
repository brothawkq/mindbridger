import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import PublikTestAlKlient from "@/components/public/PublikTestAlKlient";
import {
  parsesorular,
  parseScoringLogic,
  parseResultRanges,
} from "@/lib/testler/scoring";

type Params = { params: Promise<{ slug: string }> };

async function getTest(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psikolojik_testler")
    .select(
      "id, title, slug, description, estimated_minutes, questions, scoring_logic, result_ranges"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTest(slug);
  if (!test) return { title: "Test Bulunamadı | MindBridger" };

  return {
    title: `${test.title} | MindBridger`,
    description: test.description ?? `${test.title} psikolojik testi.`,
  };
}

export default async function TestDetayPage({ params }: Params) {
  const { slug } = await params;
  const test = await getTest(slug);
  if (!test) notFound();

  const sorular = parsesorular(test.questions);
  const scoringLogic = parseScoringLogic(test.scoring_logic);
  const resultRanges = parseResultRanges(test.result_ranges);

  return (
    <div className="min-h-screen bg-[#F5F7F5] dark:bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-[#BDBDBD] mb-6">
          <Link href="/" className="hover:text-[#325343] dark:hover:text-white transition-colors">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/testler" className="hover:text-[#325343] dark:hover:text-white transition-colors">
            Testler
          </Link>
          <span>/</span>
          <span className="text-[#BDBDBD] truncate max-w-[200px]">{test.title}</span>
        </div>

        <PublikTestAlKlient
          testId={test.id}
          title={test.title}
          description={test.description}
          estimatedMinutes={test.estimated_minutes}
          sorular={sorular}
          scoringLogic={scoringLogic}
          resultRanges={resultRanges}
        />
      </div>
    </div>
  );
}
