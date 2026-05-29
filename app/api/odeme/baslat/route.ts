import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import iyzipay from "@/lib/iyzico/client";
import { komisyonHesapla } from "@/lib/iyzico/komisyon";
import { encrypt } from "@/lib/auth/encrypt";

const bodySchema = z.object({
  randevu_id: z.string().uuid(),
  callback_url: z.string().url(),
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
  const { randevu_id, callback_url } = parsed.data;

  // DEN-16: callback_url yalnızca kendi platformumuzun domaini olabilir.
  // Dışarıdan URL kabul etmek iyzico tokenını 3. tarafa sızdırabilir.
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl || !callback_url.startsWith(appUrl)) {
    return Response.json({ error: "Geçersiz callback adresi" }, { status: 400 });
  }

  try {
    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, status, price, session_type, musteri_id, danisan_id, scheduled_at")
      .eq("id", randevu_id)
      .eq("musteri_id", user.id)
      .eq("status", "pending")
      .is("deleted_at", null)
      .single();

    if (!randevu) {
      return Response.json({ error: "Randevu bulunamadı veya ödeme başlatılamaz" }, { status: 404 });
    }

    // Zaten ödeme kaydı var mı?
    const { data: mevcutOdeme } = await supabase
      .from("payments")
      .select("id, status")
      .eq("randevu_id", randevu_id)
      .is("deleted_at", null)
      .single();

    if (mevcutOdeme && mevcutOdeme.status !== "failed") {
      return Response.json({ error: "Bu randevu için ödeme zaten başlatılmış" }, { status: 409 });
    }

    const { data: profil } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", user.id)
      .single();

    const { data: supabaseUser } = await supabase.auth.getUser();
    const email = supabaseUser.user?.email ?? "musteri@mindbridger.com";

    const komisyon = await komisyonHesapla(randevu.price, supabase);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const adSoyad = `${profil?.first_name ?? "Müşteri"} ${profil?.last_name ?? ""}`.trim();
    const fiyatStr = komisyon.brutTutar.toFixed(2);

    const checkoutRequest = {
      locale: "tr",
      conversationId: randevu_id,
      price: fiyatStr,
      paidPrice: fiyatStr,
      currency: "TRY",
      basketId: randevu_id,
      paymentGroup: "PRODUCT",
      callbackUrl: callback_url,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id: user.id,
        name: profil?.first_name ?? "Müşteri",
        surname: profil?.last_name ?? "-",
        identityNumber: "00000000000",
        email,
        registrationAddress: "Türkiye",
        city: "Istanbul",
        country: "Turkey",
        ip,
        phone: profil?.phone ?? "05000000000",
      },
      shippingAddress: {
        contactName: adSoyad,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      billingAddress: {
        contactName: adSoyad,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: randevu_id,
          name: `Online Seans (${randevu.session_type})`,
          category1: "Danışmanlık",
          itemType: "VIRTUAL",
          price: fiyatStr,
        },
      ],
    };

    const sonuc = await new Promise<{
      status: string;
      errorMessage?: string;
      token?: string;
      checkoutFormContent?: string;
      paymentPageUrl?: string;
    }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (iyzipay.checkoutFormInitialize as any).create(checkoutRequest, (err: unknown, result: unknown) => {
        if (err) reject(err);
        else resolve(result as typeof sonuc);
      });
    });

    if (sonuc.status !== "success" || !sonuc.token) {
      return Response.json(
        { error: sonuc.errorMessage ?? "Ödeme başlatılamadı" },
        { status: 502 },
      );
    }

    // Ödeme kaydını ekle (token AES-256 ile şifrelenmiş)
    const { data: odeme, error: odemeHata } = await supabase
      .from("payments")
      .insert({
        randevu_id,
        musteri_id: user.id,
        danisan_id: randevu.danisan_id,
        amount_gross: komisyon.brutTutar,
        amount_net: komisyon.netTutar,
        commission_rate: komisyon.komisyonOrani,
        commission_amount: komisyon.komisyonTutar,
        status: "pending",
        iyzico_token: encrypt(sonuc.token),
      })
      .select("id")
      .single();

    if (odemeHata || !odeme) {
      // DEN-17: 23505 = unique_violation — eşzamanlı istek bu randevu için zaten ödeme başlattı
      if ((odemeHata as { code?: string } | null)?.code === "23505") {
        return Response.json(
          { error: "Bu randevu için ödeme zaten başlatılmış" },
          { status: 409 },
        );
      }
      return Response.json({ error: "Ödeme kaydı oluşturulamadı" }, { status: 500 });
    }

    return Response.json({
      payment_id: odeme.id,
      token: sonuc.token,
      checkoutFormContent: sonuc.checkoutFormContent,
      paymentPageUrl: sonuc.paymentPageUrl,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
