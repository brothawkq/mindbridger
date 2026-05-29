import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { odaOlustur } from "@/lib/dailyco/oda";
import { turkceHataMesaji } from "@/lib/dailyco/fallback";
import type { Database } from "@/types/supabase";

type SessionType = Database["public"]["Enums"]["session_type"];

const bodySchema = z.object({
  randevu_id: z.string().uuid(),
});

// Seans süresi dakikası — bitişi hesaplamak için randevu tablosundan okunur
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  // Yalnızca admin veya server-side cron tetikleyebilir
  const user = await requireRole(supabase, ["admin"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { randevu_id } = parsed.data;

  try {
    const { data: randevu } = await supabase
      .from("randevular")
      .select(
        "id, session_type, scheduled_at, duration_minutes, daily_room_name, status",
      )
      .eq("id", randevu_id)
      .is("deleted_at", null)
      .single();

    if (!randevu) {
      return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    }

    if (!["confirmed", "pending"].includes(randevu.status)) {
      return Response.json(
        { error: "Bu randevu için oda oluşturulamaz" },
        { status: 409 },
      );
    }

    // Oda zaten varsa mevcut adı döndür
    if (randevu.daily_room_name) {
      return Response.json({ oda_adi: randevu.daily_room_name });
    }

    const baslangic = new Date(randevu.scheduled_at);
    const sure = randevu.duration_minutes ?? 50;
    const bitisSaniye = Math.floor(
      (baslangic.getTime() + sure * 60 * 1000) / 1000,
    );

    const oda = await odaOlustur(
      randevu_id,
      randevu.session_type as SessionType,
      bitisSaniye,
    );

    // Oda adını randevu kaydına yaz
    await supabase
      .from("randevular")
      .update({ daily_room_name: oda.name })
      .eq("id", randevu_id);

    return Response.json({ oda_adi: oda.name, oda_url: oda.url });
  } catch (err) {
    return Response.json(
      { error: turkceHataMesaji(err) },
      { status: 502 },
    );
  }
}
