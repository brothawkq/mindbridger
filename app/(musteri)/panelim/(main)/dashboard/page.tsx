import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DashboardKlient from "@/components/musteri/DashboardKlient";

export const metadata = { title: "Dashboard — Müşteri | MindBridger" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const bugun = new Date().toISOString().substring(0, 10);
  const haftaBaslangic = new Date();
  haftaBaslangic.setDate(
    haftaBaslangic.getDate() - ((haftaBaslangic.getDay() + 6) % 7)
  );
  haftaBaslangic.setHours(0, 0, 0, 0);
  const haftaStr = haftaBaslangic.toISOString();

  const [
    { data: profil },
    { data: yaklasanRandevuRaw },
    { data: bugunMood },
    { count: bekleyenOdev },
    { data: aktivePaketRaw },
    { data: blogIcerikleriRaw },
    { data: rozetler },
    { data: rozetTanimlar },
    { data: haftaGunluk },
    { data: haftaRandevu },
    { data: haftaOdev },
    { data: haftaMesaj },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("randevular")
      .select("id, scheduled_at, status, session_type, danisan_id")
      .eq("musteri_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString())
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: true })
      .limit(1),
    supabase
      .from("gunluk_kayitlar")
      .select("id, mood, mood_emoji, note")
      .eq("musteri_id", user.id)
      .eq("date", bugun)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("odevler")
      .select("*", { count: "exact", head: true })
      .eq("musteri_id", user.id)
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("musteri_paketler")
      .select("id, sessions_used, sessions_total, sessions_remaining, status, expires_at")
      .eq("musteri_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("blog_posts")
      .select("id, title, slug, tags, excerpt, published_at, danisan_id")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("kullanici_rozetleri")
      .select("rozet_id, earned_at")
      .eq("musteri_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("rozetler_tanim")
      .select("id, code, name, description, icon")
      .is("deleted_at", null),
    supabase
      .from("gunluk_kayitlar")
      .select("id")
      .eq("musteri_id", user.id)
      .gte("created_at", haftaStr)
      .is("deleted_at", null)
      .limit(1),
    supabase
      .from("randevular")
      .select("id")
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .gte("scheduled_at", haftaStr)
      .is("deleted_at", null)
      .limit(1),
    supabase
      .from("odevler")
      .select("id")
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", haftaStr)
      .is("deleted_at", null)
      .limit(1),
    supabase
      .from("messages")
      .select("id")
      .eq("sender_id", user.id)
      .gte("created_at", haftaStr)
      .is("deleted_at", null)
      .limit(1),
  ]);

  const randevuDanisanId = yaklasanRandevuRaw?.[0]?.danisan_id;
  const blogDanisanIds = [
    ...new Set(
      (blogIcerikleriRaw ?? [])
        .map((b) => b.danisan_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const [{ data: randevuDanisan }, { data: blogDanisanlar }] =
    await Promise.all([
      randevuDanisanId
        ? supabase
            .from("danisanlar")
            .select("id, title, profiles:profile_id(first_name, last_name)")
            .eq("id", randevuDanisanId)
            .single()
        : Promise.resolve({ data: null }),
      blogDanisanIds.length > 0
        ? supabase
            .from("danisanlar")
            .select("id, title, profiles:profile_id(first_name, last_name)")
            .in("id", blogDanisanIds)
        : Promise.resolve({
            data: [] as {
              id: string;
              title: string | null;
              profiles: {
                first_name: string | null;
                last_name: string | null;
              } | null;
            }[],
          }),
    ]);

  const kazanilanRozetIds = new Set((rozetler ?? []).map((r) => r.rozet_id));
  const rozetlerHesap = (rozetTanimlar ?? []).map((r) => ({
    ...r,
    earned: kazanilanRozetIds.has(r.id),
    earned_at:
      (rozetler ?? []).find((kr) => kr.rozet_id === r.id)?.earned_at ?? null,
  }));

  const danisanMap = new Map((blogDanisanlar ?? []).map((d) => [d.id, d]));
  const blogler = (blogIcerikleriRaw ?? []).map((b) => ({
    ...b,
    danisan_id: b.danisan_id ?? "",
    danisanBilgi: b.danisan_id ? (danisanMap.get(b.danisan_id) ?? null) : null,
  }));

  const haftaGorevler = {
    gunlukYaz: (haftaGunluk ?? []).length > 0,
    randevuKatil: (haftaRandevu ?? []).length > 0,
    odevTamamla: (haftaOdev ?? []).length > 0,
    mesajGonder: (haftaMesaj ?? []).length > 0,
  };

  const baslangicVeri = {
    yaklasanRandevu: yaklasanRandevuRaw?.[0]
      ? { ...yaklasanRandevuRaw[0], danisanBilgi: randevuDanisan ?? null }
      : null,
    bugunMood: bugunMood ?? null,
    bekleyenOdev: bekleyenOdev ?? 0,
    aktivePaket: aktivePaketRaw?.[0] ?? null,
    blogIcerikleri: blogler,
    rozetler: rozetlerHesap,
    haftaGorevler,
    tamamlananGorev: Object.values(haftaGorevler).filter(Boolean).length,
    toplamGorev: 4,
  };

  const kullaniciIsim = profil?.first_name ?? "Kullanıcı";

  return (
    <DashboardKlient
      baslangicVeri={baslangicVeri}
      kullaniciIsim={kullaniciIsim}
    />
  );
}
