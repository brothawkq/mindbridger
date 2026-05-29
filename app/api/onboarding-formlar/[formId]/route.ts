import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import type { Json } from "@/types/supabase";

const soruSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(500),
  type: z.enum(["text", "textarea", "select", "checkbox", "radio", "number", "date"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const guncellemeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  is_default: z.boolean().optional(),
  questions: z.array(soruSchema).max(30).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { formId } = await params;

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  const { data: mevcutForm } = await supabase
    .from("onboarding_formlar")
    .select("id, danisan_id")
    .eq("id", formId)
    .is("deleted_at", null)
    .single();

  if (!mevcutForm) return Response.json({ error: "Form bulunamadı" }, { status: 404 });
  if (mevcutForm.danisan_id !== danisanRow.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = guncellemeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
    }

    const { is_default, title, questions } = parsed.data;

    if (is_default === true) {
      await supabase
        .from("onboarding_formlar")
        .update({ is_default: false })
        .eq("danisan_id", danisanRow.id)
        .is("deleted_at", null);
    }

    const guncelleme: {
      updated_at: string;
      title?: string;
      questions?: Json;
      is_default?: boolean;
    } = { updated_at: new Date().toISOString() };
    if (title !== undefined) guncelleme.title = title;
    if (questions !== undefined) guncelleme.questions = questions as Json;
    if (is_default !== undefined) guncelleme.is_default = is_default;

    const { data: guncellenenForm, error } = await supabase
      .from("onboarding_formlar")
      .update(guncelleme)
      .eq("id", formId)
      .select("id, title, is_default, questions, updated_at")
      .single();

    if (error) return Response.json({ error: "Form güncellenemedi" }, { status: 500 });

    return Response.json({ form: guncellenenForm });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { formId } = await params;

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  const { data: mevcutForm } = await supabase
    .from("onboarding_formlar")
    .select("id, danisan_id, is_default")
    .eq("id", formId)
    .is("deleted_at", null)
    .single();

  if (!mevcutForm) return Response.json({ error: "Form bulunamadı" }, { status: 404 });
  if (mevcutForm.danisan_id !== danisanRow.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
  if (mevcutForm.is_default) {
    return Response.json({ error: "Varsayılan form silinemez. Önce başka bir formu varsayılan yapın." }, { status: 400 });
  }

  const { error } = await supabase
    .from("onboarding_formlar")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", formId);

  if (error) return Response.json({ error: "Form silinemedi" }, { status: 500 });

  return Response.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { formId } = await params;

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  const { data: form } = await supabase
    .from("onboarding_formlar")
    .select("id, title, is_default, questions, created_at")
    .eq("id", formId)
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .single();

  if (!form) return Response.json({ error: "Form bulunamadı" }, { status: 404 });

  const { data: yanitlar } = await supabase
    .from("onboarding_yanitlar")
    .select(`
      id, answers, created_at, randevu_id,
      profiles:musteri_id(first_name, last_name)
    `)
    .eq("form_id", formId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return Response.json({ form, yanitlar: yanitlar ?? [] });
}
