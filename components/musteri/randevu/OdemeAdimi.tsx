"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DanisanBilgi, WizardState } from "./RandevuSihirbazi";

type Durum = "hazir" | "olusturuluyor" | "form_hazir" | "basarili" | "hata";

interface Props {
  danisan: DanisanBilgi;
  state: WizardState;
  onGeri: () => void;
}

const SEANS_ETIKETI: Record<string, string> = {
  bireysel:    "Bireysel Seans",
  asenkron:    "Asenkron Seans",
  on_gorusme:  "Ön Görüşme (Ücretsiz)",
  cift_aile:   "Çift / Aile Seansı",
  supervizyon: "Süpervizyon",
};

function formatTarih(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export default function OdemeAdimi({ danisan, state, onGeri }: Props) {
  const router = useRouter();
  const [durum, setDurum] = useState<Durum>("hazir");
  const [hataMsg, setHataMsg] = useState<string | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [randevuId, setRandevuId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const ucretsisMi = state.fiyat === 0 || state.seansTipi === "on_gorusme";

  // iyzico checkout form HTML'ini script'leriyle birlikte DOM'a enjekte et
  useEffect(() => {
    if (durum !== "form_hazir" || !checkoutHtml || !formRef.current) return;
    const container = formRef.current;
    container.innerHTML = "";
    const range = document.createRange();
    const fragment = range.createContextualFragment(checkoutHtml);
    container.appendChild(fragment);
  }, [durum, checkoutHtml]);

  async function odemeBaslat() {
    if (!state.tarih || !state.saat || !state.seansTipi) return;

    setDurum("olusturuluyor");
    setHataMsg(null);

    try {
      // 1. Randevu oluştur (UTC+3 ile ISO datetime)
      const scheduledAt = `${state.tarih}T${state.saat}:00+03:00`;

      const randevuRes = await fetch("/api/randevular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          danisan_id: danisan.id,
          session_type: state.seansTipi,
          scheduled_at: scheduledAt,
          ...(state.paketSecim !== "tekil" ? { paket_id: state.paketSecim } : {}),
        }),
      });

      const randevuData = (await randevuRes.json()) as {
        randevu?: { id: string };
        error?: string;
      };

      if (!randevuRes.ok || !randevuData.randevu) {
        setHataMsg(randevuData.error ?? "Randevu oluşturulamadı");
        setDurum("hata");
        return;
      }

      const yeniRandevuId = randevuData.randevu.id;
      setRandevuId(yeniRandevuId);

      // 2. Ücretsiz seans (ön görüşme veya fiyat 0)
      if (ucretsisMi) {
        setDurum("basarili");
        return;
      }

      // 3. iyzico ödeme başlat
      const callbackUrl = `${window.location.origin}/api/odeme/callback`;

      const odemeRes = await fetch("/api/odeme/baslat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          randevu_id: yeniRandevuId,
          callback_url: callbackUrl,
        }),
      });

      const odemeData = (await odemeRes.json()) as {
        checkoutFormContent?: string;
        paymentPageUrl?: string;
        error?: string;
      };

      if (!odemeRes.ok) {
        setHataMsg(odemeData.error ?? "Ödeme başlatılamadı");
        setDurum("hata");
        return;
      }

      // 4a. Embedded checkout form (tercih edilen)
      if (odemeData.checkoutFormContent) {
        setCheckoutHtml(odemeData.checkoutFormContent);
        setDurum("form_hazir");
        return;
      }

      // 4b. Harici ödeme sayfasına yönlendir
      if (odemeData.paymentPageUrl) {
        window.location.href = odemeData.paymentPageUrl;
        return;
      }

      setHataMsg("Ödeme formu alınamadı, lütfen tekrar deneyin");
      setDurum("hata");
    } catch {
      setHataMsg("Bağlantı hatası oluştu, lütfen tekrar deneyin");
      setDurum("hata");
    }
  }

  // ─── Başarı ekranı ────────────────────────────────────────────────

  if (durum === "basarili") {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 bg-[#325343] rounded-full flex items-center justify-center text-white text-[20px] font-bold mx-auto mb-4">
          ✓
        </div>
        <h2 className="text-[16px] font-bold text-[#252625] mb-2">
          {ucretsisMi ? "Ön Görüşme Talebiniz Alındı" : "Ödeme Başarılı"}
        </h2>
        <p className="text-[12px] text-[#4A4D4A] mb-6 leading-relaxed max-w-xs mx-auto">
          Randevu talebiniz danışmana iletildi. Onaylandığında bildirim alacaksınız.
        </p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <button
            onClick={() =>
              router.push(
                randevuId
                  ? `/panelim/randevularim/${randevuId}`
                  : "/panelim/randevularim",
              )
            }
            className="w-full py-2.5 bg-[#A6DE9B] text-[#325343] text-[13px] font-bold"
          >
            Randevuyu Görüntüle →
          </button>
          <button
            onClick={() => router.push("/panelim/dashboard")}
            className="w-full py-2.5 border-[1.5px] border-[#325343] text-[#252625] text-[13px] font-bold bg-white"
          >
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  // ─── iyzico form ekranı ───────────────────────────────────────────

  if (durum === "form_hazir") {
    return (
      <div className="p-6">
        <h2 className="text-[15px] font-bold text-[#252625] mb-1">Ödeme</h2>
        <p className="text-[11px] text-[#4A4D4A] mb-4">
          Güvenli iyzico ödeme formu — kart bilgileriniz sunucularımızda saklanmaz
        </p>
        <div ref={formRef} className="min-h-[380px]" />
        <div className="mt-4 p-3 border-[1.5px] border-[#D4E4D8] text-[10.5px] text-[#4A4D4A]">
          △ PCI-DSS uyumlu iyzico altyapısı · 256-bit SSL şifreleme
        </div>
      </div>
    );
  }

  // ─── Ana ekran (hazir + olusturuluyor + hata) ─────────────────────

  const butonAktif = durum !== "olusturuluyor" && !!state.tarih && !!state.saat;

  return (
    <>
      <div className="p-6">
        <h2 className="text-[15px] font-bold text-[#252625] mb-1">Ödeme</h2>
        <p className="text-[11px] text-[#4A4D4A] mb-5">
          Randevu talebi oluşturulacak ve danışmana bildirim gönderilecek
        </p>

        {/* Randevu özeti */}
        <div className="border-[1.5px] border-[#325343] p-4 mb-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-3">
            Randevu Özeti
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            {[
              {
                etiket: "Danışman",
                deger: danisan.ad,
              },
              {
                etiket: "Seans Türü",
                deger: state.seansTipi
                  ? (SEANS_ETIKETI[state.seansTipi] ?? state.seansTipi)
                  : "—",
              },
              {
                etiket: "Tarih",
                deger: state.tarih ? formatTarih(state.tarih) : "—",
              },
              {
                etiket: "Saat",
                deger: state.saat ?? "—",
              },
              {
                etiket: "Süre",
                deger: `${danisan.session_duration ?? 50} dakika`,
              },
              {
                etiket: "Tekrarlayan",
                deger: state.tekrarlayan ? "Her hafta" : "Hayır",
              },
            ].map(({ etiket, deger }) => (
              <div key={etiket}>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.7px] text-[#4A4D4A]">
                  {etiket}
                </div>
                <div className="text-[13px] font-bold text-[#252625]">{deger}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#D4E4D8] mt-4 pt-3 flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#252625]">Toplam</span>
            <span className="text-[16px] font-bold text-[#252625]">
              {state.fiyat > 0
                ? `${state.fiyat.toLocaleString("tr-TR")} ₺`
                : "Ücretsiz"}
            </span>
          </div>
        </div>

        {/* Hata mesajı */}
        {durum === "hata" && hataMsg && (
          <div className="mb-4 p-3 bg-[#F5F7F5] border-[1.5px] border-[#325343] text-[12px] text-[#252625] flex items-start gap-2">
            <span className="shrink-0">⚠</span>
            <span>{hataMsg}</span>
          </div>
        )}

        {/* Güvenlik notu */}
        <div className="p-3 border-[1.5px] border-[#D4E4D8] text-[10.5px] text-[#4A4D4A]">
          △ Güvenli ödeme · Kart bilgileriniz sunucularımızda saklanmaz · PCI-DSS
          uyumlu iyzico altyapısı
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#D4E4D8] bg-[#F5F7F5]">
        <button
          onClick={onGeri}
          disabled={durum === "olusturuluyor"}
          className="px-5 py-2 text-[12px] font-bold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625] disabled:opacity-40"
        >
          ← Geri
        </button>
        <span className="text-[10.5px] text-[#4A4D4A]">Adım 4 / 4</span>
        <button
          onClick={odemeBaslat}
          disabled={!butonAktif}
          className="px-6 py-2.5 text-[13px] font-bold bg-[#A6DE9B] text-[#325343] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {durum === "olusturuluyor"
            ? "İşleniyor..."
            : ucretsisMi
              ? "Randevu Gönder"
              : "Ödeme Yap"}
        </button>
      </div>
    </>
  );
}
