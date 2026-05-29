/**
 * Merkezi Bildirim Gönderici
 *
 * Kullanım:
 *   await bildirimGonder({
 *     userId: "...",
 *     title: "Randevunuz Onaylandı",
 *     body: "...",
 *     type: "randevu_onay",
 *     emailHtml: "<html>...",          // Resend ile gönderilecek HTML
 *     emailKonu: "Randevu Onayı",
 *     smsMetin: "Randevunuz onaylandı",
 *     data: { randevuId: "..." },
 *   });
 *
 * Kanal önceliği:
 *   1. Kullanıcının `profiles.notification_channel` tercihi
 *   2. Tip bazlı `bildirim_tercihleri` (randevu_email/randevu_sms/randevu_uygulama)
 *   3. Her başarısızlıkta `bildirimler.retry_count++`; maks 3 denemede `delivery_status=failed`
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { smsSend, smsNumaraGecerli } from "@/lib/netgsm/sms";
import { uygulamaIciBildirimGonder } from "@/lib/bildirim/uygulama-ici";
import { Resend } from "resend";
import type { Database } from "@/types/supabase";

type NotifChannel = Database["public"]["Enums"]["notif_channel"];
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
type NotifChannelPref = Database["public"]["Enums"]["notification_channel_pref"];

// Bildirim tipi — hangi bildirim_tercihleri alanlarını kontrol edeceğimizi belirler
type BildirimTip =
  | "randevu_talep"
  | "randevu_onay"
  | "randevu_hatirlatma"
  | "randevu_iptal"
  | "odeme_onay"
  | "iade_onay"
  | "mesaj"
  | "kriz"
  | "blog"
  | "pazarlama"
  | "sistem";

// Sadece seçtiğimiz sütunları içeren dar tip
type TercihSatir = {
  randevu_email: boolean;
  randevu_sms: boolean;
  randevu_uygulama: boolean;
  odeme_email: boolean;
  blog_email: boolean;
  marketing_email: boolean;
};
type TercihKey = keyof TercihSatir;

/** Bildirim tipi → bildirim_tercihleri sütun eşlemesi */
const TIP_TERCIH_ESLEME: Partial<Record<BildirimTip, {
  emailKey: TercihKey;
  smsKey?: TercihKey;
  uygulamaKey?: TercihKey;
}>> = {
  randevu_talep:      { emailKey: "randevu_email", smsKey: "randevu_sms", uygulamaKey: "randevu_uygulama" },
  randevu_onay:       { emailKey: "randevu_email", smsKey: "randevu_sms", uygulamaKey: "randevu_uygulama" },
  randevu_hatirlatma: { emailKey: "randevu_email", smsKey: "randevu_sms", uygulamaKey: "randevu_uygulama" },
  randevu_iptal:      { emailKey: "randevu_email", smsKey: "randevu_sms", uygulamaKey: "randevu_uygulama" },
  odeme_onay:         { emailKey: "odeme_email" },
  iade_onay:          { emailKey: "odeme_email" },
  blog:               { emailKey: "blog_email" },
  pazarlama:          { emailKey: "marketing_email" },
};

export interface BildirimPayload {
  /** Hedef kullanıcı ID (profiles.id) */
  userId: string;
  /** Bildirim başlığı */
  title: string;
  /** Kısa açıklama (uygulama içi bildirimde görünür) */
  body?: string;
  /**
   * Bildirim türü — tercih kontrolü için kullanılır.
   * "sistem" ve "kriz" tipleri tercih kontrolünü atlar, her zaman gönderilir.
   */
  type: BildirimTip;
  /** React Email ile render edilmiş HTML string */
  emailHtml?: string;
  /** E-posta konu satırı */
  emailKonu?: string;
  /** SMS metni (maks 160 karakter önerilir) */
  smsMetin?: string;
  /** Uygulama içi bildirim için ek veri */
  data?: Record<string, unknown>;
  /**
   * Kanalı zorla belirt — bildirim_tercihleri ve notification_channel'ı atlar.
   * Kullanım: admin toplu bildirimler, kriz uyarıları
   */
  kanalZorla?: NotifChannel | "hepsi";
}

interface GonderSonucu {
  ok: boolean;
  kanal: NotifChannel | null;
  hata?: string;
  bildirimId?: string;
}

const MAX_DENEME = 3;
const DENEME_BEKLEME_MS = 500; // 500ms arası bekleme

/**
 * Kısa gecikme (retry arası)
 */
function bekle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Merkezi bildirim gönderici.
 * Hata fırlatmaz — sonuç nesnesi döner.
 */
export async function bildirimGonder(
  payload: BildirimPayload,
): Promise<GonderSonucu> {
  try {
    const supabase = await createClient();

    // ──────────────────────────────────────────────
    // 1. Kullanıcı profil + bildirim tercihleri al
    // ──────────────────────────────────────────────
    // Email auth.users'dan service role ile alınır; profiles'da email sütunu yoktur
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceUrl || !serviceKey) {
      return { ok: false, kanal: null, hata: "Supabase service role env eksik" };
    }
    const serviceClient = createServiceClient(serviceUrl, serviceKey);

    const [{ data: profil }, { data: tercihler }, { data: authUser }] = await Promise.all([
      supabase
        .from("profiles")
        .select("phone, notification_channel")
        .eq("id", payload.userId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("bildirim_tercihleri")
        .select("randevu_email, randevu_sms, randevu_uygulama, odeme_email, blog_email, marketing_email")
        .eq("user_id", payload.userId)
        .maybeSingle(),
      serviceClient.auth.admin.getUserById(payload.userId),
    ]);

    if (!profil) {
      return { ok: false, kanal: null, hata: "Kullanıcı bulunamadı" };
    }

    const kullaniciEmail = authUser?.user?.email ?? null;

    // ──────────────────────────────────────────────
    // 2. Hangi kanallar aktif? Tercih kontrolü
    // ──────────────────────────────────────────────
    const sistemBildirim = payload.type === "sistem" || payload.type === "kriz";
    const tipEsleme = TIP_TERCIH_ESLEME[payload.type];

    const tercihSatir = tercihler as TercihSatir | null;

    function kanalAktif(kanal: "email" | "sms" | "app"): boolean {
      // Sistem/kriz bildirimleri her zaman gönderilir
      if (sistemBildirim) return true;
      if (!tercihSatir) return true; // tercih kaydı yoksa varsayılan: açık

      if (kanal === "email" && tipEsleme?.emailKey) {
        return tercihSatir[tipEsleme.emailKey];
      }
      if (kanal === "sms" && tipEsleme?.smsKey) {
        return tercihSatir[tipEsleme.smsKey];
      }
      if (kanal === "app" && tipEsleme?.uygulamaKey) {
        return tercihSatir[tipEsleme.uygulamaKey];
      }
      return true;
    }

    // ──────────────────────────────────────────────
    // 3. Kanal seçimi (zorla veya kullanıcı tercihi)
    // ──────────────────────────────────────────────
    let hedefKanalar: NotifChannel[] = [];

    if (payload.kanalZorla === "hepsi") {
      hedefKanalar = ["email", "sms", "app"];
    } else if (payload.kanalZorla) {
      hedefKanalar = [payload.kanalZorla];
    } else {
      // Kullanıcı notification_channel tercihini esas al
      const tercihKanal: NotifChannelPref = profil.notification_channel;

      if (tercihKanal === "email") {
        hedefKanalar = kanalAktif("email") ? ["email"] : [];
      } else if (tercihKanal === "sms") {
        hedefKanalar = kanalAktif("sms") ? ["sms"] : [];
      } else {
        // uygulama_ici
        hedefKanalar = kanalAktif("app") ? ["app"] : [];
      }

      // Uygulama içi her zaman ek olarak (eğer aktifse)
      if (tercihKanal !== "uygulama_ici" && kanalAktif("app")) {
        hedefKanalar.push("app");
      }
    }

    if (hedefKanalar.length === 0) {
      return { ok: true, kanal: null }; // Bildirim kapalı, sorun değil
    }

    // ──────────────────────────────────────────────
    // 4. Her kanal için gönder (retry dahil)
    // ──────────────────────────────────────────────
    let sonKanal: NotifChannel | null = null;
    let sonBildirimId: string | undefined;

    for (const kanal of hedefKanalar) {
      const sonuc = await kanalGonder(kanal, payload, kullaniciEmail, profil.phone);
      if (sonuc.ok) {
        sonKanal = kanal;
        sonBildirimId = sonuc.bildirimId;
      }
    }

    return { ok: true, kanal: sonKanal, bildirimId: sonBildirimId };
  } catch (err) {
    return {
      ok: false,
      kanal: null,
      hata: err instanceof Error ? err.message : "Merkezi bildirim hatası",
    };
  }
}

// ─── Kanal Bazlı Gönderim ─────────────────────────────────────────────────────

interface KanalSonucu {
  ok: boolean;
  bildirimId?: string;
  hata?: string;
}

async function kanalGonder(
  kanal: NotifChannel,
  payload: BildirimPayload,
  email: string | null,
  telefon: string | null,
): Promise<KanalSonucu> {
  for (let deneme = 0; deneme < MAX_DENEME; deneme++) {
    try {
      if (kanal === "email") {
        await emailGonder(payload, email);
      } else if (kanal === "sms") {
        await smsGonder(payload, telefon);
      } else {
        // app
        const sonuc = await uygulamaIciBildirimGonder({
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data,
        });
        if (!sonuc.ok) throw new Error(sonuc.error ?? "Uygulama içi bildirim hatası");
        return { ok: true, bildirimId: sonuc.bildirimId };
      }

      // Başarılı → bildirimler tablosuna kaydet
      const bildirimId = await bildirimKaydet({
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        kanal,
        data: payload.data,
        durum: "sent",
        retryCount: deneme,
      });
      return { ok: true, bildirimId };
    } catch (err) {
      const sonDeneme = deneme === MAX_DENEME - 1;
      const hata = err instanceof Error ? err.message : "Bilinmeyen hata";

      if (sonDeneme) {
        // Kalıcı başarısızlık — failed olarak kaydet
        const bildirimId = await bildirimKaydet({
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          kanal,
          data: payload.data,
          durum: "failed",
          retryCount: deneme + 1,
        });
        return { ok: false, hata, bildirimId };
      }

      // Bekle ve yeniden dene
      await bekle(DENEME_BEKLEME_MS * (deneme + 1));
    }
  }

  return { ok: false, hata: "Maksimum deneme sayısı aşıldı" };
}

// ─── Email Gönderimi (Resend) ──────────────────────────────────────────────────

async function emailGonder(
  payload: BildirimPayload,
  aliciEmail: string | null,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY tanımlı değil");
  if (!aliciEmail) throw new Error("Alıcı e-posta adresi bulunamadı");
  if (!payload.emailHtml) throw new Error("E-posta HTML içeriği sağlanmadı");

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from: "MindBridger <bildirim@mindbridger.com>",
    to: aliciEmail,
    subject: payload.emailKonu ?? payload.title,
    html: payload.emailHtml,
  });

  if (error) throw new Error(error.message);
}

// ─── SMS Gönderimi (Netgsm) ───────────────────────────────────────────────────

async function smsGonder(
  payload: BildirimPayload,
  telefon: string | null,
): Promise<void> {
  if (!telefon) throw new Error("Alıcı telefon numarası bulunamadı");
  if (!smsNumaraGecerli(telefon)) throw new Error(`Geçersiz GSM numarası: ${telefon}`);
  if (!payload.smsMetin) throw new Error("SMS metni sağlanmadı");

  await smsSend({ telefon, mesaj: payload.smsMetin });
}

// ─── bildirimler Tablosuna Kaydet ────────────────────────────────────────────

interface BildirimKaydetParams {
  userId: string;
  title: string;
  body?: string;
  type: string;
  kanal: NotifChannel;
  data?: Record<string, unknown>;
  durum: DeliveryStatus;
  retryCount: number;
}

async function bildirimKaydet(params: BildirimKaydetParams): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bildirimler")
      .insert({
        user_id: params.userId,
        title: params.title,
        body: params.body ?? null,
        type: params.type,
        channel: params.kanal,
        delivery_status: params.durum,
        retry_count: params.retryCount,
        data: (params.data ?? null) as Database["public"]["Tables"]["bildirimler"]["Insert"]["data"],
      })
      .select("id")
      .single();
    return data?.id ?? "";
  } catch {
    // Kayıt hatası bildirimi engellemesin
    return "";
  }
}
