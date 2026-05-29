import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Validation ───────────────────────────────────────────────────
const schema = z.object({
  token: z
    .string({ message: "Token zorunludur." })
    .min(6, { message: "Geçersiz token." })
    .max(2048),
  password: z
    .string({ message: "Şifre zorunludur." })
    .min(8, { message: "Şifre en az 8 karakter olmalıdır." })
    .max(128, { message: "Şifre en fazla 128 karakter olabilir." })
    .regex(/[A-Z]/, { message: "En az bir büyük harf içermelidir." })
    .regex(/[0-9]/, { message: "En az bir rakam içermelidir." }),
});

// ─── POST /api/auth/reset-password ───────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  // 2. Validation
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const { token, password } = parsed.data;
  const supabase = createAdminClient();

  // 3. Token'ı doğrula — recovery OTP
  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });

  if (verifyError) {
    if (
      verifyError.message.toLowerCase().includes("expired") ||
      verifyError.message.toLowerCase().includes("invalid") ||
      verifyError.message.toLowerCase().includes("not found")
    ) {
      return NextResponse.json(
        { error: "Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı isteyin." },
        { status: 410 }
      );
    }
    console.error("[reset-password] verifyOtp error:", verifyError.message);
    return NextResponse.json({ error: "Doğrulama sırasında bir hata oluştu." }, { status: 500 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // 4. Şifreyi güncelle
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password,
  });

  if (updateError) {
    console.error("[reset-password] updateUser error:", updateError.message);
    return NextResponse.json(
      { error: "Şifre güncellenemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
