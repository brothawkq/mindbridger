"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type BlogStatus = "draft" | "pending" | "published" | "rejected";

interface BlogYazi {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: BlogStatus;
  tags: string[] | null;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
}

interface Props {
  yazilar: BlogYazi[];
}

const DURUM_ETIKETLERI: Record<BlogStatus, string> = {
  draft: "Taslak",
  pending: "İncelemede",
  published: "Yayında",
  rejected: "Reddedildi",
};

const DURUM_STILLER: Record<BlogStatus, string> = {
  draft: "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] bg-[#F5F7F5]",
  pending: "border-[1.5px] border-[#325343] text-[#252625] bg-white dark:bg-transparent",
  published: "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]",
  rejected: "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] bg-[#F5F7F5]",
};

function formatTarih(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;
}

export default function BlogListeKlient({ yazilar }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [filtre, setFiltre] = useState<BlogStatus | "tumu">("tumu");
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);

  const filtreliYazilar =
    filtre === "tumu" ? yazilar : yazilar.filter((y) => y.status === filtre);

  async function yaziSil(id: string) {
    setSiliniyor(id);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSiliniyor(null);
      setSilOnayId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-5"
    >
      {/* Başlık */}
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625] dark:text-white">
            Blog Yazılarım
          </h1>
          <p className="text-[11px] text-[#4A4D4A]">
            {yazilar.length} yazı · Yayınlanan yazılar profilinizde görünür
          </p>
        </div>
        <Link
          href="/danisan/blog/yeni"
          className="text-[11px] font-bold px-4 py-2 bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625] hover:opacity-90 hover:scale-[1.01] transition-all duration-100"
        >
          + Yeni Yazı
        </Link>
      </div>

      {/* Durum filtresi */}
      <div className="flex gap-0 mb-5">
        {(["tumu", "draft", "pending", "published", "rejected"] as const).map(
          (d, i, arr) => (
            <button
              key={d}
              onClick={() => setFiltre(d)}
              className={`text-[11px] px-3 py-[5px] border-[1.5px] transition-colors ${
                i < arr.length - 1 ? "border-r-0" : ""
              } ${
                filtre === d
                  ? "bg-[#A6DE9B] text-[#325343] border-[#325343] font-bold dark:bg-white dark:text-[#252625]"
                  : "bg-white dark:bg-[#1a1a1a] border-[#D4E4D8] dark:border-[#444] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white"
              }`}
            >
              {d === "tumu"
                ? "Tümü"
                : DURUM_ETIKETLERI[d]}
              {d !== "tumu" && (
                <span className="ml-1 text-[9px]">
                  ({yazilar.filter((y) => y.status === d).length})
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Yazı listesi */}
      {filtreliYazilar.length === 0 ? (
        <div className="text-center py-16 text-[#4A4D4A] text-[13px]">
          {filtre === "tumu"
            ? "Henüz blog yazısı yok. İlk yazınızı oluşturun."
            : `Bu durumda yazı bulunamadı.`}
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <AnimatePresence initial={false}>
            {filtreliYazilar.map((yazi, idx) => (
              <motion.div
                key={yazi.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                whileHover={prefersReduced ? {} : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: { duration: 0.15 } }}
                className="border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Başlık + durum */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[9px] font-bold tracking-[0.5px] uppercase px-2 py-[2px] inline-block ${
                          DURUM_STILLER[yazi.status]
                        }`}
                      >
                        {DURUM_ETIKETLERI[yazi.status]}
                      </span>
                      {yazi.status === "published" && (
                        <span className="text-[10px] text-[#4A4D4A]">
                          {yazi.view_count} görüntülenme
                        </span>
                      )}
                    </div>

                    <h2 className="text-[14px] font-bold text-[#252625] dark:text-white mb-1 truncate">
                      {yazi.title}
                    </h2>

                    {yazi.excerpt && (
                      <p className="text-[12px] text-[#4A4D4A] line-clamp-2 mb-2">
                        {yazi.excerpt}
                      </p>
                    )}

                    {/* Red gerekçesi */}
                    {yazi.status === "rejected" && yazi.rejection_reason && (
                      <div className="text-[11px] text-[#4A4D4A] bg-[#F5F7F5] dark:bg-[#111] border-[1.5px] border-[#D4E4D8] dark:border-[#333] px-3 py-2 mb-2">
                        <span className="font-bold text-[#252625] dark:text-white">
                          Red gerekçesi:{" "}
                        </span>
                        {yazi.rejection_reason}
                      </div>
                    )}

                    {/* Etiketler */}
                    {yazi.tags && yazi.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {yazi.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-bold px-2 py-[1px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] bg-[#F5F7F5] dark:bg-[#111]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-[10px] text-[#4A4D4A]">
                      {yazi.status === "published" && yazi.published_at
                        ? `Yayınlandı: ${formatTarih(yazi.published_at)}`
                        : `Güncellendi: ${formatTarih(yazi.updated_at)}`}
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {yazi.status === "published" && (
                      <a
                        href={`/blog/${yazi.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] px-3 py-1 border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#4A4D4A] hover:border-[#325343] hover:text-[#252625] dark:hover:text-white transition-colors"
                      >
                        Görüntüle ↗
                      </a>
                    )}
                    {(yazi.status === "draft" || yazi.status === "rejected") && (
                      <Link
                        href={`/danisan/blog/${yazi.id}/duzenle`}
                        className="text-[10.5px] px-3 py-1 border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white hover:bg-[#325343] hover:text-white dark:hover:bg-white dark:hover:text-[#252625] transition-colors"
                      >
                        Düzenle
                      </Link>
                    )}
                    {yazi.status === "pending" && (
                      <span className="text-[10px] text-[#4A4D4A] italic">
                        İnceleniyor...
                      </span>
                    )}
                    {(yazi.status === "draft" || yazi.status === "rejected") && (
                      silOnayId === yazi.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => void yaziSil(yazi.id)}
                            disabled={siliniyor === yazi.id}
                            className="text-[10px] font-bold px-2 py-1 bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625] hover:opacity-80 transition-opacity disabled:opacity-40"
                          >
                            {siliniyor === yazi.id ? "..." : "Evet, sil"}
                          </button>
                          <button
                            onClick={() => setSilOnayId(null)}
                            className="text-[10px] px-2 py-1 border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A]"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSilOnayId(yazi.id)}
                          className="text-[10px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white transition-colors underline"
                        >
                          Sil
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
