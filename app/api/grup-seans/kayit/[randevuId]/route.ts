import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { grupSeansKapasiteAl, minKontrolGuncelle } from "@/lib/grup-seans/kapasite";

// POST /api/grup-seans/kayit/[randevuId]  → randevuId = randevular.id
// DELETE /api/grup-seans/kayit/[randevuId] → randevuId = grup_seans_katilimcilar.id
// (Next.js'de aynı path seviyesinde iki farklı dynamic segment oluşturulamaz;
//  ROUTES.md'deki kayit/[randevuId] ve kayit/[id] bu dosyada birleştirildi.)

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ randevuId: string }> },
) {
  const { randevuId } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    // Randevu var mı ve grup seansı mı kontrol et
    const { data: randevu } = await supabase
      .from("randevular")
      .select("id, session_type, status, scheduled_at")
      .eq("id", randevuId)
      .eq("session_type", "grup")
      .is("deleted_at", null)
      .single();

    if (!randevu) {
      return Response.json({ error: "Grup seansı bulunamadı" }, { status: 404 });
    }
    if (!["pending", "confirmed"].includes(randevu.status)) {
      return Response.json({ error: "Bu seansa kayıt yapılamaz" }, { status: 409 });
    }
    if (new Date(randevu.scheduled_at) <= new Date()) {
      return Response.json({ error: "Geçmiş seansa kayıt yapılamaz" }, { status: 422 });
    }

    // Kapasite kontrolü
    const kapasite = await grupSeansKapasiteAl(randevuId, supabase);
    if (kapasite.kapasiteDolu) {
      return Response.json({ error: "Seans kapasitesi doldu" }, { status: 409 });
    }

    // Zaten kayıtlı mı?
    const { data: mevcutKayit } = await supabase
      .from("grup_seans_katilimcilar")
      .select("id")
      .eq("randevu_id", randevuId)
      .eq("musteri_id", user.id)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .single();

    if (mevcutKayit) {
      return Response.json({ error: "Bu seansa zaten kayıtlısınız" }, { status: 409 });
    }

    const { data: yeniKayit, error: insertErr } = await supabase
      .from("grup_seans_katilimcilar")
      .insert({
        randevu_id: randevuId,
        musteri_id: user.id,
        status: "registered",
        // payment_id: Faz 4'te pre-authorization sonrası doldurulacak
      })
      .select("id, randevu_id, status, created_at")
      .single();

    if (insertErr || !yeniKayit) {
      return Response.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }

    // Minimum katılımcı durumunu güncelle
    await minKontrolGuncelle(randevuId, supabase);

    return Response.json({ kayit: yeniKayit }, { status: 201 });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ randevuId: string }> },
) {
  // Bu endpoint'te randevuId parametresi grup_seans_katilimcilar.id'dir
  const { randevuId: kayitId } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "musteri") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { data: kayit } = await supabase
      .from("grup_seans_katilimcilar")
      .select("id, musteri_id, randevu_id, status, min_participant_met")
      .eq("id", kayitId)
      .is("deleted_at", null)
      .single();

    if (!kayit) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    if (kayit.musteri_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (kayit.status === "cancelled") {
      return Response.json({ error: "Kayıt zaten iptal edilmiş" }, { status: 409 });
    }

    const { error: updateErr } = await supabase
      .from("grup_seans_katilimcilar")
      .update({
        status: "cancelled",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", kayitId);

    if (updateErr) return Response.json({ error: "Kayıt iptal edilemedi" }, { status: 500 });

    // Minimum katılımcı durumunu yeniden hesapla
    await minKontrolGuncelle(kayit.randevu_id, supabase);

    // İade: ödeme alındıysa Faz 4'te işlenecek
    return Response.json({
      ok: true,
      iade: { not: "Ödeme iadesi Faz 4 ödeme entegrasyonu ile işlenecektir." },
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
