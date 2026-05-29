import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import type { Json } from "@/types/supabase";

const yanitSchema = z.object({
  form_id: z.string().uuid(),
  randevu_id: z.string().uuid().optional(),
  answers: z.record(z.string(), z.unknown()),
}).refine((v) => Object.keys(v.answers).length <= 30, { message: "Çok fazla alan", path: ["answers"] });

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = yanitSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
    }

    const { form_id, randevu_id, answers } = parsed.data;
    const answersJson = answers as Json;

    const { data: form } = await supabase
      .from("onboarding_formlar")
      .select("id, danisan_id")
      .eq("id", form_id)
      .is("deleted_at", null)
      .single();

    if (!form) return Response.json({ error: "Form bulunamadı" }, { status: 404 });

    if (randevu_id) {
      const { data: randevu } = await supabase
        .from("randevular")
        .select("id, musteri_id, danisan_id")
        .eq("id", randevu_id)
        .is("deleted_at", null)
        .single();

      if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
      if (randevu.musteri_id !== user.id) return Response.json({ error: "Bu randevu size ait değil" }, { status: 403 });
      if (randevu.danisan_id !== form.danisan_id) return Response.json({ error: "Randevu ve form uyuşmuyor" }, { status: 400 });
    }

    const { data: mevcutYanit } = await supabase
      .from("onboarding_yanitlar")
      .select("id")
      .eq("form_id", form_id)
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (mevcutYanit) {
      const { error } = await supabase
        .from("onboarding_yanitlar")
        .update({ answers: answersJson, updated_at: new Date().toISOString() })
        .eq("id", mevcutYanit.id);

      if (error) return Response.json({ error: "Yanıt güncellenemedi" }, { status: 500 });
      return Response.json({ ok: true, updated: true });
    }

    const { error } = await supabase
      .from("onboarding_yanitlar")
      .insert({ form_id, musteri_id: user.id, randevu_id: randevu_id ?? null, answers: answersJson });

    if (error) return Response.json({ error: "Yanıt kaydedilemedi" }, { status: 500 });

    return Response.json({ ok: true, updated: false }, { status: 201 });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
