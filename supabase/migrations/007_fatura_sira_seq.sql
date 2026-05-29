-- DEN-13: Fatura numarası yarış koşulu düzeltmesi
-- Sayım tabanlı numara üretimi atomik olmadığından iki eşzamanlı istek
-- aynı invoice_number'ı üretebilir. PostgreSQL sequence ile atomiklik sağlanır.

CREATE SEQUENCE IF NOT EXISTS fatura_sira_seq START 1;

-- Mevcut en yüksek sıra numarasını bul; tablo boşsa 1'den başla
SELECT setval(
  'fatura_sira_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(
          CAST(split_part(invoice_number, '-', 3) AS BIGINT)
        )
        FROM seans_faturalari
        WHERE invoice_number ~ '^MBR-[0-9]{4}-[0-9]+$'
      ),
      1
    ),
    1
  )
);

-- Atomik sıra numarası üretici RPC
CREATE OR REPLACE FUNCTION get_next_fatura_sira()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT LPAD(nextval('fatura_sira_seq')::text, 6, '0');
$$;
