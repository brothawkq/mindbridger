-- Aynı danışman için aynı slot'ta çift randevu oluşmasını engeller (race condition koruması).
-- Yalnızca aktif (pending veya confirmed) ve soft-delete edilmemiş randevular için geçerlidir.
-- İptal edilmiş veya tamamlanmış randevular aynı slot'un yeniden kullanılmasına izin verir.

CREATE UNIQUE INDEX idx_randevular_unique_slot
  ON randevular (danisan_id, scheduled_at)
  WHERE status IN ('pending', 'confirmed')
    AND deleted_at IS NULL;
