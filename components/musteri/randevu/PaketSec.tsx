"use client";

import type { DanisanBilgi, PaketBilgi, WizardState } from "./RandevuSihirbazi";

interface Props {
  danisan: DanisanBilgi;
  paketler: PaketBilgi[];
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onIleri: () => void;
  onGeri: () => void;
}

export default function PaketSec({ danisan, paketler, state, setState, onIleri, onGeri }: Props) {
  const tekil = state.paketSecim === "tekil";

  function seçTekil() {
    setState((p) => ({
      ...p,
      paketSecim: "tekil",
      fiyat: danisan.price_individual ?? 0,
    }));
  }

  function seçPaket(p: PaketBilgi) {
    setState((prev) => ({
      ...prev,
      paketSecim: p.id,
      fiyat: p.price ?? danisan.price_individual ?? 0,
    }));
  }

  function devam() {
    onIleri();
  }

  const bireyselFiyat = danisan.price_individual ?? 0;

  return (
    <>
      <div className="p-6">
        <h2 className="text-[15px] font-bold text-[#252625] mb-1">Paket veya Tekil Seans</h2>
        <p className="text-[11px] text-[#4A4D4A] mb-5">
          Pakette indirim kazanın veya tek seans ödeme yapın
        </p>

        <div className="flex flex-col gap-3">
          {/* Tekil seans */}
          <button
            onClick={seçTekil}
            className="w-full text-left p-[14px] border-[1.5px] transition-colors duration-100"
            style={{
              borderColor: tekil ? "#252625" : "#D4E4D8",
              background:  tekil ? "#F5F7F5" : "#FFFFFF",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold text-[#252625]">Tekil Seans</div>
                <div className="text-[11px] text-[#4A4D4A] mt-0.5">
                  Tek seferlik randevu · Yükümlülük yok
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold text-[#252625]">
                  {bireyselFiyat > 0 ? `${bireyselFiyat}₺` : "Ücretsiz"}
                </div>
                <div className="text-[10px] text-[#4A4D4A]">/ seans</div>
              </div>
            </div>
            {tekil && (
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625]">
                ✓ Seçildi
              </div>
            )}
          </button>

          {/* Paketler */}
          {paketler.length > 0 ? (
            paketler.map((paket) => {
              const secili = state.paketSecim === paket.id;
              const seansFiyat =
                paket.price !== null && paket.session_count
                  ? Math.round(paket.price / paket.session_count)
                  : null;
              const indirimVar = (paket.discount_percent ?? 0) > 0;

              return (
                <button
                  key={paket.id}
                  onClick={() => seçPaket(paket)}
                  className="w-full text-left p-[14px] border-[1.5px] transition-colors duration-100"
                  style={{
                    borderColor: secili ? "#252625" : "#D4E4D8",
                    background:  secili ? "#F5F7F5" : "#FFFFFF",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#252625]">{paket.name}</span>
                        {indirimVar && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#A6DE9B] text-[#325343]">
                            %{paket.discount_percent} İndirim
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#4A4D4A] mt-0.5">
                        {paket.session_count} seans
                        {paket.validity_days ? ` · ${paket.validity_days} günde kullan` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-[#252625]">
                        {paket.price !== null ? `${paket.price}₺` : "—"}
                      </div>
                      {seansFiyat !== null && (
                        <div className="text-[10px] text-[#4A4D4A]">
                          {seansFiyat}₺ / seans
                        </div>
                      )}
                    </div>
                  </div>
                  {secili && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625]">
                      ✓ Seçildi
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-4 border border-dashed border-[#D4E4D8] text-[11px] text-[#4A4D4A] text-center">
              Bu danışmanın paketi bulunmuyor. Tekil seans ile devam edin.
            </div>
          )}
        </div>

        {/* Özet */}
        <div className="mt-5 border-[1.5px] border-[#325343] bg-[#F5F7F5] p-3 px-4">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.7px] text-[#4A4D4A] mb-1">
            Seçim Özeti
          </div>
          <div className="text-[13px] font-bold text-[#252625]">
            {tekil
              ? `Tekil Seans — ${bireyselFiyat > 0 ? `${bireyselFiyat}₺` : "Ücretsiz"}`
              : (() => {
                  const p = paketler.find((x) => x.id === state.paketSecim);
                  return p ? `${p.name} — ${p.price}₺` : "—";
                })()}
          </div>
          <div className="text-[10.5px] text-[#4A4D4A]">
            {state.tarih} · {state.saat}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#D4E4D8] bg-[#F5F7F5]">
        <button
          onClick={onGeri}
          className="px-5 py-2 text-[12px] font-bold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625]"
        >
          ← Geri
        </button>
        <span className="text-[10.5px] text-[#4A4D4A]">Adım 3 / 4</span>
        <button
          onClick={devam}
          className="px-6 py-2.5 text-[13px] font-bold bg-[#A6DE9B] text-[#325343]"
          style={{ border: "none" }}
        >
          İleri →
        </button>
      </div>
    </>
  );
}
