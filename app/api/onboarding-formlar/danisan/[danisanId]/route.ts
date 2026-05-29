import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ danisanId: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { danisanId } = await params;

  const { data: formlar } = await supabase
    .from("onboarding_formlar")
    .select("id, title, questions, is_default")
    .eq("danisan_id", danisanId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false });

  if (!formlar || formlar.length === 0) {
    return Response.json({ formlar: [] });
  }

  const formIds = formlar.map((f) => f.id);
  const { data: mevcutYanitlar } = await supabase
    .from("onboarding_yanitlar")
    .select("form_id")
    .in("form_id", formIds)
    .eq("musteri_id", user.id)
    .is("deleted_at", null);

  const doldurulmusIds = new Set((mevcutYanitlar ?? []).map((y) => y.form_id));

  return Response.json({
    formlar: formlar.map((f) => ({ ...f, doldurulmus: doldurulmusIds.has(f.id) })),
  });
}
