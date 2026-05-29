"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import DanismanDegistirme from "@/components/musteri/DanismanDegistirme";

export interface MusteriProfilVeri {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  dark_mode: boolean;
  notification_channel: "email" | "sms" | "uygulama_ici";
  kvkk_accepted_at: string | null;
  created_at: string;
}

export interface BildirimTercih {
  randevu_email: boolean;
  randevu_sms: boolean;
  randevu_uygulama: boolean;
  odeme_email: boolean;
  blog_email: boolean;
  marketing_email: boolean;
}

const VARSAYILAN_TERCIH: BildirimTercih = {
  randevu_email: true,
  randevu_sms: true,
  randevu_uygulama: true,
  odeme_email: true,
  blog_email: true,
  marketing_email: false,
};

const TERCIH_ETIKETLER: { key: keyof BildirimTercih; label: string }[] = [
  { key: "randevu_email",    label: "Randevu bildirimleri (e-posta)" },
  { key: "randevu_sms",      label: "Randevu bildirimleri (SMS)" },
  { key: "randevu_uygulama", label: "Randevu bildirimleri (uygulama içi)" },
  { key: "odeme_email",      label: "Ödeme bildirimleri (e-posta)" },
  { key: "blog_email",       label: "Blog durum bildirimleri (e-posta)" },
  { key: "marketing_email",  label: "Duyurular ve kampanyalar (e-posta)" },
];

export interface MusteriProfilKlientProps {
  profil: MusteriProfilVeri;
  mevcutDanisanId?: string;
  email: string;
  baslangicTercihler?: BildirimTercih | null;
}

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

type Mesaj = { tip: "basari" | "hata"; metin: string };
type HesapSilAdim = "idle" | "onay" | "otp_bekle" | "yukleniyor";

export default function MusteriProfilKlient({
  profil,
  mevcutDanisanId,
  email,
  baslangicTercihler,
}: MusteriProfilKlientProps) {
  const reduced = useReducedMotion();
  const router = useRouter();

  // Kişisel bilgiler
  const [form, setForm] = useState({
    first_name: profil.first_name ?? "",
    last_name: profil.last_name ?? "",
    phone: profil.phone ?? "",
  });
  const [tercih, setTercih] = useState<"email" | "sms" | "uygulama_ici">(
    profil.notification_channel
  );
  const [darkMode, setDarkMode] = useState(profil.dark_mode);
  const [profilMesaj, setProfilMesaj] = useState<Mesaj | null>(null);
  const [profilYukleniyor, setProfilYukleniyor] = useState(false);

  // Bildirim tercihleri
  const [tercihler, setTercihler] = useState<BildirimTercih>(
    baslangicTercihler ?? VARSAYILAN_TERCIH,
  );
  const [bildirimMesaj, setBildirimMesaj] = useState<Mesaj | null>(null);
  const [bildirimYukleniyor, setBildirimYukleniyor] = useState(false);

  // Şifre değiştirme
  const [sifreForm, setSifreForm] = useState({
    mevcutSifre: "",
    yeniSifre: "",
    tekrar: "",
  });
  const [sifreMesaj, setSifreMesaj] = useState<Mesaj | null>(null);
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false);

  // Hesap silme
  const [silAdim, setSilAdim] = useState<HesapSilAdim>("idle");
  const [otpKod, setOtpKod] = useState("");
  const [silMesaj, setSilMesaj] = useState<string | null>(null);

  async function profilKaydet() {
    setProfilYukleniyor(true);
    setProfilMesaj(null);
    try {
      const res = await fetch("/api/musteri/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
          notification_channel: tercih,
          dark_mode: darkMode,
        }),
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Hata");
      setProfilMesaj({ tip: "basari", metin: "Profil güncellendi." });
    } catch (e) {
      setProfilMesaj({
        tip: "hata",
        metin: e instanceof Error ? e.message : "Profil kaydedilemedi.",
      });
    } finally {
      setProfilYukleniyor(false);
    }
  }

  async function bildirimKaydet() {
    setBildirimYukleniyor(true);
    setBildirimMesaj(null);
    try {
      const res = await fetch("/api/bildirim-tercihleri", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tercihler),
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Hata");
      setBildirimMesaj({ tip: "basari", metin: "Bildirim tercihleri kaydedildi." });
    } catch (e) {
      setBildirimMesaj({
        tip: "hata",
        metin: e instanceof Error ? e.message : "Tercihler kaydedilemedi.",
      });
    } finally {
      setBildirimYukleniyor(false);
    }
  }

  async function sifreDegistir() {
    if (!sifreForm.mevcutSifre) {
      setSifreMesaj({ tip: "hata", metin: "Mevcut şifre zorunlu." });
      return;
    }
    if (sifreForm.yeniSifre.length < 8) {
      setSifreMesaj({ tip: "hata", metin: "Yeni şifre en az 8 karakter." });
      return;
    }
    if (sifreForm.yeniSifre !== sifreForm.tekrar) {
      setSifreMesaj({ tip: "hata", metin: "Şifreler eşleşmiyor." });
      return;
    }
    setSifreYukleniyor(true);
    setSifreMesaj(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: sifreForm.mevcutSifre,
          newPassword: sifreForm.yeniSifre,
        }),
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Hata");
      setSifreMesaj({ tip: "basari", metin: "Şifre başarıyla değiştirildi." });
      setSifreForm({ mevcutSifre: "", yeniSifre: "", tekrar: "" });
    } catch (e) {
      setSifreMesaj({
        tip: "hata",
        metin: e instanceof Error ? e.message : "Şifre değiştirilemedi.",
      });
    } finally {
      setSifreYukleniyor(false);
    }
  }

  async function otpGonder() {
    setSilAdim("yukleniyor");
    setSilMesaj(null);
    try {
      const res = await fetch("/api/musteri/hesap-sil", { method: "POST" });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Hata");
      setSilAdim("otp_bekle");
    } catch (e) {
      setSilMesaj(e instanceof Error ? e.message : "OTP gönderilemedi.");
      setSilAdim("onay");
    }
  }

  async function hesabiSil() {
    if (otpKod.length < 4) {
      setSilMesaj("Doğrulama kodu eksik.");
      return;
    }
    setSilAdim("yukleniyor");
    setSilMesaj(null);
    try {
      const res = await fetch("/api/musteri/hesap-sil", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp_token: otpKod }),
      });
      const json = (await res.json()) as { hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Hata");
      router.push("/giris");
    } catch (e) {
      setSilMesaj(
        e instanceof Error ? e.message : "Hesap silinemedi."
      );
      setSilAdim("otp_bekle");
    }
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-6 max-w-2xl">

      {/* ── Kişisel Bilgiler ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-4">
          Kişisel Bilgiler
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-1">
              Ad
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[13px] px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-1">
              Soyad
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[13px] px-3 py-2 focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-1">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full border-[1.5px] border-dashed border-[#BDBDBD] bg-[#F5F7F5] dark:bg-[#1a1a1a] text-[#4A4D4A] text-[13px] px-3 py-2 cursor-not-allowed"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-1">
            Telefon
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+90 5XX XXX XX XX"
            className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[13px] px-3 py-2 focus:outline-none placeholder:text-[#4A4D4A]"
          />
        </div>

        {/* Bildirim tercihi */}
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-2">
            Bildirim Kanalı
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["email", "sms", "uygulama_ici"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTercih(k)}
                className={`text-[11px] font-bold px-3 py-1.5 border-[1.5px] transition-colors ${
                  tercih === k
                    ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white text-white dark:text-[#252625]"
                    : "border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] hover:border-[#325343] dark:hover:border-white"
                }`}
              >
                {k === "email" ? "E-posta" : k === "sms" ? "SMS" : "Uygulama İçi"}
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#D4E4D8] dark:border-[#333]">
          <span className="text-[12px] font-semibold text-[#252625] dark:text-white">
            Karanlık Mod
          </span>
          <button
            onClick={() => setDarkMode((v) => !v)}
            className={`relative w-10 h-5 border-[1.5px] transition-colors ${
              darkMode
                ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white"
                : "border-[#BDBDBD] bg-white dark:bg-transparent"
            }`}
            aria-label="Karanlık mod toggle"
          >
            <motion.span
              className={`absolute top-0.5 w-3 h-3 ${
                darkMode ? "bg-white dark:bg-[#325343]" : "bg-[#BDBDBD]"
              }`}
              animate={{ left: darkMode ? "calc(100% - 14px)" : "2px" }}
              transition={{ duration: 0.18 }}
            />
          </button>
        </div>

        {profilMesaj && (
          <div
            className={`text-[11px] mb-3 ${
              profilMesaj.tip === "basari" ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"
            }`}
          >
            {profilMesaj.tip === "hata" ? "⚠ " : "✓ "}
            {profilMesaj.metin}
          </div>
        )}
        <button
          onClick={profilKaydet}
          disabled={profilYukleniyor}
          className="bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold px-5 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
        >
          {profilYukleniyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </motion.div>

      {/* ── Şifre Değiştirme ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.06 }}
        className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-4">
          Şifre Değiştir
        </div>
        <div className="flex flex-col gap-3 mb-3">
          {[
            { key: "mevcutSifre", label: "Mevcut Şifre" },
            { key: "yeniSifre", label: "Yeni Şifre" },
            { key: "tekrar", label: "Yeni Şifre (Tekrar)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-1">
                {label}
              </label>
              <input
                type="password"
                value={sifreForm[key as keyof typeof sifreForm]}
                onChange={(e) =>
                  setSifreForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[13px] px-3 py-2 focus:outline-none"
              />
            </div>
          ))}
        </div>
        {sifreMesaj && (
          <div
            className={`text-[11px] mb-3 ${
              sifreMesaj.tip === "basari" ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"
            }`}
          >
            {sifreMesaj.tip === "hata" ? "⚠ " : "✓ "}
            {sifreMesaj.metin}
          </div>
        )}
        <button
          onClick={sifreDegistir}
          disabled={sifreYukleniyor}
          className="bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold px-5 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
        >
          {sifreYukleniyor ? "Değiştiriliyor..." : "Şifreyi Güncelle"}
        </button>
      </motion.div>

      {/* ── KVKK Bilgisi ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.10 }}
        className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3">
          KVKK ve Gizlilik
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <span className="text-[#4A4D4A]">Üyelik tarihi:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {formatTarih(profil.created_at)}
            </span>
          </div>
          <div>
            <span className="text-[#4A4D4A]">KVKK onay tarihi:</span>{" "}
            <span className="text-[#252625] dark:text-white font-semibold">
              {profil.kvkk_accepted_at
                ? formatTarih(profil.kvkk_accepted_at)
                : "—"}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#4A4D4A] mt-3 leading-relaxed">
          Kişisel verileriniz KVKK kapsamında korunmaktadır. Verileriniz yalnızca
          Türkiye sınırlarındaki sunucularda saklanır. Seans notları ve psikolojik
          test sonuçlarınıza yalnızca siz ve danışmanınız erişebilir.
        </p>
      </motion.div>

      {/* ── Bildirim Tercihleri ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.14 }}
        className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] p-4"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-4">
          Bildirim Tercihleri
        </div>
        <div className="flex flex-col gap-3 mb-4">
          {TERCIH_ETIKETLER.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[12px] text-[#252625] dark:text-white">{label}</span>
              <button
                onClick={() => setTercihler((prev) => ({ ...prev, [key]: !prev[key] }))}
                role="switch"
                aria-checked={tercihler[key]}
                className={`relative w-10 h-5 border-[1.5px] transition-colors ${
                  tercihler[key]
                    ? "border-[#325343] dark:border-white bg-[#325343] dark:bg-white"
                    : "border-[#BDBDBD] bg-white dark:bg-transparent"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 transition-transform ${
                    tercihler[key]
                      ? "translate-x-[18px] bg-white dark:bg-[#325343]"
                      : "translate-x-0.5 bg-[#BDBDBD]"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        {bildirimMesaj && (
          <div
            className={`text-[11px] mb-3 ${
              bildirimMesaj.tip === "basari" ? "text-[#252625] dark:text-white" : "text-[#4A4D4A]"
            }`}
          >
            {bildirimMesaj.tip === "hata" ? "⚠ " : "✓ "}
            {bildirimMesaj.metin}
          </div>
        )}
        <button
          onClick={bildirimKaydet}
          disabled={bildirimYukleniyor}
          className="bg-[#325343] dark:bg-white text-white dark:text-[#252625] text-[12px] font-bold px-5 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
        >
          {bildirimYukleniyor ? "Kaydediliyor..." : "Tercihleri Kaydet"}
        </button>
      </motion.div>

      {/* ── Danışman Değiştirme ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.18 }}
      >
        <DanismanDegistirme mevcutDanisanId={mevcutDanisanId} />
      </motion.div>

      {/* ── Hesap Silme ── */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.22 }}
        className="border-[1.5px] border-dashed border-[#BDBDBD] p-4"
      >
        <div className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-3">
          Hesap Silme
        </div>

        <AnimatePresence mode="wait">
          {silAdim === "idle" && (
            <motion.div
              key="idle"
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <p className="text-[12px] text-[#4A4D4A] mb-3">
                Hesabınızı silmek, tüm randevu ve ödeme geçmişinizin 30 gün
                içinde anonimleştirilmesine neden olur. Bu işlem geri alınamaz.
              </p>
              <button
                onClick={() => setSilAdim("onay")}
                className="text-[12px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A] px-4 py-2 hover:border-[#325343] hover:text-[#252625] dark:hover:border-white dark:hover:text-white transition-colors"
              >
                Hesabımı Sil
              </button>
            </motion.div>
          )}

          {silAdim === "onay" && (
            <motion.div
              key="onay"
              initial={reduced ? {} : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[12px] text-[#252625] dark:text-white font-semibold">
                Emin misiniz? Bu işlem geri alınamaz.
              </p>
              {silMesaj && (
                <span className="text-[11px] text-[#4A4D4A]">⚠ {silMesaj}</span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={otpGonder}
                  className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
                >
                  Devam Et — Kod Gönder
                </button>
                <button
                  onClick={() => { setSilAdim("idle"); setSilMesaj(null); }}
                  className="text-[12px] text-[#4A4D4A] underline"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          )}

          {(silAdim === "otp_bekle" || silAdim === "yukleniyor") && (
            <motion.div
              key="otp"
              initial={reduced ? {} : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[12px] text-[#4A4D4A]">
                <strong className="text-[#252625] dark:text-white">{email}</strong>{" "}
                adresine doğrulama kodu gönderildi. Kodu girin:
              </p>
              <input
                type="text"
                value={otpKod}
                onChange={(e) => setOtpKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 haneli kod"
                className="w-40 border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-transparent text-[#252625] dark:text-white text-[16px] font-bold px-3 py-2 text-center tracking-widest focus:outline-none"
              />
              {silMesaj && (
                <span className="text-[11px] text-[#4A4D4A]">⚠ {silMesaj}</span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={hesabiSil}
                  disabled={silAdim === "yukleniyor"}
                  className="text-[12px] font-bold bg-[#325343] dark:bg-white text-white dark:text-[#252625] px-4 py-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50"
                >
                  {silAdim === "yukleniyor" ? "İşleniyor..." : "Hesabı Sil"}
                </button>
                <button
                  onClick={() => { setSilAdim("idle"); setOtpKod(""); setSilMesaj(null); }}
                  className="text-[12px] text-[#4A4D4A] underline"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
