import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const bodySchema = z.object({
  cancellation_reason: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz veri", detaylar: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();
    if (!danisanRow) return Response.json({ error: "Danışman bulunamadı" }, { status: 404 });

    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, status, danisan_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    if (randevu.danisan_id !== danisanRow.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (randevu.status !== "pending") {
      return Response.json({ error: "Yalnızca bekleyen randevular reddedilebilir" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data: guncellendi, error: updateErr } = await supabase
      .from("randevular")
      .update({
        status: "rejected",
        cancellation_reason: parsed.data.cancellation_reason,
        cancelled_at: now,
        cancelled_by: user.id,
      })
      .eq("id", id)
      .select("id, status, cancellation_reason, cancelled_at")
      .single();

    if (updateErr) return Response.json({ error: "Randevu reddedilemedi" }, { status: 500 });

    return Response.json({ randevu: guncellendi });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
