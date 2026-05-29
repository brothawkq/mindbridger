/**
 * Supabase Service Role Client — SADECE SUNUCU TARAFI
 *
 * Bu istemci RLS'yi atlar. Asla client component'te import etme.
 * Yalnızca şu amaçlarla kullanılır:
 *  - ip_blacklist yazma/okuma (auth öncesi)
 *  - Cron job'lar
 *  - Webhook handler'lar
 *  - Admin işlemleri (service_role gerektiren)
 */
import "server-only"; // [FIX #5] Client bundle'a girmesini derleme zamanında engelle
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin istemcisi için NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gereklidir."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
