-- DEN-14: Payout idempotency race condition düzeltmesi
-- Aynı dönem için aynı danışmana iki payout kaydı oluşmasını önler.
-- Partial index: silinmiş (deleted_at IS NOT NULL) kayıtlar kısıta dahil edilmez.

CREATE UNIQUE INDEX idx_payouts_unique_period
  ON payouts (danisan_id, period_start, period_end)
  WHERE deleted_at IS NULL;
