import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
// FIX #7: Statik import — önceki sürümde await import() kullanılıyordu.
// Dinamik import, request handler içinde anti-pattern: her istekte modül
// çözümleme overhead'ı oluşturur ve tree-shaking'i engeller.
import { createClient as createBrowserLikeClient } from "@supabase/supabase-js";

// ─── Validation ───────────────────────────────────────────────────
const schema = z
  .object({
    current_password: z.string({ message: "Mevcut şifre zorunludur." }).max(128).optional(),
    new_password: z
      .string({ message: "Yeni şifre zorunludur." })
      .min(8, { message: "Şifre en az 8 karakter olmalıdır." })
      .max(128)
      .regex(/[A-Z]/, { message: "En az bir büyük harf içermelidir." })
      .regex(/[0-9]/, { message: "En az bir rakam içermelidir." }),
  })
  .superRefine((data, ctx) => {
    // Mevcut şifre ya da OTP zorunlu
    if (!data.current_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mevcut şifrenizi girmelisiniz.",
        path: ["current_password"],
      });
    }
  });

// ─── POST /api/auth/change-password ──────────────────────────────
//
// Gereksinimler:
//  - Oturum zorunlu (requireAuth)
//  - Mevcut şifre doğrulaması ile güvenli güncelleme
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Oturum kontrolü
  const supabaseServer = await createServerSupabase();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Bu işlem için giriş yapmanız gerekiyor." }, { status: 401 });
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

  const { current_password, new_password } = parsed.data;
  const supabase = createAdminClient();

  // 4. Mevcut şifreyi doğrula — signInWithPassword ile kontrol
  const userEmail = user.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Hesap e-postası bulunamadı." }, { status: 400 });
  }

  // Mevcut şifreyi doğrulama için geçici anon client
  // Admin client ile signInWithPassword yapılamaz; anonKey client kullanılır
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Sunucu yapılandırma hatası." }, { status: 500 });
  }

  const verifyClient = createBrowserLikeClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: userEmail,
    password: current_password!,
  });

  if (signInError) {
    return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 401 });
  }

  // 5. Şifreyi güncelle (admin client ile)
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: new_password,
  });

  if (updateError) {
    console.error("[change-password] updateUser error:", updateError.message);
    return NextResponse.json(
      { error: "Şifre güncellenemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
