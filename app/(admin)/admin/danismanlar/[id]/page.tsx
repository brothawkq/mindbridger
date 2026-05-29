import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import KullaniciAksiyonlar from "@/components/admin/KullaniciAksiyonlar";

export const metadata: Metadata = {
  title: "Danışman Detay — MindBridger Admin",
};

const DURUM_ETIKET: Record<string, string> = {
  active: "Aktif",
  pending: "Beklemede",
  suspended: "Donduruldu",
  rejected: "Reddedildi",
};

const SEANS_TUR_ETIKET: Record<string, string> = {
  bireysel: "Bireysel",
  asenkron: "Asenkron",
  grup: "Grup",
  cift_aile: "Çift/Aile",
  on_gorusme: "Ön Görüşme",
  supervizyon: "Süpervizyon",
};

function formatGMYS(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hour = String(d.getUTCHours() + 3).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hour}:${min}`;
}

function formatTL(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${n.toLocaleString("tr-TR")} ₺`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DanismanDetayPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser) redirect("/giris");

  const { data: profil, error: profilHata } = await supabase
    .from("profiles")
    .select(
      "id, role, status, first_name, last_name, phone, created_at, last_login_at, admin_notes, kvkk_accepted_at"
    )
    .eq("id", id)
    .eq("role", "danisan")
    .is("deleted_at", null)
    .single();

  if (profilHata || !profil) notFound();

  const { data: danisan } = await supabase
    .from("danisanlar")
    .select(
      "id, slug, bio, title, specialties, approach, age_groups, languages, city, price_individual, price_group, session_duration, sliding_scale, is_online, is_in_person, is_supervisor, profile_published, profile_completion_percent, average_rating, total_sessions, total_reviews, diploma_url, id_document_url, rejection_reason, bank_name"
    )
    .eq("profile_id", id)
    .is("deleted_at", null)
    .maybeSingle();

  const adminClient = createAdminClient();
  const { data: authData } = await adminClient.auth.admin.getUserById(id);
  const email = authData?.user?.email ?? "-";

  const { data: sonSeans } = await supabase
    .from("randevular")
    .select("id, scheduled_at, status, session_type, price, musteri_id")
    .eq("danisan_id", danisan?.id ?? "")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(5);

  const adSoyad =
    `${profil.first_name ?? ""} ${profil.last_name ?? ""}`.trim() || "(adsız)";

  return (
    <div className="flex flex-col h-full">
      {/* Frame Header */}
      <div className="border-b-[1.5px] border-[#325343] bg-[#F5F7F5] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/danismanlar/basvurular"
            className="text-[11px] text-[#4A4D4A] hover:text-[#252625] transition-colors"
          >
            ← Danışmanlar
          </Link>
          <span className="text-[#E0E0E0]">/</span>
          <span className="text-[12px] font-bold text-[#252625]">
            {adSoyad}
          </span>
        </div>
        <span className="border-[1.5px] border-[#325343] text-[10px] font-bold px-2 py-0.5">
          ADMIN
        </span>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="max-w-2xl space-y-4">
          {/* Temel Bilgiler */}
          <section className="border-[1.5px] border-[#D4E4D8] p-4">
            <SectionBaslik>Temel Bilgiler</SectionBaslik>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <InfoSatir etiket="Ad Soyad" deger={adSoyad} />
              <InfoSatir etiket="E-posta" deger={email} />
              <InfoSatir etiket="Telefon" deger={profil.phone ?? "-"} />
              <InfoSatir etiket="Unvan" deger={danisan?.title ?? "-"} />
              <InfoSatir
                etiket="Durum"
                deger={
                  DURUM_ETIKET[profil.status ?? ""] ?? (profil.status ?? "-")
                }
              />
              <InfoSatir
                etiket="Profil Yayında"
                deger={danisan?.profile_published ? "Evet" : "Hayır"}
              />
              <InfoSatir
                etiket="Kayıt Tarihi"
                deger={formatGMYS(profil.created_at)}
              />
              <InfoSatir
                etiket="Son Giriş"
                deger={formatGMYS(profil.last_login_at)}
              />
            </div>
          </section>

          {/* Profil Tamamlanma */}
          {danisan && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <SectionBaslik>Profil Durumu</SectionBaslik>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
                  <div
                    className="h-full bg-[#325343] transition-all"
                    style={{ width: `${danisan.profile_completion_percent ?? 0}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-[#252625]">
                  %{danisan.profile_completion_percent ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <InfoSatir
                  etiket="Uzmanlık"
                  deger={
                    Array.isArray(danisan.specialties) && danisan.specialties.length > 0
                      ? danisan.specialties.join(", ")
                      : "-"
                  }
                />
                <InfoSatir
                  etiket="Yaklaşım"
                  deger={
                    Array.isArray(danisan.approach) && danisan.approach.length > 0
                      ? danisan.approach.join(", ")
                      : "-"
                  }
                />
                <InfoSatir
                  etiket="Yaş Grupları"
                  deger={
                    Array.isArray(danisan.age_groups) && danisan.age_groups.length > 0
                      ? danisan.age_groups.join(", ")
                      : "-"
                  }
                />
                <InfoSatir etiket="Şehir" deger={danisan.city ?? "-"} />
                <InfoSatir
                  etiket="Tekil Seans"
                  deger={formatTL(danisan.price_individual)}
                />
                <InfoSatir
                  etiket="Seans Süresi"
                  deger={danisan.session_duration ? `${danisan.session_duration} dk` : "-"}
                />
                <InfoSatir
                  etiket="Online"
                  deger={danisan.is_online ? "Evet" : "Hayır"}
                />
                <InfoSatir
                  etiket="Yüz Yüze"
                  deger={danisan.is_in_person ? "Evet" : "Hayır"}
                />
                <InfoSatir
                  etiket="Süpervizör"
                  deger={danisan.is_supervisor ? "Evet" : "Hayır"}
                />
                <InfoSatir
                  etiket="Sliding Scale"
                  deger={danisan.sliding_scale ? "Evet" : "Hayır"}
                />
              </div>
            </section>
          )}

          {/* Performans */}
          {danisan && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <SectionBaslik>Performans</SectionBaslik>
              <div className="grid grid-cols-3 gap-4">
                <KpiKart
                  etiket="Toplam Seans"
                  deger={String(danisan.total_sessions ?? 0)}
                />
                <KpiKart
                  etiket="Değerlendirme"
                  deger={String(danisan.total_reviews ?? 0)}
                />
                <KpiKart
                  etiket="Ort. Puan"
                  deger={
                    danisan.average_rating != null
                      ? Number(danisan.average_rating).toFixed(1)
                      : "-"
                  }
                />
              </div>
            </section>
          )}

          {/* Belgeler */}
          {danisan && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <SectionBaslik>Belgeler</SectionBaslik>
              <div className="flex gap-3">
                {danisan.diploma_url ? (
                  <a
                    href={danisan.diploma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold border-[1.5px] border-[#325343] px-3 py-1.5 hover:bg-[#F5F7F5] transition-colors"
                  >
                    Diploma / Lisans Belgesi →
                  </a>
                ) : (
                  <span className="text-[11px] border-[1.5px] border-dashed border-[#BDBDBD] px-3 py-1.5 text-[#4A4D4A]">
                    Diploma yüklenmemiş
                  </span>
                )}
                {danisan.id_document_url ? (
                  <a
                    href={danisan.id_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold border-[1.5px] border-[#325343] px-3 py-1.5 hover:bg-[#F5F7F5] transition-colors"
                  >
                    Kimlik Belgesi →
                  </a>
                ) : (
                  <span className="text-[11px] border-[1.5px] border-dashed border-[#BDBDBD] px-3 py-1.5 text-[#4A4D4A]">
                    Kimlik yüklenmemiş
                  </span>
                )}
              </div>
              {danisan.rejection_reason && (
                <div className="mt-3 border-[1.5px] border-dashed border-[#BDBDBD] p-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                    Red Gerekçesi
                  </div>
                  <p className="text-[12px] text-[#252625]">
                    {danisan.rejection_reason}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* İşlemler */}
          <section className="border-[1.5px] border-[#D4E4D8] p-4">
            <SectionBaslik>İşlemler</SectionBaslik>
            <KullaniciAksiyonlar
              userId={profil.id}
              mevcutDurum={profil.status ?? "pending"}
              mevcutRol={profil.role ?? "danisan"}
              onGuncellendi={() => {}}
            />
            <p className="text-[10px] text-[#4A4D4A] mt-2">
              Durum değişikliği sonrası sayfayı yenileyin.
            </p>
          </section>

          {/* Admin Notları */}
          <section className="border-[1.5px] border-[#D4E4D8] p-4">
            <SectionBaslik>Admin Notları</SectionBaslik>
            {profil.admin_notes ? (
              <p className="text-[12px] text-[#252625] whitespace-pre-wrap">
                {profil.admin_notes}
              </p>
            ) : (
              <p className="text-[11px] text-[#4A4D4A]">Not eklenmemiş.</p>
            )}
          </section>

          {/* Son Seanslar */}
          {sonSeans && sonSeans.length > 0 && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <SectionBaslik>Son Seanslar (danışman olarak)</SectionBaslik>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#F5F7F5] border-b border-[#D4E4D8]">
                    {["Tarih", "Tür", "Durum", "Tutar"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-2 py-1.5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sonSeans.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5]"
                    >
                      <td className="px-2 py-1.5 text-[#4A4D4A]">
                        {formatGMYS(r.scheduled_at)}
                      </td>
                      <td className="px-2 py-1.5 text-[#252625]">
                        {SEANS_TUR_ETIKET[r.session_type ?? ""] ??
                          (r.session_type ?? "-")}
                      </td>
                      <td className="px-2 py-1.5 text-[#4A4D4A]">
                        {r.status ?? "-"}
                      </td>
                      <td className="px-2 py-1.5 text-[#252625]">
                        {formatTL(r.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionBaslik({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] border-b border-dotted border-[#D4E4D8] pb-1 mb-3">
      {children}
    </div>
  );
}

function InfoSatir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
        {etiket}
      </div>
      <div className="text-[12px] text-[#252625] break-words">{deger}</div>
    </div>
  );
}

function KpiKart({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="border-[1.5px] border-[#D4E4D8] p-3 text-center">
      <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
        {etiket}
      </div>
      <div className="text-[18px] font-bold text-[#252625]">{deger}</div>
    </div>
  );
}
