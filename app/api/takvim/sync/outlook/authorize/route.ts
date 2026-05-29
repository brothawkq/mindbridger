import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const MS_AUTH_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

// Calendars.Read: takvim okuma | offline_access: refresh_token için zorunlu
const SCOPES = "https://graph.microsoft.com/Calendars.Read offline_access";

export async function GET() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const clientId = process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return Response.json(
      { error: "Outlook takvim bağlantısı yapılandırılmamış" },
      { status: 500 },
    );
  }

  const nonce = randomBytes(16).toString("hex");
  const state = `${user.id}:${nonce}`;
  const redirectUri = `${appUrl}/api/takvim/sync/outlook/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    response_mode: "query",
    state,
  });

  const response = NextResponse.redirect(`${MS_AUTH_URL}?${params}`);

  response.cookies.set("takvim_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
