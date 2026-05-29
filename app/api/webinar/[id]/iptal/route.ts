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
      .select("host_id, status")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!webinar) return Response.json({ error: "Webinar bulunamadı" }, { status: 404 });
    if (webinar.host_id !== user.id) return Response.json({ error: "Yetkisiz" }, { status: 403 });
    if (webinar.status === "cancelled" || webinar.status === "completed") {
      return Response.json({ error: "Bu webinar zaten iptal edilmiş veya tamamlanmış" }, { status: 400 });
    }

    const { error } = await supabase
      .from("webinarlar")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    // Kayıtlı katılımcıları iptal et
    await supabase
      .from("webinar_kayitlar")
      .update({ status: "cancelled" })
      .eq("webinar_id", id)
      .eq("status", "registered");

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "İptal başarısız" }, { status: 500 });
  }
}
