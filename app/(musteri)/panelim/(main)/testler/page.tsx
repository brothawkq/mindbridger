import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import TestlerKlient, {
  type TestOzet,
  type GecmisSonuc,
} from "@/components/musteri/TestlerKlient";

export const metadata = { title: "Psikolojik Testler | MindBridger" };

export default async function TestlerPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const [{ data: testlerRaw }, { data: sonuclarRaw }] = await Promise.all([
    supabase
      .from("psikolojik_testler")
      .select("id, slug, title, description, estimated_minutes")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("test_sonuclari")
      .select("id, test_id, score, result_label, shared_with_danisan, created_at")
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const testler = testlerRaw ?? [];
  const sonuclar = sonuclarRaw ?? [];

  // Last result per test
  const sonKayitMap = new Map<
    string,
    { result_label: string | null; score: number | null; created_at: string }
  >();
  for (const s of sonuclar) {
    if (!sonKayitMap.has(s.test_id)) {
      sonKayitMap.set(s.test_id, {
        result_label: s.result_label,
        score: s.score,
        created_at: s.created_at,
      });
    }
  }

  const testOzetler: TestOzet[] = testler.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    estimated_minutes: t.estimated_minutes,
    sonKayit: sonKayitMap.get(t.id) ?? null,
  }));

  // Build test title map for past results
  const testTitleMap = new Map(testler.map((t) => [t.id, { title: t.title, slug: t.slug }]));

  const gecmisSonuclar: GecmisSonuc[] = sonuclar.map((s) => ({
    id: s.id,
    test_id: s.test_id,
    test_title: testTitleMap.get(s.test_id)?.title ?? "Bilinmeyen Test",
    test_slug: testTitleMap.get(s.test_id)?.slug ?? "",
    score: s.score,
    result_label: s.result_label,
    shared_with_danisan: s.shared_with_danisan,
    created_at: s.created_at,
  }));

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Psikolojik Testler
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Sonuçlar yalnızca size aittir — paylaşmak istemedikçe danışmanınız göremez
        </span>
      </div>

      <TestlerKlient
        testler={testOzetler}
        gecmisSonuclar={gecmisSonuclar}
      />
    </>
  );
}
