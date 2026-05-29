import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import TestAlKlient, { type TestSoru } from "@/components/musteri/TestAlKlient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("psikolojik_testler")
    .select("title")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return { title: data ? `${data.title} | MindBridger` : "Test | MindBridger" };
}

function parsesorular(raw: unknown): TestSoru[] {
  if (!Array.isArray(raw)) return [];
  const sorular: TestSoru[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "string" &&
      typeof (item as { text?: unknown }).text === "string" &&
      Array.isArray((item as { options?: unknown }).options)
    ) {
      const soru = item as {
        id: string;
        text: string;
        options: unknown[];
      };
      const options: { value: number; label: string }[] = [];
      for (const opt of soru.options) {
        if (
          opt &&
          typeof opt === "object" &&
          typeof (opt as { value?: unknown }).value === "number" &&
          typeof (opt as { label?: unknown }).label === "string"
        ) {
          const o = opt as { value: number; label: string };
          options.push({ value: o.value, label: o.label });
        }
      }
      sorular.push({ id: soru.id, text: soru.text, options });
    }
  }
  return sorular;
}

export default async function TestDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: test } = await supabase
    .from("psikolojik_testler")
    .select(
      "id, title, description, estimated_minutes, questions"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!test) notFound();

  const sorular = parsesorular(test.questions);

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <a
          href="/panelim/testler"
          className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white transition-colors"
        >
          ← Testler
        </a>
        <span className="text-[#E0E0E0]">/</span>
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap truncate max-w-[200px]">
          {test.title}
        </span>
        {test.estimated_minutes && (
          <span className="text-[10px] font-semibold border-[1.5px] border-[#BDBDBD] px-[7px] py-[1px] text-[#4A4D4A] whitespace-nowrap">
            ~{test.estimated_minutes} dk
          </span>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        <TestAlKlient
          testId={test.id}
          title={test.title}
          description={test.description}
          estimatedMinutes={test.estimated_minutes}
          sorular={sorular}
        />
      </div>
    </>
  );
}
