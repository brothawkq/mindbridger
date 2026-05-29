/**
 * Cron: IP Kara Liste Temizliği
 * Schedule: Her gün 04:00 (vercel.json: "0 4 * * *")
 *
 * ip_blacklist tablosundaki süresi dolmuş kayıtları temizler:
 *   1. `banned_until` geçmiş olanları → failed_attempts sıfırla
 *   2. `locked_until` geçmiş olanları → locked_until temizle
 *   3. 30+ gün hareketsiz kalan kayıtları hard-delete (güvenlik kaydı tutma politikası)
 *
 * CLAUDE.md güvenlik parametreleri:
 *   - Hesap kilidi: 5 başarısız giriş → 15 dakika kilit
 *   - IP kara listesi: 50 başarısız giriş → 24 saat ban
 */
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET;
const KAYIT_SAKLA_GUN = 30; // Hard-delete öncesi bekleme süresi

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const simdi = new Date().toISOString();

    // 1. Ban süresi dolmuş kayıtları temizle (failed_attempts sıfırla, banned_until null)
    const { data: banData } = await supabase
      .from("ip_blacklist")
      .update({
        failed_attempts: 0,
        banned_until: null,
        locked_until: null,
      })
      .not("banned_until", "is", null)
      .lt("banned_until", simdi)
      .is("deleted_at", null)
      .select("id");

    // 2. Kilit süresi dolmuş ama ban olmayan kayıtların locked_until'ini temizle
    const { data: kilitData } = await supabase
      .from("ip_blacklist")
      .update({ locked_until: null })
      .not("locked_until", "is", null)
      .lt("locked_until", simdi)
      .is("banned_until", null)
      .is("deleted_at", null)
      .select("id");

    // 3. 30+ gün önce son aktivitesi olan ve başarısız denemesi olmayan soft-delete
    const eskiTarih = new Date(
      Date.now() - KAYIT_SAKLA_GUN * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: softData } = await supabase
      .from("ip_blacklist")
      .update({ deleted_at: simdi })
      .eq("failed_attempts", 0)
      .is("banned_until", null)
      .is("locked_until", null)
      .lt("last_attempt_at", eskiTarih)
      .is("deleted_at", null)
      .select("id");

    // 4. Soft-deleted kayıtları hard-delete (30+ gün önce silinmiş)
    const { data: hardData } = await supabase
      .from("ip_blacklist")
      .delete()
      .not("deleted_at", "is", null)
      .lt("deleted_at", eskiTarih)
      .select("id");

    return Response.json({
      ok: true,
      banSilinen: banData?.length ?? 0,
      kilitSilinen: kilitData?.length ?? 0,
      softSilinen: softData?.length ?? 0,
      hardSilinen: hardData?.length ?? 0,
      zaman: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/ip-temizlik] hata:", err);
    return Response.json({ error: "Cron hatası" }, { status: 500 });
  }
}
