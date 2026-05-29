import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export async function GET() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return Response.json(
      { error: "Google takvim bağlantısı yapılandırılmamış" },
      { status: 500 },
    );
  }

  const nonce = randomBytes(16).toString("hex");
  const state = `${user.id}:${nonce}`;
  const redirectUri = `${appUrl}/api/takvim/sync/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const response = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);

  // CSRF koruması: state'i kısa ömürlü cookie'ye kaydet
  response.cookies.set("takvim_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
