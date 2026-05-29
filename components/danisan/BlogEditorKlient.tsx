"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type BlogStatus = "draft" | "pending" | "published" | "rejected";

interface BlogYazi {
  id?: string;
  title: string;
  content: string;
  excerpt: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_url: string | null;
  status?: BlogStatus;
  rejection_reason?: string | null;
}

interface Props {
  baslangicVeri?: BlogYazi;
  mod: "yeni" | "duzenle";
}

const DURUM_ETIKETLERI: Record<BlogStatus, string> = {
  draft: "Taslak",
  pending: "İncelemede",
  published: "Yayında",
  rejected: "Reddedildi",
};

export default function BlogEditorKlient({ baslangicVeri, mod }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [baslik, setBaslik] = useState(baslangicVeri?.title ?? "");
  const [ozet, setOzet] = useState(baslangicVeri?.excerpt ?? "");
  const [etiketler, setEtiketler] = useState(
    (baslangicVeri?.tags ?? []).join(", ")
  );
  const [seoBaslik, setSeoBaslik] = useState(baslangicVeri?.seo_title ?? "");
  const [seoAciklama, setSeoAciklama] = useState(
    baslangicVeri?.seo_description ?? ""
  );
  const [kapakUrl, setKapakUrl] = useState(
    baslangicVeri?.cover_image_url ?? ""
  );
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [seoAcik, setSeoAcik] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
    ],
    content: baslangicVeri?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] focus:outline-none text-[13px] text-[#252625] dark:text-white p-4",
      },
    },
  });

  // Otomatik kaydetme (30 sn aralıklarla, sadece mevcut taslak için)
  const otomatikKaydet = useCallback(async () => {
    if (mod !== "duzenle" || !baslangicVeri?.id) return;
    if (!baslik.trim()) return;
    if (
      baslangicVeri.status !== "draft" &&
      baslangicVeri.status !== "rejected"
    )
      return;

    await fetch(`/api/blog/${baslangicVeri.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: baslik,
        content: editor?.getHTML() ?? "",
        excerpt: ozet || null,
        tags: etiketler
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: seoBaslik || null,
        seo_description: seoAciklama || null,
        cover_image_url: kapakUrl || null,
      }),
    });
  }, [mod, baslangicVeri, baslik, editor, ozet, etiketler, seoBaslik, seoAciklama, kapakUrl]);

  useEffect(() => {
    const interval = setInterval(() => void otomatikKaydet(), 30000);
    return () => clearInterval(interval);
  }, [otomatikKaydet]);

  async function kaydet() {
    if (!baslik.trim()) {
      setHata("Başlık zorunludur.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    setBasari(null);

    try {
      const payload = {
        title: baslik,
        content: editor?.getHTML() ?? "",
        excerpt: ozet || null,
        tags: etiketler
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: seoBaslik || null,
        seo_description: seoAciklama || null,
        cover_image_url: kapakUrl || null,
      };

      if (mod === "yeni") {
        const res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Yazı oluşturulamadı");
        setBasari("Taslak oluşturuldu.");
        router.push(`/danisan/blog/${data.id ?? ""}/duzenle`);
      } else {
        const res = await fetch(`/api/blog/${baslangicVeri?.id ?? ""}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Yazı güncellenemedi");
        setBasari("Değişiklikler kaydedildi.");
      }
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function gonder() {
    if (!baslangicVeri?.id) {
      setHata("Önce yazıyı kaydedin.");
      return;
    }
    setGonderiliyor(true);
    setHata(null);
    setBasari(null);

    try {
      // Önce güncel içeriği kaydet
      await fetch(`/api/blog/${baslangicVeri.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: baslik,
          content: editor?.getHTML() ?? "",
          excerpt: ozet || null,
          tags: etiketler.split(",").map((t) => t.trim()).filter(Boolean),
          seo_title: seoBaslik || null,
          seo_description: seoAciklama || null,
          cover_image_url: kapakUrl || null,
        }),
      });

      const res = await fetch(`/api/blog/${baslangicVeri.id}/gonder`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Yazı gönderilemedi");

      setBasari("Yazınız incelemeye gönderildi. Onaylanınca yayınlanacak.");
      router.refresh();
      router.push("/danisan/blog");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  const mevcutDurum = baslangicVeri?.status;
  const duzenlenebilir =
    !mevcutDurum || mevcutDurum === "draft" || mevcutDurum === "rejected";

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
      className="p-5 max-w-4xl"
    >
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => router.back()}
          className="text-[11px] text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white transition-colors"
        >
          ← Geri
        </button>
        <h1 className="text-[16px] font-bold text-[#252625] dark:text-white flex-1">
          {mod === "yeni" ? "Yeni Blog Yazısı" : "Yazıyı Düzenle"}
        </h1>
        {mevcutDurum && (
          <span
            className={`text-[9px] font-bold tracking-[0.5px] uppercase px-2 py-[2px] ${
              mevcutDurum === "published"
                ? "bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625]"
                : mevcutDurum === "pending"
                ? "border-[1.5px] border-[#325343] text-[#252625]"
                : "border-[1.5px] border-[#D4E4D8] text-[#4A4D4A] bg-[#F5F7F5]"
            }`}
          >
            {DURUM_ETIKETLERI[mevcutDurum]}
          </span>
        )}
      </div>

      {/* Red gerekçesi */}
      {mevcutDurum === "rejected" && baslangicVeri?.rejection_reason && (
        <div className="mb-4 p-3 bg-[#F5F7F5] dark:bg-[#111] border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[12px]">
          <span className="font-bold text-[#252625] dark:text-white">
            Red gerekçesi:{" "}
          </span>
          <span className="text-[#4A4D4A]">{baslangicVeri.rejection_reason}</span>
        </div>
      )}

      {/* Hata / Başarı */}
      <AnimatePresence>
        {hata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[12px] text-[#4A4D4A] bg-[#F5F7F5] dark:bg-[#111]"
          >
            ⚠ {hata}
          </motion.div>
        )}
        {basari && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 border-[1.5px] border-[#325343] dark:border-white text-[12px] text-[#252625] dark:text-white bg-white dark:bg-[#1a1a1a]"
          >
            ✓ {basari}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {/* Başlık */}
        <div>
          <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            Başlık *
          </label>
          <input
            type="text"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            disabled={!duzenlenebilir}
            maxLength={200}
            placeholder="Yazı başlığı..."
            className="w-full border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] text-[14px] font-bold text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="text-[9px] text-[#4A4D4A] text-right mt-1">
            {baslik.length}/200
          </div>
        </div>

        {/* Özet */}
        <div>
          <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            Özet (Kısa Açıklama)
          </label>
          <textarea
            value={ozet}
            onChange={(e) => setOzet(e.target.value)}
            disabled={!duzenlenebilir}
            maxLength={500}
            rows={2}
            placeholder="Yazının kısa özeti, liste sayfasında gösterilir..."
            className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] resize-none disabled:opacity-50"
          />
          <div className="text-[9px] text-[#4A4D4A] text-right mt-1">
            {ozet.length}/500
          </div>
        </div>

        {/* Kapak Görseli */}
        <div>
          <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            Kapak Görseli URL
          </label>
          <input
            type="url"
            value={kapakUrl}
            onChange={(e) => setKapakUrl(e.target.value)}
            disabled={!duzenlenebilir}
            placeholder="https://..."
            className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] disabled:opacity-50"
          />
        </div>

        {/* İçerik Editörü */}
        <div>
          <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            İçerik *
          </label>

          {/* Araç çubuğu */}
          {duzenlenebilir && editor && (
            <div className="flex flex-wrap gap-1 mb-2 border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-[#F5F7F5] dark:bg-[#111] p-2">
              {[
                {
                  label: "B",
                  title: "Kalın",
                  action: () => editor.chain().focus().toggleBold().run(),
                  active: editor.isActive("bold"),
                },
                {
                  label: "İ",
                  title: "İtalik",
                  action: () => editor.chain().focus().toggleItalic().run(),
                  active: editor.isActive("italic"),
                },
                {
                  label: "S",
                  title: "Üstü Çizili",
                  action: () => editor.chain().focus().toggleStrike().run(),
                  active: editor.isActive("strike"),
                },
                {
                  label: "H1",
                  title: "Başlık 1",
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  active: editor.isActive("heading", { level: 1 }),
                },
                {
                  label: "H2",
                  title: "Başlık 2",
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  active: editor.isActive("heading", { level: 2 }),
                },
                {
                  label: "H3",
                  title: "Başlık 3",
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  active: editor.isActive("heading", { level: 3 }),
                },
                {
                  label: "•",
                  title: "Madde Listesi",
                  action: () =>
                    editor.chain().focus().toggleBulletList().run(),
                  active: editor.isActive("bulletList"),
                },
                {
                  label: "1.",
                  title: "Numaralı Liste",
                  action: () =>
                    editor.chain().focus().toggleOrderedList().run(),
                  active: editor.isActive("orderedList"),
                },
                {
                  label: '"',
                  title: "Alıntı",
                  action: () =>
                    editor.chain().focus().toggleBlockquote().run(),
                  active: editor.isActive("blockquote"),
                },
                {
                  label: "</>",
                  title: "Kod",
                  action: () =>
                    editor.chain().focus().toggleCodeBlock().run(),
                  active: editor.isActive("codeBlock"),
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  title={btn.title}
                  onClick={btn.action}
                  type="button"
                  className={`text-[11px] font-bold w-7 h-7 flex items-center justify-center border transition-colors ${
                    btn.active
                      ? "bg-[#A6DE9B] text-[#325343] border-[#325343] dark:bg-white dark:text-[#252625] dark:border-white"
                      : "border-[#D4E4D8] dark:border-[#333] text-[#252625] dark:text-white bg-white dark:bg-[#1a1a1a] hover:border-[#325343]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          <div
            className={`border-[1.5px] bg-white dark:bg-[#1a1a1a] ${
              duzenlenebilir
                ? "border-[#D4E4D8] dark:border-[#333] focus-within:border-[#325343]"
                : "border-[#D4E4D8] dark:border-[#333] opacity-60"
            }`}
          >
            <EditorContent editor={editor} />
          </div>
          <div className="text-[9px] text-[#4A4D4A] mt-1">
            Minimum 100 karakter gereklidir (incelemeye göndermek için)
          </div>
        </div>

        {/* Etiketler */}
        <div>
          <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-2">
            Etiketler (virgülle ayırın)
          </label>
          <input
            type="text"
            value={etiketler}
            onChange={(e) => setEtiketler(e.target.value)}
            disabled={!duzenlenebilir}
            placeholder="kaygı, depresyon, mindfulness..."
            className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] disabled:opacity-50"
          />
          {etiketler && (
            <div className="flex flex-wrap gap-1 mt-2">
              {etiketler
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 10)
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-bold px-2 py-[1px] border-[1.5px] border-[#D4E4D8] dark:border-[#333] text-[#4A4D4A] bg-[#F5F7F5] dark:bg-[#111]"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* SEO Alanları (kapatılabilir) */}
        <div>
          <button
            type="button"
            onClick={() => setSeoAcik((v) => !v)}
            className="text-[10px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] hover:text-[#252625] dark:hover:text-white transition-colors flex items-center gap-2"
          >
            {seoAcik ? "▾" : "▸"} SEO Ayarları (Opsiyonel)
          </button>
          <AnimatePresence>
            {seoAcik && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-col gap-3"
              >
                <div>
                  <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
                    SEO Başlığı
                  </label>
                  <input
                    type="text"
                    value={seoBaslik}
                    onChange={(e) => setSeoBaslik(e.target.value)}
                    disabled={!duzenlenebilir}
                    maxLength={160}
                    placeholder="Arama motoru için başlık (boş bırakılırsa yazı başlığı kullanılır)"
                    className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] disabled:opacity-50"
                  />
                  <div className="text-[9px] text-[#4A4D4A] text-right mt-1">
                    {seoBaslik.length}/160
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold tracking-[0.8px] uppercase text-[#4A4D4A] mb-1">
                    SEO Açıklaması
                  </label>
                  <textarea
                    value={seoAciklama}
                    onChange={(e) => setSeoAciklama(e.target.value)}
                    disabled={!duzenlenebilir}
                    maxLength={320}
                    rows={2}
                    placeholder="Meta description (boş bırakılırsa özet kullanılır)"
                    className="w-full border-[1.5px] border-[#D4E4D8] dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[13px] text-[#252625] dark:text-white px-3 py-2 outline-none focus:border-[#325343] resize-none disabled:opacity-50"
                  />
                  <div className="text-[9px] text-[#4A4D4A] text-right mt-1">
                    {seoAciklama.length}/320
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Aksiyon Butonları */}
        {duzenlenebilir && (
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#D4E4D8] dark:border-[#333]">
            <button
              onClick={() => void kaydet()}
              disabled={kaydediliyor || gonderiliyor}
              className="text-[11px] font-bold px-5 py-2 border-[1.5px] border-[#325343] dark:border-white bg-white dark:bg-[#1a1a1a] text-[#252625] dark:text-white hover:bg-[#325343] hover:text-white dark:hover:bg-white dark:hover:text-[#252625] transition-colors disabled:opacity-40"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Taslak Kaydet"}
            </button>

            {mod === "duzenle" && baslangicVeri?.id && (
              <button
                onClick={() => void gonder()}
                disabled={kaydediliyor || gonderiliyor || !baslik.trim()}
                className="text-[11px] font-bold px-5 py-2 bg-[#A6DE9B] text-[#325343] dark:bg-white dark:text-[#252625] hover:opacity-90 hover:scale-[1.01] transition-all duration-100 disabled:opacity-40"
              >
                {gonderiliyor ? "Gönderiliyor..." : "İncelemeye Gönder →"}
              </button>
            )}

            <span className="text-[10px] text-[#4A4D4A]">
              {mod === "yeni"
                ? "Önce taslak kaydedip ardından incelemeye gönderebilirsiniz."
                : "Onaylanan yazılar profilinizde yayınlanır."}
            </span>
          </div>
        )}

        {!duzenlenebilir && (
          <div className="pt-2 border-t border-[#D4E4D8] dark:border-[#333] text-[11px] text-[#4A4D4A]">
            {mevcutDurum === "pending"
              ? "Yazı incelemede — onaylanana kadar düzenleme kapalıdır."
              : "Yayınlanmış yazılar düzenlenemez."}
          </div>
        )}
      </div>
    </motion.div>
  );
}
