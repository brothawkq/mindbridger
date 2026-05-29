-- Chatbot API rate limiting tablosu
-- IP başına 1 dakikalık pencerede maksimum istek sayısını izler.

create table chatbot_rate_limits (
  ip_address  text        not null primary key,
  count       int         not null default 1,
  window_start timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: yalnızca service_role erişebilir
alter table chatbot_rate_limits enable row level security;

create policy "chatbot_rate_limits_service_only" on chatbot_rate_limits
  for all using (false);   -- RLS tüm rolleri engeller; service_role RLS'yi bypass eder

-- Süresi dolmuş satırları temizleyen fonksiyon (cron tarafından çağrılır)
create or replace function clean_chatbot_rate_limits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from chatbot_rate_limits
  where window_start < now() - interval '5 minutes';
end;
$$;

revoke execute on function clean_chatbot_rate_limits() from public, anon, authenticated;
grant  execute on function clean_chatbot_rate_limits() to service_role;
