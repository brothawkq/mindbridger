import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { encrypt, decrypt } from "@/lib/auth/encrypt";

type CalendarProvider = Database["public"]["Enums"]["calendar_provider"];

export interface TakvimToken {
  accessToken:  string;
  refreshToken: string;
  tokenExpiry:  Date;
  calendarId:   string | null;
}

/**
 * OAuth token'larını AES-256 ile şifreleyerek takvim_sync tablosuna kaydeder.
 * Aynı danisan_id + provider için kayıt varsa günceller (upsert).
 *
 * ⚠️  Token değerlerini asla loglama.
 */
export async function tokenKaydet(
  danisanId: string,
  provider: CalendarProvider,
  token: TakvimToken,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const encryptedAccess  = encrypt(token.accessToken);
  const encryptedRefresh = encrypt(token.refreshToken);

  const { error } = await supabase
    .from("takvim_sync")
    .upsert(
      {
        danisan_id:    danisanId,
        provider,
        access_token:  encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expiry:  token.tokenExpiry.toISOString(),
        calendar_id:   token.calendarId ?? null,
        is_active:     true,
      },
      { onConflict: "danisan_id,provider" },
    );

  if (error) {
    throw new Error(`Takvim token kaydedilemedi: ${error.message}`);
  }
}

/**
 * Şifreli token'ları veritabanından çekip çözer.
 *
 * @returns Çözülmüş TakvimToken veya null (kayıt yok, pasif veya şifre hatalı)
 */
export async function tokenAl(
  danisanId: string,
  provider: CalendarProvider,
  supabase: SupabaseClient<Database>,
): Promise<TakvimToken | null> {
  const { data, error } = await supabase
    .from("takvim_sync")
    .select("access_token, refresh_token, token_expiry, calendar_id")
    .eq("danisan_id", danisanId)
    .eq("provider", provider)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  try {
    return {
      accessToken:  decrypt(data.access_token),
      refreshToken: decrypt(data.refresh_token),
      tokenExpiry:  new Date(data.token_expiry ?? 0),
      calendarId:   data.calendar_id,
    };
  } catch {
    // Şifre çözme başarısız: veri bozuk veya ENCRYPTION_KEY değişmiş
    return null;
  }
}

/**
 * Takvim bağlantısını pasife alır.
 * Token değerleri silinmez; yeniden bağlanmak için upsert yeterli.
 */
export async function tokenDevreDisi(
  danisanId: string,
  provider: CalendarProvider,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const { error } = await supabase
    .from("takvim_sync")
    .update({ is_active: false })
    .eq("danisan_id", danisanId)
    .eq("provider", provider)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Takvim bağlantısı kesilemedi: ${error.message}`);
  }
}

/**
 * Token'ın süresinin dolup dolmadığını kontrol eder.
 * 5 dakika erken uyarı verir (network gecikmesi + refresh buffer).
 */
export function tokenSuresiDolmuMu(token: TakvimToken): boolean {
  const BUFFER_MS = 5 * 60 * 1000;
  return token.tokenExpiry.getTime() - Date.now() < BUFFER_MS;
}
