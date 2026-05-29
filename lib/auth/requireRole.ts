import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type UserRole   = Database["public"]["Enums"]["user_role"];
type UserStatus = Database["public"]["Enums"]["user_status"];

export interface AuthUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  status: UserStatus;
}

/**
 * [FIX #13] Ortak auth + profil doğrulama yardımcısı.
 * requireRole ve requireAuth arasındaki kod tekrarını ortadan kaldırır.
 *
 * [FIX #24] pending durumu: pending danışmanlar middleware katmanında
 * /onay-bekleniyor'a yönlendirilir. API katmanında da kontrol eklenmiştir.
 */
async function _resolveAuthUser(
  supabase: SupabaseClient<Database>
): Promise<AuthUser | null> {
  // 1. Oturum kontrolü
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // 2. Profil: rol + durum
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  const role   = profile.role   as UserRole;
  const status = profile.status as UserStatus;

  // 3. Aktif olmayan hesapları reddet
  // [FIX #24] pending danışmanlar da API seviyesinde bloke edilir
  if (
    status === "suspended" ||
    status === "rejected"  ||
    (status === "pending" && role === "danisan")
  ) {
    return null;
  }

  return { id: user.id, email: user.email, role, status };
}

/**
 * Her API route'un başında çağrılır.
 * Kullanıcıyı doğrular, rolünü kontrol eder.
 *
 * @returns Yetkili kullanıcı bilgisi | null (yetkisiz veya hata)
 *
 * Kullanım:
 *   const user = await requireRole(supabase, ['admin'])
 *   if (!user) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
 */
export async function requireRole(
  supabase: SupabaseClient<Database>,
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const authUser = await _resolveAuthUser(supabase);
  if (!authUser) return null;

  // 4. Rol kontrolü
  if (!allowedRoles.includes(authUser.role)) return null;

  return authUser;
}

/**
 * Kullanıcının kimliğini doğrular; rol kontrolü yapmaz.
 * Birden fazla rolün kendi verisine eriştiği route'larda kullanılır.
 * (Örn: GET /api/randevular — musteri, danisan, admin hepsi kendi verisini çeker)
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>
): Promise<AuthUser | null> {
  return _resolveAuthUser(supabase);
}
