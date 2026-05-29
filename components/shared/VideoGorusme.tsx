"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";

interface Props {
  randevuId: string;
}

type Durum = "bekliyor" | "baglaniyor" | "aktif" | "bitti" | "hata";

export default function VideoGorusme({ randevuId }: Props) {
  const prefersReduced = useReducedMotion();
  const [durum, setDurum] = useState<Durum>("bekliyor");
  const [hataMsg, setHataMsg] = useState<string | null>(null);
  const [odaAdi, setOdaAdi] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Daily.co call frame referansı (tip: any — Daily.co resmi TS desteği yok)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callFrameRef = useRef<any>(null);

  async function gorusmeyeKatil() {
    setDurum("baglaniyor");
    setHataMsg(null);

    try {
      // 1. Token al
      const res = await fetch(`/api/video/token/${randevuId}`);
      const data = (await res.json()) as {
        token?: string;
        oda_adi?: string;
        error?: string;
        kalan_dakika?: number;
      };

      if (!res.ok || !data.token || !data.oda_adi) {
        const msg =
          data.kalan_dakika !== undefined
            ? `Video bağlantısı ${data.kalan_dakika} dakika sonra aktif olacak`
            : (data.error ?? "Video bağlantısı kurulamadı");
        setHataMsg(msg);
        setDurum("hata");
        return;
      }

      setOdaAdi(data.oda_adi);

      // 2. Daily.co script yükle (CDN — bundle'a dahil değil)
      await loadDailyScript();

      if (!containerRef.current) {
        setHataMsg("Video alanı yüklenemedi, sayfayı yenileyin.");
        setDurum("hata");
        return;
      }

      // 3. Call frame oluştur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DailyIframe = (window as any).DailyIframe as {
        createFrame: (el: HTMLElement, opts: Record<string, unknown>) => unknown;
      } | undefined;

      if (!DailyIframe) {
        setHataMsg("Video servisi yüklenemedi, lütfen sayfayı yenileyin.");
        setDurum("hata");
        return;
      }

      const frame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          width:  "100%",
          height: "100%",
          border: "none",
        },
      });

      callFrameRef.current = frame;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = frame as any;

      f.on("joined-meeting",  () => setDurum("aktif"));
      f.on("left-meeting",    () => setDurum("bitti"));
      f.on("error",           (e: { errorMsg?: string }) => {
        setHataMsg(e.errorMsg ?? "Video bağlantısı kesildi");
        setDurum("hata");
      });

      await f.join({
        url:   `https://${getDailyDomain()}.daily.co/${data.oda_adi}`,
        token: data.token,
      });
    } catch {
      setHataMsg("Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
      setDurum("hata");
    }
  }

  // Ayrıl
  function gorusmeyiSonlandir() {
    if (callFrameRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (callFrameRef.current as any).destroy();
      callFrameRef.current = null;
    }
    setDurum("bitti");
  }

  // Otomatik yeniden bağlanma: hata durumunda 5 saniye bekle
  useEffect(() => {
    if (durum !== "hata") return;
    const t = setTimeout(() => {
      if (durum === "hata") setDurum("bekliyor");
    }, 5000);
    return () => clearTimeout(t);
  }, [durum]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callFrameRef.current as any).destroy();
      }
    };
  }, []);

  const animProps = prefersReduced
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  return (
    <div className="border-[1.5px] border-[#212121] bg-white overflow-hidden">
      {/* Başlık */}
      <div className="bg-[#F5F5F5] border-b-[1.5px] border-[#212121] px-4 py-2.5 flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#212121]">Video Görüşme</span>
        <div className="flex items-center gap-3">
          {/* Kayıt kapalı notu — PRD zorunluluğu */}
          <span className="text-[10px] text-[#BDBDBD] border-[1.5px] border-[#BDBDBD] px-2 py-0.5">
            ⊘ Kayıt Kapalı
          </span>
          {odaAdi && (
            <span className="text-[10px] text-[#BDBDBD]">
              Oda: {odaAdi.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      {/* İçerik */}
      <AnimatePresence mode="wait">
        {durum === "bekliyor" && (
          <motion.div
            key="bekliyor"
            {...animProps}
            transition={{ duration: 0.18 }}
            className="p-8 text-center"
          >
            <div className="text-[32px] mb-3">🎥</div>
            <p className="text-[13px] font-bold text-[#212121] mb-1">Görüşmeye katılmak için hazır mısınız?</p>
            <p className="text-[11px] text-[#BDBDBD] mb-6">
              Tarayıcı kamera ve mikrofon izni isteyebilir.
            </p>
            <button
              onClick={gorusmeyeKatil}
              className="px-6 py-2.5 bg-[#212121] text-white text-[13px] font-bold hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
            >
              Görüşmeye Katıl →
            </button>
          </motion.div>
        )}

        {durum === "baglaniyor" && (
          <motion.div
            key="baglaniyor"
            {...animProps}
            transition={{ duration: 0.18 }}
            className="p-8 text-center"
          >
            <div className="text-[11px] text-[#BDBDBD] mb-2">Bağlanıyor…</div>
            <div className="w-full h-1 bg-[#E0E0E0] border-[1.5px] border-[#BDBDBD]">
              <motion.div
                className="h-full bg-[#212121]"
                animate={{ width: ["0%", "80%"] }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {durum === "aktif" && (
          <motion.div
            key="aktif"
            {...animProps}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
          >
            {/* Daily.co iframe burada render edilir */}
            <div ref={containerRef} style={{ height: 520 }} />
            <div className="px-4 py-2 border-t border-[#E0E0E0] flex items-center justify-between bg-[#F5F5F5]">
              <span className="text-[10px] text-[#BDBDBD]">
                Bu görüşme kaydedilmemektedir
              </span>
              <button
                onClick={gorusmeyiSonlandir}
                className="px-4 py-1.5 border-[1.5px] border-[#212121] text-[11px] font-bold text-[#212121] bg-white"
              >
                Görüşmeyi Bitir
              </button>
            </div>
          </motion.div>
        )}

        {durum === "bitti" && (
          <motion.div
            key="bitti"
            {...animProps}
            transition={{ duration: 0.18 }}
            className="p-8 text-center"
          >
            <div className="text-[32px] mb-3">✓</div>
            <p className="text-[13px] font-bold text-[#212121] mb-1">Görüşme Tamamlandı</p>
            <p className="text-[11px] text-[#BDBDBD]">
              Görüşme sonlandırıldı. Teşekkürler.
            </p>
          </motion.div>
        )}

        {durum === "hata" && (
          <motion.div
            key="hata"
            {...animProps}
            transition={{ duration: 0.18 }}
            className="p-8 text-center"
          >
            <div className="text-[32px] mb-3">⚠</div>
            <p className="text-[13px] font-bold text-[#212121] mb-2">Bağlantı Sorunu</p>
            <p className="text-[11px] text-[#BDBDBD] mb-4">
              {hataMsg ?? "Video bağlantısı kurulamadı."}
            </p>
            <p className="text-[10px] text-[#BDBDBD]">5 saniye içinde tekrar deneyebilirsiniz…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gizlilik notu */}
      <div className="border-t border-[#E0E0E0] px-4 py-2 text-[10px] text-[#BDBDBD] text-center">
        🔒 Uçtan uca şifreli · Kayıt yapılmamaktadır · Daily.co altyapısı
      </div>
    </div>
  );
}

// ─── Yardımcı fonksiyonlar ─────────────────────────────────────────

function getDailyDomain(): string {
  return process.env.NEXT_PUBLIC_DAILY_DOMAIN ?? "mindbridger";
}

function loadDailyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).DailyIframe) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@daily-co/daily-js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Daily.co script yüklenemedi"));
    document.head.appendChild(script);
  });
}
