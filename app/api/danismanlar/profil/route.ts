import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

// ── Profil tamamlanma hesabı ─────────────────────────────────
interface CompletionData {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  approach: string[] | null;
  age_groups: string[] | null;
  languages: string[] | null;
  city: string | null;
  price_individual: number | null;
  session_duration: number | null;
  is_online: boolean;
  is_in_person: boolean;
  diploma_url: string | null;
  bank_iban: string | null;
}

function profilTamamlanmaHesapla(d: CompletionData): number {
  const kontroller = [
    !!d.first_name?.trim(),
    !!d.last_name?.trim(),
    !!d.avatar_url,
    !!d.title?.trim(),
    !!(d.bio && d.bio.length >= 50),
    (d.specialties?.length ?? 0) > 0,
    (d.approach?.length ?? 0) > 0,
    (d.age_groups?.length ?? 0) > 0,
    (d.languages?.length ?? 0) > 0,
    !!d.city?.trim(),
    (d.price_individual ?? 0) > 0,
    (d.session_duration ?? 0) > 0,
    d.is_online || d.is_in_person,
    !!d.diploma_url,
    !!d.bank_iban,
  ];
  const tamamlanan = kontroller.filter(Boolean).length;
  return Math.round((tamamlanan / kontroller.length) * 100);
}

const ProfilGuncelleSchema = z.object({
  // Profil
  first_name: z.string().min(1, "Ad zorunludur").max(100).optional(),
  last_name: z.string().min(1, "Soyad zorunludur").max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  avatar_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  // Danışman
  title: z.string().max(200).nullable().optional(),
  bio: z.string().max(5000).nullable().optional(),
  specialties: z.array(z.string().max(100)).max(20).nullable().optional(),
  approach: z.array(z.string().max(100)).max(20).nullable().optional(),
  age_groups: z.array(z.string().max(50)).nullable().optional(),
  languages: z.array(z.string().max(50)).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  gender: z
    .enum(["erkek", "kadin", "belirtmek_istemiyorum"])
    .nullable()
    .optional(),
  is_online: z.boolean().optional(),
  is_in_person: z.boolean().optional(),
  is_supervisor: z.boolean().optional(),
  price_individual: z.number().min(0).max(100000).nullable().optional(),
  price_group: z.number().min(0).max(100000).nullable().optional(),
  price_async: z.number().min(0).max(100000).nullable().optional(),
  session_duration: z.number().min(30).max(240).nullable().optional(),
  buffer_minutes: z.number().min(0).max(60).optional(),
  intro_session_enabled: z.boolean().optional(),
  intro_session_duration: z.number().min(15).max(60).optional(),
  sliding_scale: z.boolean().optional(),
  sliding_scale_price: z.number().min(0).max(100000).nullable().optional(),
  // Yayın durumu
  profile_published: z.boolean().optional(),
});

/** GET /api/danismanlar/profil — danisan: kendi profil verisi */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisan } = await supabase
    .from("danisanlar")
    .select(`
      id, slug, title, bio, specialties, approach, age_groups, languages,
      city, district, gender, is_online, is_in_person, is_supervisor,
      price_individual, price_group, price_async, session_duration,
      buffer_minutes, intro_session_enabled, intro_session_duration,
      sliding_scale, sliding_scale_price, profile_completion_percent,
      profile_published, diploma_url, id_document_url, bank_name,
      bank_iban, bank_account_name
    `)
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisan) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ danisan, profil });
}

/** PUT /api/danismanlar/profil — danisan: profil güncelle */
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id, diploma_url, bank_iban, is_online, is_in_person")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) return NextResponse.json({ error: "Danışman bulunamadı" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = ProfilGuncelleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  // profiles güncellemesi (typed partial)
  const profilUpdate = {
    ...(d.first_name !== undefined ? { first_name: d.first_name } : {}),
    ...(d.last_name !== undefined ? { last_name: d.last_name } : {}),
    ...(d.phone !== undefined ? { phone: d.phone } : {}),
    ...(d.avatar_url !== undefined ? { avatar_url: d.avatar_url } : {}),
  };

  if (Object.keys(profilUpdate).length > 0) {
    await supabase
      .from("profiles")
      .update({ ...profilUpdate, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  // Profil tamamlanma hesabı — mevcut veriyle gelen veriyi birleştir
  const { data: guncellenenProfil } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: guncellenenDanisan } = await supabase
    .from("danisanlar")
    .select(
      `title, bio, specialties, approach, age_groups, languages, city,
       price_individual, session_duration, is_online, is_in_person,
       diploma_url, bank_iban`
    )
    .eq("id", danisanRow.id)
    .single();

  const merged: CompletionData = {
    first_name: d.first_name ?? guncellenenProfil?.first_name ?? null,
    last_name: d.last_name ?? guncellenenProfil?.last_name ?? null,
    avatar_url: d.avatar_url ?? guncellenenProfil?.avatar_url ?? null,
    title: d.title ?? guncellenenDanisan?.title ?? null,
    bio: d.bio ?? guncellenenDanisan?.bio ?? null,
    specialties: d.specialties ?? guncellenenDanisan?.specialties ?? null,
    approach: d.approach ?? guncellenenDanisan?.approach ?? null,
    age_groups: d.age_groups ?? guncellenenDanisan?.age_groups ?? null,
    languages: d.languages ?? guncellenenDanisan?.languages ?? null,
    city: d.city ?? guncellenenDanisan?.city ?? null,
    price_individual: d.price_individual ?? guncellenenDanisan?.price_individual ?? null,
    session_duration: d.session_duration ?? guncellenenDanisan?.session_duration ?? null,
    is_online: d.is_online ?? guncellenenDanisan?.is_online ?? danisanRow.is_online,
    is_in_person: d.is_in_person ?? guncellenenDanisan?.is_in_person ?? danisanRow.is_in_person,
    diploma_url: guncellenenDanisan?.diploma_url ?? danisanRow.diploma_url ?? null,
    bank_iban: guncellenenDanisan?.bank_iban ?? danisanRow.bank_iban ?? null,
  };

  const yeniTamamlanma = profilTamamlanmaHesapla(merged);
  const yayinDurumu =
    yeniTamamlanma < 100 ? false : (d.profile_published ?? false);

  // danisanlar güncellemesi (typed partial)
  const { error } = await supabase
    .from("danisanlar")
    .update({
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.bio !== undefined ? { bio: d.bio } : {}),
      ...(d.specialties !== undefined ? { specialties: d.specialties } : {}),
      ...(d.approach !== undefined ? { approach: d.approach } : {}),
      ...(d.age_groups !== undefined ? { age_groups: d.age_groups } : {}),
      ...(d.languages !== undefined ? { languages: d.languages } : {}),
      ...(d.city !== undefined ? { city: d.city } : {}),
      ...(d.district !== undefined ? { district: d.district } : {}),
      ...(d.gender !== undefined ? { gender: d.gender } : {}),
      ...(d.is_online !== undefined ? { is_online: d.is_online } : {}),
      ...(d.is_in_person !== undefined ? { is_in_person: d.is_in_person } : {}),
      ...(d.is_supervisor !== undefined ? { is_supervisor: d.is_supervisor } : {}),
      ...(d.price_individual !== undefined ? { price_individual: d.price_individual } : {}),
      ...(d.price_group !== undefined ? { price_group: d.price_group } : {}),
      ...(d.price_async !== undefined ? { price_async: d.price_async } : {}),
      ...(d.session_duration !== undefined ? { session_duration: d.session_duration } : {}),
      ...(d.buffer_minutes !== undefined ? { buffer_minutes: d.buffer_minutes } : {}),
      ...(d.intro_session_enabled !== undefined ? { intro_session_enabled: d.intro_session_enabled } : {}),
      ...(d.intro_session_duration !== undefined ? { intro_session_duration: d.intro_session_duration } : {}),
      ...(d.sliding_scale !== undefined ? { sliding_scale: d.sliding_scale } : {}),
      ...(d.sliding_scale_price !== undefined ? { sliding_scale_price: d.sliding_scale_price } : {}),
      profile_completion_percent: yeniTamamlanma,
      profile_published: yayinDurumu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", danisanRow.id);

  if (error) return NextResponse.json({ error: "Profil güncellenemedi" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    profile_completion_percent: yeniTamamlanma,
    profile_published: yayinDurumu,
  });
}
