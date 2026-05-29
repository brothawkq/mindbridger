"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import KullaniciAksiyonlar from "@/components/admin/KullaniciAksiyonlar";
import type { KullaniciOzet, KullaniciListeResponse } from "@/types/admin";

const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number];

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

const DURUM_FILTRELER = [
  { deger: "", etiket: "Tümü" },
  { deger: "active", etiket: "Aktif" },
  { deger: "pending", etiket: "Beklemede" },
  { deger: "suspended", etiket: "Donduruldu" },
  { deger: "rejected", etiket: "Reddedildi" },
];

const ROL_FILTRELER = [
  { deger: "", etiket: "Tüm Roller" },
  { deger: "musteri", etiket: "Müşteri" },
  { deger: "danisan", etiket: "Danışman" },
  { deger: "kurumsal", etiket: "Kurumsal" },
  { deger: "affiliate", etiket: "Affiliate" },
];

function DurumPill({ durum }: { durum: string }) {
  if (durum === "active") {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-[#A6DE9B] text-[#325343]">
        {DURUM_ETIKET[durum] ?? durum}
      </span>
    );
  }
  if (durum === "suspended") {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]">
        {DURUM_ETIKET[durum] ?? durum}
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 border-[1.5px] border-[#325343] text-[#252625]">
      {DURUM_ETIKET[durum] ?? durum}
    </span>
  );
}

function ChurnBadge({ skor }: { skor: number }) {
  const renk =
    skor >= 67
      ? "text-[#252625] font-bold"
      : skor >= 34
      ? "text-[#252625]"
      : "text-[#4A4D4A]";
  return <span className={`text-[11px] ${renk}`}>{skor}</span>;
}

export default function KullanicilarKlient() {
  const azaltilmisHareket = useReducedMotion();

  const [kullanicilar, setKullanicilar] = useState<KullaniciOzet[]>([]);
  const [toplam, setToplam] = useState(0);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  const [sayfa, setSayfa] = useState(1);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const [aramaGirdi, setAramaGirdi] = useState("");
  const [aramaQ, setAramaQ] = useState("");
  const [seciliDurum, setSeciliDurum] = useState("");
  const [seciliRol, setSeciliRol] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchKullanicilar = useCallback(
    async (q: string, durum: string, rol: string, s: number) => {
      setYukleniyor(true);
      setHata(null);
      try {
        const params = new URLSearchParams({
          sayfa: String(s),
          ...(q ? { q } : {}),
          ...(durum ? { durum } : {}),
          ...(rol ? { rol } : {}),
        });
        const res = await fetch(`/api/admin/kullanicilar?${params.toString()}`);
        if (!res.ok) throw new Error("Veri alınamadı.");
        const json = (await res.json()) as KullaniciListeResponse;
        setKullanicilar(json.kullanicilar);
        setToplam(json.toplam);
        setToplamSayfa(json.toplamSayfa);
        setSayfa(json.sayfa);
      } catch {
        setHata("Kullanıcılar yüklenirken hata oluştu.");
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchKullanicilar(aramaQ, seciliDurum, seciliRol, sayfa);
  }, [aramaQ, seciliDurum, seciliRol, sayfa, fetchKullanicilar]);

  function aramaGuncelleDebounce(deger: string) {
    setAramaGirdi(deger);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAramaQ(deger.trim());
      setSayfa(1);
    }, 400);
  }

  function durumDegistir(deger: string) {
    setSeciliDurum(deger);
    setSayfa(1);
  }

  function rolDegistir(deger: string) {
    setSeciliRol(deger);
    setSayfa(1);
  }

  const tableAnim = azaltilmisHareket
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.18, ease: EASE_OUT },
      };

  return (
    <div className="flex flex-col h-full">
      {/* Frame Header */}
      <div className="border-b-[1.5px] border-[#325343] bg-[#F5F7F5] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-[#252625]">
            Kullanıcı Yönetimi
          </span>
          <span className="text-[10px] italic text-[#4A4D4A]">
            {toplam} kayıt
          </span>
        </div>
        <span className="border-[1.5px] border-[#325343] text-[10px] font-bold px-2 py-0.5">
          ADMIN
        </span>
      </div>

      {/* Araçlar */}
      <div className="px-5 pt-3.5 pb-2 flex flex-wrap items-center gap-2 border-b border-[#D4E4D8] flex-shrink-0">
        {/* Arama */}
        <input
          type="text"
          value={aramaGirdi}
          onChange={(e) => aramaGuncelleDebounce(e.target.value)}
          placeholder="İsim ara..."
          className="border-[1.5px] border-[#325343] text-[12px] px-3 py-1.5 w-52 bg-white placeholder-[#BDBDBD] focus:outline-none"
        />

        {/* Durum pilleri */}
        <div className="flex items-center gap-1">
          {DURUM_FILTRELER.map((f) => (
            <button
              key={f.deger}
              onClick={() => durumDegistir(f.deger)}
              className={`text-[10px] font-bold px-2 py-0.5 transition-colors ${
                seciliDurum === f.deger
                  ? "bg-[#A6DE9B] text-[#325343]"
                  : "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625]"
              }`}
            >
              {f.etiket}
            </button>
          ))}
        </div>

        {/* Rol pilleri */}
        <div className="flex items-center gap-1">
          {ROL_FILTRELER.map((f) => (
            <button
              key={f.deger}
              onClick={() => rolDegistir(f.deger)}
              className={`text-[10px] font-bold px-2 py-0.5 transition-colors ${
                seciliRol === f.deger
                  ? "bg-[#A6DE9B] text-[#325343]"
                  : "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625]"
              }`}
            >
              {f.etiket}
            </button>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-auto px-5 py-3">
        {hata && (
          <div className="text-[12px] text-[#4A4D4A] py-8 text-center">
            ⚠ {hata}
          </div>
        )}

        {!hata && (
          <AnimatePresence mode="wait">
            <motion.div key={`${aramaQ}-${seciliDurum}-${seciliRol}-${sayfa}`} {...tableAnim}>
              {yukleniyor ? (
                <div className="text-[11px] text-[#4A4D4A] py-8 text-center">
                  Yükleniyor...
                </div>
              ) : kullanicilar.length === 0 ? (
                <div className="text-[11px] text-[#4A4D4A] py-8 text-center">
                  Kullanıcı bulunamadı.
                </div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#F5F7F5] border-b border-[#D4E4D8]">
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Ad Soyad
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Rol
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Durum
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Kayıt
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Son Giriş
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        Churn
                      </th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kullanicilar.map((k) => (
                      <tr
                        key={k.id}
                        className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5] transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/kullanicilar/${k.id}`}
                            className="font-bold text-[#252625] hover:underline"
                          >
                            {k.adSoyad}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-[#4A4D4A]">
                          {ROL_ETIKET[k.rol] ?? k.rol}
                        </td>
                        <td className="px-3 py-2.5">
                          <DurumPill durum={k.durum} />
                        </td>
                        <td className="px-3 py-2.5 text-[#4A4D4A]">
                          {k.kayitTarihi}
                        </td>
                        <td className="px-3 py-2.5 text-[#4A4D4A]">
                          {k.sonGiris ?? "-"}
                        </td>
                        <td className="px-3 py-2.5">
                          <ChurnBadge skor={k.churnSkoru} />
                        </td>
                        <td className="px-3 py-2.5">
                          <KullaniciAksiyonlar
                            userId={k.id}
                            mevcutDurum={k.durum}
                            mevcutRol={k.rol}
                            onGuncellendi={() =>
                              void fetchKullanicilar(
                                aramaQ,
                                seciliDurum,
                                seciliRol,
                                sayfa
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {toplamSayfa > 1 && (
        <div className="px-5 py-3 border-t border-[#D4E4D8] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#4A4D4A]">
            {sayfa} / {toplamSayfa} sayfa — {toplam} kullanıcı
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={sayfa <= 1}
              onClick={() => setSayfa((s) => s - 1)}
              className="text-[11px] border-[1.5px] border-[#D4E4D8] px-2.5 py-1 disabled:opacity-30 hover:border-[#325343] transition-colors"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, toplamSayfa) }, (_, i) => {
              const p =
                toplamSayfa <= 5
                  ? i + 1
                  : sayfa <= 3
                  ? i + 1
                  : sayfa >= toplamSayfa - 2
                  ? toplamSayfa - 4 + i
                  : sayfa - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setSayfa(p)}
                  className={`text-[11px] w-7 py-1 border-[1.5px] transition-colors ${
                    p === sayfa
                      ? "bg-[#A6DE9B] text-[#325343] border-[#325343]"
                      : "border-[#D4E4D8] hover:border-[#325343]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={sayfa >= toplamSayfa}
              onClick={() => setSayfa((s) => s + 1)}
              className="text-[11px] border-[1.5px] border-[#D4E4D8] px-2.5 py-1 disabled:opacity-30 hover:border-[#325343] transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
