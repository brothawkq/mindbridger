import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { tokenKaydet } from "@/lib/takvim/sync";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const takvimUrl = `${appUrl}/danisan/takvim`;
  const errorUrl = `${takvimUrl}?hata=google_baglanti`;

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) {
    return NextResponse.redirect(errorUrl);
  }

  // CSRF doğrulama
  const cookieState = req.cookies.get("takvim_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(errorUrl);
  }

  // State'ten userId'yi çıkar
  const userId = state.split(":")[0];
  if (!userId) {
    return NextResponse.redirect(errorUrl);
  }

  // Oturum kontrolü + userId eşleşmesi
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user || user.id !== userId) {
    return NextResponse.redirect(errorUrl);
  }

  // takvim_sync için danisanlar.id gerekli (profiles.id değil)
  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return NextResponse.redirect(errorUrl);
  }

  // Google'dan token exchange
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
  const redirectUri = `${appUrl}/api/takvim/sync/google/callback`;

  let tokenData: GoogleTokenResponse;

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(errorUrl);
    }

    tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  // prompt: consent ile her zaman refresh_token dönmeli
  if (!tokenData.access_token || !tokenData.refresh_token) {
    return NextResponse.redirect(errorUrl);
  }

  try {
    await tokenKaydet(
      danisanRow.id,
      "google",
      {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        calendarId: "primary",
      },
      supabase,
    );
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(`${takvimUrl}?google=baglandi`);
  response.cookies.delete("takvim_oauth_state");
  return response;
}
