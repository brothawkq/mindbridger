"use client";

import { useEffect, useState, useCallback } from "react";
import type { DanisanBilgi, WizardState } from "./RandevuSihirbazi";

// ─── Tipler ───────────────────────────────────────────────────────

interface GunBilgi {
  tarih: string;   // "YYYY-MM-DD"
  musait: boolean;
  slotlar: string[];
}

// ─── Yardımcılar ──────────────────────────────────────────────────

const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

function todayTR(): string {
  return new Date(Date.now() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

function tarihFormatla(tarih: string): string {
  // "YYYY-MM-DD" → "15 Nisan 2026, Salı"
  const aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  const d = new Date(`${tarih}T12:00:00Z`);
  return `${d.getUTCDate()} ${aylar[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${gunler[d.getUTCDay()]}`;
}

function ayBasligi(yil: number, ay: number): string {
  const aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${aylar[ay]} ${yil}`;
}

// Haftanın pazartesi-başlangıçlı indeksi (0=Pzt … 6=Paz)
function pztIndex(dateStr: string): number {
  const dow = new Date(`${dateStr}T12:00:00Z`).getUTCDay(); // 0=Paz
  return dow === 0 ? 6 : dow - 1;
}

function ayGunleri(yil: number, ay: number): Array<string | null> {
  const ilkGun = `${yil}-${String(ay + 1).padStart(2, "0")}-01`;
  const offset = pztIndex(ilkGun);
  const sonGun = new Date(yil, ay + 1, 0).getDate();

  const cells: Array<string | null> = Array(offset).fill(null);
  for (let d = 1; d <= sonGun; d++) {
    cells.push(
      `${yil}-${String(ay + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  // 6-sütun ızgarayı tamamla
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function grupSlotlar(slotlar: string[]): { sabah: string[]; ogleden: string[]; aksam: string[] } {
  return {
    sabah:   slotlar.filter((s) => s < "12:00"),
    ogleden: slotlar.filter((s) => s >= "12:00" && s < "18:00"),
    aksam:   slotlar.filter((s) => s >= "18:00"),
  };
}

// ─── Bileşen ──────────────────────────────────────────────────────

interface Props {
  danisan: DanisanBilgi;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onIleri: () => void;
  onGeri: () => void;
}

export default function TarihSaatSec({ danisan, state, setState, onIleri, onGeri }: Props) {
  const today = todayTR();
  const todayDate = new Date(`${today}T12:00:00Z`);

  const [gunler, setGunler] = useState<Map<string, GunBilgi>>(new Map());
  const [yuklenyor, setYukleniyor] = useState(true);
  const [gorunenAy, setGorunenAy] = useState({
    yil: todayDate.getUTCFullYear(),
    ay:  todayDate.getUTCMonth(),
  });

  // 30 günlük takvimi çek
  const takvimCek = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/danismanlar/${danisan.slug}/takvim`);
      if (!res.ok) return;
      const json = (await res.json()) as { gunler: GunBilgi[] };
      const map = new Map<string, GunBilgi>();
      for (const g of json.gunler) map.set(g.tarih, g);
      setGunler(map);
    } catch {
      // Hata durumunda boş map kalır
    } finally {
      setYukleniyor(false);
    }
  }, [danisan.slug]);

  useEffect(() => {
    void takvimCek();
  }, [takvimCek]);

  const cells = ayGunleri(gorunenAy.yil, gorunenAy.ay);

  const seciliGunSlotlar =
    state.tarih && gunler.has(state.tarih)
      ? grupSlotlar(gunler.get(state.tarih)!.slotlar)
      : null;

  const secilenSayisi =
    (seciliGunSlotlar?.sabah.length ?? 0) +
    (seciliGunSlotlar?.ogleden.length ?? 0) +
    (seciliGunSlotlar?.aksam.length ?? 0);

  // 30 günlük son tarih
  const maxTarih = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 29);
    return d.toISOString().slice(0, 10);
  })();

  function oncekiAy() {
    setGorunenAy((prev) => {
      if (prev.ay === 0) return { yil: prev.yil - 1, ay: 11 };
      return { yil: prev.yil, ay: prev.ay - 1 };
    });
  }

  function sonrakiAy() {
    setGorunenAy((prev) => {
      if (prev.ay === 11) return { yil: prev.yil + 1, ay: 0 };
      return { yil: prev.yil, ay: prev.ay + 1 };
    });
  }

  function gunSec(tarih: string) {
    const gun = gunler.get(tarih);
    if (!gun?.musait) return;
    setState((prev) => ({ ...prev, tarih, saat: null }));
  }

  function saatSec(saat: string) {
    setState((prev) => ({ ...prev, saat }));
  }

  function devam() {
    if (!state.tarih || !state.saat) return;
    onIleri();
  }

  const gunSinifi = (tarih: string | null): React.CSSProperties => {
    if (!tarih) return { border: "transparent", background: "transparent", color: "transparent", cursor: "default" };
    const gun = gunler.get(tarih);
    const gecmis = tarih < today || tarih > maxTarih;
    if (gecmis || !gun) return { background: "#D4E4D8", borderColor: "#4A4D4A", color: "#4A4D4A", cursor: "default" };
    if (tarih === state.tarih) return { background: "#252625", borderColor: "#252625", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" };
    if (tarih === today) return { borderColor: "#252625", borderWidth: 2, fontWeight: 700, cursor: "pointer" };
    if (!gun.musait) return { background: "#D4E4D8", borderColor: "#4A4D4A", color: "#4A4D4A", cursor: "default", textDecoration: "line-through" };
    return { borderColor: "#252625", cursor: "pointer" };
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-[15px] font-bold text-[#252625] mb-1">Tarih ve Saat Seçin</h2>
        <p className="text-[11px] text-[#4A4D4A] mb-5">
          Müsait günleri ve saatleri görüntüleyin · Dolu slotlar çizgili gösterilir
        </p>

        {yuklenyor ? (
          <div className="h-48 flex items-center justify-center text-[12px] text-[#4A4D4A]">
            Takvim yükleniyor…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Takvim */}
            <div className="border-[1.5px] border-[#D4E4D8] p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <button
                  onClick={oncekiAy}
                  className="w-[22px] h-[22px] border-[1.5px] border-[#D4E4D8] bg-white flex items-center justify-center text-[11px]"
                >
                  ‹
                </button>
                <span className="text-[12px] font-bold text-[#252625]">
                  {ayBasligi(gorunenAy.yil, gorunenAy.ay)}
                </span>
                <button
                  onClick={sonrakiAy}
                  className="w-[22px] h-[22px] border-[1.5px] border-[#D4E4D8] bg-white flex items-center justify-center text-[11px]"
                >
                  ›
                </button>
              </div>

              {/* Haftanın günleri */}
              <div className="grid grid-cols-7 mb-1">
                {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((g) => (
                  <div key={g} className="text-center text-[9px] font-bold uppercase text-[#4A4D4A] py-0.5 tracking-[0.5px]">
                    {g}
                  </div>
                ))}
              </div>

              {/* Gün ızgarası */}
              <div className="grid grid-cols-7 gap-[2px]">
                {cells.map((tarih, i) => (
                  <div
                    key={i}
                    onClick={() => tarih && gunSec(tarih)}
                    className="h-[28px] flex items-center justify-center text-[11px] font-medium border-[1px]"
                    style={gunSinifi(tarih)}
                  >
                    {tarih ? new Date(`${tarih}T12:00:00Z`).getUTCDate() : ""}
                  </div>
                ))}
              </div>

              {/* Açıklama */}
              <div className="mt-2.5 flex gap-3 flex-wrap">
                {[
                  { renk: "#252625", metin: "Müsait", dolgu: false },
                  { renk: "#D4E4D8", metin: "Dolu",   dolgu: true },
                  { renk: "#252625", metin: "Seçili",  dolgu: true },
                ].map(({ renk, metin, dolgu }) => (
                  <div key={metin} className="flex items-center gap-1 text-[10px] text-[#4A4D4A]">
                    <div
                      style={{
                        width: 10, height: 10,
                        border: `1.5px solid ${renk}`,
                        background: dolgu ? renk : "#FFF",
                      }}
                    />
                    {metin}
                  </div>
                ))}
              </div>
            </div>

            {/* Saat slotları */}
            <div className="border-[1.5px] border-[#D4E4D8] p-3.5">
              {state.tarih && seciliGunSlotlar ? (
                <>
                  <div className="text-[12px] font-bold text-[#252625] mb-0.5">
                    {tarihFormatla(state.tarih)}
                  </div>
                  <div className="text-[10.5px] text-[#4A4D4A] mb-3">
                    {secilenSayisi} müsait slot
                    {state.saat ? ` · ${state.saat} seçildi` : ""}
                  </div>

                  {(["sabah", "ogleden", "aksam"] as const).map((grup) => {
                    const etiket = grup === "sabah" ? "Sabah" : grup === "ogleden" ? "Öğleden Sonra" : "Akşam";
                    const slotGrup = seciliGunSlotlar[grup];
                    if (slotGrup.length === 0) return null;
                    return (
                      <div key={grup}>
                        <div className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mt-2.5 mb-1.5">
                          {etiket}
                        </div>
                        <div className="grid grid-cols-3 gap-[5px]">
                          {slotGrup.map((saat) => (
                            <button
                              key={saat}
                              onClick={() => saatSec(saat)}
                              className="h-8 flex items-center justify-center text-[12px] font-semibold border-[1.5px] transition-colors duration-100"
                              style={{
                                background:  state.saat === saat ? "#252625" : "#FFFFFF",
                                borderColor: state.saat === saat ? "#252625" : "#252625",
                                color:       state.saat === saat ? "#FFFFFF" : "#252625",
                              }}
                            >
                              {saat}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {state.saat && (
                    <div className="mt-3 p-2 bg-[#F5F7F5] border-[1.5px] border-[#D4E4D8]">
                      <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#4A4D4A] mb-0.5">Seçilen</div>
                      <div className="text-[13px] font-bold text-[#252625]">
                        {tarihFormatla(state.tarih).split(",")[0]}, {state.saat}
                      </div>
                      <div className="text-[10.5px] text-[#4A4D4A]">
                        Online · {danisan.session_duration ?? 50} dakika
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[180px] text-[11px] text-[#4A4D4A] border border-dashed border-[#D4E4D8]">
                  Saatleri görmek için bir gün seçin
                </div>
              )}
            </div>
          </div>
        )}

        {/* Özet kartı */}
        {state.tarih && state.saat && (
          <div className="mt-5 border-[1.5px] border-[#325343] bg-[#F5F7F5] p-3 px-4 flex flex-wrap gap-4 items-center">
            {[
              { etiket: "Danışman",   deger: danisan.ad },
              { etiket: "Seans Türü", deger: state.seansTipi ?? "—" },
              { etiket: "Tarih & Saat", deger: `${tarihFormatla(state.tarih).split(",")[0]} · ${state.saat}` },
              { etiket: "Ücret",      deger: state.fiyat > 0 ? `${state.fiyat}₺` : "Ücretsiz" },
            ].map(({ etiket, deger }) => (
              <div key={etiket} className="flex flex-col">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.7px] text-[#4A4D4A]">{etiket}</span>
                <span className="text-[13px] font-bold text-[#252625]">{deger}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tekrarlayan toggle */}
        <div className="mt-4 flex items-center gap-2.5 p-3 border-[1.5px] border-dashed border-[#BDBDBD] bg-[#F5F7F5]">
          <button
            onClick={() => setState((p) => ({ ...p, tekrarlayan: !p.tekrarlayan }))}
            className="relative shrink-0"
            style={{
              width: 30, height: 16,
              borderRadius: 8,
              border: `1.5px solid #325343`,
              background: state.tekrarlayan ? "#252625" : "#FFFFFF",
            }}
            aria-pressed={state.tekrarlayan}
            aria-label="Her hafta tekrarla"
          >
            <div
              style={{
                width: 11, height: 11,
                borderRadius: "50%",
                background: state.tekrarlayan ? "#FFFFFF" : "#4A4D4A",
                position: "absolute",
                top: "1.5px",
                transition: "left 0.15s",
                left: state.tekrarlayan ? "calc(100% - 13px)" : "2px",
              }}
            />
          </button>
          <div>
            <div className="text-[12px] font-bold text-[#252625]">Her hafta tekrarla</div>
            <div className="text-[10.5px] text-[#4A4D4A]">Aynı gün ve saat · İptal edilene kadar devam eder</div>
          </div>
          {state.tekrarlayan && state.tarih && state.saat && (
            <div className="ml-auto text-[10.5px] text-[#4A4D4A]">
              Aktif — Her {tarihFormatla(state.tarih).split(", ")[1]} {state.saat}
            </div>
          )}
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
        <span className="text-[10.5px] text-[#4A4D4A]">
          Adım 2 / 4{state.saat ? " · Saat seçildi" : ""}
        </span>
        <button
          onClick={devam}
          disabled={!state.tarih || !state.saat}
          className="px-6 py-2.5 text-[13px] font-bold"
          style={{
            background: state.tarih && state.saat ? "#252625" : "#4A4D4A",
            color: "#FFFFFF",
            border: "none",
            cursor: state.tarih && state.saat ? "pointer" : "not-allowed",
          }}
        >
          İleri →
        </button>
      </div>
    </>
  );
}
