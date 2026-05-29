import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import iyzipay from "@/lib/iyzico/client";
import { decrypt } from "@/lib/auth/encrypt";

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { token } = parsed.data;

  try {
    // Token ile ödeme kaydını bul (şifrelenmiş token karşılaştırması yapılamaz; iyzico'dan doğrula)
    const sonuc = await new Promise<{
      status: string;
      errorMessage?: string;
      paymentStatus?: string;
      paymentId?: string;
      conversationId?: string;
    }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (iyzipay.checkoutForm as any).retrieve(
        { locale: "tr", token },
        (err: unknown, result: unknown) => {
          if (err) reject(err);
          else resolve(result as typeof sonuc);
        },
      );
    });

    if (sonuc.status !== "success" || sonuc.paymentStatus !== "SUCCESS") {
      return Response.json(
        { error: sonuc.errorMessage ?? "Ödeme doğrulanamadı" },
        { status: 402 },
      );
    }

    const randevuId = sonuc.conversationId;
    if (!randevuId) {
      return Response.json({ error: "Randevu bilgisi eksik" }, { status: 400 });
    }

    // Ödeme kaydını bul
    const { data: odeme } = await supabase
      .from("payments")
      .select("id, status, iyzico_token, randevu_id, musteri_id")
      .eq("randevu_id", randevuId)
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!odeme) {
      return Response.json({ error: "Ödeme kaydı bulunamadı" }, { status: 404 });
    }

    // Token doğrula
    const kayitliToken = odeme.iyzico_token ? decrypt(odeme.iyzico_token) : null;
    if (kayitliToken !== token) {
      return Response.json({ error: "Token eşleşmiyor" }, { status: 403 });
    }

    if (odeme.status === "captured") {
      return Response.json({ error: "Ödeme zaten onaylanmış" }, { status: 409 });
    }

    const simdi = new Date().toISOString();

    // Ödeme ve randevu durumlarını güncelle
    const [odemeGuncelle, randevuGuncelle] = await Promise.all([
      supabase
        .from("payments")
        .update({
          status: "captured",
          iyzico_payment_id: sonuc.paymentId ?? null,
          paid_at: simdi,
          payment_method: "checkout_form",
        })
        .eq("id", odeme.id),
      supabase
        .from("randevular")
        .update({ status: "confirmed" })
        .eq("id", randevuId)
        .eq("status", "pending"),
    ]);

    if (odemeGuncelle.error || randevuGuncelle.error) {
      return Response.json({ error: "Güncelleme hatası" }, { status: 500 });
    }

    // Fatura oluştur — hata olsa ödeme zaten kaydedildi
    try {
      const { faturaOlustur } = await import("@/lib/fatura/olustur");
      await faturaOlustur(randevuId, supabase);
    } catch {
      // Kritik değil: admin paneli veya /api/fatura/olustur/[randevuId] ile tekrar oluşturulabilir
    }

    return Response.json({
      basarili: true,
      payment_id: odeme.id,
      randevu_id: randevuId,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
