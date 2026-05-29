import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const soruSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(500),
  type: z.enum(["text", "textarea", "select", "checkbox", "radio", "number", "date"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu").max(200),
  is_default: z.boolean().optional(),
  questions: z.array(soruSchema).max(30),
});

export async function GET() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  const { data: formlar, error } = await supabase
    .from("onboarding_formlar")
    .select(`
      id, title, is_default, questions, created_at, updated_at,
      onboarding_yanitlar(count)
    `)
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: "Formlar yüklenemedi" }, { status: 500 });

  return Response.json({ formlar: formlar ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
    }

    const { title, is_default, questions } = parsed.data;

    if (is_default) {
      await supabase
        .from("onboarding_formlar")
        .update({ is_default: false })
        .eq("danisan_id", danisanRow.id)
        .is("deleted_at", null);
    }

    const { data: yeniForm, error } = await supabase
      .from("onboarding_formlar")
      .insert({ danisan_id: danisanRow.id, title, is_default: is_default ?? false, questions })
      .select("id, title, is_default, questions, created_at")
      .single();

    if (error) return Response.json({ error: "Form oluşturulamadı" }, { status: 500 });

    return Response.json({ form: yeniForm }, { status: 201 });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
