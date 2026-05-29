import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import GamificationKlient, {
  type Rozet,
  type HaftalikGorev,
} from "@/components/musteri/GamificationKlient";

export const metadata = { title: "Rozetler ve İlerleme | MindBridger" };

export default async function GamificationPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  // Week boundaries (Mon–Sun)
  const bugun = new Date();
  const haftaBaslangic = new Date(bugun);
  haftaBaslangic.setDate(bugun.getDate() - ((bugun.getDay() + 6) % 7));
  haftaBaslangic.setHours(0, 0, 0, 0);
  const haftaBitis = new Date(haftaBaslangic);
  haftaBitis.setDate(haftaBaslangic.getDate() + 7);
  const haftaStr = haftaBaslangic.toISOString();
  const haftaBitisStr = haftaBitis.toISOString();

  const [
    { data: rozetTanimlar },
    { data: kazanilanRozetler },
    { data: haftaGorev },
    { count: haftaRandevularCount },
    { count: haftaGunlukCount },
    { count: haftaOdevCount },
    { count: haftaMesajCount },
    { count: toplamRandevuCount },
    { count: toplamGunlukCount },
    { data: sonGunluklar },
  ] = await Promise.all([
    supabase
      .from("rozetler_tanim")
      .select("id, code, name, description, icon")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("kullanici_rozetleri")
      .select("rozet_id, earned_at")
      .eq("musteri_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("haftalik_hedefler")
      .select(
        "target_sessions, completed_sessions, target_mood_logs, completed_mood_logs"
      )
      .eq("musteri_id", user.id)
      .eq("week_start", haftaBaslangic.toISOString().substring(0, 10))
      .is("deleted_at", null)
      .maybeSingle(),
    // This week: attended sessions
    supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .gte("scheduled_at", haftaStr)
      .lt("scheduled_at", haftaBitisStr)
      .is("deleted_at", null),
    // This week: mood logs
    supabase
      .from("gunluk_kayitlar")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .gte("date", haftaBaslangic.toISOString().substring(0, 10))
      .lt("date", haftaBitis.toISOString().substring(0, 10))
      .is("deleted_at", null),
    // This week: completed tasks
    supabase
      .from("odevler")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", haftaStr)
      .lt("completed_at", haftaBitisStr)
      .is("deleted_at", null),
    // This week: sent messages
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", haftaStr)
      .lt("created_at", haftaBitisStr)
      .is("deleted_at", null),
    // All-time completed sessions
    supabase
      .from("randevular")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .is("deleted_at", null),
    // All-time mood logs
    supabase
      .from("gunluk_kayitlar")
      .select("id", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .is("deleted_at", null),
    // Last 30 days mood logs for streak calculation
    supabase
      .from("gunluk_kayitlar")
      .select("date")
      .eq("musteri_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  // Rozet map: earned ones
  const kazanilanMap = new Map(
    (kazanilanRozetler ?? []).map((kr) => [kr.rozet_id, kr.earned_at])
  );

  const rozetler: Rozet[] = (rozetTanimlar ?? []).map((rt) => ({
    id: rt.id,
    code: rt.code,
    name: rt.name,
    description: rt.description,
    icon: rt.icon,
    earned: kazanilanMap.has(rt.id),
    earned_at: kazanilanMap.get(rt.id) ?? null,
  }));

  // Weekly task flags
  const gunlukYazdi = (haftaGunlukCount ?? 0) > 0;
  const randevuKatildi = (haftaRandevularCount ?? 0) > 0;
  const odevTamamladi = (haftaOdevCount ?? 0) > 0;
  const mesajGonderdi = (haftaMesajCount ?? 0) > 0;

  const haftaGorevleri: HaftalikGorev[] = [
    { label: "Günlük Yaz", tamamlandi: gunlukYazdi },
    { label: "Seansa Katıl", tamamlandi: randevuKatildi },
    { label: "Ödev Tamamla", tamamlandi: odevTamamladi },
    { label: "Mesaj Gönder", tamamlandi: mesajGonderdi },
  ];
  const tamamlananGorev = haftaGorevleri.filter((g) => g.tamamlandi).length;

  // Streak: consecutive days with mood log up to today
  const gunlukTarihler = new Set(
    (sonGunluklar ?? []).map((g) => g.date)
  );
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tarih = d.toISOString().substring(0, 10);
    if (gunlukTarihler.has(tarih)) {
      streak++;
    } else {
      break;
    }
  }

  // Weekly session / mood targets
  const hedefSeans = haftaGorev?.target_sessions ?? 1;
  const tamamlananSeans =
    haftaGorev?.completed_sessions ?? (haftaRandevularCount ?? 0);
  const hedefMood = haftaGorev?.target_mood_logs ?? 5;
  const tamamlananMood =
    haftaGorev?.completed_mood_logs ?? (haftaGunlukCount ?? 0);

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Rozetler ve İlerleme
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Hedeflerini tamamla, rozet kazan
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        <GamificationKlient
          rozetler={rozetler}
          haftaGorevleri={haftaGorevleri}
          tamamlananGorev={tamamlananGorev}
          toplamGorev={haftaGorevleri.length}
          istatistikler={{
            toplamSeans: toplamRandevuCount ?? 0,
            toplamGunluk: toplamGunlukCount ?? 0,
            toplamRozet: kazanilanRozetler?.length ?? 0,
            streak,
          }}
          haftaSeansler={{
            tamamlanan: tamamlananSeans,
            hedef: hedefSeans,
          }}
          haftaMoodlar={{
            tamamlanan: tamamlananMood,
            hedef: hedefMood,
          }}
        />
      </div>
    </>
  );
}
