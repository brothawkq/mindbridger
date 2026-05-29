import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const KABUL_SURESI_DK = 30;

/**
 * Bir danışmanın bekleme listesindeki ilk kişiye slot açıldığını bildirir.
 * İptal veya kapasite açılmasından sonra çağrılır.
 * Gerçek mail/SMS gönderimi Faz 10'da eklenir.
 */
export async function siradakineHaber(
  danisanId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ musteri_id: string; bekleme_id: string } | null> {
  // Henüz bildirilmemiş veya süresi dolmuş en eski kaydı bul
  const now = new Date();
  const { data: siradaki } = await supabase
    .from("bekleme_listesi")
    .select("id, musteri_id")
    .eq("danisan_id", danisanId)
    .is("deleted_at", null)
    .is("accepted_at", null)
    .or(`notified_at.is.null,expires_at.lt.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!siradaki) return null;

  const expires = new Date(now.getTime() + KABUL_SURESI_DK * 60 * 1000);

  // Bildirim zamanı ve son kabul tarihini güncelle
  await supabase
    .from("bekleme_listesi")
    .update({
      notified_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .eq("id", siradaki.id);

  // Uygulama içi bildirim kaydı oluştur (Faz 10'da mail/SMS eklenir)
  await supabase.from("bildirimler").insert({
    user_id: siradaki.musteri_id,
    type: "bekleme_slot_acildi",
    title: "Slot açıldı!",
    body: `Bekleme listenizde yer alan danışman için bir slot açıldı. ${KABUL_SURESI_DK} dakika içinde randevu alabilirsiniz.`,
    data: { danisan_id: danisanId, bekleme_id: siradaki.id },
    channel: "app",
    delivery_status: "pending",
  });

  return { musteri_id: siradaki.musteri_id, bekleme_id: siradaki.id };
}
