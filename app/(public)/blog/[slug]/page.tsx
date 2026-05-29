import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeBlogContent } from "@/lib/utils/sanitizeHtml";
import type { Metadata } from "next";
import Link from "next/link";

type Params = { params: Promise<{ slug: string }> };

const AYLAR = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function formatTarih(str: string): string {
  const d = new Date(str);
  return `${d.getDate()} ${AYLAR[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

async function getYazi(slug: string) {
  const supabase = await createClient();

  const { data: yazi } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, content, excerpt, cover_image_url, tags, seo_title, seo_description, seo_keywords, published_at, view_count, danisan_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();

  return yazi;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const yazi = await getYazi(slug);

  if (!yazi) {
    return { title: "Yazı Bulunamadı | MindBridger" };
  }

  return {
    title: yazi.seo_title ?? `${yazi.title} | MindBridger`,
    description: yazi.seo_description ?? yazi.excerpt ?? undefined,
    keywords: yazi.seo_keywords ?? undefined,
    openGraph: {
      title: yazi.seo_title ?? yazi.title,
      description: yazi.seo_description ?? yazi.excerpt ?? undefined,
      images: yazi.cover_image_url ? [yazi.cover_image_url] : [],
      type: "article",
      publishedTime: yazi.published_at ?? undefined,
    },
  };
}

export default async function BlogDetayPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const yazi = await getYazi(slug);
  if (!yazi) notFound();

  // view_count artır (fire-and-forget)
  void supabase
    .from("blog_posts")
    .update({ view_count: yazi.view_count + 1 })
    .eq("id", yazi.id);

  // Yazar bilgisi (admin yazılarında danisan_id olmayabilir)
  const { data: danisanRow } = yazi.danisan_id
    ? await supabase
        .from("danisanlar")
        .select("id, slug, title, profile_id, specialties")
        .eq("id", yazi.danisan_id)
        .single()
    : { data: null };

  let yazar: {
    isim: string;
    slug: string;
    title: string | null;
    avatar_url: string | null;
    specialties: string[] | null;
  } | null = null;

  if (danisanRow) {
    const { data: profilRow } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", danisanRow.profile_id)
      .single();

    if (profilRow) {
      yazar = {
        isim: `${profilRow.first_name ?? ""} ${profilRow.last_name ?? ""}`.trim(),
        slug: danisanRow.slug ?? "",
        title: danisanRow.title,
        avatar_url: profilRow.avatar_url,
        specialties: danisanRow.specialties,
      };
    }
  }

  // İlgili yazılar (aynı tag'e sahip, farklı yazı, max 3)
  const ilkTag = yazi.tags?.[0];
  let ilgiliYazilar: { id: string; title: string; slug: string; published_at: string | null }[] = [];
  if (ilkTag) {
    const { data: ilgili } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published_at")
      .eq("status", "published")
      .contains("tags", [ilkTag])
      .neq("id", yazi.id)
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(3);
    ilgiliYazilar = ilgili ?? [];
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] dark:bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-[#BDBDBD] mb-6">
          <Link href="/" className="hover:text-[#325343] dark:hover:text-white transition-colors">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#325343] dark:hover:text-white transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-[#BDBDBD] truncate max-w-[200px]">{yazi.title}</span>
        </div>

        {/* Cover image */}
        {yazi.cover_image_url && (
          <div className="w-full h-56 overflow-hidden mb-6 border-[1.5px] border-[#E0E0E0] dark:border-[#333]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={yazi.cover_image_url}
              alt={yazi.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tags */}
        {yazi.tags && yazi.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {yazi.tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="text-[9px] font-bold uppercase tracking-[0.6px] border-[1.5px] border-[#E0E0E0] dark:border-[#333] px-2 py-0.5 text-[#BDBDBD] hover:border-[#325343] dark:hover:border-white hover:text-[#325343] dark:hover:text-white transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-[22px] font-bold text-[#325343] dark:text-white leading-snug mb-3">
          {yazi.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-[#BDBDBD] mb-6 pb-6 border-b border-[#E0E0E0] dark:border-[#333]">
          {yazar && (
            <Link
              href={`/danismanlar/${yazar.slug}`}
              className="font-semibold text-[#325343] dark:text-white hover:underline"
            >
              {yazar.isim}
            </Link>
          )}
          {yazi.published_at && (
            <span>{formatTarih(yazi.published_at)}</span>
          )}
          <span>{yazi.view_count} görüntülenme</span>
        </div>

        {/* Content */}
        {yazi.content ? (
          <div
            className="prose prose-sm max-w-none text-[#325343] dark:text-white
              prose-headings:font-bold prose-headings:text-[#325343] dark:prose-headings:text-white
              prose-p:text-[13px] prose-p:leading-relaxed prose-p:text-[#325343] dark:prose-p:text-white
              prose-a:text-[#325343] dark:prose-a:text-white prose-a:underline
              prose-blockquote:border-l-[3px] prose-blockquote:border-[#325343] dark:prose-blockquote:border-white prose-blockquote:pl-4 prose-blockquote:text-[#BDBDBD]
              prose-code:bg-[#F5F7F5] dark:prose-code:bg-[#1a1a1a] prose-code:px-1 prose-code:text-[12px]
              prose-ul:list-disc prose-ol:list-decimal mb-8"
            dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(yazi.content ?? "") }}
          />
        ) : (
          <p className="text-[13px] text-[#BDBDBD] py-8">İçerik yüklenemedi.</p>
        )}

        {/* Yazar Kartı */}
        {yazar && (
          <div className="border-[1.5px] border-[#325343] dark:border-white p-4 mb-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-3">
              Yazar Hakkında
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-[#F5F7F5] dark:bg-[#1a1a1a] border-[1.5px] border-[#E0E0E0] dark:border-[#333] overflow-hidden">
                {yazar.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={yazar.avatar_url}
                    alt={yazar.isim}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[16px] font-bold text-[#BDBDBD]">
                    {yazar.isim.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-[#325343] dark:text-white mb-0.5">
                  {yazar.isim}
                </div>
                {yazar.title && (
                  <div className="text-[11px] text-[#BDBDBD] mb-2">{yazar.title}</div>
                )}
                {yazar.specialties && yazar.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {yazar.specialties.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[9px] border-[1.5px] border-[#E0E0E0] dark:border-[#333] px-1.5 py-0.5 text-[#BDBDBD]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/danismanlar/${yazar.slug}`}
                  className="inline-block mt-3 text-[11px] font-bold border-[1.5px] border-[#325343] dark:border-white text-[#325343] dark:text-white px-3 py-1 hover:bg-[#325343] hover:text-white dark:hover:bg-white dark:hover:text-[#325343] transition-colors"
                >
                  Profili İncele
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* İlgili Yazılar */}
        {ilgiliYazilar.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#BDBDBD] mb-3 pb-1.5 border-b border-[#E0E0E0] dark:border-[#333]">
              İlgili Yazılar
            </div>
            <div className="flex flex-col gap-2">
              {ilgiliYazilar.map((y) => (
                <Link
                  key={y.id}
                  href={`/blog/${y.slug}`}
                  className="flex items-center justify-between px-3 py-2.5 border-[1.5px] border-[#E0E0E0] dark:border-[#333] hover:border-[#325343] dark:hover:border-white transition-colors group"
                >
                  <span className="text-[12px] font-semibold text-[#325343] dark:text-white group-hover:underline">
                    {y.title}
                  </span>
                  {y.published_at && (
                    <span className="text-[10px] text-[#BDBDBD] flex-shrink-0 ml-4">
                      {formatTarih(y.published_at)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Blog'a Dön */}
        <div className="mt-8 pt-6 border-t border-[#E0E0E0] dark:border-[#333]">
          <Link
            href="/blog"
            className="text-[12px] font-bold text-[#BDBDBD] hover:text-[#325343] dark:hover:text-white transition-colors"
          >
            ← Blog'a Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
