-- 003: günlük kayıtlar — tags, intensity ve upsert için unique constraint
alter table gunluk_kayitlar
  add column if not exists tags text[] not null default '{}',
  add column if not exists intensity int check (intensity between 1 and 10);

alter table gunluk_kayitlar
  add constraint gunluk_kayitlar_musteri_date_unique unique (musteri_id, date);

create index if not exists idx_gunluk_kayitlar_date on gunluk_kayitlar(date);
