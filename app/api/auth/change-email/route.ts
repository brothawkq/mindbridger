import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

// ─── Validation ───────────────────────────────────────────────────
const schema = z
  .object({
    current_password: z
      .string({ message: "Mevcut şifre zorunludur." })
      .max(128)
      .optional(),
    new_email: z
      .string({ message: "Yeni e-posta zorunludur." })
      .email({ message: "Geçerli bir e-posta adresi girin." })
      .max(254),
  })
  .superRefine((data, ctx) => {
    if (!data.current_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mevcut şifrenizi girmelisiniz.",
        path: ["current_password"],
      });
    }
  });

// ─── POST /api/auth/change-email ─────────────────────────────────
//
// Gereksinimler:
//  - Oturum zorunlu
//  - Mevcut şifre doğrulaması
//  - Yeni e-postaya doğrulama linki gönderilir
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Oturum kontrolü
  const supabaseServer = await createServerSupabase();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Bu işlem için giriş yapmanız gerekiyor." },
      { status: 401 }
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

  const { current_password, new_email } = parsed.data;
  const currentEmail = user.email;

  if (!currentEmail) {
    return NextResponse.json({ error: "Mevcut e-posta adresi bulunamadı." }, { status: 400 });
  }

  // E-posta değişmiyorsa hata
  if (currentEmail.toLowerCase() === new_email.toLowerCase()) {
    return NextResponse.json(
      { error: "Yeni e-posta mevcut e-posta ile aynı olamaz." },
      { status: 422 }
    );
  }

  // 4. Mevcut şifreyi doğrula
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Sunucu yapılandırma hatası." }, { status: 500 });
  }

  const verifyClient = createBrowserClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: currentEmail,
    password: current_password!,
  });

  if (signInError) {
    return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 401 });
  }

  // 5. E-postayı güncelle (admin client)
  const supabase = createAdminClient();

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    email: new_email,
    email_confirm: false, // Yeni adrese doğrulama linki gönder
  });

  if (updateError) {
    if (updateError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten başka bir hesaba kayıtlı." },
        { status: 409 }
      );
    }
    console.error("[change-email] updateUser error:", updateError.message);
    return NextResponse.json(
      { error: "E-posta güncellenemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  // 6. Supabase, updateUserById ile e-posta değiştirildiğinde yeni adrese
  // otomatik olarak onay e-postası gönderir. Ek generateLink gerekmez.
  // Faz 10'da Resend ile özelleştirilmiş şablon gönderilecek.

  return NextResponse.json(
    { ok: true, message: `${new_email} adresine doğrulama e-postası gönderildi.` },
    { status: 200 }
  );
}
