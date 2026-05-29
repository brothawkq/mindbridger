-- 014_blog_admin_author.sql
-- Admin kullanıcıların blog yazısı oluşturabilmesi için:
-- 1. danisan_id nullable yapılır (admin yazılarında danisan yok)
-- 2. author_id eklenir (admin profil ID'si için)
-- 3. CHECK constraint: danisan_id veya author_id'den biri zorunlu

-- danisan_id artık nullable — admin yazıları için
ALTER TABLE blog_posts ALTER COLUMN danisan_id DROP NOT NULL;

-- Admin yazarı için author_id kolonu
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- En az bir yazar olmalı
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_author_check
  CHECK (danisan_id IS NOT NULL OR author_id IS NOT NULL);

-- Mevcut insert politikasını genişlet (admin kendi author_id ile ekler)
DROP POLICY IF EXISTS "blog_posts_insert_danisan" ON blog_posts;
CREATE POLICY "blog_posts_insert_danisan" ON blog_posts
  FOR INSERT WITH CHECK (
    -- Danışan: kendi danisanlar kaydına göre
    danisan_id = my_danisan_id()
    OR
    -- Admin: author_id kendi profil ID'si olmalı
    (is_admin() AND author_id = auth.uid())
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
