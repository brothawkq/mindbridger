import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { tokenKaydet } from "@/lib/takvim/sync";

const MS_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";

interface MsTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const takvimUrl = `${appUrl}/danisan/takvim`;
  const errorUrl = `${takvimUrl}?hata=outlook_baglanti`;

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

  const userId = state.split(":")[0];
  if (!userId) {
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user || user.id !== userId) {
    return NextResponse.redirect(errorUrl);
  }

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return NextResponse.redirect(errorUrl);
  }

  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID ?? "";
  const clientSecret = process.env.MICROSOFT_OAUTH_CLIENT_SECRET ?? "";
  const redirectUri = `${appUrl}/api/takvim/sync/outlook/callback`;
  const scopes = "https://graph.microsoft.com/Calendars.Read offline_access";

  let tokenData: MsTokenResponse;

  try {
    const tokenRes = await fetch(MS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: scopes,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(errorUrl);
    }

    tokenData = (await tokenRes.json()) as MsTokenResponse;
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  if (!tokenData.access_token || !tokenData.refresh_token) {
    return NextResponse.redirect(errorUrl);
  }

  try {
    await tokenKaydet(
      danisanRow.id,
      "outlook",
      {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        calendarId: null,
      },
      supabase,
    );
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(`${takvimUrl}?outlook=baglandi`);
  response.cookies.delete("takvim_oauth_state");
  return response;
}
