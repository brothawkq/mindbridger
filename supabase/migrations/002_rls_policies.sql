-- ============================================================
-- MindBridger — RLS Politikaları
-- CONFLICTS.md: hassas veri (notes_private, gunluk note,
-- test_sonuclari.answers, onboarding_yanitlar.answers)
-- → müşteri: kendi kaydı; danışman: paylaşılanlar; admin: erişim yok
-- ============================================================

-- Yardımcı fonksiyonlar
create or replace function get_my_role()
returns text as $$
  select role::text from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Danışmanın kendi danisanlar.id'sini döndürür
create or replace function my_danisan_id()
returns uuid as $$
  select id from danisanlar where profile_id = auth.uid() and deleted_at is null limit 1;
$$ language sql security definer stable;

-- ============================================================
-- profiles
-- ============================================================
alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid() or is_admin());

-- ============================================================
-- ip_blacklist — sadece service_role erişir (sunucu tarafı)
-- ============================================================
alter table ip_blacklist enable row level security;

create policy "ip_blacklist_admin_only" on ip_blacklist
  for all using (is_admin());

-- ============================================================
-- danisanlar
-- ============================================================
alter table danisanlar enable row level security;

-- Yayındaki profiller herkese açık
create policy "danisanlar_public_select" on danisanlar
  for select using (
    (profile_published = true and deleted_at is null)
    or profile_id = auth.uid()
    or is_admin()
  );

create policy "danisanlar_insert_own" on danisanlar
  for insert with check (profile_id = auth.uid());

create policy "danisanlar_update_own" on danisanlar
  for update using (profile_id = auth.uid() or is_admin());

-- ============================================================
-- danisan_musaitlik
-- ============================================================
alter table danisan_musaitlik enable row level security;

create policy "danisan_musaitlik_public_select" on danisan_musaitlik
  for select using (deleted_at is null);

create policy "danisan_musaitlik_manage_own" on danisan_musaitlik
  for all using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- danisan_izin
-- ============================================================
alter table danisan_izin enable row level security;

create policy "danisan_izin_select" on danisan_izin
  for select using (danisan_id = my_danisan_id() or is_admin());

create policy "danisan_izin_manage_own" on danisan_izin
  for all using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- danisan_paketler
-- ============================================================
alter table danisan_paketler enable row level security;

create policy "danisan_paketler_public_select" on danisan_paketler
  for select using (is_active = true and deleted_at is null);

create policy "danisan_paketler_manage_own" on danisan_paketler
  for all using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- randevular
-- NOT: notes_private sütunu uygulama katmanında gizlenir;
--      danışman API route'u bu alanı müşteriye dönmez.
-- ============================================================
alter table randevular enable row level security;

create policy "randevular_select" on randevular
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or partner_id = auth.uid()
    or is_admin()
  );

create policy "randevular_insert_musteri" on randevular
  for insert with check (
    musteri_id = auth.uid()
    or is_admin()
  );

create policy "randevular_update" on randevular
  for update using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

-- ============================================================
-- musteri_paketler
-- ============================================================
alter table musteri_paketler enable row level security;

create policy "musteri_paketler_select" on musteri_paketler
  for select using (
    musteri_id = auth.uid()
    or exists (
      select 1 from danisan_paketler dp
      where dp.id = danisan_paket_id
        and dp.danisan_id = my_danisan_id()
    )
    or is_admin()
  );

create policy "musteri_paketler_insert" on musteri_paketler
  for insert with check (musteri_id = auth.uid() or is_admin());

create policy "musteri_paketler_update" on musteri_paketler
  for update using (musteri_id = auth.uid() or is_admin());

-- ============================================================
-- bekleme_listesi
-- ============================================================
alter table bekleme_listesi enable row level security;

create policy "bekleme_listesi_select" on bekleme_listesi
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

create policy "bekleme_listesi_insert" on bekleme_listesi
  for insert with check (musteri_id = auth.uid());

create policy "bekleme_listesi_delete" on bekleme_listesi
  for delete using (musteri_id = auth.uid() or is_admin());

-- ============================================================
-- payments
-- ============================================================
alter table payments enable row level security;

create policy "payments_select" on payments
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

-- Ödeme oluşturma sadece sunucu tarafında (service_role)
create policy "payments_insert_admin" on payments
  for insert with check (is_admin());

create policy "payments_update_admin" on payments
  for update using (is_admin());

-- ============================================================
-- payouts
-- ============================================================
alter table payouts enable row level security;

create policy "payouts_select" on payouts
  for select using (
    danisan_id = my_danisan_id()
    or is_admin()
  );

create policy "payouts_manage_admin" on payouts
  for all using (is_admin());

-- ============================================================
-- refunds
-- ============================================================
alter table refunds enable row level security;

create policy "refunds_select" on refunds
  for select using (
    initiated_by = auth.uid()
    or exists (
      select 1 from payments p
      where p.id = payment_id and p.musteri_id = auth.uid()
    )
    or exists (
      select 1 from payments p
      where p.id = payment_id and p.danisan_id = my_danisan_id()
    )
    or is_admin()
  );

create policy "refunds_manage_admin" on refunds
  for all using (is_admin());

-- ============================================================
-- seans_faturalari
-- ============================================================
alter table seans_faturalari enable row level security;

create policy "seans_faturalari_select" on seans_faturalari
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or exists (
      select 1 from kurumsal_kullanicilar kk
      join kurumsal_hesaplar kh on kh.id = kk.kurumsal_id
      where kk.musteri_id = auth.uid()
        and kh.id = kurumsal_id
    )
    or is_admin()
  );

create policy "seans_faturalari_manage_admin" on seans_faturalari
  for all using (is_admin());

-- ============================================================
-- conversations
-- ============================================================
alter table conversations enable row level security;

create policy "conversations_select" on conversations
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

create policy "conversations_insert" on conversations
  for insert with check (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
  );

-- ============================================================
-- messages
-- ============================================================
alter table messages enable row level security;

create policy "messages_select" on messages
  for select using (
    sender_id = auth.uid()
    or exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.musteri_id = auth.uid() or c.danisan_id = my_danisan_id())
    )
    or is_admin()
  );

create policy "messages_insert" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.musteri_id = auth.uid() or c.danisan_id = my_danisan_id())
    )
  );

-- ============================================================
-- blog_posts
-- ============================================================
alter table blog_posts enable row level security;

create policy "blog_posts_public_select" on blog_posts
  for select using (
    status = 'published'
    or danisan_id = my_danisan_id()
    or is_admin()
  );

create policy "blog_posts_insert_danisan" on blog_posts
  for insert with check (danisan_id = my_danisan_id() or is_admin());

create policy "blog_posts_update" on blog_posts
  for update using (danisan_id = my_danisan_id() or is_admin());

create policy "blog_posts_delete" on blog_posts
  for delete using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- psikolojik_testler
-- ============================================================
alter table psikolojik_testler enable row level security;

create policy "psikolojik_testler_public_select" on psikolojik_testler
  for select using (is_active = true and deleted_at is null or is_admin());

create policy "psikolojik_testler_manage_admin" on psikolojik_testler
  for all using (is_admin());

-- ============================================================
-- test_sonuclari — HASSas VERİ
-- Admin direkt erişemez; yalnızca musteri + paylaşım açık ise danışman
-- ============================================================
alter table test_sonuclari enable row level security;

create policy "test_sonuclari_select_musteri" on test_sonuclari
  for select using (musteri_id = auth.uid());

create policy "test_sonuclari_select_danisan" on test_sonuclari
  for select using (
    shared_with_danisan = true
    and exists (
      select 1 from randevular r
      where r.musteri_id = test_sonuclari.musteri_id
        and r.danisan_id = my_danisan_id()
    )
  );

create policy "test_sonuclari_insert_musteri" on test_sonuclari
  for insert with check (musteri_id = auth.uid());

create policy "test_sonuclari_update_musteri" on test_sonuclari
  for update using (musteri_id = auth.uid());

-- ============================================================
-- kaynaklar
-- ============================================================
alter table kaynaklar enable row level security;

create policy "kaynaklar_public_select" on kaynaklar
  for select using (is_active = true and deleted_at is null);

create policy "kaynaklar_manage_admin" on kaynaklar
  for all using (is_admin());

-- ============================================================
-- faq
-- ============================================================
alter table faq enable row level security;

create policy "faq_public_select" on faq
  for select using (is_active = true);

create policy "faq_manage_admin" on faq
  for all using (is_admin());

-- ============================================================
-- degerlendirmeler
-- ============================================================
alter table degerlendirmeler enable row level security;

create policy "degerlendirmeler_public_select" on degerlendirmeler
  for select using (is_visible = true and deleted_at is null or is_admin());

create policy "degerlendirmeler_insert_musteri" on degerlendirmeler
  for insert with check (musteri_id = auth.uid());

-- Danışman kendi yanıtını günceller
create policy "degerlendirmeler_update" on degerlendirmeler
  for update using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

-- ============================================================
-- gunluk_kayitlar — HASSas VERİ
-- Admin direkt erişemez; danışman yalnızca paylaşılanları görür
-- ============================================================
alter table gunluk_kayitlar enable row level security;

create policy "gunluk_kayitlar_select_musteri" on gunluk_kayitlar
  for select using (musteri_id = auth.uid());

create policy "gunluk_kayitlar_select_danisan" on gunluk_kayitlar
  for select using (
    shared_with_danisan_id = my_danisan_id()
  );

create policy "gunluk_kayitlar_insert_musteri" on gunluk_kayitlar
  for insert with check (musteri_id = auth.uid());

create policy "gunluk_kayitlar_update_musteri" on gunluk_kayitlar
  for update using (musteri_id = auth.uid());

-- ============================================================
-- odevler
-- ============================================================
alter table odevler enable row level security;

create policy "odevler_select" on odevler
  for select using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

create policy "odevler_insert_danisan" on odevler
  for insert with check (danisan_id = my_danisan_id() or is_admin());

create policy "odevler_update" on odevler
  for update using (
    musteri_id = auth.uid()
    or danisan_id = my_danisan_id()
    or is_admin()
  );

-- ============================================================
-- onboarding_formlar
-- ============================================================
alter table onboarding_formlar enable row level security;

create policy "onboarding_formlar_select" on onboarding_formlar
  for select using (
    danisan_id = my_danisan_id()
    or exists (
      select 1 from randevular r
      where r.danisan_id = onboarding_formlar.danisan_id
        and r.musteri_id = auth.uid()
    )
    or is_admin()
  );

create policy "onboarding_formlar_manage_danisan" on onboarding_formlar
  for all using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- onboarding_yanitlar — HASSas VERİ
-- Admin direkt erişemez
-- ============================================================
alter table onboarding_yanitlar enable row level security;

create policy "onboarding_yanitlar_select_musteri" on onboarding_yanitlar
  for select using (musteri_id = auth.uid());

create policy "onboarding_yanitlar_select_danisan" on onboarding_yanitlar
  for select using (
    exists (
      select 1 from onboarding_formlar of2
      where of2.id = form_id
        and of2.danisan_id = my_danisan_id()
    )
  );

create policy "onboarding_yanitlar_insert_musteri" on onboarding_yanitlar
  for insert with check (musteri_id = auth.uid());

-- ============================================================
-- kurumsal_hesaplar
-- ============================================================
alter table kurumsal_hesaplar enable row level security;

create policy "kurumsal_hesaplar_select" on kurumsal_hesaplar
  for select using (
    exists (
      select 1 from kurumsal_kullanicilar kk
      where kk.kurumsal_id = id and kk.musteri_id = auth.uid()
    )
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'kurumsal'
    )
    or is_admin()
  );

create policy "kurumsal_hesaplar_manage_admin" on kurumsal_hesaplar
  for all using (is_admin());

-- ============================================================
-- kurumsal_kullanicilar
-- ============================================================
alter table kurumsal_kullanicilar enable row level security;

create policy "kurumsal_kullanicilar_select" on kurumsal_kullanicilar
  for select using (
    musteri_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'kurumsal'
    )
    or is_admin()
  );

create policy "kurumsal_kullanicilar_manage_admin" on kurumsal_kullanicilar
  for all using (is_admin());

-- ============================================================
-- affiliates
-- ============================================================
alter table affiliates enable row level security;

create policy "affiliates_select_own" on affiliates
  for select using (profile_id = auth.uid() or is_admin());

create policy "affiliates_insert_own" on affiliates
  for insert with check (profile_id = auth.uid());

create policy "affiliates_update_own" on affiliates
  for update using (profile_id = auth.uid() or is_admin());

-- ============================================================
-- affiliate_clicks
-- ============================================================
alter table affiliate_clicks enable row level security;

create policy "affiliate_clicks_select" on affiliate_clicks
  for select using (
    exists (
      select 1 from affiliates a
      where a.id = affiliate_id and a.profile_id = auth.uid()
    )
    or is_admin()
  );

create policy "affiliate_clicks_insert" on affiliate_clicks
  for insert with check (true);

-- ============================================================
-- affiliate_conversions
-- ============================================================
alter table affiliate_conversions enable row level security;

create policy "affiliate_conversions_select" on affiliate_conversions
  for select using (
    exists (
      select 1 from affiliates a
      where a.id = affiliate_id and a.profile_id = auth.uid()
    )
    or is_admin()
  );

create policy "affiliate_conversions_manage_admin" on affiliate_conversions
  for all using (is_admin());

-- ============================================================
-- bildirimler
-- ============================================================
alter table bildirimler enable row level security;

create policy "bildirimler_select_own" on bildirimler
  for select using (user_id = auth.uid() or is_admin());

create policy "bildirimler_update_own" on bildirimler
  for update using (user_id = auth.uid() or is_admin());

create policy "bildirimler_insert_admin" on bildirimler
  for insert with check (is_admin());

-- ============================================================
-- bildirim_tercihleri
-- ============================================================
alter table bildirim_tercihleri enable row level security;

create policy "bildirim_tercihleri_select_own" on bildirim_tercihleri
  for select using (user_id = auth.uid() or is_admin());

create policy "bildirim_tercihleri_manage_own" on bildirim_tercihleri
  for all using (user_id = auth.uid() or is_admin());

-- ============================================================
-- rozetler_tanim
-- ============================================================
alter table rozetler_tanim enable row level security;

create policy "rozetler_tanim_public_select" on rozetler_tanim
  for select using (true);

create policy "rozetler_tanim_manage_admin" on rozetler_tanim
  for all using (is_admin());

-- ============================================================
-- kullanici_rozetleri
-- ============================================================
alter table kullanici_rozetleri enable row level security;

create policy "kullanici_rozetleri_select_own" on kullanici_rozetleri
  for select using (musteri_id = auth.uid() or is_admin());

create policy "kullanici_rozetleri_insert_admin" on kullanici_rozetleri
  for insert with check (is_admin());

-- ============================================================
-- haftalik_hedefler
-- ============================================================
alter table haftalik_hedefler enable row level security;

create policy "haftalik_hedefler_select_own" on haftalik_hedefler
  for select using (musteri_id = auth.uid() or is_admin());

create policy "haftalik_hedefler_manage_own" on haftalik_hedefler
  for all using (musteri_id = auth.uid() or is_admin());

-- ============================================================
-- platform_ayarlari — herkes okur, sadece admin yazar
-- ============================================================
alter table platform_ayarlari enable row level security;

create policy "platform_ayarlari_public_select" on platform_ayarlari
  for select using (true);

create policy "platform_ayarlari_manage_admin" on platform_ayarlari
  for all using (is_admin());

-- ============================================================
-- kriz_kelimeleri — sunucu okur (service_role), admin yönetir
-- ============================================================
alter table kriz_kelimeleri enable row level security;

create policy "kriz_kelimeleri_manage_admin" on kriz_kelimeleri
  for all using (is_admin());

-- ============================================================
-- audit_logs — sadece admin okur, uygulama sunucusu yazar
-- ============================================================
alter table audit_logs enable row level security;

create policy "audit_logs_select_admin" on audit_logs
  for select using (is_admin());

create policy "audit_logs_insert_admin" on audit_logs
  for insert with check (is_admin());

-- ============================================================
-- takvim_sync — danışman kendi token'larını yönetir
-- ============================================================
alter table takvim_sync enable row level security;

create policy "takvim_sync_select_own" on takvim_sync
  for select using (danisan_id = my_danisan_id() or is_admin());

create policy "takvim_sync_manage_own" on takvim_sync
  for all using (danisan_id = my_danisan_id() or is_admin());

-- ============================================================
-- webinarlar
-- ============================================================
alter table webinarlar enable row level security;

create policy "webinarlar_public_select" on webinarlar
  for select using (status = 'published' and deleted_at is null or is_admin());

create policy "webinarlar_manage" on webinarlar
  for all using (
    host_id = auth.uid()
    or is_admin()
  );

-- ============================================================
-- webinar_kayitlar
-- ============================================================
alter table webinar_kayitlar enable row level security;

create policy "webinar_kayitlar_select" on webinar_kayitlar
  for select using (
    musteri_id = auth.uid()
    or exists (
      select 1 from webinarlar w
      where w.id = webinar_id and w.host_id = auth.uid()
    )
    or is_admin()
  );

create policy "webinar_kayitlar_insert_musteri" on webinar_kayitlar
  for insert with check (musteri_id = auth.uid());

create policy "webinar_kayitlar_update" on webinar_kayitlar
  for update using (musteri_id = auth.uid() or is_admin());

-- ============================================================
-- grup_seans_katilimcilar
-- ============================================================
alter table grup_seans_katilimcilar enable row level security;

create policy "grup_seans_katilimcilar_select" on grup_seans_katilimcilar
  for select using (
    musteri_id = auth.uid()
    or exists (
      select 1 from randevular r
      where r.id = randevu_id and r.danisan_id = my_danisan_id()
    )
    or is_admin()
  );

create policy "grup_seans_katilimcilar_insert_musteri" on grup_seans_katilimcilar
  for insert with check (musteri_id = auth.uid());

create policy "grup_seans_katilimcilar_update_admin" on grup_seans_katilimcilar
  for update using (is_admin());
