"use client";

import type { DanisanBilgi, SeansTipi, WizardState } from "./RandevuSihirbazi";

interface SeansSecenegi {
  tip: SeansTipi;
  baslik: string;
  aciklama: string;
  fiyat: number;
  sure: string;
}

function secilenekleriBelirle(danisan: DanisanBilgi): SeansSecenegi[] {
  const secenekler: SeansSecenegi[] = [];
  const bireyselFiyat = danisan.price_individual ?? 0;
  const sure = `${danisan.session_duration ?? 50} dk`;

  if (danisan.intro_session_enabled) {
    secenekler.push({
      tip: "on_gorusme",
      baslik: "Ücretsiz Ön Görüşme",
      aciklama: "Tanışma seansı — uyum değerlendirmesi",
      fiyat: 0,
      sure: `${danisan.intro_session_duration ?? 15} dk`,
    });
  }

  if (danisan.is_online) {
    secenekler.push({
      tip: "bireysel",
      baslik: "Bireysel Seans",
      aciklama: "Online görüntülü görüşme",
      fiyat: danisan.sliding_scale ? (danisan.sliding_scale_price ?? bireyselFiyat) : bireyselFiyat,
      sure,
    });
  }

  if (danisan.is_in_person) {
    secenekler.push({
      tip: "bireysel",
      baslik: "Yüz Yüze Seans",
      aciklama: "Yüz yüze bireysel görüşme",
      fiyat: bireyselFiyat,
      sure,
    });
  }

  if (danisan.price_async) {
    secenekler.push({
      tip: "asenkron",
      baslik: "Asenkron Seans",
      aciklama: "Yazılı mesaj; 24 saat içinde yanıt",
      fiyat: danisan.price_async,
      sure: "24 saat yanıt",
    });
  }

  secenekler.push({
    tip: "cift_aile",
    baslik: "Çift / Aile Seansı",
    aciklama: "İki veya daha fazla katılımcı",
    fiyat: bireyselFiyat,
    sure,
  });

  if (danisan.is_supervisor) {
    secenekler.push({
      tip: "supervizyon",
      baslik: "Süpervizyon",
      aciklama: "Mesleki süpervizyon seansı",
      fiyat: bireyselFiyat,
      sure,
    });
  }

  return secenekler;
}

interface Props {
  danisan: DanisanBilgi;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onIleri: () => void;
}

export default function SeansTipiSec({ danisan, state, setState, onIleri }: Props) {
  const secenekler = secilenekleriBelirle(danisan);

  function sec(s: SeansSecenegi) {
    setState((prev) => ({
      ...prev,
      seansTipi: s.tip,
      fiyat: s.fiyat,
    }));
  }

  function devam() {
    if (!state.seansTipi) return;
    onIleri();
  }

  return (
    <>
      <div className="p-6">
        <h2 className="text-[15px] font-bold text-[#252625] mb-1">Seans Türünü Seçin</h2>
        <p className="text-[11px] text-[#4A4D4A] mb-5">
          Size en uygun seans türünü belirleyin
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {secenekler.map((s) => {
            const secili =
              state.seansTipi === s.tip && state.fiyat === s.fiyat;

            return (
              <button
                key={`${s.tip}-${s.fiyat}`}
                onClick={() => sec(s)}
                className="text-left p-[14px] border-[1.5px] transition-colors duration-100"
                style={{
                  borderColor: secili ? "#252625" : "#D4E4D8",
                  background:  secili ? "#F5F7F5" : "#FFFFFF",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-bold text-[#252625]">
                      {s.baslik}
                    </div>
                    <div className="text-[11px] text-[#4A4D4A] mt-0.5">
                      {s.aciklama}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-[#252625]">
                      {s.fiyat > 0 ? `${s.fiyat}₺` : "Ücretsiz"}
                    </div>
                    <div className="text-[10px] text-[#4A4D4A]">{s.sure}</div>
                  </div>
                </div>
                {secili && (
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.8px] text-[#252625]">
                    ✓ Seçildi
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {danisan.sliding_scale && (
          <div className="mt-4 p-3 border-[1.5px] border-dashed border-[#BDBDBD] text-[11px] text-[#4A4D4A]">
            ↘ Bu danışman &quot;kayan ücret&quot; (sliding scale) uygulamaktadır.
            Ücret konusunda danışmanınızla görüşebilirsiniz.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-t border-[#D4E4D8] bg-[#F5F7F5]"
      >
        <div />
        <span className="text-[10.5px] text-[#4A4D4A]">Adım 1 / 4</span>
        <button
          onClick={devam}
          disabled={!state.seansTipi}
          className="px-6 py-2.5 text-[13px] font-bold"
          style={{
            background: state.seansTipi ? "#252625" : "#4A4D4A",
            color:      "#FFFFFF",
            border:     "none",
            cursor:     state.seansTipi ? "pointer" : "not-allowed",
          }}
        >
          İleri →
        </button>
      </div>
    </>
  );
}
