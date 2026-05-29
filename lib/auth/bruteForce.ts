/**
 * Brute Force Koruması
 *
 * Eşikler (CONFLICTS.md ile tutarlı):
 *  - 5  başarısız giriş → 15 dakika hesap kilidi
 *  - 50 başarısız giriş → 24 saat IP yasağı
 *
 * ip_blacklist tablosu RLS'yi atlamak için service_role kullanır.
 * recordFailedAttempt: atomik Postgres RPC (004_record_failed_attempt_rpc.sql)
 */
import { createAdminClient } from "@/lib/supabase/admin";

export interface IpStatus {
  blocked: boolean;
  reason: "banned" | "locked" | null;
  until: Date | null;
}

/**
 * Başarısız giriş denemesini atomik olarak kaydeder.
 * Postgres RPC (record_failed_attempt) ile tek işlemde increment + eşik kontrolü.
 *
 * @returns Güncel IP durumu
 */
export async function recordFailedAttempt(ip: string): Promise<IpStatus> {
  const supabase = createAdminClient();
  const now = new Date();

  const { data, error } = await supabase.rpc("record_failed_attempt", {
    p_ip: ip,
  });

  if (error) {
    console.error("[bruteForce] recordFailedAttempt rpc error:", error.message);
    return { blocked: false, reason: null, until: null };
  }

  const result = data as unknown as {
    failed_attempts: number;
    locked_until: string | null;
    banned_until: string | null;
  };

  if (result.banned_until && new Date(result.banned_until) > now) {
    return { blocked: true, reason: "banned", until: new Date(result.banned_until) };
  }
  if (result.locked_until && new Date(result.locked_until) > now) {
    return { blocked: true, reason: "locked", until: new Date(result.locked_until) };
  }
  return { blocked: false, reason: null, until: null };
}

/**
 * Başarılı girişte sayacı sıfırlar.
 * Kilit ve yasak süresi kalkmışsa kaydı temizler.
 */
export async function clearFailedAttempts(ip: string): Promise<void> {
  const supabase = createAdminClient();

  // [FIX #4] banned_until da temizleniyor — süresi dolmuş yasak verisi DB'de bırakılmamalı
  // [FIX #3] Hata kontrolü eklendi
  const { error } = await supabase
    .from("ip_blacklist")
    .update({
      failed_attempts: 0,
      locked_until: null,
      banned_until: null,
    })
    .eq("ip_address", ip);

  if (error) {
    // Kritik değil ama gözlemlenmeli; başarılı giriş sayacı sıfırlanamadı
    console.error("[bruteForce] clearFailedAttempts error:", error.message);
  }
}

/**
 * IP adresinin şu anki durumunu kontrol eder.
 * Middleware dışındaki API route'lardan çağrılabilir.
 */
export async function checkIpStatus(ip: string): Promise<IpStatus> {
  const supabase = createAdminClient();
  const now = new Date(); // [FIX #20] Date objesi; string karşılaştırma yerine

  // [FIX #3] Hata kontrolü eklendi
  const { data, error } = await supabase
    .from("ip_blacklist")
    .select("banned_until, locked_until")
    .eq("ip_address", ip)
    .maybeSingle();

  if (error) {
    console.error("[bruteForce] checkIpStatus error:", error.message);
    return { blocked: false, reason: null, until: null };
  }

  if (!data) {
    return { blocked: false, reason: null, until: null };
  }

  // [FIX #20] Date objesi karşılaştırması
  if (data.banned_until && new Date(data.banned_until) > now) {
    return {
      blocked: true,
      reason: "banned",
      until: new Date(data.banned_until),
    };
  }

  if (data.locked_until && new Date(data.locked_until) > now) {
    return {
      blocked: true,
      reason: "locked",
      until: new Date(data.locked_until),
    };
  }

  return { blocked: false, reason: null, until: null };
}

/**
 * Kalan kilit süresini dakika cinsinden döndürür.
 * Giriş formundaki geri sayım için kullanılır.
 */
export function minutesRemaining(until: Date): number {
  const ms = until.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 60000));
}
