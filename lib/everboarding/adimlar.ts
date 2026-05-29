/**
 * Everboarding — Kullanıcı Görev Listesi
 *
 * Müşteri ve danışman rollerine özel ilk katılım adımlarını tanımlar.
 * Tamamlanma kontrolü ve 3/7/14. gün hatırlatma tetikleyicileri içerir.
 *
 * "Everboarding" = onboarding + sürekli teşvik. Kullanıcı ilk girişten
 * sonra tamamlaması gereken mikro görevler aracılığıyla platforma alıştırılır.
 *
 * Mimari not: Bu modül yalnızca tanım ve hesaplama içerir.
 * DB yazma işlemleri API route'larında yapılmalıdır.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

// ─── Tipler ───────────────────────────────────────────────────────

export type EverboardingRol = "musteri" | "danisan";

export interface EverboardingAdim {
  /** Benzersiz görev kimliği (slug formatı) */
  id: string;
  /** Kullanıcıya gösterilecek başlık */
  baslik: string;
  /** Ek açıklama */
  aciklama: string;
  /** Tamamlanma kontrolü için kullanılan alan veya işlem */
  kontrol: "profil_foto" | "ilk_randevu" | "musaitlik_ayar" | "profil_tamamla" | "profil_yayinla" | "banka_bilgi" | "ilk_seans";
  /** XP puanı (gamification Faz 12'de devreye girer) */
  xp: number;
  /** Kaç gün sonra hatırlatma gönderilecek (null = hatırlatma yok) */
  hatirlatma_gunu: 3 | 7 | 14 | null;
}

export interface EverboardingDurum {
  adim: EverboardingAdim;
  tamamlandi: boolean;
  tamamlanma_tarihi: string | null;
}

// ─── Müşteri adımları ─────────────────────────────────────────────

export const MUSTERI_ADIMLARI: EverboardingAdim[] = [
  {
    id:               "profil_foto_yukle",
    baslik:           "Profil Fotoğrafı Ekle",
    aciklama:         "Danışmanlar sizi daha iyi tanısın.",
    kontrol:          "profil_foto",
    xp:               50,
    hatirlatma_gunu:  3,
  },
  {
    id:               "ilk_randevu_al",
    baslik:           "İlk Randevuyu Al",
    aciklama:         "Size uygun bir danışman bulun ve ilk seansınızı planlayın.",
    kontrol:          "ilk_randevu",
    xp:               100,
    hatirlatma_gunu:  7,
  },
  {
    id:               "profil_tercih_tamamla",
    baslik:           "Profil Tercihlerini Tamamla",
    aciklama:         "İletişim tercihleri ve bildirim ayarlarını yapılandırın.",
    kontrol:          "profil_tamamla",
    xp:               30,
    hatirlatma_gunu:  14,
  },
];

// ─── Danışman adımları ────────────────────────────────────────────

export const DANISAN_ADIMLARI: EverboardingAdim[] = [
  {
    id:               "profil_foto_yukle",
    baslik:           "Profil Fotoğrafı Ekle",
    aciklama:         "Müşterilerin ilk izlenimi sizi görmekle oluşur.",
    kontrol:          "profil_foto",
    xp:               50,
    hatirlatma_gunu:  3,
  },
  {
    id:               "musaitlik_ayarla",
    baslik:           "Müsaitlik Takvimi Oluştur",
    aciklama:         "Hangi gün ve saatlerde görüşebileceğinizi belirleyin.",
    kontrol:          "musaitlik_ayar",
    xp:               80,
    hatirlatma_gunu:  3,
  },
  {
    id:               "profil_tamamla",
    baslik:           "Profilini Tamamla",
    aciklama:         "Bio, uzmanlık alanları ve yaklaşımınızı ekleyin.",
    kontrol:          "profil_tamamla",
    xp:               60,
    hatirlatma_gunu:  7,
  },
  {
    id:               "profili_yayinla",
    baslik:           "Profilini Yayınla",
    aciklama:         "Profil onaylandıktan sonra yayına alarak müşterilere görünür olun.",
    kontrol:          "profil_yayinla",
    xp:               100,
    hatirlatma_gunu:  7,
  },
  {
    id:               "banka_bilgi_dogrula",
    baslik:           "Banka Bilgilerini Doğrula",
    aciklama:         "Ödeme alabilmek için IBAN bilgilerinizin doğru olduğundan emin olun.",
    kontrol:          "banka_bilgi",
    xp:               40,
    hatirlatma_gunu:  14,
  },
  {
    id:               "ilk_seans_tamamla",
    baslik:           "İlk Seansını Tamamla",
    aciklama:         "Platformdaki ilk seansınızı tamamlayarak kariyer yolculuğunuza başlayın.",
    kontrol:          "ilk_seans",
    xp:               150,
    hatirlatma_gunu:  14,
  },
];

// ─── Tamamlanma kontrol fonksiyonları ────────────────────────────

/**
 * Verilen kullanıcı ID'si için adımların tamamlanma durumunu kontrol eder.
 * DB'den gerekli verileri çeker; server component veya API route'dan çağrılmalıdır.
 */
export async function getEverboardingDurum(
  userId: string,
  rol: EverboardingRol
): Promise<EverboardingDurum[]> {
  const supabase = await createClient();

  const adimlar = rol === "musteri" ? MUSTERI_ADIMLARI : DANISAN_ADIMLARI;

  // Profil verisini çek
  const { data: profil } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  // Danışman profil verisini çek (danışman ise)
  // FIX #3: danisanlar.id de alınıyor — musaitlik ve randevu sorgularında
  //         danisan_id = danisanlar.id (profiles.id değil)
  const { data: danisanRow } =
    rol === "danisan"
      ? await supabase
          .from("danisanlar")
          .select("id, profile_published, bank_iban, profile_completion_percent")
          .eq("profile_id", userId)
          .single()
      : { data: null };

  const danisanId = danisanRow?.id ?? null;

  // Müsaitlik kaydı var mı? (danisan_musaitlik.danisan_id = danisanlar.id)
  // FIX #3: danisanId kullanılıyor (userId değil)
  const { count: musaitlikCount } =
    rol === "danisan" && danisanId
      ? await supabase
          .from("danisan_musaitlik")
          .select("id", { count: "exact", head: true })
          .eq("danisan_id", danisanId)
      : { count: null };

  // Randevu kaydı var mı?
  // FIX #2: önceki sürümde .eq() dönüş değeri atılıyordu → filtre uygulanmıyordu.
  // FIX #3: randevular.danisan_id = danisanlar.id → danisanId kullanılıyor.
  let randevuCount: number | null = null;

  if (rol === "musteri") {
    const { count } = await supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", userId);
    randevuCount = count;
  } else if (rol === "danisan" && danisanId) {
    const { count } = await supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("danisan_id", danisanId)
      .eq("status", "completed");
    randevuCount = count;
  }

  // Her adım için tamamlanma durumunu hesapla
  const durumlar: EverboardingDurum[] = adimlar.map((adim) => {
    let tamamlandi = false;

    switch (adim.kontrol) {
      case "profil_foto":
        tamamlandi = !!profil?.avatar_url;
        break;
      case "ilk_randevu":
        tamamlandi = (randevuCount ?? 0) > 0;
        break;
      case "musaitlik_ayar":
        tamamlandi = (musaitlikCount ?? 0) > 0;
        break;
      case "profil_tamamla":
        tamamlandi =
          rol === "danisan"
            ? (danisanRow?.profile_completion_percent ?? 0) >= 80
            : !!profil?.avatar_url;
        break;
      case "profil_yayinla":
        tamamlandi = danisanRow?.profile_published === true;
        break;
      case "banka_bilgi":
        tamamlandi = !!danisanRow?.bank_iban;
        break;
      case "ilk_seans":
        tamamlandi = (randevuCount ?? 0) > 0;
        break;
    }

    return {
      adim,
      tamamlandi,
      tamamlanma_tarihi: tamamlandi ? new Date().toISOString() : null,
    };
  });

  return durumlar;
}

// ─── Hatırlatma tetikleyici ───────────────────────────────────────

/**
 * Belirli gün eşiğindeki bekleyen adımları döndürür.
 * Cron job'dan (vercel.json) çağrılır: `/api/cron/everboarding-hatirlatma`
 *
 * @param gun  Kaçıncı gün tetiklemesi: 3, 7 veya 14
 */
export async function getHatirlatmaGerektirenAdimlar(
  userId: string,
  rol: EverboardingRol,
  gun: 3 | 7 | 14
): Promise<EverboardingAdim[]> {
  const durumlar = await getEverboardingDurum(userId, rol);

  return durumlar
    .filter(
      (d) =>
        !d.tamamlandi &&
        d.adim.hatirlatma_gunu === gun
    )
    .map((d) => d.adim);
}

// ─── Tamamlanma yüzdesi ───────────────────────────────────────────

/**
 * Kullanıcının everboarding tamamlanma yüzdesini hesaplar.
 * Gamification için XP bazlı hesaplama yapar.
 */
export function tamamlanmaYuzdesi(durumlar: EverboardingDurum[]): number {
  if (durumlar.length === 0) return 0;

  const toplamXp   = durumlar.reduce((sum, d) => sum + d.adim.xp, 0);
  const kazanilanXp = durumlar
    .filter((d) => d.tamamlandi)
    .reduce((sum, d) => sum + d.adim.xp, 0);

  return toplamXp === 0 ? 0 : Math.round((kazanilanXp / toplamXp) * 100);
}
