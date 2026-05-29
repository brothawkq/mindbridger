import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriProfilKlient, {
  type MusteriProfilVeri,
  type BildirimTercih,
} from "@/components/musteri/MusteriProfilKlient";

export const metadata = { title: "Profilim | MindBridger" };

const GECERLI_KANALLAR = ["email", "sms", "uygulama_ici"] as const;
type BildirimKanali = (typeof GECERLI_KANALLAR)[number];

function isBildirimKanali(v: string): v is BildirimKanali {
  return (GECERLI_KANALLAR as readonly string[]).includes(v);
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const [{ data: profilRaw }, { data: randevuRaw }, { data: tercihlerRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, last_name, phone, dark_mode, notification_channel, kvkk_accepted_at, created_at"
      )
      .eq("id", user.id)
      .single(),
    // Mevcut danışmanı bul (en son tamamlanmış randevu üzerinden)
    supabase
      .from("randevular")
      .select("danisan_id")
      .eq("musteri_id", user.id)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Bildirim tercihleri
    supabase
      .from("bildirim_tercihleri")
      .select("randevu_email, randevu_sms, randevu_uygulama, odeme_email, blog_email, marketing_email")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!profilRaw) redirect("/giris");

  const kanalHam = profilRaw.notification_channel as string;
  const profil: MusteriProfilVeri = {
    first_name: profilRaw.first_name,
    last_name: profilRaw.last_name,
    phone: profilRaw.phone,
    dark_mode: profilRaw.dark_mode,
    notification_channel: isBildirimKanali(kanalHam) ? kanalHam : "email",
    kvkk_accepted_at: profilRaw.kvkk_accepted_at,
    created_at: profilRaw.created_at,
  };

  const mevcutDanisanId = randevuRaw?.danisan_id ?? undefined;
  const baslangicTercihler: BildirimTercih | null = tercihlerRaw
    ? {
        randevu_email:    tercihlerRaw.randevu_email,
        randevu_sms:      tercihlerRaw.randevu_sms,
        randevu_uygulama: tercihlerRaw.randevu_uygulama,
        odeme_email:      tercihlerRaw.odeme_email,
        blog_email:       tercihlerRaw.blog_email,
        marketing_email:  tercihlerRaw.marketing_email,
      }
    : null;

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Profilim
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Kişisel bilgiler, şifre ve hesap yönetimi
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        <MusteriProfilKlient
          profil={profil}
          mevcutDanisanId={mevcutDanisanId}
          email={user.email ?? ""}
          baslangicTercihler={baslangicTercihler}
        />
      </div>
    </>
  );
}
