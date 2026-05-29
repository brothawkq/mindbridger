"use client";

import { useState } from "react";

interface Ayar {
  key: string;
  value: string;
  description: string | null;
}

interface Props {
  ayarlar: Ayar[];
}

const KEY_LABELS: Record<string, string> = {
  commission_rate: "Komisyon Oranı (%)",
  cancel_full_refund_hours: "Tam İade Saati (saat)",
  cancel_partial_refund_hours: "Kısmi İade Saati (saat)",
  cancel_partial_refund_percent: "Kısmi İade Oranı (%)",
  payout_day: "Ödeme Günü",
  intro_session_duration: "Tanışma Seans Süresi (dk)",
  session_timeout_minutes: "Oturum Zaman Aşımı (dk)",
  account_lock_minutes: "Hesap Kilit Süresi (dk)",
  account_lock_attempts: "Hesap Kilit Deneme Sayısı",
  ip_ban_hours: "IP Ban Süresi (saat)",
  ip_ban_attempts: "IP Ban Deneme Sayısı",
  video_link_active_minutes_before: "Video Link Aktivasyon (dk önce)",
  max_file_upload_mb: "Maksimum Dosya Boyutu (MB)",
  audit_log_retention_days: "Log Saklama Süresi (gün)",
  platform_name: "Platform Adı",
};

export default function AyarlarKlient({ ayarlar }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(ayarlar.map((a) => [a.key, a.value]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [basarili, setBasarili] = useState<string | null>(null);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});

  async function handleKaydet(key: string) {
    setLoading(key);
    setBasarili(null);
    setHatalar((h) => ({ ...h, [key]: "" }));

    try {
      const res = await fetch("/api/admin/ayarlar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: values[key] }),
      });
      const data: { hata?: string } = await res.json();
      if (!res.ok) {
        setHatalar((h) => ({ ...h, [key]: data.hata ?? "Güncelleme başarısız." }));
      } else {
        setBasarili(key);
        setTimeout(() => setBasarili(null), 2000);
      }
    } catch {
      setHatalar((h) => ({ ...h, [key]: "Ağ hatası oluştu." }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8]">
        <h1 className="text-[16px] font-bold text-[#252625]">Platform Ayarları</h1>
        <p className="text-[11px] text-[#4A4D4A] mt-0.5">Sistem genelinde geçerli ayarları düzenleyin</p>
      </div>

      <div className="p-5">
        <div className="border-t-[1.5px] border-[#325343]">
          {ayarlar.map((a) => {
            const isDirty = values[a.key] !== a.value;
            return (
              <div
                key={a.key}
                className="flex items-start gap-4 py-4 border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343]"
              >
                {/* Label + description */}
                <div className="w-64 flex-shrink-0">
                  <div className="text-[12px] font-bold text-[#252625]">
                    {KEY_LABELS[a.key] ?? a.key}
                  </div>
                  <div className="text-[10px] text-[#4A4D4A] font-mono mt-0.5">{a.key}</div>
                  {a.description && (
                    <div className="text-[10px] text-[#4A4D4A] mt-1">{a.description}</div>
                  )}
                </div>

                {/* Input + save */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <input
                    type="text"
                    value={values[a.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [a.key]: e.target.value }))
                    }
                    className="border-[1.5px] border-[#325343] px-3 py-[7px] text-[13px] outline-none w-48 bg-white"
                  />
                  {hatalar[a.key] && (
                    <span className="text-[11px] text-red-600">{hatalar[a.key]}</span>
                  )}
                  {basarili === a.key && (
                    <span className="text-[11px] text-[#252625] font-bold">✓ Kaydedildi</span>
                  )}
                  {isDirty && basarili !== a.key && !hatalar[a.key] && (
                    <button
                      onClick={() => handleKaydet(a.key)}
                      disabled={loading === a.key}
                      className="text-[11px] font-bold bg-[#A6DE9B] text-[#325343] px-3 py-[5px] border-none disabled:opacity-50 cursor-pointer"
                    >
                      {loading === a.key ? "..." : "Kaydet"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {ayarlar.length === 0 && (
          <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
            Platform ayarı bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
