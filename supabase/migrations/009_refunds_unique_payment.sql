-- DEN-15: Çift iade (double refund) race condition düzeltmesi
-- Aynı payment için iki eşzamanlı iptal isteği duplicate refund kaydı oluşturabilir.
-- Partial index: silinmiş kayıtlar kısıta dahil edilmez.

CREATE UNIQUE INDEX idx_refunds_unique_payment
  ON refunds (payment_id)
  WHERE deleted_at IS NULL;
