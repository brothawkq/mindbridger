import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

// ─── Sabitler ────────────────────────────────────────────────────
const PAGE_SIZE = 12;

type GenderType = Database["public"]["Enums"]["gender_type"];

// ─── Query param validasyonu ─────────────────────────────────────
//
// Çoklu değerler virgülle ayrılmış string olarak gelir:
//   ?uzmanlik=Anksiyete,Depresyon
//   ?siralama=puan  (varsayılan)
//   ?sayfa=2
//
const filtrelerSchema = z.object({
  // Çoklu seçim (overlaps filtresi)
  uzmanlik:          z.string().max(500).optional(),
  yaklasim:          z.string().max(500).optional(),
  yas_grubu:         z.string().max(500).optional(),
  dil:               z.string().max(500).optional(),

  // Tekil seçim
  sehir:             z.string().max(80).optional(),
  cinsiyet:          z.enum(["erkek", "kadin", "belirtmek_istemiyorum"]).optional(),

  // Boolean filtreler ("true" | "false" string)
  online:            z.enum(["true", "false"]).optional(),
  yuz_yuze:          z.enum(["true", "false"]).optional(),
  ucretsiz_gorusme:  z.enum(["true", "false"]).optional(),
  sliding_scale:     z.enum(["true", "false"]).optional(),

  // Fiyat aralığı
  min_fiyat:         z.coerce.number().int().min(0).max(100_000).optional(),
  max_fiyat:         z.coerce.number().int().min(0).max(100_000).optional(),

  // Metin araması (title + bio üzerinde ilike; isim araması ileride full-text ile geliştirilecek)
  q: z.string().max(100).optional(),

  // Minimum puan filtresi (0–5)
  min_puan: z.coerce.number().min(0).max(5).optional(),

  // Sıralama ve sayfalama
  siralama: z
    .enum(["puan", "fiyat_artan", "fiyat_azalan", "seans_sayisi"])
    .optional()
    .default("puan"),
  sayfa: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

type FiltrelerInput = z.infer<typeof filtrelerSchema>;

// ─── Yardımcı: virgüllü string → dizi ────────────────────────────
function parseCsvParam(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── GET /api/danismanlar ────────────────────────────────────────
//
// Public endpoint — kimlik doğrulama gerekmez.
// Yalnızca profile_published=true ve profile_completion_percent=100
// olan danışmanları döndürür (RLS + query filtresi).
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Query param parse + validasyon
  const searchParams = req.nextUrl.searchParams;
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = filtrelerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Geçersiz filtre parametresi.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const filtreler: FiltrelerInput = parsed.data;
  const supabase = await createClient();
  const offset   = (filtreler.sayfa - 1) * PAGE_SIZE;

  // 2. Temel sorgu — hassas alanlar seçilmiyor (banka, belge, red gerekçesi)
  let query = supabase
    .from("danisanlar")
    .select(
      `
      id,
      slug,
      title,
      bio,
      specialties,
      approach,
      age_groups,
      languages,
      gender,
      city,
      district,
      is_online,
      is_in_person,
      intro_session_enabled,
      intro_session_duration,
      session_duration,
      price_individual,
      price_group,
      price_async,
      sliding_scale,
      sliding_scale_price,
      average_rating,
      total_reviews,
      total_sessions,
      profiles!danisanlar_profile_id_fkey (
        first_name,
        last_name,
        avatar_url
      )
      `,
      { count: "exact" }
    )
    // Yayında + tamamlanmış profil zorunluluğu (PRD Faz 2 notu)
    .eq("profile_published", true)
    .eq("profile_completion_percent", 100)
    .is("deleted_at", null);

  // 3. Filtreler ─────────────────────────────────────────────────

  // Şehir (case-insensitive içerir)
  if (filtreler.sehir) {
    query = query.ilike("city", `%${filtreler.sehir}%`);
  }

  // Cinsiyet
  if (filtreler.cinsiyet) {
    query = query.eq("gender", filtreler.cinsiyet as GenderType);
  }

  // Boolean alanlar
  if (filtreler.online === "true")           query = query.eq("is_online", true);
  if (filtreler.yuz_yuze === "true")         query = query.eq("is_in_person", true);
  if (filtreler.ucretsiz_gorusme === "true") query = query.eq("intro_session_enabled", true);
  if (filtreler.sliding_scale === "true")    query = query.eq("sliding_scale", true);

  // Fiyat aralığı
  if (filtreler.min_fiyat !== undefined) {
    query = query.gte("price_individual", filtreler.min_fiyat);
  }
  if (filtreler.max_fiyat !== undefined) {
    query = query.lte("price_individual", filtreler.max_fiyat);
  }

  // Metin araması — title ve bio (isim araması ileride full-text index ile)
  if (filtreler.q) {
    // % ve _ ilike joker karakterleri; , ve . PostgREST .or() ayırıcıları — hepsi temizlenir
    const safe = filtreler.q.replace(/[%_,.]/g, "");
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,bio.ilike.%${safe}%`);
    }
  }

  // Minimum puan
  if (filtreler.min_puan !== undefined) {
    query = query.gte("average_rating", filtreler.min_puan);
  }

  // Array overlaps (çoklu seçim — en az bir eleman eşleşmeli)
  const uzmanliklar = parseCsvParam(filtreler.uzmanlik);
  if (uzmanliklar.length > 0) {
    query = query.overlaps("specialties", uzmanliklar);
  }

  const yaklasimlar = parseCsvParam(filtreler.yaklasim);
  if (yaklasimlar.length > 0) {
    query = query.overlaps("approach", yaklasimlar);
  }

  const yasGruplari = parseCsvParam(filtreler.yas_grubu);
  if (yasGruplari.length > 0) {
    query = query.overlaps("age_groups", yasGruplari);
  }

  const diller = parseCsvParam(filtreler.dil);
  if (diller.length > 0) {
    query = query.overlaps("languages", diller);
  }

  // 4. Sıralama ──────────────────────────────────────────────────
  switch (filtreler.siralama) {
    case "puan":
      // En yüksek puan önce; eşit puanlı danışmanlar toplam seans sayısına göre sıralanır
      query = query
        .order("average_rating",  { ascending: false })
        .order("total_reviews",   { ascending: false });
      break;

    case "fiyat_artan":
      // Fiyatı null olanlar listenin sonuna düşer
      query = query.order("price_individual", { ascending: true,  nullsFirst: false });
      break;

    case "fiyat_azalan":
      query = query.order("price_individual", { ascending: false, nullsFirst: false });
      break;

    case "seans_sayisi":
      query = query.order("total_sessions", { ascending: false });
      break;
  }

  // 5. Sayfalama
  query = query.range(offset, offset + PAGE_SIZE - 1);

  // 6. Sorguyu çalıştır
  const { data, error, count } = await query;

  if (error) {
    console.error("[danismanlar] sorgu hatası:", error.message);
    return NextResponse.json(
      { error: "Danışmanlar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  const toplam       = count ?? 0;
  const toplamSayfa  = Math.ceil(toplam / PAGE_SIZE);

  return NextResponse.json(
    {
      danismanlar: data ?? [],
      meta: {
        toplam,
        sayfa:        filtreler.sayfa,
        toplam_sayfa: toplamSayfa,
        limit:        PAGE_SIZE,
        sonuc_var:    toplam > 0,
      },
    },
    {
      status: 200,
      headers: {
        // ISR ile uyumlu: Vercel CDN'de 60 sn önbellekle, stale-while-revalidate ile taze tut
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
