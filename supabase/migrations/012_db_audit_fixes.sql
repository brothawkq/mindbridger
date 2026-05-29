-- Migration 012: Veritabanı Denetim Düzeltmeleri
-- DEN-27: profiles RLS — yayınlanmış danışman profilleri herkese açık olmalı
-- DEN-28: kriz_kelimeleri RLS — kimlik doğrulanmış kullanıcılar SELECT yapamıyor (kriz tespiti kırık)
-- DEN-29: blog_posts RLS — soft-deleted yayınlanmış yazılar hâlâ görünür
-- DEN-30: Yardımcı fonksiyonlar SET search_path = '' eksik (SECURITY DEFINER güvenlik açığı)
-- DEN-31: Eksik indeksler (performans)
-- DEN-32: seans_faturalari.randevu_id — tekil kısıtlama eksik (mükerrer fatura riski)

-- ============================================================
-- DEN-27: profiles — yayınlanmış danışman profilleri public SELECT
-- Sorun: createClient() ile anon/non-owner kullanıcılar profiles verisini göremiyor.
-- Danışman isim/avatar JOIN'lerinde null döndürülüyor.
-- ============================================================
CREATE POLICY "profiles_select_danisan_public" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.danisanlar d
      WHERE d.profile_id = public.profiles.id
        AND d.profile_published = true
        AND d.deleted_at IS NULL
    )
  );

-- ============================================================
-- DEN-28: kriz_kelimeleri — kimlik doğrulanmış SELECT
-- Sorun: Yalnızca admin politikası var; gunluk/route.ts createClient() ile
--        kriz_kelimeleri sorgular → her zaman boş döner → kriz uyarıları hiç tetiklenmez.
-- ============================================================
CREATE POLICY "kriz_kelimeleri_select_authenticated" ON public.kriz_kelimeleri
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- ============================================================
-- DEN-29: blog_posts — soft-delete filtresi RLS politikasına eklendi
-- Sorun: status='published' AND deleted_at IS NOT NULL olan yazılar public SELECT politikasında görünür.
-- ============================================================
DROP POLICY IF EXISTS "blog_posts_public_select" ON public.blog_posts;

CREATE POLICY "blog_posts_public_select" ON public.blog_posts
  FOR SELECT USING (
    (status = 'published' AND deleted_at IS NULL)
    OR danisan_id = my_danisan_id()
    OR is_admin()
  );

-- ============================================================
-- DEN-30: Yardımcı fonksiyonlar — SET search_path = '' eklendi
-- Sorun: SECURITY DEFINER fonksiyonlarda sabit search_path olmadan search_path injection riski.
--        Tüm tablo referansları public. önekiyle tam nitelendi.
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION my_danisan_id()
RETURNS uuid AS $$
  SELECT id FROM public.danisanlar
  WHERE profile_id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '';

-- ============================================================
-- DEN-31: Eksik indeksler
-- ============================================================

-- payments: danışman bazlı sorgular + durum filtrelemesi
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_danisan
  ON public.payments(danisan_id);

-- danisanlar: danışman keşfi sorgusunun birincil filtre kombinasyonu
CREATE INDEX IF NOT EXISTS idx_danisanlar_published_complete
  ON public.danisanlar(profile_published, profile_completion_percent)
  WHERE deleted_at IS NULL;

-- audit_logs: admin sorgularında action filtresi + zaman bazlı temizleme
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON public.audit_logs(created_at);

-- bildirimler: okunmamış bildirim sayısı sorgusu (WHERE read_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_bildirimler_user_unread
  ON public.bildirimler(user_id, read_at)
  WHERE deleted_at IS NULL;

-- messages: konuşma başlıklı zaman sıralaması
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages(conversation_id, created_at)
  WHERE deleted_at IS NULL;

-- blog_posts: public blog listesi ve yönetim sorguları
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
  ON public.blog_posts(status, published_at)
  WHERE deleted_at IS NULL;

-- ============================================================
-- DEN-33: randevular.notes_private — kolon düzeyinde erişim kısıtlaması
-- Sorun: musteri, Supabase PostgREST API üzerinden kendi randevusundaki
--        danışman klinik notlarını (notes_private) okuyabiliyordu.
--        API route uygulama katmanında filtreler ama DB düzeyinde korumasız.
-- Çözüm: authenticated rolünden notes_private SELECT yetkisi kaldırıldı.
--        Danışman paneli server componentları createAdminClient() kullanacak.
-- ============================================================
REVOKE SELECT (notes_private) ON public.randevular FROM authenticated;

-- randevular(deleted_at) — soft-delete filtreli sorgular için
-- Eksik indeks: DENETIM.md 2.4
CREATE INDEX IF NOT EXISTS idx_randevular_deleted
  ON public.randevular(deleted_at);

-- ============================================================
-- DEN-32: seans_faturalari.randevu_id — mükerrer fatura kısıtlaması
-- Sorun: Aynı randevu için eşzamanlı faturaOlustur() çağrıları birden fazla fatura yaratabilir.
-- Çözüm: Partial unique index (NULL ve soft-deleted kayıtlar hariç).
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_seans_faturalari_randevu
  ON public.seans_faturalari(randevu_id)
  WHERE randevu_id IS NOT NULL AND deleted_at IS NULL;
