import "server-only";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Webinarlar — MindBridger",
  description: "Psikologlar ve PDR danışmanları tarafından düzenlenen canlı webinarlara katılın.",
};

const AYLAR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function formatTarih(iso: string) {
  const d = new Date(iso);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${utc3.getUTCDate()} ${AYLAR[utc3.getUTCMonth()] ?? ""} ${utc3.getUTCFullYear()}`;
}

function formatSaat(iso: string) {
  const d = new Date(iso);
  const utc3 = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${String(utc3.getUTCHours()).padStart(2, "0")}:${String(utc3.getUTCMinutes()).padStart(2, "0")}`;
}

function formatTL(n: number) {
  if (n === 0) return "Ücretsiz";
  return `${n.toLocaleString("tr-TR")} TL`;
}

type WebinarRow = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  capacity: number;
  registered_count: number;
  cover_image_url: string | null;
};

type HostProfil = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export default async function WebinarListePage() {
  const supabase = await createClient();

  const { data: webinarlarRaw } = await supabase
    .from("webinarlar")
    .select("id, host_id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, cover_image_url")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });

  const webinarlar = (webinarlarRaw ?? []) as WebinarRow[];

  const hostIds = [...new Set(webinarlar.map((w) => w.host_id))];
  let hostMap = new Map<string, { isim: string; title: string | null }>();

  if (hostIds.length > 0) {
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", hostIds);

    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("profile_id, title")
      .in("profile_id", hostIds);

    const danisanTitleMap = new Map(
      (danisanlar ?? []).map((d) => [d.profile_id, d.title])
    );

    hostMap = new Map(
      ((profiller ?? []) as HostProfil[]).map((p) => [
        p.id,
        {
          isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
          title: danisanTitleMap.get(p.id) ?? null,
        },
      ])
    );
  }

  const simdi = Date.now();
  const yaklasiyor = webinarlar.filter((w) => new Date(w.scheduled_at).getTime() > simdi);
  const gecmis = webinarlar.filter((w) => new Date(w.scheduled_at).getTime() <= simdi);

  return (
    <div className="min-h-screen bg-[#F5F7F5]">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Başlık */}
        <div className="mb-8">
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#BDBDBD] mb-1">
            Canlı Etkinlikler
          </div>
          <h1 className="text-2xl font-bold text-[#325343] mb-1">Webinarlar</h1>
          <p className="text-[13px] text-[#BDBDBD]">
            Uzman psikolog ve danışmanların canlı eğitim etkinliklerine katılın.
          </p>
        </div>

        {/* Yaklaşan Webinarlar */}
        {yaklasiyor.length > 0 && (
          <section className="mb-10">
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#325343] mb-3 pb-2 border-b-[1.5px] border-[#325343]">
              Yaklaşan Webinarlar ({yaklasiyor.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {yaklasiyor.map((w) => {
                const host = hostMap.get(w.host_id);
                const doluluk = w.capacity > 0 ? Math.round((w.registered_count / w.capacity) * 100) : 0;
                return (
                  <Link
                    key={w.id}
                    href={`/webinar/${w.id}`}
                    className="block border-[1.5px] border-[#E0E0E0] bg-white hover:border-[#325343] transition-colors group"
                  >
                    {w.cover_image_url && (
                      <div className="w-full h-32 bg-[#F5F7F5] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={w.cover_image_url}
                          alt={w.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h2 className="text-[13px] font-bold text-[#325343] leading-tight group-hover:underline">
                          {w.title}
                        </h2>
                        <span className="text-[11px] font-bold text-[#325343] shrink-0">
                          {formatTL(w.price)}
                        </span>
                      </div>
                      {w.description && (
                        <p className="text-[11px] text-[#BDBDBD] mb-3 line-clamp-2">
                          {w.description}
                        </p>
                      )}
                      <div className="text-[10px] text-[#BDBDBD] space-y-0.5 mb-3">
                        <div>📅 {formatTarih(w.scheduled_at)} · {formatSaat(w.scheduled_at)}</div>
                        <div>⏱ {w.duration_minutes} dk · {host?.isim}{host?.title ? ` — ${host.title}` : ""}</div>
                      </div>
                      {/* Doluluk */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[#E0E0E0]">
                          <div
                            className="h-full bg-[#325343] transition-all"
                            style={{ width: `${doluluk}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#BDBDBD] shrink-0">
                          {w.registered_count}/{w.capacity}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Geçmiş Webinarlar */}
        {gecmis.length > 0 && (
          <section>
            <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#BDBDBD] mb-3 pb-2 border-b border-[#E0E0E0]">
              Geçmiş Webinarlar ({gecmis.length})
            </div>
            <div className="flex flex-col">
              {gecmis.map((w) => {
                const host = hostMap.get(w.host_id);
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-4 px-3 py-3 border-b border-[#E0E0E0] last:border-0 opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#325343] truncate">{w.title}</div>
                      <div className="text-[10px] text-[#BDBDBD]">
                        {host?.isim} · {formatTarih(w.scheduled_at)}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#BDBDBD] shrink-0">{formatTL(w.price)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {webinarlar.length === 0 && (
          <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-16 text-center">
            <div className="text-[#BDBDBD] text-[13px]">Şu anda yayında webinar bulunmuyor.</div>
            <div className="text-[11px] text-[#BDBDBD] mt-1">Yakında yeni etkinlikler eklenecek.</div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 p-6 border-[1.5px] border-[#E0E0E0] bg-white text-center">
          <div className="text-[10px] font-bold tracking-[1px] uppercase text-[#BDBDBD] mb-2">Uzman Desteği</div>
          <p className="text-[13px] text-[#325343] mb-4">
            Bir webinara katılmak yerine bire bir seans almak ister misiniz?
          </p>
          <Link
            href="/danismanlar"
            className="inline-block bg-[#325343] text-white text-[12px] font-bold px-6 py-2.5 hover:opacity-90 transition-opacity"
          >
            Danışman Bul
          </Link>
        </div>
      </div>
    </div>
  );
}
