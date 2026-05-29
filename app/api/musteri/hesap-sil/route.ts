import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

// POST: OTP gönder (hesap silme doğrulaması için)
export async function POST() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });

  // OTP gönder (shouldCreateUser: false = var olan kullanıcıya)
  const { error } = await supabase.auth.signInWithOtp({
    email: user.email ?? "",
    options: { shouldCreateUser: false },
  });

  if (error) {
    return NextResponse.json({ hata: "Doğrulama kodu gönderilemedi." }, { status: 500 });
  }

  return NextResponse.json({ basarili: true });
}

// DELETE: OTP doğrula ve hesabı soft-delete et
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const { otp_token } = body as { otp_token?: string };
  if (!otp_token || otp_token.length < 4) {
    return NextResponse.json({ hata: "Doğrulama kodu eksik." }, { status: 400 });
  }

  // OTP doğrula
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: user.email ?? "",
    token: otp_token,
    type: "email",
  });

  if (otpError) {
    return NextResponse.json({ hata: "Doğrulama kodu geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  // Soft-delete profil
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString(), status: "suspended" })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ hata: "Hesap silinemedi." }, { status: 500 });
  }

  // Auth oturumu kapat
  await supabase.auth.signOut();

  return NextResponse.json({ basarili: true });
}
