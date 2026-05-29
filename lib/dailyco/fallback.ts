import { DailyApiError } from "./client";

export function isDailyError(err: unknown): err is DailyApiError {
  return err instanceof DailyApiError;
}

/**
 * Daily.co hatasını kullanıcıya gösterilecek Türkçe mesaja çevirir.
 * PRD: "Daily.co erişilemez durumda ise kullanıcıya anlamlı Türkçe hata mesajı gösterilir."
 */
export function turkceHataMesaji(err: unknown): string {
  if (isDailyError(err)) {
    switch (err.statusCode) {
      case 401:
      case 403:
        return "Video bağlantısı için yetkilendirme başarısız. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.";
      case 404:
        return "Video odası bulunamadı. Randevu bilgileri güncel olmayabilir, lütfen sayfayı yenileyin.";
      case 429:
        return "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.";
      case 502:
      case 503:
      case 504:
        return "Video servisi şu anda geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin veya danışmanınıza e-posta gönderin.";
      default:
        return "Video bağlantısı kurulamadı. Lütfen sayfayı yenileyip tekrar deneyin.";
    }
  }

  // Ağ/fetch hatası
  if (err instanceof TypeError) {
    return "İnternet bağlantısı sorunu. Video servisine ulaşılamıyor, lütfen bağlantınızı kontrol edin.";
  }

  return "Video servisi şu anda kullanılamıyor. Alternatif iletişim için danışmanınıza e-posta gönderin.";
}

/** Admin paneline gönderilecek uyarı metni */
export const ADMIN_UYARI_MESAJI =
  "⚠ Daily.co servisi erişilemez durumda. Etkilenen randevular için müşterilere bildirim gönderilmelidir.";
