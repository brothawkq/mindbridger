import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

export const metadata: Metadata = {
  title: "Ödeme Sonucu — MindBridger",
};

const HATA_MESAJLARI: Record<string, string> = {
  token_eksik:       "Ödeme doğrulama bilgisi alınamadı.",
  odeme_basarisiz:   "Ödeme işlemi gerçekleştirilemedi.",
  randevu_bulunamadi:"Randevu bilgisi bulunamadı.",
  odeme_bulunamadi:  "Ödeme kaydı bulunamadı.",
  token_eslesmedi:   "Güvenlik doğrulaması başarısız.",
  guncelleme_hatasi: "Kayıt güncellenirken hata oluştu.",
  sunucu_hatasi:     "Sunucu hatası oluştu. Lütfen destek ekibimizle iletişime geçin.",
};

interface Props {
  searchParams: Promise<{
    basarili?: string;
    hata?: string;
    randevu_id?: string;
  }>;
}

export default async function OdemeSonucPage({ searchParams }: Props) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) redirect("/giris");

  const params = await searchParams;
  const basarili = params.basarili === "1";
  const hataKodu = params.hata;
  const randevuId = params.randevu_id;

  const hataMsg =
    hataKodu
      ? (HATA_MESAJLARI[decodeURIComponent(hataKodu)] ?? decodeURIComponent(hataKodu))
      : null;

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center p-4">
      <div className="border-[1.5px] border-[#325343] bg-white w-full max-w-md">
        {/* Header */}
        <div className="bg-[#F5F7F5] border-b-[1.5px] border-[#325343] px-6 py-3 flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#252625]">Ödeme Sonucu</span>
          <span
            className="border-[1.5px] border-[#325343] px-2 py-0.5 text-[10px] font-bold tracking-[0.5px] uppercase"
            style={{ background: basarili ? "#252625" : "#FFFFFF", color: basarili ? "#FFFFFF" : "#252625" }}
          >
            {basarili ? "BAŞARILI" : "HATA"}
          </span>
        </div>

        <div className="p-8 text-center">
          {basarili ? (
            <>
              {/* Başarı */}
              <div className="w-12 h-12 bg-[#325343] rounded-full flex items-center justify-center text-white text-[20px] font-bold mx-auto mb-4">
                ✓
              </div>
              <h1 className="text-[16px] font-bold text-[#252625] mb-2">
                Ödeme Başarılı
              </h1>
              <p className="text-[12px] text-[#4A4D4A] mb-6 leading-relaxed">
                Randevu talebiniz alındı. Danışman inceleyecek ve onayladığında bildirim gönderilecektir.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href={
                    randevuId
                      ? `/panelim/randevularim/${randevuId}`
                      : "/panelim/randevularim"
                  }
                  className="block w-full py-2.5 bg-[#A6DE9B] text-[#325343] text-[13px] font-bold text-center"
                >
                  Randevuyu Görüntüle →
                </Link>
                <Link
                  href="/panelim/finans"
                  className="block w-full py-2.5 border-[1.5px] border-[#325343] text-[#252625] text-[13px] font-bold text-center"
                >
                  Faturayı Görüntüle
                </Link>
                <Link
                  href="/panelim/dashboard"
                  className="block w-full py-2.5 text-[12px] text-[#4A4D4A] underline text-center"
                >
                  Panele Dön
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Hata */}
              <div className="w-12 h-12 border-[1.5px] border-[#325343] flex items-center justify-center text-[#252625] text-[20px] font-bold mx-auto mb-4">
                ⚠
              </div>
              <h1 className="text-[16px] font-bold text-[#252625] mb-2">
                Ödeme Tamamlanamadı
              </h1>
              <p className="text-[12px] text-[#4A4D4A] mb-6 leading-relaxed">
                {hataMsg ?? "Ödeme işlemi sırasında bir sorun oluştu."}
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/danismanlar"
                  className="block w-full py-2.5 bg-[#A6DE9B] text-[#325343] text-[13px] font-bold text-center"
                >
                  Tekrar Dene
                </Link>
                <Link
                  href="/panelim/dashboard"
                  className="block w-full py-2.5 border-[1.5px] border-[#325343] text-[#252625] text-[13px] font-bold text-center"
                >
                  Panele Git
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[#D4E4D8] px-6 py-3 text-[10px] text-[#4A4D4A] text-center">
          Sorun yaşıyorsanız destek ekibimizle iletişime geçin &middot; iyzico güvenceli ödeme
        </div>
      </div>
    </div>
  );
}
