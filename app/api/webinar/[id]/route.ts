import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

interface Params { params: Promise<{ id: string }> }

const guncelleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  scheduled_at: z.string().datetime().optional(),
  duration_minutes: z.number().int().min(15).max(480).optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().min(1).optional(),
  cover_image_url: z.string().url().nullable().optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: webinar, error } = await supabase
      .from("webinarlar")
      .select("id, host_id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, status, cover_image_url, platform_commission_rate, daily_room_name")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !webinar) {
      return Response.json({ error: "Webinar bulunamadı" }, { status: 404 });
    }

    // Yalnızca yayında olanlar public erişilebilir; diğerleri host/admin gerektirir
    if (webinar.status !== "published") {
      const supabaseAuth = await createClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user || (user.id !== webinar.host_id)) {
        const { data: profile } = await supabaseAuth.from("profiles").select("role").eq("id", user?.id ?? "").single();
        if (profile?.role !== "admin") {
          return Response.json({ error: "Bu webinar yayında değil" }, { status: 403 });
        }
      }
    }

    // Host profil bilgisi
    const { data: hostProfil } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", webinar.host_id)
      .single();

    return Response.json({
      ...webinar,
      hostIsim: `${hostProfil?.first_name ?? ""} ${hostProfil?.last_name ?? ""}`.trim() || "(adsız)",
      hostAvatar: hostProfil?.avatar_url ?? null,
      dolulukYuzde: webinar.capacity > 0 ? Math.round((webinar.registered_count / webinar.capacity) * 100) : 0,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
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
      return Response.json({ error: "Tamamlanmış veya iptal edilmiş webinar güncellenemez" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = guncelleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Geçersiz veri", details: parsed.error.issues }, { status: 400 });
    }

    const { error } = await supabase
      .from("webinarlar")
      .update({
        updated_at: new Date().toISOString(),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.scheduled_at !== undefined ? { scheduled_at: parsed.data.scheduled_at } : {}),
        ...(parsed.data.duration_minutes !== undefined ? { duration_minutes: parsed.data.duration_minutes } : {}),
        ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
        ...(parsed.data.capacity !== undefined ? { capacity: parsed.data.capacity } : {}),
        ...(parsed.data.cover_image_url !== undefined ? { cover_image_url: parsed.data.cover_image_url } : {}),
      })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
