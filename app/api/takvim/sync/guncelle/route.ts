import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { tokenAl, tokenKaydet, tokenSuresiDolmuMu } from "@/lib/takvim/sync";
import type { TakvimToken } from "@/lib/takvim/sync";
import type { Database } from "@/types/supabase";

type CalendarProvider = Database["public"]["Enums"]["calendar_provider"];

const bodySchema = z.object({
  provider: z.enum(["google", "outlook"]),
});

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MS_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz sağlayıcı" }, { status: 400 });
  }

  const { provider } = parsed.data;

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) {
    return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });
  }

  try {
    const token = await tokenAl(danisanRow.id, provider, supabase);

    if (!token) {
      return Response.json(
        { error: "Takvim bağlantısı bulunamadı. Lütfen tekrar bağlanın." },
        { status: 404 },
      );
    }

    if (!tokenSuresiDolmuMu(token)) {
      return Response.json({ ok: true, refreshed: false });
    }

    const refreshed = await doTokenRefresh(provider, token);
    if (!refreshed) {
      return Response.json(
        { error: "Token yenilenirken hata oluştu. Takvimi tekrar bağlayın." },
        { status: 502 },
      );
    }

    await tokenKaydet(danisanRow.id, provider, refreshed, supabase);
    return Response.json({ ok: true, refreshed: true });
  } catch {
    return Response.json(
      { error: "Senkronizasyon sırasında bir hata oluştu" },
      { status: 500 },
    );
  }
}

async function doTokenRefresh(
  provider: CalendarProvider,
  existingToken: TakvimToken,
): Promise<TakvimToken | null> {
  const isGoogle = provider === "google";

  const clientId = isGoogle
    ? process.env.GOOGLE_OAUTH_CLIENT_ID
    : process.env.MICROSOFT_OAUTH_CLIENT_ID;
  const clientSecret = isGoogle
    ? process.env.GOOGLE_OAUTH_CLIENT_SECRET
    : process.env.MICROSOFT_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const tokenUrl = isGoogle ? GOOGLE_TOKEN_URL : MS_TOKEN_URL;

  const bodyParams: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: existingToken.refreshToken,
    grant_type: "refresh_token",
  };

  if (!isGoogle) {
    bodyParams["scope"] =
      "https://graph.microsoft.com/Calendars.Read offline_access";
  }

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!data.access_token) return null;

    return {
      accessToken: data.access_token,
      // Google bazen yeni refresh_token döndürmez — eskiyi koru
      refreshToken: data.refresh_token ?? existingToken.refreshToken,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      calendarId: existingToken.calendarId,
    };
  } catch {
    return null;
  }
}
