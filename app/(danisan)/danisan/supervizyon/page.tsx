import "server-only";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata = { title: "Süpervizyon — Danışman | MindBridger" };

export default async function SupervizyonPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id, is_supervisor, slug")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  const [{ data: supervizorRandevularRaw }, { data: alanRandevularRaw }, { data: supervizorler }] =
    await Promise.all([
      danisanRow.is_supervisor
        ? supabase
            .from("randevular")
            .select("id, scheduled_at, status, duration_minutes, price, musteri_id")
            .eq("danisan_id", danisanRow.id)
            .eq("session_type", "supervizyon")
            .is("deleted_at", null)
            .order("scheduled_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null }),
      supabase
        .from("randevular")
        .select("id, scheduled_at, status, duration_minutes, price, danisan_id")
        .eq("musteri_id", user.id)
        .eq("session_type", "supervizyon")
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false })
        .limit(20),
      supabase
        .from("danisanlar")
        .select(`
          id, slug, title, specialties, price_individual,
          profiles:profile_id(first_name, last_name, avatar_url)
        `)
        .eq("is_supervisor", true)
        .eq("profile_published", true)
        .is("deleted_at", null)
        .limit(12),
    ]);

  const supervizorMusteriIds = (supervizorRandevularRaw ?? []).map((r) => r.musteri_id);
  const alanDanisanIds = (alanRandevularRaw ?? []).map((r) => r.danisan_id);

  const [{ data: musteriProfiller }, { data: danisanProfiller }] = await Promise.all([
    supervizorMusteriIds.length > 0
      ? supabase.from("profiles").select("id, first_name, last_name").in("id", supervizorMusteriIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null }[] }),
    alanDanisanIds.length > 0
      ? supabase.from("danisanlar").select("id, slug, title, profile_id").in("id", alanDanisanIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string | null; profile_id: string }[] }),
  ]);

  const musteriMap = new Map((musteriProfiller ?? []).map((p) => [p.id, p]));
  const danisanMap = new Map((danisanProfiller ?? []).map((d) => [d.id, d]));

  type RandevuRow = { id: string; scheduled_at: string; status: string; duration_minutes: number; price: number };
  const supervizorRandevular = (supervizorRandevularRaw ?? []).map((r) => ({
    ...r,
    musteriIsim: (() => { const p = musteriMap.get(r.musteri_id); return p ? `${p.first_name} ${p.last_name}` : "Bilinmiyor"; })(),
  }));
  const alanRandevular = (alanRandevularRaw ?? []).map((r) => ({
    ...r,
    danisanBilgi: danisanMap.get(r.danisan_id) ?? null,
  }));

  function formatTarih(iso: string) {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  const DURUM_ETIKET: Record<string, string> = {
    pending: "Bekliyor",
    confirmed: "Onaylı",
    completed: "Tamamlandı",
    cancelled: "İptal",
    rejected: "Reddedildi",
    no_show: "Gelmedi",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Araçlar</div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">Süpervizyon</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Süpervizör Modu */}
        {danisanRow.is_supervisor && (
          <section>
            <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3 pb-2 border-b border-dotted border-[#D4E4D8] dark:border-[#333]">
              Süpervizör Modunda — Gelen Talepler
            </div>
            {!supervizorRandevular || supervizorRandevular.length === 0 ? (
              <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-6 text-center text-xs text-[#4A4D4A]">
                Henüz süpervizyon talebi yok.
              </div>
            ) : (
              <div className="space-y-2">
                {supervizorRandevular.map((r) => {
                  return (
                    <div key={r.id} className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-[#252625] dark:text-white">
                            {r.musteriIsim}
                          </div>
                          <div className="text-[11px] text-[#4A4D4A]">{formatTarih(r.scheduled_at)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase border-[1.5px] border-[#325343] px-1.5 py-0.5 text-[#252625] dark:border-white dark:text-white">
                            {DURUM_ETIKET[r.status] ?? r.status}
                          </span>
                          <Link
                            href={`/danisan/randevular/${r.id}`}
                            className="text-[11px] text-[#252625] underline dark:text-white"
                          >
                            Detay
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Alan Modu — Randevularım */}
        <section>
          <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3 pb-2 border-b border-dotted border-[#D4E4D8] dark:border-[#333]">
            Süpervizör Randevularım
          </div>
          {!alanRandevular || alanRandevular.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-6 text-center text-xs text-[#4A4D4A]">
              Henüz süpervizyon randevunuz yok.
            </div>
          ) : (
            <div className="space-y-2">
              {alanRandevular.map((r) => {
                return (
                  <div key={r.id} className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-[#252625] dark:text-white">
                          {r.danisanBilgi?.title ?? "Süpervizör"}
                        </div>
                        <div className="text-[11px] text-[#4A4D4A]">{formatTarih(r.scheduled_at)}</div>
                      </div>
                      <span className="text-[9px] font-bold uppercase border-[1.5px] border-[#325343] px-1.5 py-0.5 text-[#252625] dark:border-white dark:text-white">
                        {DURUM_ETIKET[r.status] ?? r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Süpervizör Ara */}
      <section className="mt-8">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-3 pb-2 border-b border-dotted border-[#D4E4D8] dark:border-[#333]">
          Süpervizör Ara
        </div>
        {!supervizorler || supervizorler.length === 0 ? (
          <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-6 text-center text-xs text-[#4A4D4A]">
            Aktif süpervizör bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {supervizorler.map((sv) => {
              const p = sv.profiles as { first_name: string; last_name: string; avatar_url: string | null } | null;
              return (
                <div key={sv.id} className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-3">
                  <div className="font-semibold text-sm text-[#252625] dark:text-white mb-0.5">
                    {p ? `${p.first_name} ${p.last_name}` : "—"}
                  </div>
                  <div className="text-[11px] text-[#4A4D4A] mb-1">{sv.title ?? "Süpervizör"}</div>
                  {sv.specialties && sv.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sv.specialties.slice(0, 2).map((s) => (
                        <span key={s} className="text-[9px] border-[1.5px] border-[#D4E4D8] px-1.5 py-0.5 text-[#4A4D4A]">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#252625] dark:text-white">
                      {sv.price_individual ? `${sv.price_individual} TL` : "—"}
                    </span>
                    <Link
                      href={`/panelim/randevu-al/${sv.slug}?tur=supervizyon`}
                      className="text-[11px] bg-[#A6DE9B] text-[#325343] px-2.5 py-1 hover:opacity-80 dark:bg-white dark:text-[#252625]"
                    >
                      Randevu Al
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!danisanRow.is_supervisor && (
        <div className="mt-8 p-4 border-[1.5px] border-dashed border-[#BDBDBD] text-sm text-[#4A4D4A]">
          Süpervizyon hizmeti vermek istiyor musunuz?{" "}
          <Link href="/danisan/profil" className="text-[#252625] underline dark:text-white">
            Profilinizden
          </Link>{" "}
          süpervizör seçeneğini aktif edebilirsiniz.
        </div>
      )}
    </div>
  );
}
