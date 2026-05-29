-- Migration 011: Atomic webinar registration RPC
-- Prevents race condition where concurrent requests bypass capacity check
-- Uses FOR UPDATE row lock to serialize registrations

CREATE OR REPLACE FUNCTION webinar_kayit_ekle(
  p_webinar_id uuid,
  p_musteri_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_webinar record;
  v_kayit_id uuid;
  v_mevcut_id uuid;
BEGIN
  -- Lock the webinar row to prevent concurrent capacity bypass
  SELECT id, status, capacity, registered_count, price, scheduled_at
  INTO v_webinar
  FROM public.webinarlar
  WHERE id = p_webinar_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Webinar bulunamadı', 'http_status', 404);
  END IF;

  IF v_webinar.status != 'published' THEN
    RETURN jsonb_build_object('error', 'Bu webinar kayıt kabul etmiyor', 'http_status', 400);
  END IF;

  IF v_webinar.scheduled_at < now() THEN
    RETURN jsonb_build_object('error', 'Geçmiş tarihli webinara kayıt yapılamaz', 'http_status', 400);
  END IF;

  IF v_webinar.registered_count >= v_webinar.capacity THEN
    RETURN jsonb_build_object('error', 'Webinar kapasitesi dolmuş', 'http_status', 400);
  END IF;

  -- Mükerrer kayıt engeli
  SELECT id INTO v_mevcut_id
  FROM public.webinar_kayitlar
  WHERE webinar_id = p_webinar_id
    AND musteri_id = p_musteri_id
    AND status IN ('registered', 'attended');

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'Bu webinara zaten kayıtlısınız', 'http_status', 409);
  END IF;

  -- Insert registration
  INSERT INTO public.webinar_kayitlar (webinar_id, musteri_id, status)
  VALUES (p_webinar_id, p_musteri_id, 'registered')
  RETURNING id INTO v_kayit_id;

  -- Atomic increment (safe: row is locked above)
  UPDATE public.webinarlar
  SET registered_count = registered_count + 1
  WHERE id = p_webinar_id;

  RETURN jsonb_build_object(
    'ok', true,
    'kayit_id', v_kayit_id,
    'ucretli', (v_webinar.price > 0),
    'fiyat', v_webinar.price,
    'http_status', 201
  );
END;
$$;

GRANT EXECUTE ON FUNCTION webinar_kayit_ekle(uuid, uuid) TO authenticated;
