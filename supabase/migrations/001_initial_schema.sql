-- ============================================================
-- MindBridger — Initial Schema
-- ============================================================

-- updated_at otomatik güncelleme fonksiyonu
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- ENUM TİPLER
-- ============================================================

create type user_role as enum ('visitor','musteri','danisan','kurumsal','affiliate','admin');
create type user_status as enum ('pending','active','suspended','rejected');
create type notification_channel_pref as enum ('email','sms','uygulama_ici');
create type gender_type as enum ('erkek','kadin','belirtmek_istemiyorum');
create type session_type as enum ('bireysel','asenkron','grup','cift_aile','on_gorusme','supervizyon');
create type appointment_status as enum ('pending','confirmed','completed','cancelled','no_show','rejected');
create type package_status as enum ('active','expired','completed');
create type payment_status as enum ('pending','authorized','captured','failed','refunded');
create type payout_status as enum ('pending','processing','completed','failed');
create type refund_reason as enum ('cancelled_by_musteri','cancelled_by_danisan','dispute','admin_override');
create type refund_status as enum ('pending','completed','failed');
create type invoice_type as enum ('bireysel','kurumsal_aylik');
create type conversation_type as enum ('lojistik','asenkron_seans');
create type blog_status as enum ('draft','pending','published','rejected');
create type resource_type as enum ('pdf','video','link');
create type task_status as enum ('pending','completed','skipped');
create type corporate_status as enum ('pending','active','suspended');
create type affiliate_status as enum ('pending','active','suspended');
create type affiliate_conv_status as enum ('pending','paid');
create type notif_channel as enum ('app','email','sms');
create type delivery_status as enum ('pending','sent','failed');
create type crisis_severity as enum ('low','medium','high');
create type calendar_provider as enum ('google','outlook');
create type webinar_status as enum ('draft','published','cancelled','completed');
create type webinar_reg_status as enum ('registered','attended','cancelled','refunded');
create type group_session_status as enum ('registered','confirmed','cancelled','attended');

-- ============================================================
-- AUTH / KULLANICI
-- ============================================================

create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  user_role not null default 'musteri',
  status                user_status not null default 'pending',
  first_name            text,
  last_name             text,
  phone                 text,
  avatar_url            text,
  dark_mode             boolean not null default false,
  language              text not null default 'tr',
  kvkk_accepted_at      timestamptz,
  kvkk_ip               text,
  last_login_at         timestamptz,
  churn_risk_score      int not null default 0 check (churn_risk_score between 0 and 100),
  admin_notes           text,
  notification_channel  notification_channel_pref not null default 'email',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create table ip_blacklist (
  id                uuid default gen_random_uuid() primary key,
  ip_address        text not null unique,
  failed_attempts   int not null default 0,
  locked_until      timestamptz,
  banned_until      timestamptz,
  last_attempt_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create trigger trg_ip_blacklist_updated_at
  before update on ip_blacklist
  for each row execute function update_updated_at();

-- ============================================================
-- DANIŞMAN
-- ============================================================

create table danisanlar (
  id                          uuid default gen_random_uuid() primary key,
  profile_id                  uuid not null references profiles(id) on delete cascade,
  slug                        text not null unique,
  bio                         text,
  title                       text,
  approach                    text[],
  specialties                 text[],
  age_groups                  text[],
  languages                   text[],
  gender                      gender_type,
  session_duration            int,
  buffer_minutes              int not null default 0,
  price_individual            numeric(10,2),
  price_group                 numeric(10,2),
  price_async                 numeric(10,2),
  sliding_scale               boolean not null default false,
  sliding_scale_price         numeric(10,2),
  intro_session_enabled       boolean not null default false,
  intro_session_duration      int not null default 15,
  city                        text,
  district                    text,
  is_online                   boolean not null default true,
  is_in_person                boolean not null default false,
  is_supervisor               boolean not null default false,
  profile_published           boolean not null default false,
  profile_completion_percent  int not null default 0 check (profile_completion_percent between 0 and 100),
  average_rating              numeric(3,2) not null default 0,
  total_reviews               int not null default 0,
  total_sessions              int not null default 0,
  bank_iban                   text,
  bank_name                   text,
  bank_account_name           text,
  diploma_url                 text,
  id_document_url             text,
  rejection_reason            text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  deleted_at                  timestamptz
);

create trigger trg_danisanlar_updated_at
  before update on danisanlar
  for each row execute function update_updated_at();

create table danisan_musaitlik (
  id          uuid default gen_random_uuid() primary key,
  danisan_id  uuid not null references danisanlar(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_danisan_musaitlik_updated_at
  before update on danisan_musaitlik
  for each row execute function update_updated_at();

create table danisan_izin (
  id          uuid default gen_random_uuid() primary key,
  danisan_id  uuid not null references danisanlar(id) on delete cascade,
  date        date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_danisan_izin_updated_at
  before update on danisan_izin
  for each row execute function update_updated_at();

create table danisan_paketler (
  id               uuid default gen_random_uuid() primary key,
  danisan_id       uuid not null references danisanlar(id) on delete cascade,
  name             text not null,
  session_count    int not null,
  price            numeric(10,2) not null,
  discount_percent numeric(5,2) not null default 0,
  validity_days    int not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create trigger trg_danisan_paketler_updated_at
  before update on danisan_paketler
  for each row execute function update_updated_at();

-- ============================================================
-- RANDEVU
-- ============================================================

create table randevular (
  id                        uuid default gen_random_uuid() primary key,
  musteri_id                uuid not null references profiles(id),
  danisan_id                uuid not null references danisanlar(id),
  session_type              session_type not null,
  status                    appointment_status not null default 'pending',
  scheduled_at              timestamptz not null,
  duration_minutes          int not null,
  price                     numeric(10,2) not null,
  is_sliding_scale          boolean not null default false,
  is_recurring              boolean not null default false,
  recurring_rule            jsonb,
  cancellation_reason       text,
  cancelled_by              uuid references profiles(id),
  cancelled_at              timestamptz,
  daily_room_name           text,
  daily_room_token_musteri  text,
  daily_room_token_danisan  text,
  daily_room_token_partner  text,
  partner_id                uuid references profiles(id),
  notes_private             text,
  summary_shared            text,
  no_show_charged           boolean not null default false,
  package_id                uuid,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

create trigger trg_randevular_updated_at
  before update on randevular
  for each row execute function update_updated_at();

create table musteri_paketler (
  id                uuid default gen_random_uuid() primary key,
  musteri_id        uuid not null references profiles(id),
  danisan_paket_id  uuid not null references danisan_paketler(id),
  sessions_total    int not null,
  sessions_used     int not null default 0,
  sessions_remaining int generated always as (sessions_total - sessions_used) stored,
  expires_at        timestamptz not null,
  status            package_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

alter table randevular
  add constraint fk_randevu_package
  foreign key (package_id) references musteri_paketler(id);

create trigger trg_musteri_paketler_updated_at
  before update on musteri_paketler
  for each row execute function update_updated_at();

create table bekleme_listesi (
  id              uuid default gen_random_uuid() primary key,
  musteri_id      uuid not null references profiles(id),
  danisan_id      uuid not null references danisanlar(id),
  preferred_days  int[],
  preferred_times text[],
  notified_at     timestamptz,
  accepted_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create trigger trg_bekleme_listesi_updated_at
  before update on bekleme_listesi
  for each row execute function update_updated_at();

-- ============================================================
-- ÖDEME
-- ============================================================

create table payments (
  id                uuid default gen_random_uuid() primary key,
  randevu_id        uuid not null references randevular(id),
  musteri_id        uuid not null references profiles(id),
  danisan_id        uuid not null references danisanlar(id),
  amount_gross      numeric(10,2) not null,
  commission_rate   numeric(5,2) not null,
  commission_amount numeric(10,2) not null,
  amount_net        numeric(10,2) not null,
  status            payment_status not null default 'pending',
  iyzico_payment_id text,
  iyzico_token      text,
  payment_method    text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function update_updated_at();

create table payouts (
  id                  uuid default gen_random_uuid() primary key,
  danisan_id          uuid not null references danisanlar(id),
  period_start        date not null,
  period_end          date not null,
  total_amount        numeric(10,2) not null,
  payment_ids         uuid[],
  status              payout_status not null default 'pending',
  bank_transfer_ref   text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger trg_payouts_updated_at
  before update on payouts
  for each row execute function update_updated_at();

create table refunds (
  id                uuid default gen_random_uuid() primary key,
  payment_id        uuid not null references payments(id),
  randevu_id        uuid not null references randevular(id),
  amount            numeric(10,2) not null,
  reason            refund_reason not null,
  refund_percent    numeric(5,2) not null,
  iyzico_refund_id  text,
  status            refund_status not null default 'pending',
  initiated_by      uuid references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create trigger trg_refunds_updated_at
  before update on refunds
  for each row execute function update_updated_at();

create table seans_faturalari (
  id             uuid default gen_random_uuid() primary key,
  payment_id     uuid references payments(id),
  randevu_id     uuid references randevular(id),
  musteri_id     uuid references profiles(id),
  danisan_id     uuid references danisanlar(id),
  kurumsal_id    uuid,
  invoice_number text not null unique,
  invoice_type   invoice_type not null default 'bireysel',
  amount         numeric(10,2) not null,
  pdf_url        text,
  xlsx_url       text,
  period_start   date,
  period_end     date,
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create trigger trg_seans_faturalari_updated_at
  before update on seans_faturalari
  for each row execute function update_updated_at();

-- ============================================================
-- MESAJLAŞMA
-- ============================================================

create table conversations (
  id              uuid default gen_random_uuid() primary key,
  musteri_id      uuid not null references profiles(id),
  danisan_id      uuid not null references danisanlar(id),
  type            conversation_type not null default 'lojistik',
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

create table messages (
  id                  uuid default gen_random_uuid() primary key,
  conversation_id     uuid not null references conversations(id) on delete cascade,
  sender_id           uuid not null references profiles(id),
  content             text,
  audio_url           text,
  read_at             timestamptz,
  is_session_response boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger trg_messages_updated_at
  before update on messages
  for each row execute function update_updated_at();

-- ============================================================
-- İÇERİK
-- ============================================================

create table blog_posts (
  id               uuid default gen_random_uuid() primary key,
  danisan_id       uuid not null references danisanlar(id),
  title            text not null,
  slug             text not null unique,
  content          text,
  excerpt          text,
  cover_image_url  text,
  status           blog_status not null default 'draft',
  rejection_reason text,
  published_at     timestamptz,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  tags             text[],
  view_count       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create trigger trg_blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

create table psikolojik_testler (
  id                uuid default gen_random_uuid() primary key,
  title             text not null,
  slug              text not null unique,
  description       text,
  questions         jsonb,
  scoring_logic     jsonb,
  result_ranges     jsonb,
  is_active         boolean not null default true,
  estimated_minutes int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create trigger trg_psikolojik_testler_updated_at
  before update on psikolojik_testler
  for each row execute function update_updated_at();

create table test_sonuclari (
  id                    uuid default gen_random_uuid() primary key,
  musteri_id            uuid not null references profiles(id),
  test_id               uuid not null references psikolojik_testler(id),
  answers               jsonb,
  score                 numeric(10,2),
  result_label          text,
  shared_with_danisan   boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create trigger trg_test_sonuclari_updated_at
  before update on test_sonuclari
  for each row execute function update_updated_at();

create table kaynaklar (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  file_url    text,
  type        resource_type not null,
  category    text[],
  is_active   boolean not null default true,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_kaynaklar_updated_at
  before update on kaynaklar
  for each row execute function update_updated_at();

create table faq (
  id         uuid default gen_random_uuid() primary key,
  question   text not null,
  answer     text not null,
  category   text,
  "order"    int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_faq_updated_at
  before update on faq
  for each row execute function update_updated_at();

-- ============================================================
-- DEĞERLENDİRME
-- ============================================================

create table degerlendirmeler (
  id           uuid default gen_random_uuid() primary key,
  randevu_id   uuid not null unique references randevular(id),
  musteri_id   uuid not null references profiles(id),
  danisan_id   uuid not null references danisanlar(id),
  rating       int not null check (rating between 1 and 5),
  comment      text,
  is_visible   boolean not null default true,
  review_reply text,
  reply_at     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create trigger trg_degerlendirmeler_updated_at
  before update on degerlendirmeler
  for each row execute function update_updated_at();

-- ============================================================
-- DANIŞAN ARAÇLARI
-- ============================================================

create table gunluk_kayitlar (
  id                        uuid default gen_random_uuid() primary key,
  musteri_id                uuid not null references profiles(id),
  date                      date not null,
  mood                      int check (mood between 1 and 5),
  mood_emoji                text,
  note                      text,
  shared_with_danisan_id    uuid references danisanlar(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

create trigger trg_gunluk_kayitlar_updated_at
  before update on gunluk_kayitlar
  for each row execute function update_updated_at();

create table odevler (
  id           uuid default gen_random_uuid() primary key,
  randevu_id   uuid references randevular(id),
  musteri_id   uuid not null references profiles(id),
  danisan_id   uuid not null references danisanlar(id),
  title        text not null,
  description  text,
  file_url     text,
  due_date     date,
  status       task_status not null default 'pending',
  completed_at timestamptz,
  musteri_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create trigger trg_odevler_updated_at
  before update on odevler
  for each row execute function update_updated_at();

create table onboarding_formlar (
  id          uuid default gen_random_uuid() primary key,
  danisan_id  uuid not null references danisanlar(id),
  title       text not null,
  questions   jsonb,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_onboarding_formlar_updated_at
  before update on onboarding_formlar
  for each row execute function update_updated_at();

create table onboarding_yanitlar (
  id          uuid default gen_random_uuid() primary key,
  form_id     uuid not null references onboarding_formlar(id),
  musteri_id  uuid not null references profiles(id),
  randevu_id  uuid references randevular(id),
  answers     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_onboarding_yanitlar_updated_at
  before update on onboarding_yanitlar
  for each row execute function update_updated_at();

-- ============================================================
-- KURUMSAL
-- ============================================================

create table kurumsal_hesaplar (
  id                      uuid default gen_random_uuid() primary key,
  company_name            text not null,
  contact_name            text,
  contact_email           text,
  contact_phone           text,
  license_count           int not null default 0,
  status                  corporate_status not null default 'pending',
  invite_code             text not null unique,
  subscription_start      date,
  subscription_end        date,
  price_per_user          numeric(10,2),
  default_monthly_budget  numeric(10,2) not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create trigger trg_kurumsal_hesaplar_updated_at
  before update on kurumsal_hesaplar
  for each row execute function update_updated_at();

alter table seans_faturalari
  add constraint fk_seans_faturalari_kurumsal
  foreign key (kurumsal_id) references kurumsal_hesaplar(id);

create table kurumsal_kullanicilar (
  id                      uuid default gen_random_uuid() primary key,
  kurumsal_id             uuid not null references kurumsal_hesaplar(id),
  musteri_id              uuid not null references profiles(id),
  joined_at               timestamptz not null default now(),
  monthly_budget_limit    numeric(10,2),
  sessions_used_this_month int not null default 0,
  budget_alert_sent       boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create trigger trg_kurumsal_kullanicilar_updated_at
  before update on kurumsal_kullanicilar
  for each row execute function update_updated_at();

-- ============================================================
-- AFFİLİATE
-- ============================================================

create table affiliates (
  id              uuid default gen_random_uuid() primary key,
  profile_id      uuid not null references profiles(id),
  platform_info   text,
  referral_code   text not null unique,
  commission_rate numeric(5,2) not null default 10,
  status          affiliate_status not null default 'pending',
  total_earned    numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create trigger trg_affiliates_updated_at
  before update on affiliates
  for each row execute function update_updated_at();

create table affiliate_clicks (
  id           uuid default gen_random_uuid() primary key,
  affiliate_id uuid not null references affiliates(id),
  ip_hash      text,
  user_agent   text,
  clicked_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create trigger trg_affiliate_clicks_updated_at
  before update on affiliate_clicks
  for each row execute function update_updated_at();

create table affiliate_conversions (
  id                uuid default gen_random_uuid() primary key,
  affiliate_id      uuid not null references affiliates(id),
  musteri_id        uuid not null references profiles(id),
  payment_id        uuid references payments(id),
  commission_amount numeric(10,2) not null,
  status            affiliate_conv_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create trigger trg_affiliate_conversions_updated_at
  before update on affiliate_conversions
  for each row execute function update_updated_at();

-- ============================================================
-- BİLDİRİMLER
-- ============================================================

create table bildirimler (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid not null references profiles(id),
  type            text not null,
  title           text not null,
  body            text,
  data            jsonb,
  read_at         timestamptz,
  channel         notif_channel not null default 'app',
  delivery_status delivery_status not null default 'pending',
  retry_count     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create trigger trg_bildirimler_updated_at
  before update on bildirimler
  for each row execute function update_updated_at();

create table bildirim_tercihleri (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid not null unique references profiles(id),
  randevu_email      boolean not null default true,
  randevu_sms        boolean not null default true,
  randevu_uygulama   boolean not null default true,
  odeme_email        boolean not null default true,
  blog_email         boolean not null default true,
  marketing_email    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create trigger trg_bildirim_tercihleri_updated_at
  before update on bildirim_tercihleri
  for each row execute function update_updated_at();

-- ============================================================
-- GAMİFİCATION
-- ============================================================

create table rozetler_tanim (
  id          uuid default gen_random_uuid() primary key,
  code        text not null unique,
  name        text not null,
  description text,
  icon        text,
  condition   jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_rozetler_tanim_updated_at
  before update on rozetler_tanim
  for each row execute function update_updated_at();

create table kullanici_rozetleri (
  id          uuid default gen_random_uuid() primary key,
  musteri_id  uuid not null references profiles(id),
  rozet_id    uuid not null references rozetler_tanim(id),
  earned_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_kullanici_rozetleri_updated_at
  before update on kullanici_rozetleri
  for each row execute function update_updated_at();

create table haftalik_hedefler (
  id                  uuid default gen_random_uuid() primary key,
  musteri_id          uuid not null references profiles(id),
  week_start          date not null,
  target_sessions     int not null default 0,
  completed_sessions  int not null default 0,
  target_mood_logs    int not null default 0,
  completed_mood_logs int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger trg_haftalik_hedefler_updated_at
  before update on haftalik_hedefler
  for each row execute function update_updated_at();

-- ============================================================
-- SİSTEM
-- ============================================================

create table platform_ayarlari (
  id          uuid default gen_random_uuid() primary key,
  key         text not null unique,
  value       text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_platform_ayarlari_updated_at
  before update on platform_ayarlari
  for each row execute function update_updated_at();

create table kriz_kelimeleri (
  id         uuid default gen_random_uuid() primary key,
  word       text not null,
  severity   crisis_severity not null default 'medium',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_kriz_kelimeleri_updated_at
  before update on kriz_kelimeleri
  for each row execute function update_updated_at();

create table audit_logs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id),
  action      text not null,
  table_name  text,
  record_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_audit_logs_updated_at
  before update on audit_logs
  for each row execute function update_updated_at();

-- audit_logs expires_at otomatik set (created_at + 90 gün)
create or replace function set_audit_log_expiry()
returns trigger as $$
begin
  new.expires_at = new.created_at + interval '90 days';
  return new;
end;
$$ language plpgsql;

create trigger trg_audit_logs_expiry
  before insert on audit_logs
  for each row execute function set_audit_log_expiry();

-- ip_blacklist süresi geçmiş kayıtları silen fonksiyon (cron tarafından çağrılır)
create or replace function clean_expired_ip_bans()
returns void as $$
begin
  delete from ip_blacklist
  where banned_until < now()
    and locked_until < now();
end;
$$ language plpgsql;

-- ============================================================
-- TAKVİM SYNC
-- ============================================================

create table takvim_sync (
  id            uuid default gen_random_uuid() primary key,
  danisan_id    uuid not null references danisanlar(id) on delete cascade,
  provider      calendar_provider not null,
  access_token  text not null,
  refresh_token text not null,
  token_expiry  timestamptz,
  calendar_id   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (danisan_id, provider)
);

create trigger trg_takvim_sync_updated_at
  before update on takvim_sync
  for each row execute function update_updated_at();

-- ============================================================
-- WEBİNAR
-- ============================================================

create table webinarlar (
  id                       uuid default gen_random_uuid() primary key,
  host_id                  uuid not null references profiles(id),
  title                    text not null,
  description              text,
  scheduled_at             timestamptz not null,
  duration_minutes         int not null,
  price                    numeric(10,2) not null default 0,
  capacity                 int not null,
  registered_count         int not null default 0,
  status                   webinar_status not null default 'draft',
  daily_room_name          text,
  cover_image_url          text,
  platform_commission_rate numeric(5,2) not null default 20,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  deleted_at               timestamptz
);

create trigger trg_webinarlar_updated_at
  before update on webinarlar
  for each row execute function update_updated_at();

create table webinar_kayitlar (
  id          uuid default gen_random_uuid() primary key,
  webinar_id  uuid not null references webinarlar(id),
  musteri_id  uuid not null references profiles(id),
  payment_id  uuid references payments(id),
  status      webinar_reg_status not null default 'registered',
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger trg_webinar_kayitlar_updated_at
  before update on webinar_kayitlar
  for each row execute function update_updated_at();

-- ============================================================
-- GRUP SEANS
-- ============================================================

create table grup_seans_katilimcilar (
  id                   uuid default gen_random_uuid() primary key,
  randevu_id           uuid not null references randevular(id),
  musteri_id           uuid not null references profiles(id),
  payment_id           uuid references payments(id),
  status               group_session_status not null default 'registered',
  min_participant_met  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create trigger trg_grup_seans_katilimcilar_updated_at
  before update on grup_seans_katilimcilar
  for each row execute function update_updated_at();

-- ============================================================
-- İNDEKSLER
-- ============================================================

create index idx_profiles_role on profiles(role);
create index idx_profiles_status on profiles(status);
create index idx_danisanlar_profile_id on danisanlar(profile_id);
create index idx_danisanlar_slug on danisanlar(slug);
create index idx_danisanlar_published on danisanlar(profile_published) where deleted_at is null;
create index idx_randevular_musteri on randevular(musteri_id);
create index idx_randevular_danisan on randevular(danisan_id);
create index idx_randevular_scheduled on randevular(scheduled_at);
create index idx_randevular_status on randevular(status);
create index idx_payments_randevu on payments(randevu_id);
create index idx_bildirimler_user on bildirimler(user_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_expires on audit_logs(expires_at);
create index idx_gunluk_kayitlar_musteri on gunluk_kayitlar(musteri_id);
create index idx_blog_posts_slug on blog_posts(slug);
create index idx_blog_posts_status on blog_posts(status);
create index idx_ip_blacklist_ip on ip_blacklist(ip_address);
