"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { BasvuruOzet, BasvuruListeResponse } from "@/types/admin";

const TABS = [
  { key: "bekleyen", label: "Bekleyenler" },
  { key: "onaylanmis", label: "Onaylılar" },
  { key: "reddedilen", label: "Reddedilenler" },
  { key: "askida", label: "Askıda" },
] as const;

type Tab = (typeof TABS)[number]["key"];

interface RejectState {
  profilId: string;
  adSoyad: string;
  gerekce: string;
  hata: string;
  yukleniyor: boolean;
}

export default function BasvurularKlient() {
  const reduced = useReducedMotion();

  const [tab, setTab] = useState<Tab>("bekleyen");
  const [q, setQ] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [veri, setVeri] = useState<BasvuruListeResponse | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [actionYukleniyor, setActionYukleniyor] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<RejectState | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchVeri = useCallback(
    async (seciliTab: Tab, arama: string, seciliSayfa: number) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setYukleniyor(true);
      setHata("");

      try {
        const params = new URLSearchParams({
          tab: seciliTab,
          sayfa: String(seciliSayfa),
          ...(arama ? { q: arama } : {}),
        });
        const res = await fetch(`/api/admin/danismanlar/basvurular?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Sunucu hatası");
        const json = (await res.json()) as BasvuruListeResponse;
        setVeri(json);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setHata("Veriler yüklenemedi. Lütfen tekrar deneyin.");
        }
      } finally {
        setYukleniyor(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => {
        void fetchVeri(tab, q, sayfa);
      },
      q ? 400 : 0
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tab, q, sayfa, fetchVeri]);

  function tabDegistir(yeniTab: Tab) {
    setTab(yeniTab);
    setSayfa(1);
    setQ("");
  }

  async function onayla(profilId: string) {
    setActionYukleniyor(profilId + "-onayla");
    try {
      const res = await fetch(`/api/admin/danismanlar/${profilId}/onayla`, {
        method: "PUT",
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) {
        alert(json.hata ?? "İşlem başarısız.");
        return;
      }
      await fetchVeri(tab, q, sayfa);
    } finally {
      setActionYukleniyor(null);
    }
  }

  function reddetModalAc(b: BasvuruOzet) {
    setRejectState({
      profilId: b.profilId,
      adSoyad: b.adSoyad,
      gerekce: "",
      hata: "",
      yukleniyor: false,
    });
  }

  async function reddetOnayla() {
    if (!rejectState) return;
    if (rejectState.gerekce.trim().length < 10) {
      setRejectState((s) =>
        s ? { ...s, hata: "Gerekçe en az 10 karakter olmalıdır." } : s
      );
      return;
    }
    setRejectState((s) => (s ? { ...s, yukleniyor: true, hata: "" } : s));
    try {
      const res = await fetch(
        `/api/admin/danismanlar/${rejectState.profilId}/reddet`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gerekce: rejectState.gerekce }),
        }
      );
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) {
        setRejectState((s) =>
          s ? { ...s, hata: json.hata ?? "İşlem başarısız.", yukleniyor: false } : s
        );
        return;
      }
      setRejectState(null);
      await fetchVeri(tab, q, sayfa);
    } catch {
      setRejectState((s) =>
        s ? { ...s, hata: "Ağ hatası. Tekrar deneyin.", yukleniyor: false } : s
      );
    }
  }

  async function dondur(profilId: string) {
    setActionYukleniyor(profilId + "-dondur");
    try {
      const res = await fetch(`/api/admin/kullanicilar/${profilId}/dondur`, {
        method: "PUT",
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) {
        alert(json.hata ?? "İşlem başarısız.");
        return;
      }
      await fetchVeri(tab, q, sayfa);
    } finally {
      setActionYukleniyor(null);
    }
  }

  const rowVariants = {
    hidden: { opacity: 0, y: reduced ? 0 : 6 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduced ? 0 : i * 0.04, duration: 0.15 },
    }),
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Frame Header */}
      <div className="border-b-[1.5px] border-[#325343] bg-[#F5F7F5] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <span className="text-[12px] font-bold text-[#252625]">
          Danışman Yönetimi
        </span>
        <span className="border-[1.5px] border-[#325343] text-[10px] font-bold px-2 py-0.5">
          ADMIN
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#D4E4D8] bg-white px-5 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => tabDegistir(t.key)}
            className={`px-4 py-2.5 text-[11px] font-bold border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#325343] text-[#252625]"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-[#D4E4D8] bg-white flex-shrink-0">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSayfa(1);
          }}
          placeholder="Ad veya soyad ile ara..."
          className="border-[1.5px] border-[#325343] px-3 py-1.5 text-[12px] w-64 bg-white outline-none focus:bg-[#F5F7F5]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {hata && (
          <p className="text-[12px] text-[#252625] mb-3 border-[1.5px] border-[#D4E4D8] px-3 py-2">
            ⚠ {hata}
          </p>
        )}

        {yukleniyor && !veri && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 bg-[#F5F7F5] border-[1.5px] border-[#D4E4D8] animate-pulse"
              />
            ))}
          </div>
        )}

        {veri && (
          <>
            <div className="text-[10px] text-[#4A4D4A] mb-2">
              {veri.toplam} kayıt · Sayfa {veri.sayfa}/{veri.toplamSayfa}
            </div>

            <div className="border-[1.5px] border-[#D4E4D8] overflow-x-auto">
              <table className="w-full border-collapse text-[11px] min-w-[760px]">
                <thead>
                  <tr className="bg-[#F5F7F5] border-b border-[#D4E4D8]">
                    {[
                      "Ad Soyad",
                      "Uzmanlık",
                      "Şehir",
                      "Profil %",
                      "Başvuru",
                      "Belgeler",
                      "İşlemler",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] px-3 py-2 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <tbody key={tab + q + sayfa}>
                    {veri.basvurular.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-[11px] text-[#4A4D4A]"
                        >
                          Bu sekme için kayıt bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      veri.basvurular.map((b, i) => (
                        <motion.tr
                          key={b.profilId}
                          custom={i}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="border-b border-[#D4E4D8] hover:bg-[#F5F7F5] transition-colors"
                        >
                          <td className="px-3 py-2 font-bold text-[#252625] whitespace-nowrap">
                            <Link
                              href={`/admin/danismanlar/${b.profilId}`}
                              className="hover:underline"
                            >
                              {b.adSoyad}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-[#252625]">
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {b.uzmanlik.slice(0, 3).map((u) => (
                                <span
                                  key={u}
                                  className="border-[1.5px] border-[#D4E4D8] px-1 py-0.5 text-[9px] uppercase tracking-[0.5px] text-[#4A4D4A]"
                                >
                                  {u}
                                </span>
                              ))}
                              {b.uzmanlik.length > 3 && (
                                <span className="text-[9px] text-[#4A4D4A]">
                                  +{b.uzmanlik.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#4A4D4A] whitespace-nowrap">
                            {b.sehir ?? "-"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
                                <div
                                  className="h-full bg-[#325343] transition-all"
                                  style={{ width: `${b.profilTamamlanma}%` }}
                                />
                              </div>
                              <span className="text-[#4A4D4A] text-[10px]">
                                {b.profilTamamlanma}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#4A4D4A] whitespace-nowrap">
                            {b.basvuruTarihi}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {b.diplomaUrl ? (
                                <a
                                  href={b.diplomaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] border-[1.5px] border-[#325343] px-1.5 py-0.5 hover:bg-[#325343] hover:text-white transition-colors"
                                >
                                  Diploma
                                </a>
                              ) : (
                                <span className="text-[10px] border-[1.5px] border-dashed border-[#BDBDBD] px-1.5 py-0.5 text-[#4A4D4A]">
                                  Diploma
                                </span>
                              )}
                              {b.idDocumentUrl ? (
                                <a
                                  href={b.idDocumentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] border-[1.5px] border-[#325343] px-1.5 py-0.5 hover:bg-[#325343] hover:text-white transition-colors"
                                >
                                  Kimlik
                                </a>
                              ) : (
                                <span className="text-[10px] border-[1.5px] border-dashed border-[#BDBDBD] px-1.5 py-0.5 text-[#4A4D4A]">
                                  Kimlik
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Aksiyonlar
                              basvuru={b}
                              tab={tab}
                              actionYukleniyor={actionYukleniyor}
                              onOnayla={onayla}
                              onReddet={reddetModalAc}
                              onDondur={dondur}
                            />
                            {/* Red gerekçesi (reddedilen tab) */}
                            {tab === "reddedilen" && b.redGerekce && (
                              <p className="text-[9px] text-[#4A4D4A] mt-1 max-w-[200px] leading-relaxed">
                                {b.redGerekce}
                              </p>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>

            {/* Pagination */}
            {veri.toplamSayfa > 1 && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setSayfa((s) => Math.max(1, s - 1))}
                  disabled={sayfa === 1}
                  className="border-[1.5px] border-[#325343] px-3 py-1 text-[11px] font-bold disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] hover:bg-[#F5F7F5] transition-colors"
                >
                  ← Önceki
                </button>
                <span className="text-[11px] text-[#4A4D4A]">
                  {sayfa} / {veri.toplamSayfa}
                </span>
                <button
                  onClick={() =>
                    setSayfa((s) => Math.min(veri.toplamSayfa, s + 1))
                  }
                  disabled={sayfa === veri.toplamSayfa}
                  className="border-[1.5px] border-[#325343] px-3 py-1 text-[11px] font-bold disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] hover:bg-[#F5F7F5] transition-colors"
                >
                  Sonraki →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectState && (
          <motion.div
            key="reject-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !rejectState.yukleniyor)
                setRejectState(null);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="basvuru-red-modal-title"
              initial={{ scale: reduced ? 1 : 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: reduced ? 1 : 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white border-[1.5px] border-[#325343] w-full max-w-md mx-4 p-5"
            >
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
                Red Gerekçesi
              </div>
              <p id="basvuru-red-modal-title" className="text-[13px] font-bold text-[#252625] mb-4">
                {rejectState.adSoyad}
              </p>

              <label className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625] block mb-1.5">
                Gerekçe <span className="text-[#4A4D4A]">*</span>
              </label>
              <textarea
                value={rejectState.gerekce}
                onChange={(e) =>
                  setRejectState((s) =>
                    s ? { ...s, gerekce: e.target.value, hata: "" } : s
                  )
                }
                rows={4}
                placeholder="Başvuruyu neden reddediyorsunuz? (en az 10 karakter)"
                className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[12px] resize-none outline-none focus:bg-[#F5F7F5]"
              />
              {rejectState.hata && (
                <p className="text-[11px] text-[#252625] mt-1 flex items-center gap-1">
                  ⚠ {rejectState.hata}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={reddetOnayla}
                  disabled={rejectState.yukleniyor}
                  className="flex-1 bg-[#A6DE9B] text-[#325343] text-[12px] font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
                >
                  {rejectState.yukleniyor ? "İşleniyor..." : "Reddet"}
                </button>
                <button
                  onClick={() => setRejectState(null)}
                  disabled={rejectState.yukleniyor}
                  className="flex-1 border-[1.5px] border-[#325343] text-[#252625] text-[12px] font-bold py-2.5 hover:bg-[#F5F7F5] transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Aksiyonlar({
  basvuru,
  tab,
  actionYukleniyor,
  onOnayla,
  onReddet,
  onDondur,
}: {
  basvuru: BasvuruOzet;
  tab: string;
  actionYukleniyor: string | null;
  onOnayla: (id: string) => void;
  onReddet: (b: BasvuruOzet) => void;
  onDondur: (id: string) => void;
}) {
  const isOnaylaLoading = actionYukleniyor === basvuru.profilId + "-onayla";
  const isDondurLoading = actionYukleniyor === basvuru.profilId + "-dondur";

  if (tab === "bekleyen") {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onOnayla(basvuru.profilId)}
          disabled={isOnaylaLoading}
          className="text-[10px] font-bold border-[1.5px] border-[#325343] px-2 py-0.5 bg-[#A6DE9B] text-[#325343] hover:opacity-80 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {isOnaylaLoading ? "..." : "Onayla"}
        </button>
        <button
          onClick={() => onReddet(basvuru)}
          disabled={isOnaylaLoading}
          className="text-[10px] font-bold border-[1.5px] border-[#325343] px-2 py-0.5 text-[#252625] hover:bg-[#F5F7F5] transition-colors whitespace-nowrap"
        >
          Reddet
        </button>
      </div>
    );
  }

  if (tab === "onaylanmis") {
    return (
      <div className="flex gap-1">
        <Link
          href={`/admin/danismanlar/${basvuru.profilId}`}
          className="text-[10px] font-bold border-[1.5px] border-[#325343] px-2 py-0.5 text-[#252625] hover:bg-[#F5F7F5] transition-colors whitespace-nowrap"
        >
          Detay
        </Link>
        <button
          onClick={() => onDondur(basvuru.profilId)}
          disabled={isDondurLoading}
          className="text-[10px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] px-2 py-0.5 text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isDondurLoading ? "..." : "Dondur"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href={`/admin/danismanlar/${basvuru.profilId}`}
      className="text-[10px] font-bold border-[1.5px] border-[#325343] px-2 py-0.5 text-[#252625] hover:bg-[#F5F7F5] transition-colors inline-block whitespace-nowrap"
    >
      Detay
    </Link>
  );
}
