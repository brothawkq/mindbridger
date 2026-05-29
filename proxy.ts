import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];
type UserStatus = Database["public"]["Enums"]["user_status"];

// Her rol için yönlendirilecek dashboard URL'i
const ROLE_DASHBOARD: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  danisan: "/danisan/dashboard",
  musteri: "/panelim/dashboard",
  kurumsal: "/kurumsal-panel/dashboard",
  affiliate: "/affiliate-panel/dashboard",
  visitor: "/",
};

// Prefix → izin verilen roller (ROUTES.md Middleware Rol Kontrol Matrisi)
const ROLE_ROUTES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/danisan", roles: ["danisan"] },
  { prefix: "/panelim", roles: ["musteri"] },
  { prefix: "/kurumsal-panel", roles: ["kurumsal"] },
  { prefix: "/affiliate-panel", roles: ["affiliate"] },
];

// Giriş/kayıt sayfaları — oturum açıksa dashboard'a yönlendir
// [FIX #7] Eksik sayfalar eklendi: sifremi-unuttum, sifremi-sifirla, e-posta-dogrulama
const AUTH_PAGES = [
  "/giris",
  "/kayit",
  "/danisan-kayit",
  "/kurumsal-kayit",
  "/sifremi-unuttum",
  "/sifremi-sifirla",
  "/e-posta-dogrulama",
];

// IP kontrolü yapılacak yollar
const IP_CHECK_PREFIXES = ["/giris", "/kayit", "/api/auth"];

function getClientIp(request: NextRequest): string | null {
  // [DOC #21] Reverse proxy arkasında IP alınamıyorsa null döner; kontrol sessizce atlanır
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

/**
 * [FIX #1] Supabase oturum cookie'lerini redirect yanıtına kopyalar.
 * supabase.auth.getUser() token yenilemesi yaptıysa, yönlendirme sonraki
 * istekte de güncel cookie'leri taşır; oturum senkronizasyonu korunur.
 */
function redirectWithCookies(url: URL, sessionResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────
  // 1. Supabase oturumunu yenile (SSR için zorunlu)
  // ─────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────────
  // 2. IP kara liste kontrolü (yalnızca auth endpoint'lerinde)
  // ─────────────────────────────────────────────────────────
  const needsIpCheck = IP_CHECK_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsIpCheck) {
    const ip = getClientIp(request);

    if (ip) {
      // Admin client kullan — ip_blacklist RLS sadece admin'e izin veriyor
      const adminSupabase = createAdminClient();
      const { data: ipRecord } = await adminSupabase
        .from("ip_blacklist")
        .select("banned_until")
        .eq("ip_address", ip)
        .gt("banned_until", new Date().toISOString())
        .maybeSingle();

      if (ipRecord) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "IP adresiniz geçici olarak engellendi." },
            { status: 429 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/giris";
        url.searchParams.set("error", "ip_banned");
        return redirectWithCookies(url, response); // [FIX #1]
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. Oturum açık değilse → korumalı route kontrolü
  // ─────────────────────────────────────────────────────────
  if (!user) {
    const isProtected = ROLE_ROUTES.some(({ prefix }) =>
      pathname.startsWith(prefix)
    );
    if (isProtected) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Oturum açmanız gerekiyor." },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/giris";
      url.searchParams.set("redirect", pathname);
      return redirectWithCookies(url, response); // [FIX #1]
    }
    return response;
  }

  // ─────────────────────────────────────────────────────────
  // 4. Kullanıcı profili: rol + durum
  // ─────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role ?? null) as UserRole | null;
  const userStatus = (profile?.status ?? null) as UserStatus | null;

  // ─────────────────────────────────────────────────────────
  // 5. Askıya alınmış / reddedilmiş hesap
  // ─────────────────────────────────────────────────────────
  if (userStatus === "suspended" || userStatus === "rejected") {
    const allowedPaths = ["/giris", "/api/auth/logout"];
    if (!allowedPaths.some((p) => pathname.startsWith(p))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Hesabınız askıya alınmıştır." },
          { status: 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/giris";
      url.searchParams.set("error", "account_suspended");
      return redirectWithCookies(url, response); // [FIX #1]
    }
    return response;
  }

  // ─────────────────────────────────────────────────────────
  // 6. Onay bekleyen danışman, kurumsal veya affiliate → /onay-bekleniyor
  // FIX #8: kurumsal rol eklendi; R-10: affiliate rolü de eklendi
  // ─────────────────────────────────────────────────────────
  if (userStatus === "pending" && (userRole === "danisan" || userRole === "kurumsal" || userRole === "affiliate")) {
    const allowedPaths = ["/onay-bekleniyor", "/giris", "/api/auth"];
    if (!allowedPaths.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/onay-bekleniyor";
      return redirectWithCookies(url, response); // [FIX #1]
    }
    return response;
  }

  // ─────────────────────────────────────────────────────────
  // 7. Rol tabanlı erişim kontrolü (ROUTES.md matrisi)
  // ─────────────────────────────────────────────────────────
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix)) {
      const hasAccess = userRole !== null && roles.includes(userRole);
      if (!hasAccess) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Bu işlem için yetkiniz yok." },
            { status: 403 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname =
          userRole !== null ? (ROLE_DASHBOARD[userRole] ?? "/") : "/giris";
        return redirectWithCookies(url, response); // [FIX #1]
      }
      break; // İlk eşleşen prefix yeterli
    }
  }

  // ─────────────────────────────────────────────────────────
  // 8. Giriş/kayıt sayfaları: oturum açıksa dashboard'a yönlendir
  // ─────────────────────────────────────────────────────────
  if (userRole && AUTH_PAGES.some((page) => pathname.startsWith(page))) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_DASHBOARD[userRole] ?? "/";
    return redirectWithCookies(url, response); // [FIX #1]
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aşağıdaki yollar hariç tüm isteklere uygula:
     * - _next/static (statik dosyalar)
     * - _next/image  (görsel optimizasyonu)
     * - favicon.ico
     * - Görseller (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
