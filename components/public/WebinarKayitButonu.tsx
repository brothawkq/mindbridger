"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  webinarId: string;
  fiyat: number;
  oturumAcik: boolean;
}

export default function WebinarKayitButonu({ webinarId, fiyat, oturumAcik }: Props) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tamamlandi, setTamamlandi] = useState(false);

  async function kayitOl() {
    if (!oturumAcik) {
      router.push(`/giris?redirect=/webinar/${webinarId}`);
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      const res = await fetch(`/api/webinar/${webinarId}/kayit`, { method: "POST" });
      const d = await res.json() as { ok?: boolean; error?: string };

      if (!res.ok) {
        setHata(d.error ?? "Kayıt başarısız");
        return;
      }

      setTamamlandi(true);
      router.refresh();
    } catch {
      setHata("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  if (tamamlandi) {
    return (
      <div className="text-center py-3 border-[1.5px] border-[#325343] text-[12px] font-bold text-[#325343]">
        ✓ Kayıt tamamlandı!
      </div>
    );
  }

  return (
    <div>
      {hata && (
        <div className="mb-2 p-2 bg-[#F5F7F5] border-l-2 border-[#325343] text-[11px] text-[#325343]">
          {hata}
        </div>
      )}
      <button
        onClick={() => void kayitOl()}
        disabled={yukleniyor}
        className="w-full bg-[#325343] text-white text-[13px] font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60"
      >
        {yukleniyor
          ? "İşleniyor..."
          : oturumAcik
          ? fiyat === 0
            ? "Ücretsiz Kayıt Ol"
            : `Kayıt Ol — ${fiyat.toLocaleString("tr-TR")} TL`
          : "Giriş Yap ve Kayıt Ol"}
      </button>
      {!oturumAcik && (
        <p className="text-[10px] text-[#BDBDBD] text-center mt-2">
          Hesabınız yoksa{" "}
          <a href="/kayit" className="underline hover:text-[#325343]">
            üye olun
          </a>
          , ücretsizdir.
        </p>
      )}
    </div>
  );
}
