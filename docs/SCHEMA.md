# SCHEMA.md — Veritabanı Şeması

Tüm tablolar Supabase PostgreSQL'de. Her tabloda: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, `deleted_at timestamptz` (soft delete).

Tüm `timestamptz` alanları UTC+3 (Türkiye) saat dilimiyle kaydedilir.

> ⚠️ HASSas VERİ: `notes_private`, `summary_shared`, `gunluk_kayitlar.note`, `onboarding_yanitlar.answers`, `test_sonuclari.answers` alanları psikolojik veri içerir. RLS politikaları yalnızca ilgili danışman ve müşteriye erişim açmalıdır. Üçüncü taraflarla paylaşım yasaktır.

---

## AUTH / KULLANICI

### `profiles`
Supabase Auth'un `auth.users` tablosunu genişletir.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | auth.users.id ile aynı |
| role | enum | visitor, musteri, danisan, kurumsal, affiliate, admin |
| status | enum | pending, active, suspended, rejected |
| first_name | text | |
| last_name | text | |
| phone | text | |
| avatar_url | text | Supabase Storage URL, max 10 MB |
| dark_mode | boolean | default false |
| language | text | default 'tr' |
| kvkk_accepted_at | timestamptz | |
| kvkk_ip | text | |
| last_login_at | timestamptz | |
| churn_risk_score | int | 0-100, sistem tarafından hesaplanır |
| admin_notes | text | Admin özel notları |
| notification_channel | enum | email, sms, uygulama_ici — varsayılan email |

### `ip_blacklist`
Brute force koruması için IP kara listesi.

| Alan | Tip | Açıklama |
|---|---|---|
| ip_address | text | unique |
| failed_attempts | int | default 0 |
| locked_until | timestamptz | 15 dk kilit (5 başarısız) |
| banned_until | timestamptz | 24 saat ban (50 başarısız) |
| last_attempt_at | timestamptz | |

---

## DANIŞMAN

### `danisanlar` (danışman profilleri)
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | → profiles.id |
| slug | text | unique, SEO URL |
| bio | text | |
| title | text | Psikolog / Uzman PDR vb. |
| approach | text[] | BDT, EMDR, Psikoanaliz vb. |
| specialties | text[] | Anksiyete, Depresyon, Çift terapisi vb. |
| age_groups | text[] | Çocuk, Ergen, Yetişkin, Yaşlı |
| languages | text[] | |
| gender | enum | erkek, kadin, belirtmek_istemiyorum |
| session_duration | int | Dakika: 45, 50, 60 |
| buffer_minutes | int | Seanslar arası tampon |
| price_individual | numeric | Tekil seans fiyatı (TL) |
| price_group | numeric | Grup seans fiyatı |
| price_async | numeric | Asenkron seans fiyatı |
| sliding_scale | boolean | default false |
| sliding_scale_price | numeric | İndirimli fiyat |
| intro_session_enabled | boolean | Ücretsiz ön görüşme açık mı |
| intro_session_duration | int | default 15 dk |
| city | text | |
| district | text | |
| is_online | boolean | Online seans veriyor mu |
| is_in_person | boolean | Yüz yüze seans veriyor mu |
| is_supervisor | boolean | Süpervizyon verebilir mi |
| profile_published | boolean | Listede görünüyor mu — profile_completion_percent = 100 olmadan true yapılamaz |
| profile_completion_percent | int | 0-100, sistem hesaplar; 100 olmadan profil yayınlanamaz |
| average_rating | numeric | Güncellenen ortalama |
| total_reviews | int | |
| total_sessions | int | |
| bank_iban | text | AES-256 şifreli saklanır, loga yazılmaz |
| bank_name | text | |
| bank_account_name | text | |
| diploma_url | text | Supabase Storage, max 10 MB |
| id_document_url | text | Supabase Storage, max 10 MB |
| rejection_reason | text | Admin red gerekçesi |

### `danisan_musaitlik` (çalışma saatleri şablonu)
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | → danisanlar.id |
| day_of_week | int | 0=Pazar, 1=Pazartesi... |
| start_time | time | |
| end_time | time | |
| is_active | boolean | |

### `danisan_izin` (tatil/izin günleri)
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | |
| date | date | |
| reason | text | |

### `danisan_paketler`
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | |
| name | text | "4 Seans Paketi" |
| session_count | int | |
| price | numeric | |
| discount_percent | numeric | |
| validity_days | int | Kaç günde kullanılmalı |
| is_active | boolean | |

---

## RANDEVU

### `randevular`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | |
| musteri_id | uuid | → profiles.id |
| danisan_id | uuid | → danisanlar.id |
| session_type | enum | bireysel, asenkron, grup, cift_aile, on_gorusme, supervizyon |
| status | enum | pending, confirmed, completed, cancelled, no_show, rejected |
| scheduled_at | timestamptz | UTC+3 |
| duration_minutes | int | |
| price | numeric | Ödenen fiyat (TL) |
| is_sliding_scale | boolean | |
| is_recurring | boolean | |
| recurring_rule | jsonb | rrule formatı |
| cancellation_reason | text | |
| cancelled_by | uuid | |
| cancelled_at | timestamptz | |
| daily_room_name | text | Daily.co oda adı — tahmin edilemez (uuid bazlı) |
| daily_room_token_musteri | text | Server-side üretilir, şifreli; randevu saatinden 10 dk önce aktif |
| daily_room_token_danisan | text | Server-side üretilir, şifreli |
| daily_room_token_partner | text | Çift-aile seansında ikinci katılımcı token'ı; null ise bireysel seans |
| partner_id | uuid | → profiles.id — çift-aile seansında ikinci katılımcı; null ise bireysel |
| notes_private | text | ⚠️ HASSas — Danışmanın özel notu; yalnızca danışmana görünür |
| summary_shared | text | Danışana paylaşılan özet |
| no_show_charged | boolean | default false |
| package_id | uuid | → musteri_paketler.id (paket kullanımı) |

### `musteri_paketler` (satın alınan paketler)
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| danisan_paket_id | uuid | → danisan_paketler.id |
| sessions_total | int | |
| sessions_used | int | default 0 |
| sessions_remaining | int | generated |
| expires_at | timestamptz | |
| status | enum | active, expired, completed |

### `bekleme_listesi`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| danisan_id | uuid | |
| preferred_days | int[] | Tercih edilen günler |
| preferred_times | text[] | Tercih edilen saatler |
| notified_at | timestamptz | Son bildirim zamanı |
| accepted_at | timestamptz | Kabul ettiyse |
| expires_at | timestamptz | 30 dk kabul süresi |

---

## ÖDEME

### `payments`
| Alan | Tip | Açıklama |
|---|---|---|
| randevu_id | uuid | |
| musteri_id | uuid | |
| danisan_id | uuid | |
| amount_gross | numeric | Toplam tutar (TL) |
| commission_rate | numeric | %20 gibi |
| commission_amount | numeric | |
| amount_net | numeric | Danışmana gidecek |
| status | enum | pending, authorized, captured, failed, refunded |
| iyzico_payment_id | text | |
| iyzico_token | text | Pre-auth token — AES-256 şifreli |
| payment_method | text | |
| paid_at | timestamptz | |

### `payouts` (danışman ödemeleri)
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | |
| period_start | date | |
| period_end | date | |
| total_amount | numeric | |
| payment_ids | uuid[] | Dahil edilen ödemeler |
| status | enum | pending, processing, completed, failed |
| bank_transfer_ref | text | |
| paid_at | timestamptz | |

### `refunds`
| Alan | Tip | Açıklama |
|---|---|---|
| payment_id | uuid | |
| randevu_id | uuid | |
| amount | numeric | |
| reason | enum | cancelled_by_musteri, cancelled_by_danisan, dispute, admin_override |
| refund_percent | numeric | |
| iyzico_refund_id | text | |
| status | enum | pending, completed, failed |
| initiated_by | uuid | |

### `seans_faturalari`
Seans tamamlandığında otomatik PDF fatura kaydı.

| Alan | Tip | Açıklama |
|---|---|---|
| payment_id | uuid | → payments.id |
| randevu_id | uuid | |
| musteri_id | uuid | |
| danisan_id | uuid | |
| kurumsal_id | uuid | null ise bireysel fatura |
| invoice_number | text | unique, örn: MBR-2026-001234 |
| invoice_type | enum | bireysel, kurumsal_aylik |
| amount | numeric | |
| pdf_url | text | Supabase Storage — üretilen PDF |
| xlsx_url | text | Supabase Storage — kurumsal XLSX (kurumsal fatura için) |
| period_start | date | Kurumsal aylık fatura dönemi başlangıcı |
| period_end | date | Kurumsal aylık fatura dönemi bitişi |
| sent_at | timestamptz | Mail ile gönderilme zamanı |

---

## MESAJLAŞMA

### `conversations`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| danisan_id | uuid | |
| type | enum | lojistik, asenkron_seans |
| last_message_at | timestamptz | |

### `messages`
| Alan | Tip | Açıklama |
|---|---|---|
| conversation_id | uuid | |
| sender_id | uuid | |
| content | text | |
| audio_url | text | Ses kaydı (asenkron seans için), max 10 MB |
| read_at | timestamptz | |
| is_session_response | boolean | Asenkron seans yanıtı mı |

---

## İÇERİK

### `blog_posts`
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | Yazar |
| title | text | |
| slug | text | unique |
| content | text | Rich text (JSON) |
| excerpt | text | |
| cover_image_url | text | max 10 MB |
| status | enum | draft, pending, published, rejected |
| rejection_reason | text | |
| published_at | timestamptz | |
| seo_title | text | |
| seo_description | text | |
| seo_keywords | text[] | Anahtar kelimeler |
| tags | text[] | |
| view_count | int | |

### `psikolojik_testler`
| Alan | Tip | Açıklama |
|---|---|---|
| title | text | |
| slug | text | unique |
| description | text | |
| questions | jsonb | [{id, text, options: [{value, label}]}] |
| scoring_logic | jsonb | Puan hesaplama kuralları |
| result_ranges | jsonb | [{min, max, label, description, recommendation}] |
| is_active | boolean | |
| estimated_minutes | int | |

### `test_sonuclari`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| test_id | uuid | |
| answers | jsonb | ⚠️ HASSas — psikolojik değerlendirme verisi |
| score | numeric | |
| result_label | text | |
| shared_with_danisan | boolean | default false |

### `kaynaklar`
| Alan | Tip | Açıklama |
|---|---|---|
| title | text | |
| description | text | |
| file_url | text | max 10 MB |
| type | enum | pdf, video, link |
| category | text[] | |
| is_active | boolean | |
| created_by | uuid | Admin |

### `faq`
| Alan | Tip | Açıklama |
|---|---|---|
| question | text | |
| answer | text | |
| category | text | |
| order | int | |
| is_active | boolean | |

---

## DEĞERLENDİRME

### `degerlendirmeler`
| Alan | Tip | Açıklama |
|---|---|---|
| randevu_id | uuid | unique |
| musteri_id | uuid | |
| danisan_id | uuid | |
| rating | int | 1-5 |
| comment | text | |
| is_visible | boolean | default true |
| review_reply | text | Danışmanın yoruma verdiği yanıt |
| reply_at | timestamptz | Yanıt yazılma zamanı |

---

## DANIŞAN ARAÇLARI

### `gunluk_kayitlar`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| date | date | |
| mood | int | 1-5 |
| mood_emoji | text | |
| note | text | ⚠️ HASSas — kriz protokolü bu alanı tarar |
| shared_with_danisan_id | uuid | null ise paylaşılmamış |

### `odevler`
| Alan | Tip | Açıklama |
|---|---|---|
| randevu_id | uuid | Hangi seansın ödevi |
| musteri_id | uuid | |
| danisan_id | uuid | |
| title | text | |
| description | text | |
| file_url | text | Ek materyal, max 10 MB |
| due_date | date | |
| status | enum | pending, completed, skipped |
| completed_at | timestamptz | |
| musteri_note | text | Tamamlarken not |

### `onboarding_formlar`
| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | |
| title | text | |
| questions | jsonb | [{id, label, type, required}] |
| is_default | boolean | |

### `onboarding_yanitlar`
| Alan | Tip | Açıklama |
|---|---|---|
| form_id | uuid | |
| musteri_id | uuid | |
| randevu_id | uuid | |
| answers | jsonb | ⚠️ HASSas — seans öncesi kişisel bilgiler |

---

## KURUMSAL

### `kurumsal_hesaplar`
| Alan | Tip | Açıklama |
|---|---|---|
| company_name | text | |
| contact_name | text | |
| contact_email | text | |
| contact_phone | text | |
| license_count | int | |
| status | enum | pending, active, suspended |
| invite_code | text | unique |
| subscription_start | date | |
| subscription_end | date | |
| price_per_user | numeric | Aylık kişi başı ücret (TL) |
| default_monthly_budget | numeric | Varsayılan çalışan başı aylık seans bütçesi (TL); 0 = sınırsız |

### `kurumsal_kullanicilar`
| Alan | Tip | Açıklama |
|---|---|---|
| kurumsal_id | uuid | |
| musteri_id | uuid | |
| joined_at | timestamptz | |
| monthly_budget_limit | numeric | Bu çalışana özel aylık bütçe; null ise kurumsal_hesaplar.default_monthly_budget geçerli |
| sessions_used_this_month | int | default 0; her ay başında sıfırlanır |
| budget_alert_sent | boolean | default false; limit %80 dolunca uyarı gönderilir |

---

## AFFİLİATE

### `affiliates`
| Alan | Tip | Açıklama |
|---|---|---|
| profile_id | uuid | |
| platform_info | text | Kanal/blog URL |
| referral_code | text | unique |
| commission_rate | numeric | default %10 |
| status | enum | pending, active, suspended |
| total_earned | numeric | |

### `affiliate_clicks`
| Alan | Tip | Açıklama |
|---|---|---|
| affiliate_id | uuid | |
| ip_hash | text | |
| user_agent | text | |
| clicked_at | timestamptz | |

### `affiliate_conversions`
| Alan | Tip | Açıklama |
|---|---|---|
| affiliate_id | uuid | |
| musteri_id | uuid | |
| payment_id | uuid | |
| commission_amount | numeric | |
| status | enum | pending, paid |

---

## BİLDİRİMLER

### `bildirimler`
| Alan | Tip | Açıklama |
|---|---|---|
| user_id | uuid | |
| type | text | randevu_onay, odeme, vb. |
| title | text | |
| body | text | |
| data | jsonb | Bağlantı verisi |
| read_at | timestamptz | |
| channel | enum | app, email, sms |
| delivery_status | enum | pending, sent, failed | 
| retry_count | int | default 0; başarısız teslimatlar yeniden denenir |

### `bildirim_tercihleri`
| Alan | Tip | Açıklama |
|---|---|---|
| user_id | uuid | unique |
| randevu_email | boolean | default true |
| randevu_sms | boolean | default true |
| randevu_uygulama | boolean | default true |
| odeme_email | boolean | default true |
| blog_email | boolean | default true |
| marketing_email | boolean | default false |

---

## GAMİFİCATION

### `rozetler_tanim`
| Alan | Tip | Açıklama |
|---|---|---|
| code | text | unique |
| name | text | |
| description | text | |
| icon | text | |
| condition | jsonb | Kazanma koşulu |

### `kullanici_rozetleri`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| rozet_id | uuid | |
| earned_at | timestamptz | |

### `haftalik_hedefler`
| Alan | Tip | Açıklama |
|---|---|---|
| musteri_id | uuid | |
| week_start | date | |
| target_sessions | int | |
| completed_sessions | int | |
| target_mood_logs | int | |
| completed_mood_logs | int | |

---

## SİSTEM

### `platform_ayarlari`
| Alan | Tip | Açıklama |
|---|---|---|
| key | text | unique |
| value | text | |
| description | text | |

Seed kayıtları:
- `commission_rate`: "20"
- `cancel_full_refund_hours`: "24"
- `cancel_partial_refund_hours`: "2"
- `cancel_partial_refund_percent`: "50"
- `payout_day`: "friday"
- `intro_session_duration`: "15"
- `session_timeout_minutes`: "30"
- `account_lock_minutes`: "15"
- `account_lock_attempts`: "5"
- `ip_ban_hours`: "24"
- `ip_ban_attempts`: "50"
- `video_link_active_minutes_before`: "10"
- `max_file_upload_mb`: "10"
- `audit_log_retention_days`: "90"
- `platform_name`: "MindBridger"

### `kriz_kelimeleri`
| Alan | Tip | Açıklama |
|---|---|---|
| word | text | |
| severity | enum | low, medium, high |
| is_active | boolean | |

### `audit_logs`
Tüm kritik kullanıcı eylemleri loglanır. Loglar 90 gün saklanır.

| Alan | Tip | Açıklama |
|---|---|---|
| user_id | uuid | |
| action | text | kayit, giris, randevu_olustur, iptal, odeme, seans_baslat, admin_islem vb. |
| table_name | text | |
| record_id | uuid | |
| old_values | jsonb | |
| new_values | jsonb | |
| ip_address | text | |
| expires_at | timestamptz | created_at + 90 gün; otomatik temizlik için |

---

## TAKVİM SYNC

### `takvim_sync`
Google Calendar ve Outlook OAuth token'larını saklar.

| Alan | Tip | Açıklama |
|---|---|---|
| danisan_id | uuid | → danisanlar.id |
| provider | enum | google, outlook |
| access_token | text | AES-256 şifreli, loga yazılmaz |
| refresh_token | text | AES-256 şifreli, loga yazılmaz |
| token_expiry | timestamptz | |
| calendar_id | text | Senkronize edilen takvim ID |
| is_active | boolean | default true |

---

## WEBİNAR

### `webinarlar`
Danışman veya admin tarafından oluşturulan ücretli eğitim/webinar seansları.

| Alan | Tip | Açıklama |
|---|---|---|
| host_id | uuid | → profiles.id (danışman veya admin) |
| title | text | |
| description | text | |
| scheduled_at | timestamptz | |
| duration_minutes | int | |
| price | numeric | 0 = ücretsiz |
| capacity | int | Maksimum katılımcı |
| registered_count | int | default 0 |
| status | enum | draft, published, cancelled, completed |
| daily_room_name | text | Daily.co oda adı |
| cover_image_url | text | |
| platform_commission_rate | numeric | default %20 |

### `webinar_kayitlar`
Webinar kayıt ve ödeme takibi.

| Alan | Tip | Açıklama |
|---|---|---|
| webinar_id | uuid | |
| musteri_id | uuid | |
| payment_id | uuid | → payments.id |
| status | enum | registered, attended, cancelled, refunded |
| joined_at | timestamptz | Gerçekten katıldıysa |

---

## GRUP SEANS

### `grup_seans_katilimcilar`
Grup seansı katılımcı takibi ve minimum kişi kontrolü.

| Alan | Tip | Açıklama |
|---|---|---|
| randevu_id | uuid | → randevular.id (session_type = grup) |
| musteri_id | uuid | |
| payment_id | uuid | → payments.id |
| status | enum | registered, confirmed, cancelled, attended |
| min_participant_met | boolean | default false; minimum katılımcıya ulaşınca true |

