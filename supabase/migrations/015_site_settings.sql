-- 015_site_settings.sql
-- Site içerik yönetimi tablosu (admin editör için)

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktif
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (anon dahil)
CREATE POLICY "site_settings_select_all"
  ON site_settings FOR SELECT
  USING (true);

-- Sadece admin rolü yazabilir
CREATE POLICY "site_settings_insert_admin"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "site_settings_update_admin"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "site_settings_delete_admin"
  ON site_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Varsayılan içerik seed
INSERT INTO site_settings (key, value, description) VALUES
  ('hero_title_1',        'Ruh Sağlığınız İçin',                   'Hero bölüm - 1. satır başlık'),
  ('hero_title_2',        'Doğru Uzmanı Bulun',                    'Hero bölüm - 2. satır başlık'),
  ('hero_subtitle',       'Bireysel, çift veya kurumsal terapi',   'Hero bölüm - alt başlık'),
  ('hero_cta_primary',    'Danışman Bul',                          'Hero bölüm - ana CTA buton metni'),
  ('hero_cta_secondary',  'Nasıl Çalışır?',                        'Hero bölüm - ikincil CTA buton metni'),

  ('stat_1_value',  '500+',      'İstatistik 1 - değer'),
  ('stat_1_label',  'Onaylı Danışman',      'İstatistik 1 - etiket'),
  ('stat_2_value',  '15.000+',   'İstatistik 2 - değer'),
  ('stat_2_label',  'Tamamlanan Seans',     'İstatistik 2 - etiket'),
  ('stat_3_value',  '%97',       'İstatistik 3 - değer'),
  ('stat_3_label',  'Memnuniyet',           'İstatistik 3 - etiket'),
  ('stat_4_value',  '7/24',      'İstatistik 4 - değer'),
  ('stat_4_label',  'Destek',               'İstatistik 4 - etiket'),

  ('ticker_text',
   '500+ Onaylı Danışman · İlk 15 dk Ücretsiz Tanışma · KVKK Uyumlu · Lisanslı Uzmanlar · Güvenli Ödeme · 7/24 Erişim · ',
   'Ticker şeridinde kayan metin (· ile bölünmüş)'),

  ('how_title',          'Nasıl Çalışır?',           'Nasıl Çalışır bölüm başlığı'),
  ('why_title',          'Neden MindBridger?',        'Neden Biz bölüm başlığı'),
  ('consultants_title',  'Öne Çıkan Danışmanlar',    'Danışmanlar bölüm başlığı'),
  ('testimonials_title', 'Kullanıcılar Ne Diyor?',   'Yorumlar bölüm başlığı'),
  ('cta_final_title',    'Bugün Başlayın',            'Son CTA başlık'),
  ('cta_final_sub',      'İlk tanışma seansınız ücretsiz. Hemen danışman seçin.', 'Son CTA alt metin')

ON CONFLICT (key) DO NOTHING;

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();
