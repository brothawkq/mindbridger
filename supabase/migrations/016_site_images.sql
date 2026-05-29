-- site-images bucket
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "Public read site-images"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "Admin insert site-images"
  on storage.objects for insert
  with check (
    bucket_id = 'site-images'
    and (auth.jwt() ->> 'role') = 'admin'
  );

create policy "Admin update site-images"
  on storage.objects for update
  using (bucket_id = 'site-images' and (auth.jwt() ->> 'role') = 'admin');

create policy "Admin delete site-images"
  on storage.objects for delete
  using (bucket_id = 'site-images' and (auth.jwt() ->> 'role') = 'admin');

insert into site_settings (key, value, description) values
  ('hero_image_url',              '', 'Hero bölümü yan görseli'),
  ('hero_image_alt',              'Online terapi', 'Hero görseli alt text'),
  ('why_section_image_url',       '', 'Neden Biz görseli'),
  ('how_step1_image_url',         '', 'Nasıl çalışır — Adım 1 görseli'),
  ('how_step2_image_url',         '', 'Nasıl çalışır — Adım 2 görseli'),
  ('how_step3_image_url',         '', 'Nasıl çalışır — Adım 3 görseli'),
  ('corporate_section_image_url', '', 'Kurumsal CTA bölümü görseli'),
  ('og_image_url',                '', 'OG paylaşım görseli 1200x630')
on conflict (key) do nothing;
