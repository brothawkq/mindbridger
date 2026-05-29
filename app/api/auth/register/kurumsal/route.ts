import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIpStatus } from "@/lib/auth/bruteForce";
import { randomBytes } from "crypto";
import KurumsalKayitOnayBekliyorMail from "@/lib/resend/templates/kurumsal-kayit-onay-bekleniyor";

// ─── Validation ───────────────────────────────────────────────────
const schema = z.object({
  company_name: z
    .string({ message: "Şirket adı zorunludur." })
    .min(2, { message: "Şirket adı en az 2 karakter olmalıdır." })
    .max(120),
  contact_name: z
    .string({ message: "Yetkili adı zorunludur." })
    .min(2)
    .max(120),
  email: z
    .string({ message: "E-posta zorunludur." })
    .email({ message: "Geçerli bir e-posta adresi girin." })
    .max(254),
  phone: z.string().max(20).optional(),
  password: z
    .string({ message: "Şifre zorunludur." })
    .min(8, { message: "Şifre en az 8 karakter olmalıdır." })
    .max(128),
  license_count: z
    .number({ message: "Lisans sayısı zorunludur." })
    .int()
    .min(1)
    .max(10000),
  default_monthly_budget: z.number().int().min(0).default(0),
  kvkk: z.literal(true, { message: "KVKK onayı zorunludur." }),
});

// ─── Helper: IP ───────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─── POST /api/auth/register/kurumsal ────────────────────────────
export async function POST(req: NextRequest) {
  // 1. IP kontrol
  const ip = getClientIp(req);
  const ipStatus = await checkIpStatus(ip);
  if (ipStatus.blocked) {
    return NextResponse.json(
      { error: "Bu IP adresi geçici olarak engellenmiştir." },
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

  const {
    company_name,
    contact_name,
    email,
    phone,
    password,
    license_count,
    default_monthly_budget,
  } = parsed.data;

  const supabase = createAdminClient();

  // 4. Supabase Auth kullanıcı oluştur
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { company_name, contact_name },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle zaten bir hesap mevcut." },
        { status: 409 }
      );
    }
    console.error("[register/kurumsal] signUp error:", signUpError.message);
    return NextResponse.json({ error: "Kayıt sırasında bir hata oluştu." }, { status: 500 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: "Kullanıcı oluşturulamadı." }, { status: 500 });
  }

  const userId = authData.user.id;

  // 5. Profiles tablosuna kayıt (kurumsal rol — ad olarak şirket adı)
  const kvkkIp = ip === "unknown" ? null : ip;
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    first_name: contact_name,
    last_name: null,
    phone: phone ?? null,
    role: "kurumsal",
    status: "pending",
    kvkk_accepted_at: new Date().toISOString(),
    kvkk_ip: kvkkIp,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/kurumsal] profile insert error:", profileError.message);
    return NextResponse.json({ error: "Hesap oluşturulamadı." }, { status: 500 });
  }

  // 6. Benzersiz davet kodu oluştur ve kaydet
  // FIX #6: unique constraint ihlali durumunda yeni kod ile yeniden dene
  const MAX_CODE_RETRIES = 5;
  let inserted = false;
  let lastInsertError: { message: string } | null = null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const invite_code = randomBytes(6).toString("hex").toUpperCase();

    const { error } = await supabase.from("kurumsal_hesaplar").insert({
      id:                    userId,
      company_name,
      contact_name,
      contact_email:         email,
      contact_phone:         phone ?? null,
      license_count,
      default_monthly_budget,
      invite_code,
      status:                "pending",
    });

    if (!error) {
      inserted = true;
      break;
    }

    lastInsertError = error;
    // Unique constraint değilse yeniden deneme yapma
    if (!error.message.toLowerCase().includes("unique")) break;
  }

  // 7. Kayıt başarısız olursa geri al
  if (!inserted) {
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/kurumsal] kurumsal_hesaplar insert error:", lastInsertError?.message);
    return NextResponse.json({ error: "Kurumsal hesap oluşturulamadı." }, { status: 500 });
  }

  // 8. E-posta doğrulama linki gönder
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error: otpError } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: `${appUrl}/e-posta-dogrulama` },
  });
  if (otpError) {
    console.error("[register/kurumsal] generateLink error:", otpError.message);
  }

  // 9. Bilgilendirme maili gönder (Resend) — hata kayıt sürecini engellemez
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "MindBridger <onboarding@resend.dev>",
      to: email,
      subject: "Kurumsal Başvurunuz Alındı — MindBridger",
      react: KurumsalKayitOnayBekliyorMail({ isim: contact_name, sirketAdi: company_name }),
    });
  } catch (mailErr) {
    console.error("[register/kurumsal] resend mail error:", mailErr);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
