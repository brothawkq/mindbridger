import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const schema = z.object({
  review_reply: z.string().min(1).max(2000),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!danisanRow)
    return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });

  const { data: degerlendirme } = await supabase
    .from("degerlendirmeler")
    .select("danisan_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!degerlendirme)
    return Response.json({ error: "Değerlendirme bulunamadı" }, { status: 404 });
  if (degerlendirme.danisan_id !== danisanRow.id)
    return Response.json({ error: "Yetkisiz" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  const { error } = await supabase
    .from("degerlendirmeler")
    .update({
      review_reply: parsed.data.review_reply,
      reply_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error)
    return Response.json({ error: "Yanıt kaydedilemedi" }, { status: 500 });

  return Response.json({ ok: true });
}
