import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIpStatus } from "@/lib/auth/bruteForce";

// ─── Validation ───────────────────────────────────────────────────
const schema = z.object({
  first_name: z
    .string({ message: "Ad zorunludur." })
    .min(2, { message: "Ad en az 2 karakter olmalıdır." })
    .max(60, { message: "Ad en fazla 60 karakter olabilir." }),
  last_name: z
    .string({ message: "Soyad zorunludur." })
    .min(2, { message: "Soyad en az 2 karakter olmalıdır." })
    .max(60, { message: "Soyad en fazla 60 karakter olabilir." }),
  email: z
    .string({ message: "E-posta zorunludur." })
    .email({ message: "Geçerli bir e-posta adresi girin." })
    .max(254),
  password: z
    .string({ message: "Şifre zorunludur." })
    .min(8, { message: "Şifre en az 8 karakter olmalıdır." })
    .max(128),
  phone: z.string().max(20).nullable().optional(),
  // FIX #5: KVKK onayı zorunlu — kayıt formunda gösterilmeli
  kvkk: z.literal(true, { message: "KVKK onayı zorunludur." }),
});

// ─── Helper: IP adresini header'dan al ────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─── POST /api/auth/register/musteri ─────────────────────────────
export async function POST(req: NextRequest) {
  // 1. IP kontrol
  const ip = getClientIp(req);
  const ipStatus = await checkIpStatus(ip);
  if (ipStatus.blocked) {
    return NextResponse.json(
      { error: "Bu IP adresi geçici olarak engellenmiştir. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  // 2. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  // 3. Validation
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const { first_name, last_name, email, password, phone } = parsed.data;
  const supabase = createAdminClient();

  // 4. Supabase Auth kullanıcı oluştur
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // e-posta doğrulama linki gönderilecek
    user_metadata: { first_name, last_name },
  });

  if (signUpError) {
    // E-posta zaten kayıtlı — güvenli mesaj (kullanıcıya bilgi sızdırma)
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle zaten bir hesap mevcut." },
        { status: 409 }
      );
    }
    console.error("[register/musteri] signUp error:", signUpError.message);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  const userId = authData.user.id;

  // 5. Profiles tablosuna kayıt
  const kvkkIp = ip === "unknown" ? null : ip;
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    first_name,
    last_name,
    phone: phone ?? null,
    role: "musteri",
    status: "pending", // e-posta doğrulanana kadar pending
    kvkk_accepted_at: new Date().toISOString(),
    kvkk_ip: kvkkIp,
  });

  if (profileError) {
    // Profil oluşturulamazsa auth kullanıcısını da sil (atomic cleanup)
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/musteri] profile insert error:", profileError.message);
    return NextResponse.json(
      { error: "Hesap oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  // 6. E-posta doğrulama linki gönder (Supabase yerleşik maili)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // password, generateLink'in GenerateSignupLinkParams tipi için zorunludur.
  // Kullanıcı zaten oluşturulmuş olduğundan password burada tekrar atama yapmaz;
  // Supabase yalnızca doğrulama linkini oluşturur ve gönderir.
  const { error: otpError } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: `${appUrl}/e-posta-dogrulama`,
    },
  });

  if (otpError) {
    // Mail hatası kayıt akışını durdurmaz; kullanıcı yine de oluşturuldu
    console.error("[register/musteri] generateLink error:", otpError.message);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
