/**
 * Uygulama İçi Bildirim
 *
 * `bildirimler` tablosuna kayıt yazar.
 * Supabase Realtime üzerinden bağlı istemcilere anında push yapar.
 *
 * Mimari: Bu modül yalnızca app/in-app kanalı için kullanılır.
 * Email / SMS kanalları `lib/bildirim/gonder.ts` tarafından yönetilir.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type NotifChannel = Database["public"]["Enums"]["notif_channel"];
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];

export interface UygulamaIciBildirimPayload {
  /** Hedef kullanıcı ID */
  userId: string;
  /** Bildirim başlığı */
  title: string;
  /** Bildirim içeriği (opsiyonel) */
  body?: string;
  /**
   * Bildirim tipi — frontend'de aksiyon/yönlendirme kararı verilir
   * Örnekler: "randevu_onay", "randevu_talep", "mesaj", "odeme", "kriz"
   */
  type: string;
  /** Ek veri — link, randevu ID, vb. */
  data?: Record<string, unknown>;
}

/**
 * Uygulama içi bildirim yazar ve Realtime broadcast gönderir.
 * Hem `bildirimler` tablosuna INSERT yapar hem de Supabase channel broadcast.
 *
 * Hata fırlatmaz — başarısız olursa `{ ok: false, error }` döner.
 */
export async function uygulamaIciBildirimGonder(
  payload: UygulamaIciBildirimPayload,
): Promise<{ ok: boolean; bildirimId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const channel: NotifChannel = "app";
    const delivery_status: DeliveryStatus = "pending";

    // 1. Bildirimler tablosuna yaz
    const { data: bildirim, error: insertError } = await supabase
      .from("bildirimler")
      .insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body ?? null,
        type: payload.type,
        channel,
        delivery_status,
        // Json tip — Record<string,unknown> Supabase Json uyumlu
        data: (payload.data ?? null) as Database["public"]["Tables"]["bildirimler"]["Insert"]["data"],
        retry_count: 0,
      })
      .select("id")
      .single();

    if (insertError || !bildirim) {
      return {
        ok: false,
        error: insertError?.message ?? "Bildirim kaydedilemedi",
      };
    }

    // 2. Delivery status'u sent olarak güncelle
    await supabase
      .from("bildirimler")
      .update({ delivery_status: "sent" })
      .eq("id", bildirim.id);

    // 3. Supabase Realtime broadcast — kullanıcıya özel kanal
    //    İstemci tarafında: supabase.channel(`user:${userId}`).on("broadcast", ...)
    const realtimeChannel = supabase.channel(`user:${payload.userId}`);
    await realtimeChannel.send({
      type: "broadcast",
      event: "bildirim",
      payload: {
        id: bildirim.id,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data,
      },
    });

    return { ok: true, bildirimId: bildirim.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Uygulama içi bildirim hatası",
    };
  }
}
