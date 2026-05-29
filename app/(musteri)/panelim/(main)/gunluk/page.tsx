import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import GunlukKlient, { type GunlukKayit } from "@/components/musteri/GunlukKlient";

export const metadata = { title: "Günlük ve Ruh Hali | MindBridger" };

const EMOJILER = ["😞", "😐", "🙂", "😊", "😄"] as const;
type MoodEmoji = (typeof EMOJILER)[number];

export default async function GunlukPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

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

  const kayitlarList: GunlukKayit[] = (kayitlar ?? []).map((k) => ({
    id: k.id,
    date: k.date,
    mood: k.mood,
    mood_emoji: k.mood_emoji,
    note: k.note,
    tags: k.tags,
    intensity: k.intensity,
    shared_with_danisan_id: k.shared_with_danisan_id,
    created_at: k.created_at,
  }));

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
      pct:
        toplam > 0
          ? Math.round((moodSayimlar[emoji] / toplam) * 100)
          : 0,
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

  return (
    <>
      {/* Frame Header */}
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Günlük ve Ruh Hali
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Emoji seçimi anlık kayıt yapmaz — Kaydet butonu gerekli
        </span>
      </div>

      <GunlukKlient
        bugunKayit={bugunKayit}
        gecmisKayitlar={kayitlarList.filter((k) => k.date !== bugun)}
        moodIstatistik={moodIstatistik}
        krizAktif={krizAktif}
        danisanIsim={danisanIsim}
        danisanId={danisanId}
      />
    </>
  );
}
