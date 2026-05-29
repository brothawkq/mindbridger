import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { faturaNumarasiUret, seansTypeLabel } from "./numara";
import { FaturaTemplate } from "./template";

export interface FaturaOlusturSonucu {
  faturaId: string;
  faturaNumarasi: string;
  pdfUrl: string;
}

export async function faturaOlustur(
  randevuId: string,
  supabase: SupabaseClient,
): Promise<FaturaOlusturSonucu> {
  // Zaten fatura var mı?
  const { data: mevcutFatura } = await supabase
    .from("seans_faturalari")
    .select("id, invoice_number, pdf_url")
    .eq("randevu_id", randevuId)
    .is("deleted_at", null)
    .single();

  if (mevcutFatura?.pdf_url) {
    return {
      faturaId: mevcutFatura.id,
      faturaNumarasi: mevcutFatura.invoice_number,
      pdfUrl: mevcutFatura.pdf_url,
    };
  }

  // Randevu + ödeme bilgilerini çek
  const { data: randevu } = await supabase
    .from("randevular")
    .select("id, musteri_id, danisan_id, session_type, scheduled_at, duration_minutes, price")
    .eq("id", randevuId)
    .is("deleted_at", null)
    .single();

  if (!randevu) throw new Error("Randevu bulunamadı");

  const { data: odeme } = await supabase
    .from("payments")
    .select("id, amount_gross, status")
    .eq("randevu_id", randevuId)
    .eq("status", "captured")
    .is("deleted_at", null)
    .single();

  if (!odeme) throw new Error("Onaylanmış ödeme bulunamadı");

  // Müşteri profili
  const { data: musteriProfil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", randevu.musteri_id)
    .single();

  // DEN-18: auth.admin gerektirir; user client yerine admin client kullan.
  const adminClient = createAdminClient();
  const { data: musteriAuth } = await adminClient.auth.admin.getUserById(randevu.musteri_id);
  const musteriEmail = musteriAuth.user?.email ?? "";

  // Danışman profili
  const { data: danisan } = await supabase
    .from("danisanlar")
    .select("title, profile_id")
    .eq("id", randevu.danisan_id)
    .single();

  const { data: danisanProfil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", danisan?.profile_id ?? "")
    .single();

  // Kurumsal kontrol
  const { data: kurumsal } = await supabase
    .from("kurumsal_kullanicilar")
    .select("kurumsal_id")
    .eq("musteri_id", randevu.musteri_id)
    .single();

  const faturaNumarasi = await faturaNumarasiUret(supabase);

  const veri = {
    faturaNumarasi,
    faturaTarihi: new Date().toISOString(),
    musteriAdSoyad: `${musteriProfil?.first_name ?? ""} ${musteriProfil?.last_name ?? ""}`.trim(),
    musteriEmail,
    danisanAdSoyad: `${danisanProfil?.first_name ?? ""} ${danisanProfil?.last_name ?? ""}`.trim(),
    danisanUnvan: danisan?.title ?? "Danışman",
    seansLabel: seansTypeLabel(randevu.session_type),
    seansZamani: randevu.scheduled_at,
    seansSuresi: randevu.duration_minutes ?? 50,
    brutTutar: odeme.amount_gross,
  };

  const pdfBuffer = await renderToBuffer(<FaturaTemplate veri={veri} />);

  const dosyaYolu = `${randevu.danisan_id}/${new Date().getFullYear()}/${faturaNumarasi}.pdf`;

  const { error: yukleHata } = await supabase.storage
    .from("faturalar")
    .upload(dosyaYolu, pdfBuffer, { contentType: "application/pdf", upsert: false });

  if (yukleHata) throw new Error(`PDF yüklenemedi: ${yukleHata.message}`);

  const { data: urlData } = supabase.storage.from("faturalar").getPublicUrl(dosyaYolu);
  const pdfUrl = urlData.publicUrl;

  // Fatura kaydı oluştur (veya güncelle)
  const insertPayload = {
    payment_id: odeme.id,
    randevu_id: randevuId,
    musteri_id: randevu.musteri_id,
    danisan_id: randevu.danisan_id,
    kurumsal_id: kurumsal?.kurumsal_id ?? null,
    invoice_number: faturaNumarasi,
    invoice_type: "bireysel" as const,
    amount: odeme.amount_gross,
    pdf_url: pdfUrl,
  };

  const { data: yeniFatura, error: kayitHata } = mevcutFatura
    ? await supabase
        .from("seans_faturalari")
        .update({ pdf_url: pdfUrl, invoice_number: faturaNumarasi })
        .eq("id", mevcutFatura.id)
        .select("id")
        .single()
    : await supabase
        .from("seans_faturalari")
        .insert(insertPayload)
        .select("id")
        .single();

  if (kayitHata || !yeniFatura) throw new Error("Fatura kaydı oluşturulamadı");

  return {
    faturaId: yeniFatura.id,
    faturaNumarasi,
    pdfUrl,
  };
}
