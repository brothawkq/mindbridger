"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

type NotifChannel = "email" | "sms" | "uygulama_ici";

interface Profil {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  dark_mode: boolean;
  language: string | null;
  notification_channel: NotifChannel | null;
}

interface BildirimTercih {
  randevu_email: boolean;
  randevu_sms: boolean;
  randevu_uygulama: boolean;
  odeme_email: boolean;
  blog_email: boolean;
  marketing_email: boolean;
}

interface Props {
  userId: string;
  profil: Profil;
  tercihler: BildirimTercih | null;
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
  { key: "randevu_email", label: "Randevu bildirimleri (e-posta)" },
  { key: "randevu_sms", label: "Randevu bildirimleri (SMS)" },
  { key: "randevu_uygulama", label: "Randevu bildirimleri (uygulama içi)" },
  { key: "odeme_email", label: "Ödeme bildirimleri (e-posta)" },
  { key: "blog_email", label: "Blog durum bildirimleri (e-posta)" },
  { key: "marketing_email", label: "Duyurular ve kampanyalar (e-posta)" },
];

export default function AyarlarKlient({ userId, profil: baslangicProfil, tercihler: baslangicTercihler }: Props) {
  const router = useRouter();

  const [profil, setProfil] = useState({
    ...baslangicProfil,
    first_name: baslangicProfil.first_name ?? "",
    last_name: baslangicProfil.last_name ?? "",
  });
  const [tercihler, setTercihler] = useState<BildirimTercih>(baslangicTercihler ?? VARSAYILAN_TERCIH);
  const [sifreForm, setSifreForm] = useState({ mevcutSifre: "", yeniSifre: "", onay: "" });

  const [profilYukleniyor, setProfilYukleniyor] = useState(false);
  const [bildirimYukleniyor, setBildirimYukleniyor] = useState(false);
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false);

  const [profilMesaj, setProfilMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [bildirimMesaj, setBildirimMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);
  const [sifreMesaj, setSifreMesaj] = useState<{ tip: "ok" | "hata"; metin: string } | null>(null);

  async function profilKaydet() {
    setProfilYukleniyor(true);
    setProfilMesaj(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "GET",
      });
      const updateRes = await fetch("/api/danismanlar/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: profil.first_name,
          last_name: profil.last_name,
          phone: profil.phone,
          dark_mode: profil.dark_mode,
        }),
      });
      if (!updateRes.ok) throw new Error("Güncellenemedi");
      setProfilMesaj({ tip: "ok", metin: "Bilgiler güncellendi." });
      router.refresh();
    } catch {
      setProfilMesaj({ tip: "hata", metin: "Güncelleme başarısız." });
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
      if (!res.ok) throw new Error("Kaydedilemedi");
      setBildirimMesaj({ tip: "ok", metin: "Tercihler kaydedildi." });
    } catch {
      setBildirimMesaj({ tip: "hata", metin: "Kayıt başarısız." });
    } finally {
      setBildirimYukleniyor(false);
    }
  }

  async function sifreGuncelle() {
    if (!sifreForm.mevcutSifre) { setSifreMesaj({ tip: "hata", metin: "Mevcut şifre zorunlu." }); return; }
    if (sifreForm.yeniSifre.length < 8) { setSifreMesaj({ tip: "hata", metin: "Yeni şifre en az 8 karakter." }); return; }
    if (sifreForm.yeniSifre !== sifreForm.onay) { setSifreMesaj({ tip: "hata", metin: "Şifreler eşleşmiyor." }); return; }
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
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Güncellenemedi");
      }
      setSifreMesaj({ tip: "ok", metin: "Şifre güncellendi." });
      setSifreForm({ mevcutSifre: "", yeniSifre: "", onay: "" });
    } catch (err) {
      setSifreMesaj({ tip: "hata", metin: err instanceof Error ? err.message : "Güncelleme başarısız." });
    } finally {
      setSifreYukleniyor(false);
    }
  }

  function Mesaj({ mesaj }: { mesaj: { tip: "ok" | "hata"; metin: string } | null }) {
    const shouldReduce = useReducedMotion();
    if (!mesaj) return null;
    return (
      <motion.div
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-2 p-2 text-xs border-l-2 ${
          mesaj.tip === "ok"
            ? "border-[#325343] bg-[#F5F7F5] text-[#252625]"
            : "border-red-500 bg-red-50 text-red-700"
        }`}
      >
        {mesaj.metin}
      </motion.div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#4A4D4A] mb-1">Hesap</div>
        <h1 className="text-base font-bold text-[#252625] dark:text-white">Ayarlar</h1>
      </div>

      {/* Kişisel Bilgiler */}
      <section className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Kişisel Bilgiler</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Ad</label>
              <input
                type="text"
                value={profil.first_name}
                onChange={(e) => setProfil({ ...profil, first_name: e.target.value })}
                className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Soyad</label>
              <input
                type="text"
                value={profil.last_name}
                onChange={(e) => setProfil({ ...profil, last_name: e.target.value })}
                className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">Telefon</label>
            <input
              type="tel"
              value={profil.phone ?? ""}
              onChange={(e) => setProfil({ ...profil, phone: e.target.value })}
              placeholder="+90 5xx xxx xx xx"
              className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="darkMode"
              checked={profil.dark_mode}
              onChange={(e) => setProfil({ ...profil, dark_mode: e.target.checked })}
            />
            <label htmlFor="darkMode" className="text-sm text-[#252625] dark:text-white cursor-pointer">Karanlık mod</label>
          </div>
        </div>
        <button
          onClick={profilKaydet}
          disabled={profilYukleniyor}
          className="mt-4 w-full bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
        >
          {profilYukleniyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Mesaj mesaj={profilMesaj} />
      </section>

      {/* Bildirim Tercihleri */}
      <section className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Bildirim Tercihleri</div>
        <div className="space-y-3">
          {TERCIH_ETIKETLER.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[#252625] dark:text-white">{label}</span>
              <button
                onClick={() => setTercihler((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-10 h-5 transition-colors ${tercihler[key] ? "bg-[#325343] dark:bg-white" : "bg-[#D4E4D8]"}`}
                role="switch"
                aria-checked={tercihler[key]}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-[#325343] transition-transform ${
                    tercihler[key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={bildirimKaydet}
          disabled={bildirimYukleniyor}
          className="mt-4 w-full bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
        >
          {bildirimYukleniyor ? "Kaydediliyor..." : "Tercihleri Kaydet"}
        </button>
        <Mesaj mesaj={bildirimMesaj} />
      </section>

      {/* Şifre Değiştir */}
      <section className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-4">Şifre Değiştir</div>
        <div className="space-y-3">
          {[
            { label: "Mevcut Şifre", key: "mevcutSifre" as const },
            { label: "Yeni Şifre", key: "yeniSifre" as const },
            { label: "Yeni Şifre (Tekrar)", key: "onay" as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">{label}</label>
              <input
                type="password"
                value={sifreForm[key]}
                onChange={(e) => setSifreForm({ ...sifreForm, [key]: e.target.value })}
                className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-sm bg-white dark:bg-[#111] dark:text-white dark:border-white"
              />
            </div>
          ))}
        </div>
        <button
          onClick={sifreGuncelle}
          disabled={sifreYukleniyor}
          className="mt-4 w-full bg-[#A6DE9B] text-[#325343] text-sm font-bold py-[11px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-60 dark:bg-white dark:text-[#252625]"
        >
          {sifreYukleniyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
        <Mesaj mesaj={sifreMesaj} />
      </section>
    </div>
  );
}
