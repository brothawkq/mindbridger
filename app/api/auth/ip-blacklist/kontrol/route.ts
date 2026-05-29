import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { checkIpStatus } from "@/lib/auth/bruteForce";

// ─── Helper: IP ───────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─── GET /api/auth/ip-blacklist/kontrol ──────────────────────────
//
// İstemcinin IP adresini kontrol eder.
// Kullanım: Giriş formunun yüklenmesinden önce IP'nin banlanıp
// banlanmadığını kontrol etmek için çağrılır.
//
// Yanıt:
//  { banned: false }              — IP temiz
//  { banned: true,  until: ISO } — IP banlı, bitiş zamanı
//  { locked: true,  until: ISO } — IP kilitli (geçici, ban değil)
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  // IP bilinmiyorsa güvenli varsayılan döndür
  if (ip === "unknown") {
    return NextResponse.json({ banned: false }, { status: 200 });
  }

  const status = await checkIpStatus(ip);

  if (status.blocked && status.reason === "banned") {
    return NextResponse.json(
      {
        banned: true,
        until: status.until?.toISOString() ?? null,
        message: "Bu IP adresi geçici olarak engellenmiştir.",
      },
      { status: 200 }
    );
  }

  if (status.blocked && status.reason === "locked") {
    return NextResponse.json(
      {
        banned: false,
        locked: true,
        until: status.until?.toISOString() ?? null,
        message: "Çok fazla başarısız giriş denemesi. Lütfen bekleyin.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ banned: false, locked: false }, { status: 200 });
}
