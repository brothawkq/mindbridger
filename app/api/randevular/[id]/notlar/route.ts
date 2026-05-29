import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const schema = z.object({
  notes_private: z.string().max(5000).optional(),
  summary_shared: z.string().max(5000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
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

  const { data: randevu } = await supabase
    .from("randevular")
    .select("danisan_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!randevu)
    return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (randevu.danisan_id !== danisanRow.id)
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

  const updates: { notes_private?: string; summary_shared?: string } = {};
  if (parsed.data.notes_private !== undefined)
    updates.notes_private = parsed.data.notes_private;
  if (parsed.data.summary_shared !== undefined)
    updates.summary_shared = parsed.data.summary_shared;

  if (Object.keys(updates).length === 0)
    return Response.json({ ok: true });

  const { error } = await supabase
    .from("randevular")
    .update(updates)
    .eq("id", id);
  if (error)
    return Response.json({ error: "Notlar kaydedilemedi" }, { status: 500 });

  return Response.json({ ok: true });
}
