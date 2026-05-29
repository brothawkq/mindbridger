-- ============================================================
-- 013_grant_permissions.sql
-- PostgREST rolleri için tablo ve sekans izinleri
--
-- Neden gerekli:
--   Supabase'de tablolar migration ile oluşturulursa PostgREST
--   rolleri (anon, authenticated, service_role) için varsayılan
--   GRANT'lar otomatik eklenmez. Bu migration eksik izinleri ekler.
--
-- Çalıştırma: npx supabase db push
-- ============================================================

-- ── Mevcut tablolara izin ver ────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role: RLS'yi zaten atlar, ama tablo erişimi GRANT gerektirir
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO service_role;

-- authenticated: giriş yapmış kullanıcılar — RLS politikaları uygulanır
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO authenticated;

-- anon: misafir kullanıcılar — RLS politikaları uygulanır (genelde sadece SELECT)
GRANT SELECT
  ON ALL TABLES IN SCHEMA public TO anon;

-- Sekanslar (UUID gen_random_uuid yerine serial/sequence kullanan tablolar için)
GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- ── Gelecekte oluşturulacak tablolar için varsayılan izinler ─

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role, authenticated;
