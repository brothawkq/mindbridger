import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { tokenUret } from "@/lib/dailyco/token";
import { turkceHataMesaji } from "@/lib/dailyco/fallback";

const VIDEO_AKTIF_DAKIKA = 10;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ randevuId: string }> },
) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || !["musteri", "danisan"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { randevuId } = await params;

  try {
    // Randevu + danışman profil bilgisini çek
    const { data: randevu } = await supabase
      .from("randevular")
      .select(
        `id, musteri_id, danisan_id, scheduled_at, duration_minutes,
         daily_room_name, status, partner_id`,
      )
      .eq("id", randevuId)
      .is("deleted_at", null)
      .single();

    if (!randevu) {
      return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
    }

    if (randevu.status !== "confirmed") {
      return Response.json(
        { error: "Randevu onaylanmamış, video bağlantısı kullanılamaz" },
        { status: 409 },
      );
    }

    if (!randevu.daily_room_name) {
      return Response.json(
        { error: "Video odası henüz oluşturulmamış" },
        { status: 404 },
      );
    }

    // Danışman profil ID → danisanlar.profile_id eşleştirmesi
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("profile_id")
      .eq("id", randevu.danisan_id)
      .is("deleted_at", null)
      .single();

    const isDanisan = user.id === danisanRow?.profile_id;
    const isMusteri = user.id === randevu.musteri_id;
    const isPartner = user.id === randevu.partner_id;

    // Yalnızca randevu sahibi, danışman veya partner token alabilir
    if (!isDanisan && !isMusteri && !isPartner) {
      return Response.json({ error: "Bu randevuya erişim yetkiniz yok" }, { status: 403 });
    }

    // Token randevu saatinden VIDEO_AKTIF_DAKIKA önce aktif olur
    const baslangic = new Date(randevu.scheduled_at);
    const simdi = new Date();
    const aktifBaslangic = new Date(
      baslangic.getTime() - VIDEO_AKTIF_DAKIKA * 60 * 1000,
    );

    if (simdi < aktifBaslangic) {
      const kalan = Math.ceil(
        (aktifBaslangic.getTime() - simdi.getTime()) / 60000,
      );
      return Response.json(
        {
          error: `Video bağlantısı randevudan ${VIDEO_AKTIF_DAKIKA} dakika önce aktif olur`,
          kalan_dakika: kalan,
        },
        { status: 425 },
      );
    }

    // Kullanıcı adını çek
    const { data: profil } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const sure = randevu.duration_minutes ?? 50;
    const bitisTs = Math.floor(
      (baslangic.getTime() + sure * 60 * 1000) / 1000,
    );
    const baslangicTs = Math.floor(baslangic.getTime() / 1000);

    const token = await tokenUret({
      odaAdi:             randevu.daily_room_name,
      kullaniciId:        user.id,
      kullaniciAdi:       `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim() || "Katılımcı",
      isDanisan,
      randevuBaslangicTs: baslangicTs,
      bitisTs,
    });

    return Response.json({ token, oda_adi: randevu.daily_room_name });
  } catch (err) {
    return Response.json(
      { error: turkceHataMesaji(err) },
      { status: 502 },
    );
  }
}
