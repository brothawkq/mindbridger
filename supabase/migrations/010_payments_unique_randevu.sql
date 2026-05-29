-- DEN-17: Çift ödeme (duplicate payment) race condition düzeltmesi
-- Aynı randevu_id için iki eşzamanlı baslat isteği iki iyzico oturumu oluşturabilir.
-- Partial index: başarısız (failed) ve silinmiş kayıtlar kısıtın dışında tutulur.

CREATE UNIQUE INDEX idx_payments_unique_randevu
  ON payments (randevu_id)
  WHERE status <> 'failed'
    AND deleted_at IS NULL;
