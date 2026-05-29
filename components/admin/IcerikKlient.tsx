"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type {
  AdminIcerikResponse,
  BlogSatir,
  TestSatir,
  KaynaklarSatir,
  SssSatir,
  WebinarSatir,
} from "@/types/admin";

type Tab = "blog" | "testler" | "kaynaklar" | "sss" | "webinarlar";

const TABS: { key: Tab; label: string }[] = [
  { key: "blog", label: "Blog Yazıları" },
  { key: "testler", label: "Testler" },
  { key: "kaynaklar", label: "Kaynaklar" },
  { key: "sss", label: "SSS" },
  { key: "webinarlar", label: "Webinarlar" },
];

const BLOG_DURUM_PILL: Record<string, string> = {
  pending: "border-[1.5px] border-[#325343] text-[#252625] bg-white",
  published: "bg-[#A6DE9B] text-[#325343] border-[1.5px] border-[#325343]",
  draft: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  rejected: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
};

const BLOG_DURUM_LABEL: Record<string, string> = {
  pending: "İncelemede",
  published: "Yayında",
  draft: "Taslak",
  rejected: "Reddedildi",
};

const WEB_DURUM_PILL: Record<string, string> = {
  draft: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  published: "bg-[#A6DE9B] text-[#325343] border-[1.5px] border-[#325343]",
  cancelled: "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]",
  completed: "border-[1.5px] border-[#325343] text-[#252625]",
};

const WEB_DURUM_LABEL: Record<string, string> = {
  draft: "Taslak",
  published: "Yayında",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

function formatTL(n: number) {
  return n === 0 ? "Ücretsiz" : `₺${n.toLocaleString("tr-TR")}`;
}

// ── Red Modal ─────────────────────────────────────────────────────────────────

interface RedModalProps {
  post: BlogSatir;
  onClose: () => void;
  onSuccess: () => void;
}

function RedModal({ post, onClose, onSuccess }: RedModalProps) {
  const shouldReduce = useReducedMotion();
  const [gerekce, setGerekce] = useState("");
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  async function handleRed() {
    if (!gerekce.trim()) { setHata("Red gerekçesi zorunludur."); return; }
    setLoading(true);
    setHata("");
    try {
      const res = await fetch(`/api/admin/icerik/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: "rejected", gerekce }),
      });
      const data: { hata?: string } = await res.json();
      if (!res.ok) { setHata(data.hata ?? "Güncelleme başarısız."); return; }
      onSuccess();
    } catch {
      setHata("Ağ hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="icerik-red-modal-title"
        className="bg-white border-[1.5px] border-[#325343] p-5 w-[400px] max-w-[calc(100vw-32px)]"
        initial={shouldReduce ? {} : { scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={shouldReduce ? {} : { scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div id="icerik-red-modal-title" className="text-[13px] font-bold mb-0.5">Blog Yazısını Reddet</div>
        <div className="text-[11px] text-[#4A4D4A] mb-4 truncate">"{post.baslik}"</div>
        <div className="mb-4">
          <label className="block text-[9px] font-bold uppercase tracking-wide text-[#4A4D4A] mb-1">
            Red Gerekçesi
          </label>
          <textarea
            className="w-full border-[1.5px] border-[#325343] px-3 py-2 text-[13px] outline-none resize-none h-24"
            placeholder="Yazara iletilecek red gerekçesini girin..."
            value={gerekce}
            onChange={(e) => setGerekce(e.target.value)}
          />
        </div>
        {hata && <div className="text-[11px] text-red-600 mb-3">{hata}</div>}
        <div className="flex gap-2">
          <button
            className="flex-1 bg-[#A6DE9B] text-[#325343] font-bold text-[12px] py-[9px] border-none hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-50 cursor-pointer"
            onClick={handleRed}
            disabled={loading}
          >
            {loading ? "İşleniyor..." : "Reddet"}
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

// ── Blog Tablosu ──────────────────────────────────────────────────────────────

interface BlogTablosuProps {
  rows: BlogSatir[];
  shouldReduce: boolean;
  onOnayla: (id: string) => Promise<void>;
  onReddet: (post: BlogSatir) => void;
}

function BlogTablosu({ rows, shouldReduce, onOnayla, onReddet }: BlogTablosuProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (rows.length === 0) {
    return <div className="py-10 text-center text-[12px] text-[#4A4D4A]">Bu filtreyle eşleşen blog yazısı bulunamadı.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Başlık", "Yazar", "Durum", "Yayın Tarihi", "Görüntüleme", "Aksiyonlar"].map((h, i) => (
              <th
                key={h}
                className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i >= 3 ? "text-right" : "text-left"} ${i === 5 ? "text-center" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="show"
        >
          {rows.map((r) => (
            <motion.tr
              key={r.id}
              variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }}
              className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors"
            >
              <td className="py-[10px] px-[10px] align-middle max-w-[240px]">
                <div className="font-semibold truncate">{r.baslik}</div>
                <div className="text-[10px] text-[#4A4D4A] font-mono">{r.slug}</div>
              </td>
              <td className="py-[10px] px-[10px] align-middle text-[#4A4D4A]">{r.danisanAdi}</td>
              <td className="py-[10px] px-[10px] align-middle">
                <span className={`text-[10px] font-bold px-[9px] py-[3px] ${BLOG_DURUM_PILL[r.durum] ?? ""}`}>
                  {BLOG_DURUM_LABEL[r.durum] ?? r.durum}
                </span>
              </td>
              <td className="py-[10px] px-[10px] align-middle text-right text-[#4A4D4A] whitespace-nowrap">
                {r.yayinTarihi ?? "—"}
              </td>
              <td className="py-[10px] px-[10px] align-middle text-right">{r.goruntuleme.toLocaleString("tr-TR")}</td>
              <td className="py-[10px] px-[10px] align-middle text-center">
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {r.durum === "pending" && (
                    <>
                      <button
                        className="text-[11px] font-bold bg-[#A6DE9B] text-[#325343] border-none px-3 py-[5px] cursor-pointer disabled:opacity-50"
                        disabled={loading === r.id}
                        onClick={async () => {
                          setLoading(r.id);
                          await onOnayla(r.id);
                          setLoading(null);
                        }}
                      >
                        {loading === r.id ? "..." : "Onayla"}
                      </button>
                      <button
                        className="text-[11px] font-bold border-[1.5px] border-[#325343] bg-white text-[#252625] px-3 py-[5px] cursor-pointer"
                        onClick={() => onReddet(r)}
                      >
                        Reddet
                      </button>
                    </>
                  )}
                  <Link
                    href={`/admin/icerik/blog/${r.id}/duzenle`}
                    className="text-[11px] font-bold border-[1.5px] border-dashed border-[#BDBDBD] bg-white text-[#4A4D4A] px-3 py-[5px] hover:border-[#325343] hover:text-[#252625] transition-colors"
                  >
                    Düzenle
                  </Link>
                </div>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── Testler Tablosu ───────────────────────────────────────────────────────────

function TestlerTablosu({ rows, shouldReduce }: { rows: TestSatir[]; shouldReduce: boolean }) {
  if (rows.length === 0) return <div className="py-10 text-center text-[12px] text-[#4A4D4A]">Test bulunamadı.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Başlık", "Açıklama", "Süre (dk)", "Durum"].map((h, i) => (
              <th key={h} className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i === 2 ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <motion.tbody variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show">
          {rows.map((r) => (
            <motion.tr key={r.id} variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }} className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors">
              <td className="py-[10px] px-[10px] font-semibold">{r.baslik}</td>
              <td className="py-[10px] px-[10px] text-[#4A4D4A] max-w-[240px] truncate">{r.aciklama}</td>
              <td className="py-[10px] px-[10px] text-right">{r.sureme ?? "—"}</td>
              <td className="py-[10px] px-[10px]">
                <span className={`text-[10px] font-bold px-[9px] py-[3px] ${r.aktif ? "bg-[#A6DE9B] text-[#325343]" : "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]"}`}>
                  {r.aktif ? "Aktif" : "Pasif"}
                </span>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── Kaynaklar Tablosu ─────────────────────────────────────────────────────────

const TIP_LABEL: Record<string, string> = { pdf: "PDF", video: "Video", link: "Link" };

function KaynaklarTablosu({ rows, shouldReduce }: { rows: KaynaklarSatir[]; shouldReduce: boolean }) {
  if (rows.length === 0) return <div className="py-10 text-center text-[12px] text-[#4A4D4A]">Kaynak bulunamadı.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Başlık", "Tip", "Kategoriler", "Durum"].map((h) => (
              <th key={h} className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <motion.tbody variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show">
          {rows.map((r) => (
            <motion.tr key={r.id} variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }} className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors">
              <td className="py-[10px] px-[10px] font-semibold">{r.baslik}</td>
              <td className="py-[10px] px-[10px]">
                <span className="text-[10px] font-bold border-[1.5px] border-[#325343] px-[9px] py-[3px]">{TIP_LABEL[r.tip] ?? r.tip}</span>
              </td>
              <td className="py-[10px] px-[10px] text-[#4A4D4A] text-[11px]">{r.kategori.join(", ") || "—"}</td>
              <td className="py-[10px] px-[10px]">
                <span className={`text-[10px] font-bold px-[9px] py-[3px] ${r.aktif ? "bg-[#A6DE9B] text-[#325343]" : "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]"}`}>
                  {r.aktif ? "Aktif" : "Pasif"}
                </span>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── SSS Tablosu ───────────────────────────────────────────────────────────────

function SssTablosu({ rows, shouldReduce }: { rows: SssSatir[]; shouldReduce: boolean }) {
  if (rows.length === 0) return <div className="py-10 text-center text-[12px] text-[#4A4D4A]">SSS kaydı bulunamadı.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["#", "Soru", "Kategori", "Durum"].map((h, i) => (
              <th key={h} className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i === 0 ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <motion.tbody variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show">
          {rows.map((r) => (
            <motion.tr key={r.id} variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }} className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors">
              <td className="py-[10px] px-[10px] text-right text-[#4A4D4A] font-mono">{r.sira}</td>
              <td className="py-[10px] px-[10px] font-semibold max-w-[280px]">
                <div className="truncate">{r.soru}</div>
                <div className="text-[10px] text-[#4A4D4A] font-normal truncate mt-0.5">{r.cevap}</div>
              </td>
              <td className="py-[10px] px-[10px] text-[#4A4D4A]">{r.kategori || "—"}</td>
              <td className="py-[10px] px-[10px]">
                <span className={`text-[10px] font-bold px-[9px] py-[3px] ${r.aktif ? "bg-[#A6DE9B] text-[#325343]" : "border-[1.5px] border-dashed border-[#BDBDBD] text-[#4A4D4A]"}`}>
                  {r.aktif ? "Aktif" : "Pasif"}
                </span>
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

// ── Webinarlar Tablosu ────────────────────────────────────────────────────────

function WebinarlarTablosu({ rows, shouldReduce }: { rows: WebinarSatir[]; shouldReduce: boolean }) {
  if (rows.length === 0) return <div className="py-10 text-center text-[12px] text-[#4A4D4A]">Webinar bulunamadı.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {["Başlık", "Sunucu", "Tarih", "Süre", "Fiyat", "Kayıt", "Durum"].map((h, i) => (
              <th key={h} className={`text-[9px] font-bold uppercase tracking-[0.8px] text-[#4A4D4A] border-t-[1.5px] border-b-[1.5px] border-[#325343] py-[7px] px-[10px] bg-[#F5F7F5] whitespace-nowrap ${i >= 3 ? "text-right" : "text-left"} ${i === 6 ? "text-left" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <motion.tbody variants={shouldReduce ? {} : { show: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show">
          {rows.map((r) => (
            <motion.tr key={r.id} variants={shouldReduce ? {} : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }} className="border-b border-[#D4E4D8] last:border-b-[1.5px] last:border-b-[#325343] hover:bg-[#F5F7F5] transition-colors">
              <td className="py-[10px] px-[10px] font-semibold max-w-[200px] truncate">{r.baslik}</td>
              <td className="py-[10px] px-[10px] text-[#4A4D4A]">{r.sunucu}</td>
              <td className="py-[10px] px-[10px] whitespace-nowrap">{r.tarih}</td>
              <td className="py-[10px] px-[10px] text-right">{r.sure ? `${r.sure} dk` : "—"}</td>
              <td className="py-[10px] px-[10px] text-right font-bold">{formatTL(r.fiyat)}</td>
              <td className="py-[10px] px-[10px] text-right">
                {r.kayitli}<span className="text-[#4A4D4A]">/{r.kapasite}</span>
              </td>
              <td className="py-[10px] px-[10px]">
                <span className={`text-[10px] font-bold px-[9px] py-[3px] ${WEB_DURUM_PILL[r.durum] ?? ""}`}>
                  {WEB_DURUM_LABEL[r.durum] ?? r.durum}
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

export default function IcerikKlient() {
  const shouldReduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("blog");
  const [sayfa, setSayfa] = useState(1);
  const [durumFilter, setDurumFilter] = useState("pending");
  const [data, setData] = useState<AdminIcerikResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [redModal, setRedModal] = useState<BlogSatir | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ tab, sayfa: String(sayfa) });
    if (durumFilter) params.set("durum", durumFilter);

    fetch(`/api/admin/icerik?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: AdminIcerikResponse) => { setData(d); setLoading(false); })
      .catch(() => {});
  }, [tab, sayfa, durumFilter]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  function changeTab(t: Tab) {
    setTab(t);
    setSayfa(1);
    setDurumFilter(t === "blog" ? "pending" : "");
  }

  async function handleOnayla(id: string) {
    await fetch(`/api/admin/icerik/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum: "published" }),
    });
    load();
  }

  const currentRows = data
    ? tab === "blog" ? data.blog
    : tab === "testler" ? data.testler
    : tab === "kaynaklar" ? data.kaynaklar
    : tab === "sss" ? data.sss
    : data.webinarlar
    : [];

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Page title */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">İçerik Yönetimi</h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">Blog, test, kaynak, SSS ve webinarları yönetin</p>
        </div>
        {tab === "blog" && (
          <Link
            href="/admin/icerik/blog/yeni"
            className="flex-shrink-0 bg-[#A6DE9B] text-[#325343] font-bold text-[12px] px-4 py-[9px] border-none hover:opacity-90 transition-opacity"
          >
            + Yeni Yazı
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b-[1.5px] border-[#D4E4D8] bg-white px-5 overflow-x-auto">
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

      {/* Filters */}
      <div className="px-5 py-3 border-b border-[#D4E4D8] flex gap-2 flex-wrap">
        {tab === "blog" && (
          <select
            className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
            value={durumFilter}
            onChange={(e) => { setDurumFilter(e.target.value); setSayfa(1); }}
          >
            <option value="">Durum: Tümü</option>
            <option value="pending">İncelemede</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="rejected">Reddedildi</option>
          </select>
        )}
        {tab === "webinarlar" && (
          <select
            className="border-[1.5px] border-[#D4E4D8] px-2.5 py-[6px] text-[12px] font-[inherit] text-[#252625] bg-white outline-none"
            value={durumFilter}
            onChange={(e) => { setDurumFilter(e.target.value); setSayfa(1); }}
          >
            <option value="">Durum: Tümü</option>
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
            <option value="cancelled">İptal</option>
            <option value="completed">Tamamlandı</option>
          </select>
        )}
        {(tab === "blog" || tab === "webinarlar") && (
          <span className="text-[11px] text-[#4A4D4A] self-center">
            {loading ? "Yükleniyor..." : `${data?.toplam ?? 0} kayıt`}
          </span>
        )}
      </div>

      {/* Table area */}
      <div className="p-5 flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#4A4D4A]">
            Yükleniyor...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab + durumFilter}
              initial={shouldReduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduce ? {} : { opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "blog" && (
                <BlogTablosu
                  rows={data?.blog ?? []}
                  shouldReduce={!!shouldReduce}
                  onOnayla={handleOnayla}
                  onReddet={setRedModal}
                />
              )}
              {tab === "testler" && (
                <TestlerTablosu rows={data?.testler ?? []} shouldReduce={!!shouldReduce} />
              )}
              {tab === "kaynaklar" && (
                <KaynaklarTablosu rows={data?.kaynaklar ?? []} shouldReduce={!!shouldReduce} />
              )}
              {tab === "sss" && (
                <SssTablosu rows={data?.sss ?? []} shouldReduce={!!shouldReduce} />
              )}
              {tab === "webinarlar" && (
                <WebinarlarTablosu rows={data?.webinarlar ?? []} shouldReduce={!!shouldReduce} />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {data && data.toplamSayfa > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#D4E4D8]">
            <span className="text-[11px] text-[#4A4D4A]">
              Toplam <strong className="text-[#252625]">{data.toplam}</strong> kayıt · Sayfa{" "}
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
                      sayfa === p ? "bg-[#A6DE9B] text-[#325343] border-[#325343]" : "bg-white border-[#D4E4D8] text-[#252625]"
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

      {/* Red modal */}
      <AnimatePresence>
        {redModal && (
          <RedModal
            post={redModal}
            onClose={() => setRedModal(null)}
            onSuccess={() => { setRedModal(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
