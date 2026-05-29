import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

interface Params { params: Promise<{ id: string }> }

export async function PUT(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await requireRole(supabase, ["danisan", "admin"]);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const { data: webinar } = await supabase
      .from("webinarlar")
      .select("host_id, status, scheduled_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!webinar) return Response.json({ error: "Webinar bulunamadı" }, { status: 404 });
    if (webinar.host_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (webinar.status !== "draft") {
      return Response.json({ error: "Yalnızca taslak webinarlar yayınlanabilir" }, { status: 400 });
    }

    // Geçmiş tarihli webinar yayınlanamaz
    if (new Date(webinar.scheduled_at).getTime() < Date.now()) {
      return Response.json({ error: "Geçmiş tarihli webinar yayınlanamaz" }, { status: 400 });
    }

    const { error } = await supabase
      .from("webinarlar")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Yayınlama başarısız" }, { status: 500 });
  }
}
