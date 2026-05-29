"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "framer-motion";

type SoruTipi = "text" | "textarea" | "select" | "checkbox" | "radio" | "number" | "date";

interface Soru {
  id: string;
  label: string;
  type: SoruTipi;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  is_default: boolean;
  questions: Soru[] | null;
  created_at: string;
  onboarding_yanitlar?: [{ count: number }];
}

interface Props {
  formlar: Form[];
  danisanId: string;
}

const SORU_TIPLERI: { value: SoruTipi; label: string }[] = [
  { value: "text", label: "Kısa metin" },
  { value: "textarea", label: "Uzun metin" },
  { value: "select", label: "Açılır liste" },
  { value: "radio", label: "Tek seçim" },
  { value: "checkbox", label: "Çok seçim" },
  { value: "number", label: "Sayı" },
  { value: "date", label: "Tarih" },
];

function formatTarih(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function yeniSoru(): Soru {
  return { id: crypto.randomUUID(), label: "", type: "text", required: false };
}

export default function OnboardingFormlarKlient({ formlar: baslangicFormlar, danisanId }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [formlar, setFormlar] = useState<Form[]>(baslangicFormlar);
  const [modalAcik, setModalAcik] = useState(false);
  const [yanitModalAcik, setYanitModalAcik] = useState(false);
  const [seciliFormId, setSeciliFormId] = useState<string | null>(null);
  const [yanitlar, setYanitlar] = useState<{ id: string; answers: unknown; created_at: string; randevu_id: string | null; profiles: { first_name: string; last_name: string } | null }[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDefault, setFormDefault] = useState(false);
  const [sorular, setSorular] = useState<Soru[]>([yeniSoru()]);
  const [duzenlemeId, setDuzenlemeId] = useState<string | null>(null);

  const animProps = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.15 } };

  function modalAc(form?: Form) {
    if (form) {
      setDuzenlemeId(form.id);
      setFormTitle(form.title);
      setFormDefault(form.is_default);
      setSorular(form.questions && form.questions.length > 0 ? form.questions : [yeniSoru()]);
    } else {
      setDuzenlemeId(null);
      setFormTitle("");
      setFormDefault(false);
      setSorular([yeniSoru()]);
    }
    setHata(null);
    setModalAcik(true);
  }

  function soruEkle() {
    setSorular((prev) => [...prev, yeniSoru()]);
  }

  function soruSil(id: string) {
    setSorular((prev) => prev.filter((s) => s.id !== id));
  }

  function soruGuncelle(id: string, alan: keyof Soru, deger: unknown) {
    setSorular((prev) => prev.map((s) => (s.id === id ? { ...s, [alan]: deger } : s)));
  }

  function secilenekEkle(soruId: string) {
    setSorular((prev) =>
      prev.map((s) =>
        s.id === soruId ? { ...s, options: [...(s.options ?? []), ""] } : s
      )
    );
  }

  function secilenekGuncelle(soruId: string, idx: number, deger: string) {
    setSorular((prev) =>
      prev.map((s) =>
        s.id === soruId
          ? { ...s, options: (s.options ?? []).map((o, i) => (i === idx ? deger : o)) }
          : s
      )
    );
  }

  function secilenekSil(soruId: string, idx: number) {
    setSorular((prev) =>
      prev.map((s) =>
        s.id === soruId
          ? { ...s, options: (s.options ?? []).filter((_, i) => i !== idx) }
          : s
      )
    );
  }

  async function kaydet() {
    if (!formTitle.trim()) { setHata("Başlık zorunlu"); return; }
    if (sorular.some((s) => !s.label.trim())) { setHata("Tüm sorulara label girilmeli"); return; }
    setYukleniyor(true);
    setHata(null);
    try {
      const body = { title: formTitle.trim(), is_default: formDefault, questions: sorular };
      const url = duzenlemeId
        ? `/api/onboarding-formlar/${duzenlemeId}`
        : "/api/onboarding-formlar";
      const res = await fetch(url, {
        method: duzenlemeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "İşlem başarısız");
      }
      setModalAcik(false);
      router.refresh();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setYukleniyor(false);
    }
  }

  async function formSil(formId: string) {
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/onboarding-formlar/${formId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Silinemedi");
      }
      setFormlar((prev) => prev.filter((f) => f.id !== formId));
      setSilOnayId(null);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Silinemedi");
    } finally {
      setYukleniyor(false);
    }
  }

  async function yanitlariGoster(formId: string) {
    setSeciliFormId(formId);
    setYukleniyor(true);
    try {
      const res = await fetch(`/api/onboarding-formlar/${formId}`);
      const d = await res.json();
      setYanitlar(d.yanitlar ?? []);
      setYanitModalAcik(true);
    } catch {
      setHata("Yanıtlar yüklenemedi");
    } finally {
      setYukleniyor(false);
    }
  }

  const seciliForm = formlar.find((f) => f.id === seciliFormId);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Araçlar</div>
          <h1 className="text-base font-bold text-[#252625] dark:text-white">Onboarding Formları</h1>
        </div>
        <button
          onClick={() => modalAc()}
          className="bg-[#A6DE9B] text-[#325343] text-xs font-bold px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 dark:bg-white dark:text-[#252625]"
        >
          + Yeni Form
        </button>
      </div>

      {hata && !modalAcik && (
        <div className="mb-4 p-3 border-l-2 border-[#325343] bg-[#F5F7F5] text-sm text-[#252625]">{hata}</div>
      )}

      {formlar.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] p-10 text-center text-sm text-[#4A4D4A]">
          Henüz form yok. Yeni form oluşturun.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {formlar.map((form, i) => {
              const yanitSayisi = form.onboarding_yanitlar?.[0]?.count ?? 0;
              return (
                <motion.div
                  key={form.id}
                  {...(prefersReduced ? {} : {
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: i * 0.04, duration: 0.15 },
                  })}
                  className="border-[1.5px] border-[#D4E4D8] bg-white dark:bg-[#1a1a1a] dark:border-[#333] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-[#252625] dark:text-white truncate">{form.title}</span>
                        {form.is_default && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.8px] border-[1.5px] border-[#325343] px-1.5 py-0.5 text-[#252625] dark:border-white dark:text-white">
                            Varsayılan
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#4A4D4A] space-x-3">
                        <span>{(form.questions ?? []).length} soru</span>
                        <span>{yanitSayisi} yanıt</span>
                        <span>{formatTarih(form.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => yanitlariGoster(form.id)}
                        className="text-[11px] text-[#252625] underline hover:opacity-70 dark:text-white"
                      >
                        Yanıtlar
                      </button>
                      <button
                        onClick={() => modalAc(form)}
                        className="text-[11px] border-[1.5px] border-[#325343] px-2 py-1 hover:bg-[#F5F7F5] dark:border-white dark:text-white dark:hover:bg-[#333]"
                      >
                        Düzenle
                      </button>
                      {!form.is_default && (
                        silOnayId === form.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => formSil(form.id)}
                              disabled={yukleniyor}
                              className="text-[11px] font-bold bg-[#A6DE9B] text-[#325343] px-2 py-1 hover:opacity-80"
                            >
                              Evet
                            </button>
                            <button
                              onClick={() => setSilOnayId(null)}
                              className="text-[11px] border-[1.5px] border-[#D4E4D8] px-2 py-1 text-[#4A4D4A] hover:bg-[#F5F7F5]"
                            >
                              Hayır
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSilOnayId(form.id)}
                            className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
                          >
                            Sil
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Form Oluştur / Düzenle Modal */}
      <AnimatePresence>
        {modalAcik && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalAcik(false); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-form-modal-title"
              className="bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#325343] dark:border-white w-full max-w-xl p-6"
              {...(prefersReduced ? {} : { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.18 } })}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="onboarding-form-modal-title" className="text-sm font-bold text-[#252625] dark:text-white">
                  {duzenlemeId ? "Formu Düzenle" : "Yeni Form"}
                </h2>
                <button onClick={() => setModalAcik(false)} aria-label="Modalı kapat" className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none">×</button>
              </div>

              {hata && <div className="mb-3 p-2 bg-[#F5F7F5] border-l-2 border-[#325343] text-xs text-[#252625]">{hata}</div>}

              <div className="mb-4">
                <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Form Başlığı *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Örn: İlk Seans Öncesi Bilgi Formu"
                  className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
                />
              </div>

              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formDefault}
                  onChange={(e) => setFormDefault(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs text-[#252625] dark:text-white cursor-pointer">
                  Varsayılan form olarak ayarla
                </label>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">Sorular</span>
                  <button
                    onClick={soruEkle}
                    disabled={sorular.length >= 30}
                    className="text-[11px] border-[1.5px] border-[#325343] px-2 py-0.5 hover:bg-[#F5F7F5] disabled:border-dashed disabled:border-[#BDBDBD] disabled:text-[#4A4D4A] dark:border-white dark:text-white dark:hover:bg-[#333]"
                  >
                    + Soru Ekle
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {sorular.map((soru, i) => (
                    <div key={soru.id} className="border-[1.5px] border-[#D4E4D8] p-3 dark:border-[#333]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#4A4D4A] w-4 shrink-0">{i + 1}.</span>
                        <input
                          type="text"
                          value={soru.label}
                          onChange={(e) => soruGuncelle(soru.id, "label", e.target.value)}
                          placeholder="Soru metni"
                          className="flex-1 border-[1.5px] border-[#D4E4D8] px-2 py-1 text-xs bg-white dark:bg-[#111] dark:text-white dark:border-[#333]"
                        />
                        <select
                          value={soru.type}
                          onChange={(e) => soruGuncelle(soru.id, "type", e.target.value as SoruTipi)}
                          className="border-[1.5px] border-[#D4E4D8] px-1 py-1 text-xs bg-white dark:bg-[#111] dark:text-white dark:border-[#333]"
                        >
                          {SORU_TIPLERI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {sorular.length > 1 && (
                          <button onClick={() => soruSil(soru.id)} aria-label="Soruyu sil" className="text-[#4A4D4A] hover:text-[#252625] text-base leading-none dark:hover:text-white">×</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={soru.required}
                          onChange={(e) => soruGuncelle(soru.id, "required", e.target.checked)}
                          id={`req-${soru.id}`}
                        />
                        <label htmlFor={`req-${soru.id}`} className="text-[10px] text-[#4A4D4A] cursor-pointer">Zorunlu</label>
                      </div>
                      {(soru.type === "select" || soru.type === "radio" || soru.type === "checkbox") && (
                        <div className="mt-2 space-y-1">
                          {(soru.options ?? []).map((opt, oi) => (
                            <div key={oi} className="flex gap-1">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => secilenekGuncelle(soru.id, oi, e.target.value)}
                                placeholder={`Seçenek ${oi + 1}`}
                                className="flex-1 border-[1.5px] border-[#D4E4D8] px-2 py-0.5 text-xs bg-white dark:bg-[#111] dark:text-white dark:border-[#333]"
                              />
                              <button onClick={() => secilenekSil(soru.id, oi)} aria-label="Seçeneği sil" className="text-[#4A4D4A] text-xs hover:text-[#252625] dark:hover:text-white">×</button>
                            </div>
                          ))}
                          <button
                            onClick={() => secilenekEkle(soru.id)}
                            className="text-[10px] text-[#252625] underline dark:text-white"
                          >
                            + Seçenek ekle
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={kaydet}
                  disabled={yukleniyor}
                  className="flex-1 bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
                >
                  {yukleniyor ? "Kaydediliyor..." : duzenlemeId ? "Güncelle" : "Oluştur"}
                </button>
                <button
                  onClick={() => setModalAcik(false)}
                  className="px-4 border-[1.5px] border-[#325343] text-sm text-[#252625] hover:bg-[#F5F7F5] dark:border-white dark:text-white dark:hover:bg-[#333]"
                >
                  İptal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yanıtlar Modal */}
      <AnimatePresence>
        {yanitModalAcik && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setYanitModalAcik(false); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="yanit-modal-title"
              className="bg-white dark:bg-[#1a1a1a] border-[1.5px] border-[#325343] dark:border-white w-full max-w-xl p-6"
              {...(prefersReduced ? {} : { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.18 } })}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="yanit-modal-title" className="text-sm font-bold text-[#252625] dark:text-white">
                  {seciliForm?.title} — Yanıtlar
                </h2>
                <button onClick={() => setYanitModalAcik(false)} aria-label="Modalı kapat" className="text-[#4A4D4A] hover:text-[#252625] text-xl leading-none">×</button>
              </div>

              {yukleniyor ? (
                <div className="py-6 text-center text-sm text-[#4A4D4A]">Yükleniyor...</div>
              ) : yanitlar.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#4A4D4A]">Henüz yanıt yok.</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {yanitlar.map((yanit) => {
                    const isim = yanit.profiles
                      ? `${yanit.profiles.first_name} ${yanit.profiles.last_name}`
                      : "Bilinmiyor";
                    const cevaplar = (yanit.answers as Record<string, unknown>) ?? {};
                    return (
                      <div key={yanit.id} className="border-[1.5px] border-[#D4E4D8] p-3 dark:border-[#333]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-[#252625] dark:text-white">{isim}</span>
                          <span className="text-[10px] text-[#4A4D4A]">{formatTarih(yanit.created_at)}</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(cevaplar).map(([soruId, cevap]) => {
                            const soru = seciliForm?.questions?.find((s) => s.id === soruId);
                            return (
                              <div key={soruId} className="text-[11px]">
                                <span className="text-[#4A4D4A]">{soru?.label ?? soruId}: </span>
                                <span className="text-[#252625] dark:text-white">
                                  {Array.isArray(cevap) ? cevap.join(", ") : String(cevap ?? "—")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
