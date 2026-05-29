-- MindBridger Seed Data
-- platform_ayarlari, rozetler_tanim, kriz_kelimeleri

-- ============================================================
-- PLATFORM AYARLARI
-- ============================================================
INSERT INTO platform_ayarlari (key, value, description) VALUES
  ('commission_rate',                  '20',           'Platform komisyon oranı (%)'),
  ('cancel_full_refund_hours',         '24',           'Tam iade için iptal süresi (saat)'),
  ('cancel_partial_refund_hours',      '2',            'Kısmi iade için iptal süresi (saat)'),
  ('cancel_partial_refund_percent',    '50',           'Kısmi iade oranı (%)'),
  ('payout_day',                       'friday',       'Haftalık ödeme günü'),
  ('intro_session_duration',           '15',           'Ön görüşme süresi (dakika)'),
  ('session_timeout_minutes',          '30',           'Hareketsizlik oturum zaman aşımı (dakika)'),
  ('account_lock_minutes',             '15',           'Başarısız girişten sonra hesap kilit süresi (dakika)'),
  ('account_lock_attempts',            '5',            'Hesap kilitleme için başarısız giriş sayısı'),
  ('ip_ban_hours',                     '24',           'IP ban süresi (saat)'),
  ('ip_ban_attempts',                  '50',           'IP ban için başarısız giriş sayısı'),
  ('video_link_active_minutes_before', '10',           'Video bağlantısının aktif olduğu süre (randevu öncesi dakika)'),
  ('max_file_upload_mb',               '10',           'Maksimum dosya yükleme boyutu (MB)'),
  ('audit_log_retention_days',         '90',           'Audit log saklama süresi (gün)'),
  ('platform_name',                    'MindBridger',  'Platform adı')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ============================================================
-- ROZETLER_TANIM
-- ============================================================
INSERT INTO rozetler_tanim (code, name, description, icon, condition) VALUES
  (
    'ilk_adim',
    'İlk Adım',
    'İlk seansını tamamladın! Yolculuğun başladı.',
    '🌱',
    '{"type": "session_count", "threshold": 1}'::jsonb
  ),
  (
    'kararlı',
    'Kararlı',
    '3 seans tamamladın. Devam etme kararlılığın takdire değer.',
    '💪',
    '{"type": "session_count", "threshold": 3}'::jsonb
  ),
  (
    'yolda',
    'Yolda',
    '10 seansı geride bıraktın. Büyüme yolundasın.',
    '🚀',
    '{"type": "session_count", "threshold": 10}'::jsonb
  ),
  (
    'uzman_yolcusu',
    'Uzman Yolcusu',
    '25 seans tamamladın. Gelişiminde gerçek bir adanmışlık görüyoruz.',
    '⭐',
    '{"type": "session_count", "threshold": 25}'::jsonb
  ),
  (
    'kesfeden',
    'Keşfeden',
    'İlk psikolojik testini tamamladın.',
    '🔍',
    '{"type": "test_count", "threshold": 1}'::jsonb
  ),
  (
    'kendini_taniyan',
    'Kendini Tanıyan',
    '5 farklı test tamamladın. İç dünyandan haberdar oluyorsun.',
    '🧠',
    '{"type": "test_count", "threshold": 5}'::jsonb
  ),
  (
    'kalemini_al',
    'Kalemini Al',
    'İlk günlük girişini yaptın. Yazmak iyileştirir.',
    '📝',
    '{"type": "journal_count", "threshold": 1}'::jsonb
  ),
  (
    'hafiza',
    'Hafıza',
    '7 gün üst üste günlük yazdın. Süreklilik güçtür.',
    '🔥',
    '{"type": "journal_streak", "threshold": 7}'::jsonb
  ),
  (
    'duzenli',
    'Düzenli',
    '30 gün üst üste günlük yazdın. Alışkanlık kalıcı değişimi başlatır.',
    '🏆',
    '{"type": "journal_streak", "threshold": 30}'::jsonb
  ),
  (
    'caliskan',
    'Çalışkan',
    'İlk ödevi tamamladın. Seanslar arası çalışma fark yaratır.',
    '✅',
    '{"type": "assignment_count", "threshold": 1}'::jsonb
  ),
  (
    'ogrenen',
    'Öğrenen',
    '10 ödev tamamladın. Terapötik süreci tam anlamıyla yaşıyorsun.',
    '📚',
    '{"type": "assignment_count", "threshold": 10}'::jsonb
  ),
  (
    'webinar_izleyicisi',
    'Webinar İzleyicisi',
    'İlk webinara katıldın. Öğrenmeye açık bir zihin değerlidir.',
    '🎓',
    '{"type": "webinar_count", "threshold": 1}'::jsonb
  ),
  (
    'topluluk_uyesi',
    'Topluluk Üyesi',
    '3 webinara katıldın. Paylaşılan bilgi güçlenir.',
    '🤝',
    '{"type": "webinar_count", "threshold": 3}'::jsonb
  ),
  (
    'sadik',
    'Sadık',
    'Platformda 30 gün boyunca aktiftin. Tutarlılık değişimi getirir.',
    '💎',
    '{"type": "login_streak", "threshold": 30}'::jsonb
  ),
  (
    'degerlendiren',
    'Değerlendiren',
    'İlk danışman değerlendirmeni yaptın. Geri bildirim herkese değer katar.',
    '⭐',
    '{"type": "review_count", "threshold": 1}'::jsonb
  )
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      condition = EXCLUDED.condition;

-- ============================================================
-- KRİZ KELİMELERİ
-- ============================================================
INSERT INTO kriz_kelimeleri (word, severity, is_active) VALUES
  -- Yüksek Risk
  ('intihar',                  'high',   true),
  ('kendimi öldürmek',         'high',   true),
  ('hayatıma son vermek',      'high',   true),
  ('ölmek istiyorum',          'high',   true),
  ('yaşamak istemiyorum',      'high',   true),
  ('kendime zarar vermek',     'high',   true),
  ('kendime zarar',            'high',   true),
  ('intihar düşüncesi',        'high',   true),
  ('intihar planı',            'high',   true),
  ('öldürmeyi düşünüyorum',    'high',   true),
  ('bu dünyada olmak istemiyorum', 'high', true),

  -- Orta Risk
  ('umutsuz',                  'medium', true),
  ('çaresiz',                  'medium', true),
  ('değersiz hissediyorum',    'medium', true),
  ('kimse umursamıyor',        'medium', true),
  ('artık dayanamıyorum',      'medium', true),
  ('her şeyden vazgeçmek',     'medium', true),
  ('devam edemiyorum',         'medium', true),
  ('yok olmak istiyorum',      'medium', true),
  ('acı çekmekten bıktım',     'medium', true),
  ('kendime zarar verdim',     'medium', true),

  -- Düşük Risk
  ('çok mutsuzum',             'low',    true),
  ('depresyonum',              'low',    true),
  ('anksiyete',                'low',    true),
  ('panik atak',               'low',    true),
  ('uyuyamıyorum',             'low',    true),
  ('yemek yiyemiyorum',        'low',    true),
  ('hiç enerjim yok',          'low',    true),
  ('ağlıyorum sürekli',        'low',    true),
  ('kendimi kötü hissediyorum','low',    true),
  ('bunalımdayım',             'low',    true)
ON CONFLICT DO NOTHING;
