import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { rozetKontrolVeVer } from "@/lib/gamification/rozet";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

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
      .select("id, status, danisan_id, musteri_id, scheduled_at, duration_minutes")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    if (randevu.danisan_id !== danisanRow.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (randevu.status !== "confirmed") {
      return Response.json({ error: "Yalnızca onaylanmış randevular tamamlanabilir" }, { status: 409 });
    }

    // Randevu bitişinden önce tamamlama engeli
    const bitisDakikasi = new Date(randevu.scheduled_at).getTime() + randevu.duration_minutes * 60 * 1000;
    if (Date.now() < bitisDakikasi) {
      return Response.json({ error: "Randevu henüz tamamlanmadı" }, { status: 409 });
    }

    const { data: guncellendi, error: updateErr } = await supabase
      .from("randevular")
      .update({ status: "completed" })
      .eq("id", id)
      .select("id, status, scheduled_at")
      .single();

    if (updateErr) return Response.json({ error: "Randevu tamamlanamadı" }, { status: 500 });

    // Rozet tetikleyici: müşterinin toplam tamamlanan seans sayısı (fire-and-forget)
    if (randevu.musteri_id) {
      const musteriId = String(randevu.musteri_id);
      void (async () => {
        try {
          const { count } = await supabase
            .from("randevular")
            .select("id", { count: "exact", head: true })
            .eq("musteri_id", musteriId)
            .eq("status", "completed")
            .is("deleted_at", null);
          await rozetKontrolVeVer(musteriId, "session_count", count ?? 1);
        } catch {
          // Rozet hatası yanıtı etkilemez
        }
      })();
    }

    return Response.json({ randevu: guncellendi });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
