import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import iyzipay from "@/lib/iyzico/client";
import { decrypt } from "@/lib/auth/encrypt";
import { faturaOlustur } from "@/lib/fatura/olustur";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  if (!user || user.role !== "musteri") {
    return NextResponse.redirect(`${BASE}/giris`, { status: 303 });
  }

  // iyzico form POST: token form body'de gelir
  let token: string | undefined;
  try {
    const formData = await req.formData();
    token = formData.get("token")?.toString();
  } catch {
    return NextResponse.redirect(
      `${BASE}/panelim/odeme-sonuc?hata=token_eksik`,
      { status: 303 },
    );
  }

  if (!token) {
    return NextResponse.redirect(
      `${BASE}/panelim/odeme-sonuc?hata=token_eksik`,
      { status: 303 },
    );
  }

  try {
    // iyzico'dan ödeme durumunu doğrula
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
          else
            resolve(
              result as {
                status: string;
                errorMessage?: string;
                paymentStatus?: string;
                paymentId?: string;
                conversationId?: string;
              },
            );
        },
      );
    });

    if (sonuc.status !== "success" || sonuc.paymentStatus !== "SUCCESS") {
      const kod = encodeURIComponent(sonuc.errorMessage ?? "odeme_basarisiz");
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?hata=${kod}`,
        { status: 303 },
      );
    }

    const randevuId = sonuc.conversationId;
    if (!randevuId) {
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?hata=randevu_bulunamadi`,
        { status: 303 },
      );
    }

    // Ödeme kaydını bul
    const { data: odeme } = await supabase
      .from("payments")
      .select("id, status, iyzico_token, musteri_id")
      .eq("randevu_id", randevuId)
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!odeme) {
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?hata=odeme_bulunamadi`,
        { status: 303 },
      );
    }

    // Token bütünlük doğrulaması
    const kayitliToken = odeme.iyzico_token ? decrypt(odeme.iyzico_token) : null;
    if (kayitliToken !== token) {
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?hata=token_eslesmedi`,
        { status: 303 },
      );
    }

    // Mükerrer callback koruması
    if (odeme.status === "captured") {
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?basarili=1&randevu_id=${randevuId}`,
        { status: 303 },
      );
    }

    const simdi = new Date().toISOString();

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
      return NextResponse.redirect(
        `${BASE}/panelim/odeme-sonuc?hata=guncelleme_hatasi`,
        { status: 303 },
      );
    }

    // Fatura oluştur — hata olsa ödeme zaten kaydedildi, sonra yeniden oluşturulabilir
    try {
      await faturaOlustur(randevuId, supabase);
    } catch {
      // Kritik değil: admin paneli veya /api/fatura/olustur/[randevuId] ile tekrar oluşturulabilir
    }

    return NextResponse.redirect(
      `${BASE}/panelim/odeme-sonuc?basarili=1&randevu_id=${randevuId}`,
      { status: 303 },
    );
  } catch {
    return NextResponse.redirect(
      `${BASE}/panelim/odeme-sonuc?hata=sunucu_hatasi`,
      { status: 303 },
    );
  }
}
