import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const postSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatında olmalı"),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { date, reason } = parsed.data;

  // Aynı tarih için aktif izin kaydı var mı?
  const { data: mevcutIzin } = await supabase
    .from("danisan_izin")
    .select("id")
    .eq("danisan_id", danisanRow.id)
    .eq("date", date)
    .is("deleted_at", null)
    .maybeSingle();

  if (mevcutIzin) {
    return Response.json(
      { error: "Bu tarih için zaten izin kaydı mevcut" },
      { status: 409 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("danisan_izin")
      .insert({
        danisan_id: danisanRow.id,
        date,
        reason: reason ?? null,
      })
      .select("id, date, reason")
      .single();

    if (error) {
      return Response.json({ error: "İzin kaydedilemedi" }, { status: 500 });
    }

    return Response.json({ izin: data }, { status: 201 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
