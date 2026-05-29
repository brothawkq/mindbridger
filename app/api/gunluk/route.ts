import "server-only";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { rozetKontrolVeVer, gunlukSeriHesapla } from "@/lib/gamification/rozet";

const EMOJILER = ["😞", "😐", "🙂", "😊", "😄"] as const;
type MoodEmoji = (typeof EMOJILER)[number];

const PostSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  mood: z.number().int().min(1).max(5),
  mood_emoji: z.enum(EMOJILER),
  note: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  intensity: z.number().int().min(1).max(10).optional(),
  shared_with_danisan_id: z.string().uuid().nullable().optional(),
});

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const bugun = new Date().toISOString().substring(0, 10);
  const otuzGunOnce = new Date();
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
  const otuzGunOnceStr = otuzGunOnce.toISOString().substring(0, 10);

  const { data: kayitlar } = await supabase
    .from("gunluk_kayitlar")
    .select(
      "id, date, mood, mood_emoji, note, tags, intensity, shared_with_danisan_id, created_at"
    )
    .eq("musteri_id", user.id)
    .gte("date", otuzGunOnceStr)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  const kayitlarList = kayitlar ?? [];
  const kayitMap = new Map(kayitlarList.map((k) => [k.date, k]));
  const bugunKayit = kayitMap.get(bugun) ?? null;

  // Mood frequency stats
  const moodSayimlar: Record<MoodEmoji, number> = {
    "😞": 0,
    "😐": 0,
    "🙂": 0,
    "😊": 0,
    "😄": 0,
  };
  for (const k of kayitlarList) {
    const emoji = k.mood_emoji as MoodEmoji | null;
    if (emoji && emoji in moodSayimlar) {
      moodSayimlar[emoji]++;
    }
  }
  const toplam = kayitlarList.length;
  const moodIstatistik: Record<string, { count: number; pct: number }> = {};
  for (const emoji of EMOJILER) {
    moodIstatistik[emoji] = {
      count: moodSayimlar[emoji],
      pct: toplam > 0 ? Math.round((moodSayimlar[emoji] / toplam) * 100) : 0,
    };
  }

  // Crisis: 3+ consecutive days with mood=1
  let krizAktif = false;
  let ardardina = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tarih = d.toISOString().substring(0, 10);
    if (kayitMap.get(tarih)?.mood === 1) {
      ardardina++;
    } else {
      break;
    }
  }
  if (ardardina >= 3) krizAktif = true;

  // Find danisan from most recent confirmed/completed randevu
  const { data: sonRandevu } = await supabase
    .from("randevular")
    .select("danisan_id")
    .eq("musteri_id", user.id)
    .in("status", ["confirmed", "completed"])
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(1);

  let danisanIsim: string | null = null;
  let danisanId: string | null = null;

  const danisanUUID = sonRandevu?.[0]?.danisan_id;
  if (danisanUUID) {
    danisanId = danisanUUID;
    const { data: danisan } = await supabase
      .from("danisanlar")
      .select("profile_id")
      .eq("id", danisanId)
      .single();

    if (danisan?.profile_id) {
      const { data: profil } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", danisan.profile_id)
        .single();
      if (profil) {
        danisanIsim = `${profil.first_name} ${profil.last_name}`.trim();
      }
    }
  }

  return NextResponse.json({
    bugunKayit,
    gecmisKayitlar: kayitlarList.filter((k) => k.date !== bugun),
    moodIstatistik,
    krizAktif,
    danisanIsim,
    danisanId,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 422 });
  }

  const { date, mood, mood_emoji, note, tags, intensity, shared_with_danisan_id } =
    parsed.data;
  const kayitTarihi = date ?? new Date().toISOString().substring(0, 10);

  // DEN-23: shared_with_danisan_id sahiplik doğrulaması — yalnızca gerçek danışana paylaşılabilir
  let dogrulanmisDanisanId: string | null = shared_with_danisan_id ?? null;
  if (dogrulanmisDanisanId) {
    const { data: iliskiRandevu } = await supabase
      .from("randevular")
      .select("id")
      .eq("musteri_id", user.id)
      .eq("danisan_id", dogrulanmisDanisanId)
      .in("status", ["confirmed", "completed"])
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (!iliskiRandevu) {
      dogrulanmisDanisanId = null; // ilişki yok → paylaşım engellesin
    }
  }

  const { data: kayit, error } = await supabase
    .from("gunluk_kayitlar")
    .upsert(
      {
        musteri_id: user.id,
        date: kayitTarihi,
        mood,
        mood_emoji,
        note: note ?? null,
        tags: tags ?? [],
        intensity: intensity ?? null,
        shared_with_danisan_id: dogrulanmisDanisanId,
      },
      { onConflict: "musteri_id,date" }
    )
    .select()
    .single();

  if (error || !kayit) {
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu" },
      { status: 500 }
    );
  }

  // Crisis keyword detection in note
  if (note && note.trim().length > 0) {
    const { data: krizKelimeler } = await supabase
      .from("kriz_kelimeleri")
      .select("word, severity")
      .eq("is_active", true)
      .is("deleted_at", null);

    const noteLower = note.toLowerCase();
    const bulunanlar = (krizKelimeler ?? []).filter((k) =>
      noteLower.includes(k.word.toLowerCase())
    );

    if (bulunanlar.length > 0) {
      const { data: profil } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const musteriIsim = profil
        ? `${profil.first_name} ${profil.last_name}`.trim()
        : "Müşteri";

      // Notify danisan if note is shared
      if (kayit.shared_with_danisan_id) {
        const { data: danisan } = await supabase
          .from("danisanlar")
          .select("profile_id")
          .eq("id", kayit.shared_with_danisan_id)
          .single();

        if (danisan) {
          await supabase.from("bildirimler").insert({
            user_id: danisan.profile_id,
            title: "⚠ Kriz Protokolü: Müşteri Yardım İstiyor",
            body: `${musteriIsim} isimli müşterinizin günlük notunda kriz belirtileri tespit edildi.`,
            type: "kriz",
            channel: "app",
            data: { musteri_id: user.id, gunluk_id: kayit.id },
          });
        }
      }

      // Notify all active admins
      const { data: adminler } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .eq("status", "active")
        .is("deleted_at", null);

      if (adminler && adminler.length > 0) {
        await supabase.from("bildirimler").insert(
          adminler.map((a) => ({
            user_id: a.id,
            title: "⚠ Kriz Protokolü Tetiklendi",
            body: `${musteriIsim} günlük notunda kriz anahtar kelimeleri tespit edildi.`,
            type: "kriz",
            channel: "app",
            data: { musteri_id: user.id, gunluk_id: kayit.id },
          }))
        );
      }
    }
  }

  // Rozet tetikleyiciler: günlük sayısı + seri (fire-and-forget)
  void (async () => {
    try {
      const { count } = await supabase
        .from("gunluk_kayitlar")
        .select("id", { count: "exact", head: true })
        .eq("musteri_id", user.id)
        .is("deleted_at", null);
      await rozetKontrolVeVer(user.id, "journal_count", count ?? 1);
      const seri = await gunlukSeriHesapla(user.id);
      await rozetKontrolVeVer(user.id, "journal_streak", seri);
    } catch {
      // Rozet hatası yanıtı etkilemez
    }
  })();

  return NextResponse.json({ kayit });
}
