-- Atomik başarısız giriş sayacı RPC fonksiyonu
-- Race condition fix: read-modify-write yerine tek SQL ile INSERT ... ON CONFLICT ... UPDATE
--
-- Eşikler (CONFLICTS.md):
--   5  başarısız giriş → 15 dakika kilit
--   50 başarısız giriş → 24 saat IP yasağı

create or replace function record_failed_attempt(p_ip text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts   integer;
  v_locked     timestamptz;
  v_banned     timestamptz;
  v_now        timestamptz := now();
begin
  -- Tek atomik işlem: upsert + failed_attempts = failed_attempts + 1
  insert into ip_blacklist (ip_address, failed_attempts, last_attempt_at)
  values (p_ip, 1, v_now)
  on conflict (ip_address) do update
    set failed_attempts  = ip_blacklist.failed_attempts + 1,
        last_attempt_at  = v_now
  returning failed_attempts, locked_until, banned_until
  into v_attempts, v_locked, v_banned;

  -- Zaten aktif bir yasak varsa eşik kontrolü yapma
  if v_banned is not null and v_banned > v_now then
    return json_build_object(
      'failed_attempts', v_attempts,
      'locked_until',    v_locked,
      'banned_until',    v_banned
    );
  end if;

  -- 50 deneme → 24 saatlik IP yasağı
  if v_attempts >= 50 then
    v_banned := v_now + interval '24 hours';
    update ip_blacklist
    set banned_until = v_banned
    where ip_address = p_ip;

  -- Her 5 denemede bir 15 dakikalık kilit
  elsif v_attempts % 5 = 0 then
    v_locked := v_now + interval '15 minutes';
    update ip_blacklist
    set locked_until = v_locked
    where ip_address = p_ip;
  end if;

  return json_build_object(
    'failed_attempts', v_attempts,
    'locked_until',    v_locked,
    'banned_until',    v_banned
  );
end;
$$;

-- Yalnızca service_role bu fonksiyonu çağırabilir (security definer ile çalışır)
revoke execute on function record_failed_attempt(text) from public, anon, authenticated;
grant  execute on function record_failed_attempt(text) to service_role;
