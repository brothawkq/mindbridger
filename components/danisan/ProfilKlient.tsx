"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type GenderType = "erkek" | "kadin" | "belirtmek_istemiyorum";

interface DanisanProfil {
  id: string;
  slug: string;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  approach: string[] | null;
  age_groups: string[] | null;
  languages: string[] | null;
  city: string | null;
  district: string | null;
  gender: GenderType | null;
  is_online: boolean;
  is_in_person: boolean;
  is_supervisor: boolean;
  price_individual: number | null;
  price_group: number | null;
  price_async: number | null;
  session_duration: number | null;
  buffer_minutes: number;
  intro_session_enabled: boolean;
  intro_session_duration: number;
  sliding_scale: boolean;
  sliding_scale_price: number | null;
  profile_completion_percent: number;
  profile_published: boolean;
  diploma_url: string | null;
  id_document_url: string | null;
}

interface ProfilRow {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Props {
  danisan: DanisanProfil;
  profil: ProfilRow;
}

// ── Sabit seçenekler ────────────────────────────────────────
const UZMANLIKLAR = [
  "Depresyon", "Kaygı Bozukluğu", "Travma / TSSB", "İlişki Sorunları",
  "Aile Terapisi", "Çocuk ve Ergen", "Yeme Bozukluğu", "Bağımlılık",
  "Yas ve Kayıp", "Kişilik Bozuklukları", "OKB", "Panik Atak",
  "Öfke Yönetimi", "Stres Yönetimi", "Cinsellik", "Kariyer",
  "Sosyal Fobi", "DEHB", "Otizm Spektrum", "Genel İyilik Hali",
];

const YAKLASIMLAR = [
  "Bilişsel Davranışçı Terapi (BDT)", "EMDR", "Psikanalitik",
  "Kabul ve Kararlılık Terapisi (ACT)", "Diyalektik Davranış Terapisi (DBT)",
  "Gestalt", "Varoluşçu Terapi", "Şema Terapi",
  "Bütünleşik / İnteraktif", "Çözüm Odaklı", "Mindfulness Temelli",
  "Pozitif Psikoloji", "Sistemik Terapi", "Narrative Terapi",
];

const YAS_GRUPLARI = [
  { value: "cocuk", label: "Çocuk (0–12)" },
  { value: "ergen", label: "Ergen (13–17)" },
  { value: "yetiskin", label: "Yetişkin (18–64)" },
  { value: "yasli", label: "Yaşlı (65+)" },
];

const DILLER = [
  "Türkçe", "İngilizce", "Almanca", "Fransızca",
  "Arapça", "İspanyolca", "Rusça", "Diğer",
];

const CINSIYETLER: { value: GenderType; label: string }[] = [
  { value: "erkek", label: "Erkek" },
  { value: "kadin", label: "Kadın" },
  { value: "belirtmek_istemiyorum", label: "Belirtmek İstemiyorum" },
];

// ── Tamamlanma adımları ─────────────────────────────────────
const TAMAMLANMA_ADIMLARI = [
  { label: "Ad Soyad", aciklama: "first_name + last_name" },
  { label: "Profil Fotoğrafı", aciklama: "avatar_url" },
  { label: "Unvan", aciklama: "title" },
  { label: "Hakkımda (min 50 karakter)", aciklama: "bio" },
  { label: "Uzmanlık Alanları", aciklama: "specialties" },
  { label: "Çalışma Yöntemleri", aciklama: "approach" },
  { label: "Yaş Grupları", aciklama: "age_groups" },
  { label: "Diller", aciklama: "languages" },
  { label: "Şehir", aciklama: "city" },
  { label: "Bireysel Fiyat", aciklama: "price_individual" },
  { label: "Seans Süresi", aciklama: "session_duration" },
  { label: "Seans Türü", aciklama: "is_online/is_in_person" },
  { label: "Diploma", aciklama: "diploma_url" },
  { label: "Banka Bilgisi", aciklama: "bank_iban" },
];

function cokluSecToggle(mevcut: string[], deger: string): string[] {
  return mevcut.includes(deger)
    ? mevcut.filter((v) => v !== deger)
    : [...mevcut, deger];
}

export default function ProfilKlient({ danisan, profil }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  // ── Form state ──────────────────────────────────────────
  const [ad, setAd] = useState(profil.first_name ?? "");
  const [soyad, setSoyad] = useState(profil.last_name ?? "");
  const [telefon, setTelefon] = useState(profil.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profil.avatar_url ?? "");
  const [cinsiyet, setCinsiyet] = useState<GenderType | "">(danisan.gender ?? "");
  const [sehir, setSehir] = useState(danisan.city ?? "");
  const [ilce, setIlce] = useState(danisan.district ?? "");

  const [unvan, setUnvan] = useState(danisan.title ?? "");
  const [hakkimda, setHakkimda] = useState(danisan.bio ?? "");
  const [uzmanliklar, setUzmanliklar] = useState<string[]>(danisan.specialties ?? []);
  const [yaklasimlar, setYaklasimlar] = useState<string[]>(danisan.approach ?? []);
  const [yasGruplari, setYasGruplari] = useState<string[]>(danisan.age_groups ?? []);
  const [diller, setDiller] = useState<string[]>(danisan.languages ?? []);

  const [isOnline, setIsOnline] = useState(danisan.is_online);
  const [isInPerson, setIsInPerson] = useState(danisan.is_in_person);
  const [isSupervisor, setIsSupervisor] = useState(danisan.is_supervisor);
  const [fiyatBireysel, setFiyatBireysel] = useState(danisan.price_individual ?? 0);
  const [fiyatGrup, setFiyatGrup] = useState(danisan.price_group ?? 0);
  const [fiyatAsenkron, setFiyatAsenkron] = useState(danisan.price_async ?? 0);
  const [seansSuresi, setSeansSuresi] = useState(danisan.session_duration ?? 50);
  const [tamponDakika, setTamponDakika] = useState(danisan.buffer_minutes);
  const [introAktif, setIntroAktif] = useState(danisan.intro_session_enabled);
  const [introSure, setIntroSure] = useState(danisan.intro_session_duration);
  const [slidingScale, setSlidingScale] = useState(danisan.sliding_scale);
  const [slidingFiyat, setSlidingFiyat] = useState(danisan.sliding_scale_price ?? 0);

  const [profilYayinda, setProfilYayinda] = useState(danisan.profile_published);
  const [tamamlanma, setTamamlanma] = useState(danisan.profile_completion_percent);

  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [aktifSekme, setAktifSekme] = useState<"kisisel" | "profesyonel" | "seans" | "belgeler">("kisisel");

  async function kaydet() {
    setKaydediliyor(true);
    setHata(null);
    setBasari(null);

    try {
      const res = await fetch("/api/danismanlar/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: ad.trim() || undefined,
          last_name: soyad.trim() || undefined,
          phone: telefon.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          gender: cinsiyet || null,
          city: sehir.trim() || null,
          district: ilce.trim() || null,
          title: unvan.trim() || null,
          bio: hakkimda.trim() || null,
          specialties: uzmanliklar.length > 0 ? uzmanliklar : null,
          approach: yaklasimlar.length > 0 ? yaklasimlar : null,
          age_groups: yasGruplari.length > 0 ? yasGruplari : null,
          languages: diller.length > 0 ? diller : null,
          is_online: isOnline,
          is_in_person: isInPerson,
          is_supervisor: isSupervisor,
          price_individual: fiyatBireysel > 0 ? fiyatBireysel : null,
          price_group: fiyatGrup > 0 ? fiyatGrup : null,
          price_async: fiyatAsenkron > 0 ? fiyatAsenkron : null,
          session_duration: seansSuresi,
          buffer_minutes: tamponDakika,
          intro_session_enabled: introAktif,
          intro_session_duration: introSure,
          sliding_scale: slidingScale,
          sliding_scale_price: slidingScale && slidingFiyat > 0 ? slidingFiyat : null,
          profile_published: profilYayinda,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        profile_completion_percent?: number;
        profile_published?: boolean;
      };

      if (!res.ok) throw new Error(data.error ?? "Profil güncellenemedi");

      setTamamlanma(data.profile_completion_percent ?? tamamlanma);
      setProfilYayinda(data.profile_published ?? false);
      setBasari("Profil başarıyla güncellendi.");
      router.refresh();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  const SEKMELER = [
    { id: "kisisel" as const, label: "Kişisel Bilgiler" },
    { id: "profesyonel" as const, label: "Profesyonel" },
    { id: "seans" as const, label: "Seans Ayarları" },
    { id: "belgeler" as const, label: "Belgeler" },
  ];

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
      className="p-5 max-w-3xl"
    >
      {/* Başlık */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625] dark:text-white">
            Profilim
          </h1>
          <p className="text-[11px] text-[#4A4D4A]">
            Profil tamamlanma %{tamamlanma} · Yayın durumu:{" "}
            <span className={profilYayinda ? "text-[#252625] dark:text-white font-bold" : "text-[#4A4D4A]"}>
              {profilYayinda ? "Yayında" : "Kapalı"}
            </span>
          </p>
        </div>
        <a
          href={`/danismanlar/${danisan.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10.5px] px-3 py-1 border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white transition-colors"
        >
          Profili Görüntüle ↗
        </a>
      </div>

      {/* Tamamlanma progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A]">
            Profil Tamamlanma
          </span>
          <span className="text-[11px] font-bold text-[#252625] dark:text-white">
            %{tamamlanma}
          </span>
        </div>
        <div className="h-[8px] bg-[#D4E4D8] border-[1.5px] border-[#BDBDBD]">
          <motion.div
            className="h-full bg-[#325343] dark:bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${tamamlanma}%` }}
            transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: "easeInOut" }}
          />
        </div>
        {tamamlanma < 100 && (
          <p className="text-[10px] text-[#4A4D4A] mt-1">
            Profilinizi %100 tamamladığınızda yayına alabilirsiniz.
          </p>
        )}
      </div>

      {/* Yayın toggle — sadece %100'de aktif */}
      {tamamlanma === 100 && (
        <div className="mb-5 flex items-center justify-between p-3 border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a]">
          <div>
            <div className="text-[12px] font-bold text-[#252625] dark:text-white">
              Profili Yayına Al
            </div>
            <div className="text-[10px] text-[#4A4D4A]">
              Yayında iken danışan listesinde görünürsünüz
            </div>
          </div>
          <button
            onClick={() => setProfilYayinda((v) => !v)}
            className={`text-[10px] font-bold px-4 py-2 transition-colors ${
              profilYayinda
                ? "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]"
                : "border-[1.5px] border-[#325343] dark:border-white text-[#252625] dark:text-white"
            }`}
          >
            {profilYayinda ? "Yayında ✓" : "Yayına Al"}
          </button>
        </div>
      )}

      {/* Hata / Başarı */}
      <AnimatePresence>
        {hata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 border-[1.5px] border-[#D4E4D8] text-[12px] text-[#4A4D4A] bg-[#F5F7F5] dark:bg-[#111]"
          >
            ⚠ {hata}
          </motion.div>
        )}
        {basari && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 border-[1.5px] border-[#325343] dark:border-white text-[12px] text-[#252625] dark:text-white"
          >
            ✓ {basari}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sekmeler */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] dark:border-[#333] mb-5 overflow-x-auto">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            onClick={() => setAktifSekme(s.id)}
            className={`text-[11px] px-4 py-2 whitespace-nowrap transition-colors border-b-[2px] -mb-[2px] ${
              aktifSekme === s.id
                ? "border-[#325343] dark:border-white font-bold text-[#252625] dark:text-white"
                : "border-transparent text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── KİŞİSEL BİLGİLER ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {aktifSekme === "kisisel" && (
          <motion.div
            key="kisisel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ad *">
                <input
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  maxLength={100}
                  placeholder="Adınız"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Soyad *">
                <input
                  value={soyad}
                  onChange={(e) => setSoyad(e.target.value)}
                  maxLength={100}
                  placeholder="Soyadınız"
                  className={INPUT_CLS}
                />
              </Field>
            </div>

            <Field label="Telefon">
              <input
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                maxLength={20}
                placeholder="+90 5xx xxx xx xx"
                className={INPUT_CLS}
              />
            </Field>

            <Field label="Profil Fotoğrafı URL">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className={INPUT_CLS}
              />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Önizleme"
                  className="mt-2 w-16 h-16 object-cover border-[1.5px] border-[#D4E4D8] dark:border-[#333]"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </Field>

            <Field label="Cinsiyet">
              <div className="flex gap-0">
                {CINSIYETLER.map((c, i, arr) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCinsiyet(cinsiyet === c.value ? "" : c.value)}
                    className={`text-[11px] px-3 py-2 border-[1.5px] transition-colors ${
                      i < arr.length - 1 ? "border-r-0" : ""
                    } ${
                      cinsiyet === c.value
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white font-bold"
                        : "bg-white dark:bg-[#1a1a1a] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Şehir">
                <input
                  value={sehir}
                  onChange={(e) => setSehir(e.target.value)}
                  maxLength={100}
                  placeholder="İstanbul"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="İlçe">
                <input
                  value={ilce}
                  onChange={(e) => setIlce(e.target.value)}
                  maxLength={100}
                  placeholder="Kadıköy"
                  className={INPUT_CLS}
                />
              </Field>
            </div>
          </motion.div>
        )}

        {/* ── PROFESYONEL ──────────────────────────────────── */}
        {aktifSekme === "profesyonel" && (
          <motion.div
            key="profesyonel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            <Field label="Unvan">
              <input
                value={unvan}
                onChange={(e) => setUnvan(e.target.value)}
                maxLength={200}
                placeholder="Uzman Klinik Psikolog"
                className={INPUT_CLS}
              />
            </Field>

            <Field label={`Hakkımda (${hakkimda.length}/5000)`}>
              <textarea
                value={hakkimda}
                onChange={(e) => setHakkimda(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Kendinizi ve çalışma yaklaşımınızı anlatın (min. 50 karakter)..."
                className={TEXTAREA_CLS}
              />
              {hakkimda.length < 50 && hakkimda.length > 0 && (
                <p className="text-[10px] text-[#4A4D4A] mt-1">
                  En az 50 karakter gerekli ({50 - hakkimda.length} kaldı)
                </p>
              )}
            </Field>

            <Field label={`Uzmanlık Alanları (${uzmanliklar.length}/20)`}>
              <div className="flex flex-wrap gap-2">
                {UZMANLIKLAR.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUzmanliklar(cokluSecToggle(uzmanliklar, u))}
                    className={`text-[10px] font-bold px-3 py-[3px] border transition-colors ${
                      uzmanliklar.includes(u)
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white"
                        : "border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white bg-white dark:bg-[#1a1a1a]"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Çalışma Yöntemleri (${yaklasimlar.length}/20)`}>
              <div className="flex flex-wrap gap-2">
                {YAKLASIMLAR.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYaklasimlar(cokluSecToggle(yaklasimlar, y))}
                    className={`text-[10px] font-bold px-3 py-[3px] border transition-colors ${
                      yaklasimlar.includes(y)
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white"
                        : "border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white bg-white dark:bg-[#1a1a1a]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Çalıştığınız Yaş Grupları">
              <div className="flex flex-wrap gap-2">
                {YAS_GRUPLARI.map((y) => (
                  <button
                    key={y.value}
                    type="button"
                    onClick={() => setYasGruplari(cokluSecToggle(yasGruplari, y.value))}
                    className={`text-[10px] font-bold px-3 py-[3px] border transition-colors ${
                      yasGruplari.includes(y.value)
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white"
                        : "border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white bg-white dark:bg-[#1a1a1a]"
                    }`}
                  >
                    {y.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Konuşulan Diller">
              <div className="flex flex-wrap gap-2">
                {DILLER.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiller(cokluSecToggle(diller, d))}
                    className={`text-[10px] font-bold px-3 py-[3px] border transition-colors ${
                      diller.includes(d)
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white"
                        : "border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white bg-white dark:bg-[#1a1a1a]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </motion.div>
        )}

        {/* ── SEANS AYARLARI ───────────────────────────────── */}
        {aktifSekme === "seans" && (
          <motion.div
            key="seans"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-5"
          >
            {/* Seans türü */}
            <div>
              <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
                Seans Türü *
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="w-4 h-4 accent-[#325343]"
                  />
                  <span className="text-[12px] text-[#252625] dark:text-white">
                    Online (Video)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInPerson}
                    onChange={(e) => setIsInPerson(e.target.checked)}
                    className="w-4 h-4 accent-[#325343]"
                  />
                  <span className="text-[12px] text-[#252625] dark:text-white">
                    Yüz Yüze
                  </span>
                </label>
              </div>
            </div>

            {/* Fiyatlar */}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Bireysel Seans Ücreti (₺) *">
                <input
                  type="number"
                  value={fiyatBireysel}
                  onChange={(e) => setFiyatBireysel(Number(e.target.value))}
                  min={0}
                  max={100000}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Grup Seans Ücreti (₺)">
                <input
                  type="number"
                  value={fiyatGrup}
                  onChange={(e) => setFiyatGrup(Number(e.target.value))}
                  min={0}
                  max={100000}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Asenkron Mesaj Ücreti (₺)">
                <input
                  type="number"
                  value={fiyatAsenkron}
                  onChange={(e) => setFiyatAsenkron(Number(e.target.value))}
                  min={0}
                  max={100000}
                  className={INPUT_CLS}
                />
              </Field>
            </div>

            {/* Seans süresi + tampon */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Seans Süresi (dakika) *">
                <select
                  value={seansSuresi}
                  onChange={(e) => setSeansSuresi(Number(e.target.value))}
                  className={SELECT_CLS}
                >
                  {[30, 45, 50, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>
                      {d} dk
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Seans Arası Tampon (dakika)">
                <select
                  value={tamponDakika}
                  onChange={(e) => setTamponDakika(Number(e.target.value))}
                  className={SELECT_CLS}
                >
                  {[0, 5, 10, 15, 20, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} dk
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Ücretsiz ön görüşme */}
            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                    Ücretsiz Ön Görüşme
                  </div>
                  <div className="text-[10px] text-[#4A4D4A]">
                    Yeni danışanlar için kısa tanışma seansı
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIntroAktif((v) => !v)}
                  className={`text-[10px] font-bold px-3 py-1 transition-colors ${
                    introAktif
                      ? "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]"
                      : "border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A]"
                  }`}
                >
                  {introAktif ? "Aktif" : "Pasif"}
                </button>
              </div>
              {introAktif && (
                <Field label="Süre (dakika)">
                  <select
                    value={introSure}
                    onChange={(e) => setIntroSure(Number(e.target.value))}
                    className={SELECT_CLS}
                  >
                    {[15, 20, 25, 30].map((d) => (
                      <option key={d} value={d}>
                        {d} dk
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            {/* Sliding scale */}
            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                    Kayan Ölçek (Sliding Scale)
                  </div>
                  <div className="text-[10px] text-[#4A4D4A]">
                    Gelir durumuna göre indirimli ücret seçeneği
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSlidingScale((v) => !v)}
                  className={`text-[10px] font-bold px-3 py-1 transition-colors ${
                    slidingScale
                      ? "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]"
                      : "border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A]"
                  }`}
                >
                  {slidingScale ? "Aktif" : "Pasif"}
                </button>
              </div>
              {slidingScale && (
                <Field label="Minimum Ücret (₺)">
                  <input
                    type="number"
                    value={slidingFiyat}
                    onChange={(e) => setSlidingFiyat(Number(e.target.value))}
                    min={0}
                    max={100000}
                    className={INPUT_CLS}
                  />
                </Field>
              )}
            </div>

            {/* Süpervizör */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSupervisor}
                onChange={(e) => setIsSupervisor(e.target.checked)}
                className="w-4 h-4 accent-[#325343]"
              />
              <div>
                <div className="text-[12px] font-bold text-[#252625] dark:text-white">
                  Süpervizör olarak da hizmet veriyorum
                </div>
                <div className="text-[10px] text-[#4A4D4A]">
                  Süpervizyon arayanlar size ulaşabilir
                </div>
              </div>
            </label>
          </motion.div>
        )}

        {/* ── BELGELER ─────────────────────────────────────── */}
        {aktifSekme === "belgeler" && (
          <motion.div
            key="belgeler"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            <div className="text-[11px] text-[#4A4D4A] mb-2">
              Belgeler kayıt sırasında yüklendi. Güncellemek için destek ekibiyle
              iletişime geçin.
            </div>

            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
              <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
                Diploma / Sertifika
              </div>
              {danisan.diploma_url ? (
                <a
                  href={danisan.diploma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#252625] dark:text-white underline"
                >
                  Diploma dosyasını görüntüle ↗
                </a>
              ) : (
                <span className="text-[12px] text-[#4A4D4A]">
                  Diploma yüklenmemiş
                </span>
              )}
            </div>

            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
              <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
                Kimlik Belgesi
              </div>
              {danisan.id_document_url ? (
                <a
                  href={danisan.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#252625] dark:text-white underline"
                >
                  Kimlik dosyasını görüntüle ↗
                </a>
              ) : (
                <span className="text-[12px] text-[#4A4D4A]">
                  Kimlik belgesi yüklenmemiş
                </span>
              )}
            </div>

            {/* Tamamlanma kontrol listesi */}
            <div className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4">
              <div className="text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3">
                Profil Tamamlanma Kontrol Listesi
              </div>
              <div className="flex flex-col gap-[6px]">
                {TAMAMLANMA_ADIMLARI.map((adim) => (
                  <div
                    key={adim.label}
                    className="text-[11px] text-[#4A4D4A] flex items-center gap-2"
                  >
                    <span className="text-[10px]">○</span>
                    {adim.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kaydet butonu */}
      {aktifSekme !== "belgeler" && (
        <div className="mt-6 pt-4 border-t border-[#D4E4D8] dark:border-[#333] flex items-center gap-3">
          <button
            onClick={() => void kaydet()}
            disabled={kaydediliyor}
            className="text-[11px] font-bold px-6 py-2 bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-40"
          >
            {kaydediliyor ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
          <span className="text-[10px] text-[#4A4D4A]">
            Tüm sekmelerdeki değişiklikler tek seferde kaydedilir
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Yardımcı bileşenler ─────────────────────────────────────
const INPUT_CLS =
  "w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] dark:focus:border-white";

const TEXTAREA_CLS =
  "w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] dark:focus:border-white resize-none";

const SELECT_CLS =
  "w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] dark:focus:border-white";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
