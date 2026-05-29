import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { rozetKontrolVeVer } from "@/lib/gamification/rozet";

const tamamlaSchema = z.object({
  musteri_note: z.string().max(1000).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const { data: odev } = await supabase
    .from("odevler")
    .select("id, musteri_id, status, danisan_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!odev) return Response.json({ error: "Ödev bulunamadı" }, { status: 404 });
  if (odev.musteri_id !== user.id) return Response.json({ error: "Bu ödev size ait değil" }, { status: 403 });
  if (odev.status === "completed") return Response.json({ error: "Ödev zaten tamamlandı" }, { status: 400 });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = tamamlaSchema.safeParse(body);
    const musteri_note = parsed.success ? parsed.data.musteri_note : undefined;

    const { data: guncellenenOdev, error } = await supabase
      .from("odevler")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        musteri_note: musteri_note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status, completed_at, musteri_note")
      .single();

    if (error) return Response.json({ error: "Ödev tamamlanamadı" }, { status: 500 });

    await supabase.from("bildirimler").insert({
      user_id: odev.danisan_id,
      type: "odev_tamamlandi",
      title: "Ödev Tamamlandı",
      body: "Bir müşteriniz ödevini tamamladı.",
      data: { odev_id: id },
      channel: "app",
      delivery_status: "pending",
    }).then(
      () => null,
      () => null
    );

    // Rozet tetikleyici: toplam tamamlanan ödev sayısı (fire-and-forget)
    void (async () => {
      try {
        const { count } = await supabase
          .from("odevler")
          .select("id", { count: "exact", head: true })
          .eq("musteri_id", user.id)
          .eq("status", "completed")
          .is("deleted_at", null);
        await rozetKontrolVeVer(user.id, "assignment_count", count ?? 1);
      } catch {
        // Rozet hatası yanıtı etkilemez
      }
    })();

    return Response.json({ odev: guncellenenOdev });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
