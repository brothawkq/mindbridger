"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const Schema = z.object({
  baslik: z
    .string()
    .min(5, "Başlık en az 5 karakter olmalıdır.")
    .max(200, "Başlık en fazla 200 karakter olabilir."),
  slug: z
    .string()
    .min(3, "Slug en az 3 karakter olmalıdır.")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir."),
  icerik: z
    .string()
    .min(100, "İçerik en az 100 karakter olmalıdır.")
    .max(100000),
  ozet: z.string().max(300, "Özet en fazla 300 karakter olabilir.").optional(),
  durum: z.enum(["draft", "published"]),
  kapak_url: z.string().url("Geçerli bir URL girin.").optional().or(z.literal("")).nullable(),
  etiketler: z.string().max(200).optional(),
});

type FormData = {
  baslik: string;
  slug: string;
  icerik: string;
  ozet?: string;
  durum: "draft" | "published";
  kapak_url?: string | null;
  etiketler?: string;
};

// ─── Slug yardımcı ────────────────────────────────────────────────────────────
function slugOlustur(metin: string): string {
  return metin
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Kategori {
  id: string;
  name: string;
}

interface InitialVeri {
  id: string;
  baslik: string;
  slug: string;
  icerik: string;
  ozet: string;
  kapak_url: string;
  durum: "draft" | "published";
  etiketler: string[];
}

interface Props {
  kategoriler: Kategori[];
  mod: "yeni" | "duzenle";
  initialVeri?: InitialVeri;
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────
export default function BlogYazisiFormKlient({
  kategoriler,
  mod,
  initialVeri,
}: Props) {
  const router = useRouter();
  const [sunucuHata, setSunucuHata] = useState("");
  const [basari, setBasari] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      baslik: initialVeri?.baslik ?? "",
      slug: initialVeri?.slug ?? "",
      icerik: initialVeri?.icerik ?? "",
      ozet: initialVeri?.ozet ?? "",
      durum: initialVeri?.durum ?? "draft",
      kapak_url: initialVeri?.kapak_url ?? "",
      etiketler: initialVeri?.etiketler?.join(", ") ?? "",
    },
  });

  // Başlık değişince slug otomatik üret (yalnızca yeni yazıda)
  const baslikValue = watch("baslik");
  useEffect(() => {
    if (mod === "yeni" && baslikValue) {
      setValue("slug", slugOlustur(baslikValue), { shouldValidate: false });
    }
  }, [baslikValue, mod, setValue]);

  async function onSubmit(data: FormData) {
    setSunucuHata("");
    setBasari("");

    const etiketDizisi = data.etiketler
      ? data.etiketler
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const body = {
      baslik: data.baslik,
      slug: data.slug,
      icerik: data.icerik,
      ozet: data.ozet || null,
      durum: data.durum,
      kapak_url: data.kapak_url || null,
      etiketler: etiketDizisi,
    };

    try {
      const url =
        mod === "yeni"
          ? "/api/admin/blog"
          : `/api/admin/blog/${initialVeri!.id}`;
      const method = mod === "yeni" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json: { hata?: string; id?: string } = await res.json();

      if (!res.ok) {
        setSunucuHata(json.hata ?? "Bir hata oluştu.");
        return;
      }

      setBasari(
        mod === "yeni"
          ? "Blog yazısı oluşturuldu."
          : "Blog yazısı güncellendi."
      );

      setTimeout(() => router.push("/admin/icerik"), 900);
    } catch {
      setSunucuHata("Ağ hatası oluştu. Lütfen tekrar deneyin.");
    }
  }

  const baslikSayac = watch("icerik")?.length ?? 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Sayfa başlığı */}
      <div className="px-5 py-4 border-b border-[#D4E4D8] flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[#252625]">
            {mod === "yeni" ? "Yeni Blog Yazısı" : "Blog Yazısı Düzenle"}
          </h1>
          <p className="text-[11px] text-[#4A4D4A] mt-0.5">
            {mod === "yeni"
              ? "Yeni bir blog yazısı oluşturun"
              : `"${initialVeri?.baslik ?? ""}" yazısını düzenleyin`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/icerik")}
          className="text-[12px] text-[#4A4D4A] hover:text-[#252625] transition-colors"
        >
          ← Geri
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
        <div className="p-5 flex flex-col gap-5 max-w-[760px]">

          {/* Başlık */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Başlık *
            </label>
            <input
              {...register("baslik")}
              placeholder="Blog yazısı başlığı..."
              className="w-full border-[1.5px] border-[#325343] px-3 py-[9px] text-[13px] outline-none font-[inherit]"
            />
            {errors.baslik && (
              <p className="text-[11px] text-red-600 mt-1">{errors.baslik.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Slug (URL)
            </label>
            <input
              {...register("slug")}
              placeholder="blog-yazisi-url"
              className="w-full border-[1.5px] border-[#D4E4D8] px-3 py-[9px] text-[13px] outline-none font-[inherit] font-mono text-[#4A4D4A]"
            />
            {errors.slug && (
              <p className="text-[11px] text-red-600 mt-1">{errors.slug.message}</p>
            )}
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              İçerik * — Markdown destekli
            </label>
            <textarea
              {...register("icerik")}
              rows={20}
              placeholder="Blog yazısının içeriğini buraya yazın... (Markdown formatı desteklenir)"
              className="w-full border-[1.5px] border-[#325343] px-3 py-[9px] text-[13px] outline-none font-[inherit] resize-y leading-relaxed"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.icerik ? (
                <p className="text-[11px] text-red-600">{errors.icerik.message}</p>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-[#4A4D4A]">
                {baslikSayac.toLocaleString("tr-TR")} karakter
              </span>
            </div>
          </div>

          {/* Özet */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Özet (opsiyonel, max 300 karakter)
            </label>
            <textarea
              {...register("ozet")}
              rows={3}
              placeholder="Blog kartlarında ve SEO'da görünecek kısa özet..."
              className="w-full border-[1.5px] border-[#D4E4D8] px-3 py-[9px] text-[13px] outline-none font-[inherit] resize-none"
            />
            {errors.ozet && (
              <p className="text-[11px] text-red-600 mt-1">{errors.ozet.message}</p>
            )}
          </div>

          {/* Kapak görseli */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Kapak Görseli URL (opsiyonel)
            </label>
            <input
              {...register("kapak_url")}
              placeholder="https://..."
              className="w-full border-[1.5px] border-[#D4E4D8] px-3 py-[9px] text-[13px] outline-none font-[inherit]"
            />
            {errors.kapak_url && (
              <p className="text-[11px] text-red-600 mt-1">{errors.kapak_url.message}</p>
            )}
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Etiketler (virgülle ayırın)
            </label>
            <input
              {...register("etiketler")}
              placeholder="anksiyete, depresyon, psikoloji"
              className="w-full border-[1.5px] border-[#D4E4D8] px-3 py-[9px] text-[13px] outline-none font-[inherit]"
            />
          </div>

          {/* Kategoriler (varsa) */}
          {kategoriler.length > 0 && (
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
                Kategori (opsiyonel)
              </label>
              <div className="flex flex-wrap gap-2">
                {kategoriler.map((k) => (
                  <span
                    key={k.id}
                    className="text-[11px] border-[1.5px] border-dashed border-[#BDBDBD] px-2.5 py-1 text-[#4A4D4A]"
                  >
                    {k.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Durum */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-[1px] text-[#4A4D4A] mb-1">
              Yayın Durumu
            </label>
            <div className="flex gap-3">
              {(["draft", "published"] as const).map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={d}
                    {...register("durum")}
                    className="accent-[#325343]"
                  />
                  <span className="text-[12px] text-[#252625]">
                    {d === "draft" ? "Taslak" : "Yayında"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Hata / Başarı */}
          {sunucuHata && (
            <div className="border-[1.5px] border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {sunucuHata}
            </div>
          )}
          {basari && (
            <div className="border-[1.5px] border-[#325343] bg-[#F5F7F5] px-3 py-2 text-[12px] text-[#252625] font-bold">
              ✓ {basari}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={isSubmitting || (!isDirty && mod === "duzenle")}
              className="bg-[#A6DE9B] text-[#325343] font-bold text-[13px] px-6 py-[11px] border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : mod === "yeni"
                ? "Yazıyı Oluştur"
                : "Değişiklikleri Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/icerik")}
              className="border-[1.5px] border-[#325343] bg-white text-[#252625] font-bold text-[13px] px-6 py-[11px] cursor-pointer"
            >
              İptal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
