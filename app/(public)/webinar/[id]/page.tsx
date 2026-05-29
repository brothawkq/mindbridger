import "server-only";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import WebinarKayitButonu from "@/components/public/WebinarKayitButonu";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  status: string;
  cover_image_url: string | null;
  daily_room_name: string | null;
};

type DanisanRow = {
  profile_id: string;
  slug: string;
  title: string | null;
  specialties: string[] | null;
};

type ProfilRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("webinarlar")
    .select("title, description")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (!data) return { title: "Webinar — MindBridger" };
  return {
    title: `${data.title} — MindBridger`,
    description: data.description ?? undefined,
  };
}

export default async function WebinarDetayPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: webinarRaw } = await supabase
    .from("webinarlar")
    .select("id, host_id, title, description, scheduled_at, duration_minutes, price, capacity, registered_count, status, cover_image_url, daily_room_name")
    .eq("id", id)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();

  if (!webinarRaw) notFound();
  const webinar = webinarRaw as WebinarRow;

  // Host bilgisi
  const [{ data: hostProfilRaw }, { data: hostDanisanRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", webinar.host_id)
      .single(),
    supabase
      .from("danisanlar")
      .select("profile_id, slug, title, specialties")
      .eq("profile_id", webinar.host_id)
      .maybeSingle(),
  ]);

  const hostProfil = hostProfilRaw as ProfilRow | null;
  const hostDanisan = hostDanisanRaw as DanisanRow | null;

  const hostIsim = `${hostProfil?.first_name ?? ""} ${hostProfil?.last_name ?? ""}`.trim() || "(adsız)";

  // Kullanıcı oturum kontrolü (kayıt olabilir mi)
  const { data: { user } } = await supabase.auth.getUser();
  let mevcutKayit = false;

  if (user) {
    const { data: kayit } = await supabase
      .from("webinar_kayitlar")
      .select("id")
      .eq("webinar_id", id)
      .eq("musteri_id", user.id)
      .in("status", ["registered", "attended"])
      .maybeSingle();
    mevcutKayit = !!kayit;
  }

  const simdi = Date.now();
  const webinarZamani = new Date(webinar.scheduled_at).getTime();
  const webinarBitis = webinarZamani + webinar.duration_minutes * 60 * 1000;
  const aktif = simdi >= webinarZamani - 10 * 60 * 1000 && simdi < webinarBitis;
  const gecti = simdi >= webinarBitis;
  const doluluk = webinar.capacity > 0 ? Math.round((webinar.registered_count / webinar.capacity) * 100) : 0;
  const dolu = webinar.registered_count >= webinar.capacity;

  return (
    <div className="min-h-screen bg-[#F5F7F5]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="text-[11px] text-[#BDBDBD] mb-6">
          <Link href="/" className="hover:text-[#325343]">Ana Sayfa</Link>
          {" / "}
          <Link href="/webinar" className="hover:text-[#325343]">Webinarlar</Link>
          {" / "}
          <span className="text-[#325343]">{webinar.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* Sol: İçerik */}
          <div>
            {webinar.cover_image_url && (
              <div className="w-full h-48 bg-[#E0E0E0] overflow-hidden mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={webinar.cover_image_url}
                  alt={webinar.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-xl font-bold text-[#325343] mb-3">{webinar.title}</h1>

            {/* Meta bilgiler */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#BDBDBD] mb-5">
              <span>📅 {formatTarih(webinar.scheduled_at)} · {formatSaat(webinar.scheduled_at)}</span>
              <span>⏱ {webinar.duration_minutes} dakika</span>
              <span>👥 {webinar.registered_count}/{webinar.capacity} katılımcı</span>
            </div>

            {/* Doluluk */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-[#E0E0E0] border-[1.5px] border-[#BDBDBD]">
                  <div
                    className="h-full bg-[#325343] transition-all"
                    style={{ width: `${doluluk}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#BDBDBD] shrink-0">{doluluk}% dolu</span>
              </div>
            </div>

            {/* Açıklama */}
            {webinar.description && (
              <div className="border-t border-[#E0E0E0] pt-5 mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-2">
                  Webinar Hakkında
                </div>
                <p className="text-[13px] text-[#325343] whitespace-pre-wrap leading-relaxed">
                  {webinar.description}
                </p>
              </div>
            )}

            {/* Host Kartı */}
            <div className="border-[1.5px] border-[#E0E0E0] bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-3">
                Eğitmen
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-[#E0E0E0] flex items-center justify-center text-[14px] font-bold text-[#325343]">
                  {hostIsim.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#325343]">{hostIsim}</div>
                  {hostDanisan?.title && (
                    <div className="text-[11px] text-[#BDBDBD]">{hostDanisan.title}</div>
                  )}
                  {hostDanisan?.specialties && hostDanisan.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hostDanisan.specialties.slice(0, 3).map((s) => (
                        <span key={s} className="text-[9px] border-[1.5px] border-[#E0E0E0] text-[#BDBDBD] px-1.5 py-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {hostDanisan?.slug && (
                  <Link
                    href={`/danismanlar/${hostDanisan.slug}`}
                    className="text-[10px] underline text-[#BDBDBD] hover:text-[#325343] shrink-0"
                  >
                    Profil
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Kayıt Paneli */}
          <div className="lg:sticky lg:top-6">
            <div className="border-[1.5px] border-[#325343] bg-white p-5">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-[#325343] mb-0.5">
                  {formatTL(webinar.price)}
                </div>
                <div className="text-[11px] text-[#BDBDBD]">
                  {formatTarih(webinar.scheduled_at)} · {formatSaat(webinar.scheduled_at)}
                </div>
              </div>

              {gecti ? (
                <div className="text-center py-4 border-[1.5px] border-dashed border-[#BDBDBD] text-[#BDBDBD] text-[12px]">
                  Bu webinar sona erdi
                </div>
              ) : aktif && mevcutKayit && webinar.daily_room_name ? (
                <a
                  href={`https://mindbridge.daily.co/${webinar.daily_room_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#325343] text-white text-[13px] font-bold py-3 text-center hover:opacity-90 transition-opacity"
                >
                  Webinara Katıl →
                </a>
              ) : mevcutKayit ? (
                <div className="text-center py-3 border-[1.5px] border-[#325343] text-[12px] font-bold text-[#325343]">
                  ✓ Kayıtlısınız
                </div>
              ) : dolu ? (
                <div className="text-center py-3 border-[1.5px] border-dashed border-[#BDBDBD] text-[#BDBDBD] text-[12px]">
                  Kapasite doldu
                </div>
              ) : (
                <WebinarKayitButonu
                  webinarId={id}
                  fiyat={webinar.price}
                  oturumAcik={!!user}
                />
              )}

              <div className="mt-4 space-y-2 text-[11px] text-[#BDBDBD]">
                <div className="flex justify-between">
                  <span>Süre</span>
                  <span className="text-[#325343]">{webinar.duration_minutes} dakika</span>
                </div>
                <div className="flex justify-between">
                  <span>Kapasite</span>
                  <span className="text-[#325343]">{webinar.registered_count}/{webinar.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform</span>
                  <span className="text-[#325343]">MindBridger Canlı</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
