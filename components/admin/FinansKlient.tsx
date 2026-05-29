"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type {
  AdminFinansResponse,
  PayoutSatir,
  IslemSatir,
  IadeSatir,
} from "@/types/admin";

type Tab = "odemeler" | "islemler" | "iadeler";

const TABS: { key: Tab; label: string }[] = [
  { key: "islemler", label: "Tüm İşlemler" },
  { key: "odemeler", label: "Danışman Ödemeleri" },
  { key: "iadeler", label: "İadeler" },
];

const DURUM_PILL: Record<string, string> = {
  pending: "border-[1.5px] border-[#325343] text-[#252625] bg-white",
  processing: "bg-[#D4E4D8] text-white border-[1.5px] border-[#BDBDBD]",
  completed: "bg-[#A6DE9B] text-[#325343] border-[1.5px] border-[#325343]",
  failed: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

const DURUM_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Ödendi",
  failed: "Başarısız",
};

function formatTL(n: number) {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Öde Modal ─────────────────────────────────────────────────────────────────

interface OdeModalProps {
  payout: PayoutSatir;
  onClose: () => void;
  onSuccess: () => void;
}

function OdeModal({ payout, onClose, onSuccess }: OdeModalProps) {
  const shouldReduce = useReducedMotion();
  const [durum, setDurum] = useState<"processing" | "completed">("processing");
  const [bankRef, setBankRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setHata("");
    try {
      const res = await fetch(`/api/admin/finans/payout/${payout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum, bankTransferRef: bankRef || undefined }),
      });
      const data: { hata?: string } = await res.json();
      if (!res.ok) {
        setHata(data.hata ?? "Güncelleme başarısız.");
        return;
      }
      onSuccess();
    } catch {
      setHata("Ağ hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-modal-title"
        className="bg-white border-[1.5px] border-[#325343] p-5 w-[360px] max-w-[calc(100vw-32px)]"
        initial={shouldReduce ? {} : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div id="payout-modal-title" className="text-[13px] font-bold mb-0.5">{payout.danisanAdi}</div>
        <div className="text-[10px] text-[#4A4D4A] uppercase tracking-wide mb-4">
          {payout.danisanUnvan ?? "Danışman"}
        </div>

        <div className="flex justify-between mb-4 text-[12px]">
          <span className="text-[#4A4D4A]">Net tutar:</span>
          <span className="font-bold">{formatTL(payout.net)}</span>
        </div>

        <div className="mb-3">
          <label className="block text-[9px] font-bold uppercase tracking-wide text-[#4A4D4A] mb-1">
            İşlem Durumu
          </label>
          <select
            className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[13px] font-[inherit] bg-white outline-none"
            value={durum}
            onChange={(e) => setDurum(e.target.value as "processing" | "completed")}
          >
            <option value="processing">İşleme Al</option>
            <option value="completed">Ödendi Olarak İşaretle</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-[9px] font-bold uppercase tracking-wide text-[#4A4D4A] mb-1">
            Banka Referans No (isteğe bağlı)
          </label>
          <input
            type="text"
            className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[13px] outline-none"
            placeholder="EFT / havale referans numarası"
            value={bankRef}
            onChange={(e) => setBankRef(e.target.value)}
          />
        </div>

        {hata && <div className="text-[11px] text-red-600 mb-3">{hata}</div>}

        <div className="flex gap-2">
          <button
            className="flex-1 border-none bg-[#A6DE9B] text-[#325343] font-bold text-[12px] py-[9px] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50 cursor-pointer"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "İşleniyor..." : "Güncelle"}
          </button>
          <button
            className="flex-1 border-[1.5px] border-[#325343] bg-white text-[#252625] font-bold text-[12px] py-[9px] cursor-pointer"
            onClick={onClose}
          >
            İptal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Payoutlar Tablosu ──────────────────────────────────────────────────────────

interface PayoutTableProps {
  rows: PayoutSatir[];
  onOde: (p: PayoutSatir) => void;
  shouldReduce: boolean;
}

function PayoutlarTablosu({ rows, onOde, shouldReduce }: PayoutTableProps) {
  const totals = rows.reduce(
    (a, r) => ({ brut: a.brut + r.brut, kom: a.kom + r.komisyon, net: a.net + r.net }),
    { brut: 0, kom: 0, net: 0 }
  );

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
        Bu filtreyle eşleşen ödeme kaydı bulunamadı.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {[
                "Danışman",
                "Banka",
                "Seans",
                "Brüt",
                "Komisyon",
                "Net (Ödenecek)",
                "Durum",
                "Aksiyon",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${
                    i >= 2 ? "text-right" : "text-left"
                  } ${i >= 6 ? "text-center" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            variants={
              shouldReduce
                ? {}
                : { show: { transition: { staggerChildren: 0.04 } } }
            }
            initial="hidden"
            animate="show"
          >
            {rows.map((p) => (
              <motion.tr
                key={p.id}
                variants={
                  shouldReduce
                    ? {}
                    : {
                        hidden: { opacity: 0, y: 6 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
                      }
                }
                className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
              >
                <td className="py-[10px] px-[10px] align-middle">
                  <div className="font-bold text-[12.5px]">{p.danisanAdi}</div>
                  {p.danisanUnvan && (
                    <div className="text-[10px] text-[#4A4D4A] mt-0.5">{p.danisanUnvan}</div>
                  )}
                </td>
                <td className="py-[10px] px-[10px] align-middle">
                  <div className="text-[11.5px]">{p.bankAdi ?? "—"}</div>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-right">
                  <strong>{p.seansAdet}</strong>
                  <div className="text-[10px] text-[#4A4D4A]">seans</div>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-right font-variant-numeric-tabular">
                  <strong>{formatTL(p.brut)}</strong>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-right">
                  <span className="text-[11px] text-[#4A4D4A]">{formatTL(p.komisyon)}</span>
                  <div className="text-[10px] text-[#4A4D4A]">%20</div>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-right">
                  <span className="font-bold">{formatTL(p.net)}</span>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-[9px] py-[3px] ${
                      DURUM_PILL[p.durum] ?? "border-[1.5px] border-[#BDBDBD] text-[#4A4D4A]"
                    }`}
                  >
                    <span
                      className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${
                        p.durum === "pending"
                          ? "bg-white border-[1.5px] border-[#325343]"
                          : "bg-white"
                      }`}
                    />
                    {DURUM_LABEL[p.durum] ?? p.durum}
                  </span>
                </td>
                <td className="py-[10px] px-[10px] align-middle text-center">
                  {p.durum === "completed" ? (
                    <span className="text-[11px] font-bold border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] px-[13px] py-[5px]">
                      Ödendi ✓
                    </span>
                  ) : p.durum === "processing" ? (
                    <span className="text-[11px] font-bold bg-[#D4E4D8] text-white border-[1.5px] border-[#BDBDBD] px-[13px] py-[5px]">
                      İşleniyor...
                    </span>
                  ) : (
                    <button
                      onClick={() => onOde(p)}
                      className="text-[11px] font-bold border-[1.5px] border-[#325343] bg-white text-[#252625] px-[13px] py-[5px] cursor-pointer hover:bg-[#325343] hover:text-white transition-colors duration-100"
                    >
                      Öde
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Totals row */}
      <div className="flex justify-end px-[10px] py-2 bg-[#F5F7F5] border-[1.5px] border-[#D4E4D8] -mt-px">
        <div className="flex gap-10 text-[12px]">
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-0.5">
              Toplam Brüt
            </div>
            <div className="font-bold text-[#252625]">{formatTL(totals.brut)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-0.5">
              Toplam Komisyon
            </div>
            <div className="font-bold text-[#4A4D4A]">{formatTL(totals.kom)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-[#4A4D4A] mb-0.5">
              Toplam Net
            </div>
            <div className="font-bold text-[#252625] text-[14px]">{formatTL(totals.net)}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── İşlemler Tablosu ──────────────────────────────────────────────────────────

function IslemlerTablosu({
  rows,
  shouldReduce,
}: {
  rows: IslemSatir[];
  shouldReduce: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
        Gösterilecek işlem bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Tarih", "Müşteri", "Danışman", "Brüt", "Komisyon", "Net", "Durum"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${
                    i >= 3 && i < 6 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <motion.tbody
          variants={
            shouldReduce ? {} : { show: { transition: { staggerChildren: 0.035 } } }
          }
          initial="hidden"
          animate="show"
        >
          {rows.map((r) => (
            <motion.tr
              key={r.id}
              variants={
                shouldReduce
                  ? {}
                  : {
                      hidden: { opacity: 0, y: 6 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
                    }
              }
              className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
            >
              <td className="py-[10px] px-[10px] text-[#4A4D4A] whitespace-nowrap">{r.tarih}</td>
              <td className="py-[10px] px-[10px] font-semibold">{r.musteriAdi}</td>
              <td className="py-[10px] px-[10px] text-[#4A4D4A]">{r.danisanAdi}</td>
              <td className="py-[10px] px-[10px] text-right font-bold">{formatTL(r.brut)}</td>
              <td className="py-[10px] px-[10px] text-right text-[#4A4D4A]">
                {formatTL(r.komisyon)}
              </td>
              <td className="py-[10px] px-[10px] text-right font-bold">{formatTL(r.net)}</td>
              <td className="py-[10px] px-[10px]">
                <span className="text-[10px] font-bold px-2 py-0.5 border-[1.5px] border-[#D4E4D8] text-[#4A4D4A]">
                  {r.durum}
                </span>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── İadeler Tablosu ───────────────────────────────────────────────────────────

function IadelerTablosu({
  rows,
  shouldReduce,
}: {
  rows: IadeSatir[];
  shouldReduce: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-[#4A4D4A]">
        Gösterilecek iade kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Tarih", "Miktar", "İade %", "Sebep", "Durum"].map((h, i) => (
              <th
                key={h}
                className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${
                  i === 1 || i === 2 ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={
            shouldReduce ? {} : { show: { transition: { staggerChildren: 0.035 } } }
          }
          initial="hidden"
          animate="show"
        >
          {rows.map((r) => (
            <motion.tr
              key={r.id}
              variants={
                shouldReduce
                  ? {}
                  : {
                      hidden: { opacity: 0, y: 6 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
                    }
              }
              className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
            >
              <td className="py-[10px] px-[10px] text-[#4A4D4A] whitespace-nowrap">{r.tarih}</td>
              <td className="py-[10px] px-[10px] text-right font-bold">{formatTL(r.miktar)}</td>
              <td className="py-[10px] px-[10px] text-right text-[#4A4D4A]">%{r.iadePct}</td>
              <td className="py-[10px] px-[10px] max-w-[240px] truncate">{r.sebep}</td>
              <td className="py-[10px] px-[10px]">
                <span className="text-[10px] font-bold px-2 py-0.5 border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]">
                  {r.durum}
                </span>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

export default function FinansKlient() {
  const shouldReduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("odemeler");
  const [sayfa, setSayfa] = useState(1);
  const [durumFilter, setDurumFilter] = useState("");
  const [data, setData] = useState<AdminFinansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [secilenPayout, setSecilenPayout] = useState<PayoutSatir | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ tab, sayfa: String(sayfa) });
    if (durumFilter) params.set("durum", durumFilter);

    fetch(`/api/admin/finans?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: AdminFinansResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {});
  }, [tab, sayfa, durumFilter]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  function changeTab(t: Tab) {
    setTab(t);
    setSayfa(1);
    setDurumFilter("");
  }

  const summary = data?.summary;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-end justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">Finansal Yönetim</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">Son 7 günün ödeme özeti</p>
        </div>
        <div className="flex gap-1.5">
          <a
            href="/api/admin/raporlar/komisyon"
            className="text-[10.5px] font-semibold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625] px-[11px] py-[5px] hover:border-[#325343] transition-colors"
          >
            ↓ Komisyon CSV
          </a>
          <a
            href="/api/admin/raporlar/gelir"
            className="text-[10.5px] font-semibold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625] px-[11px] py-[5px] hover:border-[#325343] transition-colors"
          >
            ↓ Gelir CSV
          </a>
          <a
            href="/api/admin/raporlar/vergi"
            className="text-[10.5px] font-semibold border-[1.5px] border-[#D4E4D8] bg-white text-[#252625] px-[11px] py-[5px] hover:border-[#325343] transition-colors"
          >
            ↓ Vergi CSV
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] bg-white px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`py-[10px] px-4 text-[12px] font-semibold border-b-[2.5px] -mb-[1.5px] whitespace-nowrap transition-colors cursor-pointer ${
              tab === t.key
                ? "text-[#252625] border-[#325343]"
                : "text-[#4A4D4A] border-transparent hover:text-[#252625]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info band */}
      <div className="bg-[#F5F7F5] border-b-[1.5px] border-[#325343] px-5 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="text-[13px] text-[#252625]">
            Bekleyen toplam:{" "}
            <strong className="text-[18px] font-bold">
              {summary ? formatTL(summary.bekleyenTutar) : "—"}
            </strong>
          </div>
          <div className="w-px h-8 bg-[#D4E4D8] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
              Danışman Sayısı
            </span>
            <span className="text-[13px] font-bold text-[#252625]">
              {summary ? `${summary.bekleyenDanisanSayisi} danışman` : "—"}
            </span>
          </div>
          <div className="w-px h-8 bg-[#D4E4D8] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
              Bekleyen
            </span>
            <span className="text-[13px] font-bold text-[#252625]">
              {summary ? formatTL(summary.bekleyenTutar) : "—"}
            </span>
          </div>
          <div className="w-px h-8 bg-[#D4E4D8] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
              İşleniyor
            </span>
            <span className="text-[13px] font-bold text-[#252625]">
              {summary ? formatTL(summary.isleniyorTutar) : "—"}
            </span>
          </div>
          <div className="w-px h-8 bg-[#D4E4D8] hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A]">
              Ödendi
            </span>
            <span className="text-[13px] font-bold text-[#252625]">
              {summary ? formatTL(summary.odendiTutar) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Table area */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
          {[
            {
              label: "Toplam Brüt",
              val: summary?.toplamBrut ?? 0,
              sub: `Bu hafta ${summary?.seansAdet ?? 0} seans`,
            },
            {
              label: "Toplam Komisyon",
              val: summary?.toplamKomisyon ?? 0,
              sub: "%20 platform payı",
            },
            {
              label: "Toplam Net",
              val: summary?.toplamNet ?? 0,
              sub: "Danışmanlara ödenecek",
            },
            {
              label: "Ortalama / Danışman",
              val:
                summary && summary.bekleyenDanisanSayisi > 0
                  ? summary.toplamNet / summary.bekleyenDanisanSayisi
                  : 0,
              sub: `${summary?.bekleyenDanisanSayisi ?? 0} aktif danışman`,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="border-[1.5px] border-[#D4E4D8] p-[9px_11px] bg-white"
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] mb-1">
                {c.label}
              </div>
              <div className="text-[15px] font-bold text-[#252625]">{formatTL(c.val)}</div>
              <div className="text-[10px] text-[#4A4D4A] mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Durum filter (only for odemeler) */}
        {tab === "odemeler" && (
          <div className="flex gap-2 mb-3">
            <select
              className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
              value={durumFilter}
              onChange={(e) => {
                setDurumFilter(e.target.value);
                setSayfa(1);
              }}
            >
              <option value="">Durum: Tümü</option>
              <option value="pending">Bekliyor</option>
              <option value="processing">İşleniyor</option>
              <option value="completed">Ödendi</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>
        )}

        {/* Table content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#4A4D4A]">
            Yükleniyor...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={shouldReduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduce ? {} : { opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "odemeler" && (
                <PayoutlarTablosu
                  rows={data?.payoutlar ?? []}
                  onOde={setSecilenPayout}
                  shouldReduce={!!shouldReduce}
                />
              )}
              {tab === "islemler" && (
                <IslemlerTablosu
                  rows={data?.islemler ?? []}
                  shouldReduce={!!shouldReduce}
                />
              )}
              {tab === "iadeler" && (
                <IadelerTablosu
                  rows={data?.iadeler ?? []}
                  shouldReduce={!!shouldReduce}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {data && data.toplamSayfa > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
            <span className="text-[11px] text-[#4A4D4A]">
              Toplam{" "}
              <strong className="text-[#252625]">{data.toplam}</strong> kayıt · Sayfa{" "}
              {data.sayfa} / {data.toplamSayfa}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                disabled={sayfa <= 1}
                className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, data.toplamSayfa) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setSayfa(p)}
                    className={`w-[26px] h-[26px] border-[1.5px] flex items-center justify-center text-[11.5px] font-bold cursor-pointer ${
                      sayfa === p
                        ? "bg-[#A6DE9B] text-[#325343] border-[#325343]"
                        : "bg-white border-[#D4E4D8] text-[#252625]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setSayfa((p) => Math.min(data.toplamSayfa, p + 1))}
                disabled={sayfa >= data.toplamSayfa}
                className="w-[26px] h-[26px] border-[1.5px] border-[#D4E4D8] flex items-center justify-center text-[11.5px] bg-white disabled:opacity-40 cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Öde modal */}
      <AnimatePresence>
        {secilenPayout && (
          <OdeModal
            payout={secilenPayout}
            onClose={() => setSecilenPayout(null)}
            onSuccess={() => {
              setSecilenPayout(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
