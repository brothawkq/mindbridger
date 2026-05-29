import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  recordFailedAttempt,
  clearFailedAttempts,
  checkIpStatus,
} from "@/lib/auth/bruteForce";
import { z } from "zod";
import { headers } from "next/headers";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getIp(headersList: Awaited<ReturnType<typeof headers>>): string | null {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null
  );
}

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = getIp(headersList);

  // 1. IP ban / kilit kontrolü
  if (ip) {
    const ipStatus = await checkIpStatus(ip);
    if (ipStatus.blocked) {
      return Response.json(
        {
          error:
            ipStatus.reason === "banned"
              ? "IP adresiniz geçici olarak engellendi."
              : "Hesabınız geçici olarak kilitlendi. Lütfen bekleyin.",
          until: ipStatus.until?.toISOString() ?? null,
          reason: ipStatus.reason,
        },
        { status: 429 }
      );
    }
  }

  // 2. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçerli bir e-posta ve şifre girin." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // 3. Supabase Auth — server-side (cookie'leri otomatik set eder)
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    // Başarısız → IP sayacını artır
    if (ip) {
      const ipStatus = await recordFailedAttempt(ip);
      if (ipStatus.blocked) {
        return Response.json(
          {
            error:
              ipStatus.reason === "banned"
                ? "IP adresiniz geçici olarak engellendi."
                : "Çok fazla başarısız deneme. Hesabınız kilitlendi.",
            until: ipStatus.until?.toISOString() ?? null,
            reason: ipStatus.reason,
          },
          { status: 429 }
        );
      }
    }
    return Response.json(
      { error: "Hatalı e-posta veya şifre." },
      { status: 401 }
    );
  }

  // 4. Başarılı → sayacı sıfırla, rol ve durum döndür
  if (ip) await clearFailedAttempts(ip);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  return Response.json({
    role: profile?.role ?? null,
    status: profile?.status ?? null,
  });
}
