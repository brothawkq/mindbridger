import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import KullaniciAksiyonlar from "@/components/admin/KullaniciAksiyonlar";

export const metadata: Metadata = {
  title: "Kullanıcı Detay — MindBridger Admin",
};

const DURUM_ETIKET: Record<string, string> = {
  active: "Aktif",
  pending: "Beklemede",
  suspended: "Donduruldu",
  rejected: "Reddedildi",
};

const ROL_ETIKET: Record<string, string> = {
  musteri: "Müşteri",
  danisan: "Danışman",
  kurumsal: "Kurumsal",
  affiliate: "Affiliate",
  admin: "Admin",
  visitor: "Ziyaretçi",
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function KullaniciDetayPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const adminUser = await requireRole(supabase, ["admin"]);
  if (!adminUser) redirect("/giris");

  const { data: profil, error: profilHata } = await supabase
    .from("profiles")
    .select(
      "id, role, status, first_name, last_name, phone, created_at, last_login_at, churn_risk_score, admin_notes, kvkk_accepted_at"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (profilHata || !profil) notFound();

  const adminClient = createAdminClient();
  const { data: authData } = await adminClient.auth.admin.getUserById(id);
  const email = authData?.user?.email ?? "-";

  const { data: sonRandevular } = await supabase
    .from("randevular")
    .select("id, scheduled_at, status, session_type, price")
    .eq("musteri_id", id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(5);

  const adSoyad =
    `${profil.first_name ?? ""} ${profil.last_name ?? ""}`.trim() ||
    "(adsız)";

  return (
    <div className="flex flex-col h-full">
      {/* Frame Header */}
      <div className="border-b-[1.5px] border-[#325343] bg-[#F5F7F5] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/kullanicilar"
            className="text-[11px] text-[#4A4D4A] hover:text-[#252625] transition-colors"
          >
            ← Kullanıcılar
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
            <div className="text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] border-b border-dotted border-[#D4E4D8] pb-1 mb-3">
              Temel Bilgiler
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <InfoSatir etiket="Ad Soyad" deger={adSoyad} />
              <InfoSatir etiket="E-posta" deger={email} />
              <InfoSatir etiket="Telefon" deger={profil.phone ?? "-"} />
              <InfoSatir
                etiket="Rol"
                deger={ROL_ETIKET[profil.role ?? ""] ?? (profil.role ?? "-")}
              />
              <InfoSatir
                etiket="Durum"
                deger={DURUM_ETIKET[profil.status ?? ""] ?? (profil.status ?? "-")}
              />
              <InfoSatir
                etiket="Churn Skoru"
                deger={String(profil.churn_risk_score ?? 0)}
              />
              <InfoSatir
                etiket="Kayıt Tarihi"
                deger={formatGMYS(profil.created_at)}
              />
              <InfoSatir
                etiket="Son Giriş"
                deger={formatGMYS(profil.last_login_at)}
              />
              <InfoSatir
                etiket="KVKK Onayı"
                deger={
                  profil.kvkk_accepted_at
                    ? formatGMYS(profil.kvkk_accepted_at)
                    : "Yok"
                }
              />
            </div>
          </section>

          {/* İşlemler */}
          {profil.role !== "admin" && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <div className="text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] border-b border-dotted border-[#D4E4D8] pb-1 mb-3">
                İşlemler
              </div>
              <KullaniciAksiyonlar
                userId={profil.id}
                mevcutDurum={profil.status ?? "pending"}
                mevcutRol={profil.role ?? "visitor"}
                onGuncellendi={() => {}}
              />
              <p className="text-[10px] text-[#4A4D4A] mt-2">
                Durum değişikliği sonrası sayfayı yenileyin.
              </p>
            </section>
          )}

          {/* Admin Notları */}
          <section className="border-[1.5px] border-[#D4E4D8] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] border-b border-dotted border-[#D4E4D8] pb-1 mb-3">
              Admin Notları
            </div>
            {profil.admin_notes ? (
              <p className="text-[12px] text-[#252625] whitespace-pre-wrap">
                {profil.admin_notes}
              </p>
            ) : (
              <p className="text-[11px] text-[#4A4D4A]">Not eklenmemiş.</p>
            )}
          </section>

          {/* Son Randevular */}
          {sonRandevular && sonRandevular.length > 0 && (
            <section className="border-[1.5px] border-[#D4E4D8] p-4">
              <div className="text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] border-b border-dotted border-[#D4E4D8] pb-1 mb-3">
                Son Randevular (müşteri olarak)
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#F5F7F5] border-b border-[#D4E4D8]">
                    <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-2 py-1.5">
                      Tarih
                    </th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-2 py-1.5">
                      Tür
                    </th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-2 py-1.5">
                      Durum
                    </th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-2 py-1.5">
                      Tutar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sonRandevular.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5]"
                    >
                      <td className="px-2 py-1.5 text-[#4A4D4A]">
                        {formatGMYS(r.scheduled_at)}
                      </td>
                      <td className="px-2 py-1.5 text-[#252625]">
                        {r.session_type ?? "-"}
                      </td>
                      <td className="px-2 py-1.5 text-[#4A4D4A]">
                        {r.status ?? "-"}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[#252625]">
                        {r.price != null
                          ? `${String(r.price).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₺`
                          : "-"}
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

function InfoSatir({
  etiket,
  deger,
}: {
  etiket: string;
  deger: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-0.5">
        {etiket}
      </div>
      <div className="text-[12px] text-[#252625]">{deger}</div>
    </div>
  );
}
