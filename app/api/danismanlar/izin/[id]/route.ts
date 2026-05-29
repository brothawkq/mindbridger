import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "İzin ID gerekli" }, { status: 400 });
  }

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

  // Kaydın bu danışmana ait olduğunu doğrula
  const { data: izin } = await supabase
    .from("danisan_izin")
    .select("id, danisan_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!izin) {
    return Response.json({ error: "İzin kaydı bulunamadı" }, { status: 404 });
  }

  if (izin.danisan_id !== danisanRow.id) {
    return Response.json({ error: "Bu kayda erişim yetkiniz yok" }, { status: 403 });
  }

  try {
    const { error } = await supabase
      .from("danisan_izin")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return Response.json({ error: "İzin silinemedi" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
