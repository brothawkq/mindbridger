import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Validasyon ───────────────────────────────────────────────────

const BodySchema = z.object({
  ad:    z.string().min(2).max(100),
  email: z.string().email().max(200),
  mesaj: z.string().min(10).max(2000),
});

// ─── Rate limit ───────────────────────────────────────────────────
// chatbot_rate_limits tablosunu kullan; key olarak "contact:{ip}" prefix'i
// ile chatbot girişlerinden ayrıştır. Limit: 10 istek / saat.

const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 3600; // saniye (1 saat)

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (ip === "unknown") return true;
  const admin = createAdminClient();
  const key = `contact:${ip}`;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

  const { data } = await admin
    .from("chatbot_rate_limits")
    .select("count, window_start")
    .eq("ip_address", key)
    .maybeSingle();

  if (data && new Date(data.window_start) > new Date(windowStart)) {
    if (data.count >= RATE_LIMIT_MAX) return false;
    await admin
      .from("chatbot_rate_limits")
      .update({ count: data.count + 1, updated_at: new Date().toISOString() })
      .eq("ip_address", key);
  } else {
    await admin.from("chatbot_rate_limits").upsert(
      {
        ip_address:   key,
        count:        1,
        window_start: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      },
      { onConflict: "ip_address" }
    );
  }
  return true;
}

// ─── POST /api/iletisim ───────────────────────────────────────────
//
// Public endpoint. İletişim formu gönderimi.
// Gelen mesajı içerik olarak LOGLAMAZ; sadece admin'e iletir.
//
export async function POST(req: NextRequest) {
  // Rate limit kontrolü
  const ip = getIp(req);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderildi. Lütfen bir saat sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  // Body validasyonu
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Form alanlarını eksiksiz doldurun." },
      { status: 422 }
    );
  }

  const { ad, email, mesaj } = parsed.data;

  // Resend ile admin'e bildirim — hata mail akışını engellemez
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from:    "MindBridger <platform@mindbridger.com>",
        to:      ["platform@mindbridger.com"],
        replyTo: email,
        subject: `İletişim Formu: ${ad}`,
        html: `
          <div style="font-family:system-ui,Arial,sans-serif;font-size:13px;color:#212121;max-width:560px;margin:0 auto;border:1.5px solid #E0E0E0">
            <div style="padding:16px 20px;border-bottom:1.5px solid #212121">
              <strong style="font-size:16px">MindBridger</strong>
            </div>
            <div style="padding:24px 20px">
              <h2 style="font-size:14px;font-weight:700;margin:0 0 16px">Yeni İletişim Formu Mesajı</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:8px 0;font-weight:700;width:100px;vertical-align:top">Ad Soyad:</td>
                  <td style="padding:8px 0">${ad.replace(/</g, "&lt;")}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;vertical-align:top">E-posta:</td>
                  <td style="padding:8px 0">${email.replace(/</g, "&lt;")}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;vertical-align:top">Mesaj:</td>
                  <td style="padding:8px 0;white-space:pre-wrap">${mesaj.replace(/</g, "&lt;")}</td>
                </tr>
              </table>
            </div>
            <div style="padding:12px 20px;background:#F5F5F5;font-size:11px;color:#BDBDBD">
              Gönderilme: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
            </div>
          </div>
        `,
      });
    }
  } catch (mailHata) {
    // Mail hatası kullanıcıya yansımaz; sadece log
    console.error("[iletisim] Resend hatası:", mailHata);
  }

  return NextResponse.json({ ok: true });
}
