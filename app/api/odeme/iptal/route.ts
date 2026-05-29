import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import iyzipay from "@/lib/iyzico/client";
import { iadeHesapla } from "@/lib/iyzico/iade";

const bodySchema = z.object({
  payment_id: z.string().uuid(),
  sebep: z.enum(["cancelled_by_musteri", "cancelled_by_danisan", "admin_override"]).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan", "admin"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { payment_id } = parsed.data;

  try {
    const { data: odeme } = await supabase
      .from("payments")
      .select("id, status, amount_gross, iyzico_payment_id, randevu_id, musteri_id, danisan_id")
      .eq("id", payment_id)
      .is("deleted_at", null)
      .single();

    if (!odeme) {
      return Response.json({ error: "Ödeme bulunamadı" }, { status: 404 });
    }

    // Sahiplik kontrolü
    if (user.role === "musteri" && odeme.musteri_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow || odeme.danisan_id !== danisanRow.id) {
        return Response.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }

    if (odeme.status === "refunded") {
      return Response.json({ error: "Bu ödeme zaten iade edilmiş" }, { status: 409 });
    }
    if (!["authorized", "captured"].includes(odeme.status)) {
      return Response.json({ error: "İade edilebilir ödeme bulunamadı" }, { status: 400 });
    }

    const { data: randevu } = await supabase
      .from("randevular")
      .select("scheduled_at, status")
      .eq("id", odeme.randevu_id)
      .single();

    if (!randevu) {
      return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    }

    const iade = await iadeHesapla(odeme.amount_gross, randevu.scheduled_at, supabase);

    const sebep =
      parsed.data.sebep ??
      (user.role === "admin"
        ? "admin_override"
        : user.role === "danisan"
          ? "cancelled_by_danisan"
          : "cancelled_by_musteri");

    let iyzicoIadeId: string | null = null;

    if (iade.iadeTutar > 0 && odeme.iyzico_payment_id) {
      const iadeIstegi = {
        locale: "tr",
        conversationId: odeme.randevu_id,
        paymentTransactionId: odeme.iyzico_payment_id,
        price: iade.iadeTutar.toFixed(2),
        currency: "TRY",
        ip: "127.0.0.1",
      };

      const iadesonuc = await new Promise<{
        status: string;
        errorMessage?: string;
        paymentTransactionId?: string;
      }>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (iyzipay.refund as any).create(iadeIstegi, (err: unknown, result: unknown) => {
          if (err) reject(err);
          else resolve(result as typeof iadesonuc);
        });
      });

      if (iadesonuc.status !== "success") {
        return Response.json(
          { error: iadesonuc.errorMessage ?? "İade işlemi başarısız" },
          { status: 502 },
        );
      }
      iyzicoIadeId = iadesonuc.paymentTransactionId ?? null;
    }

    const simdi = new Date().toISOString();

    const [refundSonuc] = await Promise.all([
      supabase.from("refunds").insert({
        payment_id: odeme.id,
        randevu_id: odeme.randevu_id,
        amount: iade.iadeTutar,
        reason: sebep,
        refund_percent: iade.iadeOrani,
        iyzico_refund_id: iyzicoIadeId,
        status: iade.iadeTutar > 0 ? "completed" : "pending",
        initiated_by: user.id,
      }),
      supabase.from("payments").update({ status: "refunded" }).eq("id", odeme.id),
      supabase
        .from("randevular")
        .update({ status: "cancelled", cancellation_reason: sebep, cancelled_at: simdi })
        .eq("id", odeme.randevu_id),
    ]);

    // DEN-15: 23505 = unique_violation — eşzamanlı istek bu ödemeyi zaten iptal etti
    if (refundSonuc.error) {
      if ((refundSonuc.error as { code?: string }).code === "23505") {
        return Response.json({ error: "Bu ödeme zaten iptal edilmiş" }, { status: 409 });
      }
      return Response.json({ error: "İade kaydı oluşturulamadı" }, { status: 500 });
    }

    return Response.json({
      basarili: true,
      iade_tutari: iade.iadeTutar,
      iade_orani: iade.iadeOrani,
      politika: iade.politika,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
