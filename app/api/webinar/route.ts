import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const olusturSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).nullable().optional(),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480),
  price: z.number().min(0),
  capacity: z.number().int().min(1).max(10000),
  cover_image_url: z.string().url().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const mod = searchParams.get("mod"); // "danisan" → kendi webinarları

    if (mod === "danisan") {
      const user = await requireRole(supabase, ["danisan", "admin"]);
      if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

      const { data } = await supabase
        .from("webinarlar")
        .select("id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, status, cover_image_url, platform_commission_rate")
        .eq("host_id", user.id)
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false });

      return Response.json({ webinarlar: data ?? [] });
    }

    // Public: yalnızca yayındaki webinarlar
    const simdi = new Date().toISOString();
    const { data: webinarlar } = await supabase
      .from("webinarlar")
      .select("id, host_id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, status, cover_image_url")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: true });

    if (!webinarlar || webinarlar.length === 0) {
      return Response.json({ webinarlar: [] });
    }

    // Host (danışman) bilgilerini ayrı sorgula
    const hostIds = [...new Set(webinarlar.map((w) => w.host_id))];
    const { data: hostlar } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", hostIds);

    const hostMap = new Map(
      (hostlar ?? []).map((h) => [
        h.id,
        { isim: `${h.first_name ?? ""} ${h.last_name ?? ""}`.trim() || "(adsız)", avatar_url: h.avatar_url ?? null },
      ])
    );

    const sonuc = webinarlar.map((w) => ({
      ...w,
      hostIsim: hostMap.get(w.host_id)?.isim ?? "(adsız)",
      hostAvatar: hostMap.get(w.host_id)?.avatar_url ?? null,
      dolulukYuzde: w.capacity > 0 ? Math.round((w.registered_count / w.capacity) * 100) : 0,
      yaklasiyor: new Date(w.scheduled_at).getTime() > Date.now(),
    }));

    return Response.json({ webinarlar: sonuc });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireRole(supabase, ["danisan", "admin"]);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const body = await req.json();
    const parsed = olusturSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Geçersiz veri", details: parsed.error.issues }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("webinarlar")
      .insert({
        host_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        scheduled_at: parsed.data.scheduled_at,
        duration_minutes: parsed.data.duration_minutes,
        price: parsed.data.price,
        capacity: parsed.data.capacity,
        cover_image_url: parsed.data.cover_image_url ?? null,
        status: "draft",
        registered_count: 0,
        platform_commission_rate: 20,
      })
      .select("id")
      .single();

    if (error) throw error;

    return Response.json({ id: data.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Webinar oluşturulamadı" }, { status: 500 });
  }
}
