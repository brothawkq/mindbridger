import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const bodySchema = z.object({
  cancellation_reason: z.string().min(1).max(500).optional(),
});

async function iptalPolitikasiniAl(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("platform_ayarlari")
    .select("key, value")
    .in("key", [
      "cancel_full_refund_hours",
      "cancel_partial_refund_hours",
      "cancel_partial_refund_percent",
    ])
    .is("deleted_at", null);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, Number(r.value)]));
  return {
    tamIadeEsiği: map["cancel_full_refund_hours"] ?? 24,
    kismiIadeEsiği: map["cancel_partial_refund_hours"] ?? 2,
    kismiIadeYüzdesi: map["cancel_partial_refund_percent"] ?? 50,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan", "admin"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

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
    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, status, danisan_id, musteri_id, scheduled_at, price")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });

    if (!["pending", "confirmed"].includes(randevu.status)) {
      return Response.json({ error: "Bu randevu iptal edilemez" }, { status: 409 });
    }

    // Rol bazlı sahiplik kontrolü
    if (user.role === "musteri") {
      if (randevu.musteri_id !== user.id) {
        return Response.json({ error: "Yetkisiz" }, { status: 403 });
      }
    } else if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow || randevu.danisan_id !== danisanRow.id) {
        return Response.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }
    // admin: her randevuyu iptal edebilir

    // İade hesabı (Faz 4'te ödeme entegrasyonu ile uygulanacak)
    const politika = await iptalPolitikasiniAl(supabase);
    const saatFarki =
      (new Date(randevu.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);

    let iadeTutari = 0;
    let iadeYuzdesi = 0;
    if (saatFarki >= politika.tamIadeEsiği) {
      iadeTutari = randevu.price;
      iadeYuzdesi = 100;
    } else if (saatFarki >= politika.kismiIadeEsiği) {
      iadeYuzdesi = politika.kismiIadeYüzdesi;
      iadeTutari = Math.round(randevu.price * iadeYuzdesi / 100);
    }

    const now = new Date().toISOString();
    const { data: guncellendi, error: updateErr } = await supabase
      .from("randevular")
      .update({
        status: "cancelled",
        cancellation_reason: parsed.data.cancellation_reason ?? null,
        cancelled_at: now,
        cancelled_by: user.id,
      })
      .eq("id", id)
      .select("id, status, cancellation_reason, cancelled_at")
      .single();

    if (updateErr) return Response.json({ error: "Randevu iptal edilemedi" }, { status: 500 });

    return Response.json({
      randevu: guncellendi,
      iade: {
        tutar: iadeTutari,
        yuzde: iadeYuzdesi,
        not: "İade Faz 4 ödeme entegrasyonu ile işlenecektir.",
      },
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
