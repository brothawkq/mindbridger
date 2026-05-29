import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIpStatus } from "@/lib/auth/bruteForce";

// ─── Validation ───────────────────────────────────────────────────
const schema = z.object({
  email: z
    .string({ message: "E-posta zorunludur." })
    .email({ message: "Geçerli bir e-posta adresi girin." })
    .max(254),
});

// ─── Helper: IP ───────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─── POST /api/auth/forgot-password ──────────────────────────────
//
// Güvenlik notu: Yanıt her zaman 200 döner.
// E-postanın sistemde kayıtlı olup olmadığını dışarıya sızdırma.
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. IP kontrol
  const ip = getClientIp(req);
  const ipStatus = await checkIpStatus(ip);
  if (ipStatus.blocked) {
    // Banlı IP için bile 200 döndür — bilgi sızdırma önlemi
    return NextResponse.json({ ok: true }, { status: 200 });
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
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 422 });
  }

  const { email } = parsed.data;
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // 4. Şifre sıfırlama linki oluştur ve gönder
  // generateLink hem tokeni üretir hem de Supabase yerleşik SMTP üzerinden gönderir
  const { error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${appUrl}/sifremi-sifirla`,
    },
  });

  if (error) {
    // E-posta bulunamadı durumunda da loglama yapma — sadece hata türünü logla
    if (!error.message.toLowerCase().includes("not found")) {
      console.error("[forgot-password] generateLink error:", error.message);
    }
    // Her durumda 200 dön — e-postanın varlığını açıklama
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
