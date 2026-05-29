"use client";

import { useState } from "react";

interface Props {
  userId: string;
  mevcutDurum: string;
  mevcutRol: string;
  onGuncellendi: () => void;
}

export default function KullaniciAksiyonlar({
  userId,
  mevcutDurum,
  mevcutRol,
  onGuncellendi,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  if (mevcutRol === "admin") return null;

  async function islemYap(tip: "dondur" | "aktif") {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch(`/api/admin/kullanicilar/${userId}/${tip}`, {
        method: "PUT",
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) {
        setHata(json.hata ?? "İşlem başarısız.");
      } else {
        onGuncellendi();
      }
    } catch {
      setHata("Bağlantı hatası.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {mevcutDurum !== "suspended" ? (
        <button
          disabled={yukleniyor}
          onClick={() => void islemYap("dondur")}
          className="text-[11px] border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-2 py-0.5 disabled:opacity-50 hover:border-[#325343] hover:text-[#252625] transition-colors"
        >
          {yukleniyor ? "..." : "Dondur"}
        </button>
      ) : (
        <button
          disabled={yukleniyor}
          onClick={() => void islemYap("aktif")}
          className="text-[11px] border-[1.5px] border-[#325343] text-[#252625] px-2 py-0.5 disabled:opacity-50 hover:bg-[#325343] hover:text-white transition-colors"
        >
          {yukleniyor ? "..." : "Aktif Et"}
        </button>
      )}
      {hata && (
        <span className="text-[10px] text-[#4A4D4A]">⚠ {hata}</span>
      )}
    </div>
  );
}
