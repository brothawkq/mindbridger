import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { HeroSection } from "@/components/public/home/HeroSection"
import { StatsTicker } from "@/components/public/home/StatsTicker"
import { StatsSection } from "@/components/public/home/StatsSection"
import { HowItWorksSection } from "@/components/public/home/HowItWorksSection"
import { WhySection } from "@/components/public/home/WhySection"
import { FeaturedConsultantsSection } from "@/components/public/home/FeaturedConsultantsSection"
import { TestimonialsSection } from "@/components/public/home/TestimonialsSection"
import { KurumsalCtaSection } from "@/components/public/home/KurumsalCtaSection"
import { FinalCtaSection } from "@/components/public/home/FinalCtaSection"
import { FaqSection } from "@/components/public/home/FaqSection"

export const revalidate = 3600 // Saatte bir yeniden oluştur

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com"

export const metadata: Metadata = {
  title: "MindBridger — Online Terapi Platformu",
  description:
    "Türkiye'nin online terapi platformu. Psikolog ve PDR danışmanlarına kolayca ulaşın. Bireysel, çift ve grup seansları için randevu alın.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "MindBridger — Online Terapi Platformu",
    description:
      "Türkiye'nin online terapi platformu. 100+ danışman ile online veya yüz yüze seans yapın.",
    url: APP_URL,
    type: "website",
  },
}

// WebSite + Organization structured data
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MindBridger",
  url: APP_URL,
  description:
    "Türkiye'nin online terapi platformu. Psikolog ve PDR danışmanlarına kolayca ulaşın.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/danismanlar?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "tr",
}

const faqItems = [
  {
    name: "Online terapi yüz yüze terapi kadar etkili mi?",
    acceptedAnswer: {
      text: "Araştırmalar, video görüşme yoluyla yapılan online terapinin yüz yüze terapi kadar etkili olduğunu göstermektedir. MindBridger'da lisanslı psikolog ve PDR danışmanlarıyla güvenli video seansları yapabilirsiniz.",
    },
  },
  {
    name: "MindBridger'da seans ücreti ne kadar?",
    acceptedAnswer: {
      text: "Danışmanlar kendi ücretlerini belirler; seans ücretleri değişmekle birlikte çoğu danışman ilk 15 dakikalık ücretsiz tanışma görüşmesi sunar. Fiyat filtresiyle bütçenize uygun danışmanı kolayca bulabilirsiniz.",
    },
  },
  {
    name: "Randevumu iptal edebilir miyim?",
    acceptedAnswer: {
      text: "Evet, seans saatinden 24 saat öncesine kadar randevunuzu ücretsiz iptal edebilirsiniz. İptal durumunda ödeme iadesi otomatik olarak gerçekleşir.",
    },
  },
  {
    name: "Danışman bilgilerim gizli mi?",
    acceptedAnswer: {
      text: "Evet. Tüm seans kayıtları, notlar ve kişisel bilgileriniz şifrelenerek saklanır; üçüncü taraflarla paylaşılmaz. Gizlilik KVKK kapsamında güvence altındadır.",
    },
  },
  {
    name: "Kurumsal çalışanlar için terapi hizmeti var mı?",
    acceptedAnswer: {
      text: "Evet. MindBridger Kurumsal, şirketlerin çalışanlarına toplu terapi paketi sunmasına olanak tanır. İK departmanları panel üzerinden kullanım raporlarını takip edebilir.",
    },
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.name,
    acceptedAnswer: { "@type": "Answer", text: f.acceptedAnswer.text },
  })),
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${APP_URL}/#organization`,
  name: "MindBridger",
  url: APP_URL,
  logo: `${APP_URL}/icons/icon-512x512.png`,
  description:
    "Türkiye'ye özel online terapi marketplace. Psikolog ve PDR danışmanlarını bireysel ve kurumsal müşterilerle buluşturur.",
  address: { "@type": "PostalAddress", addressCountry: "TR" },
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "platform@mindbridger.com",
    availableLanguage: "Turkish",
  },
  priceRange: "₺₺",
  areaServed: { "@type": "Country", name: "Turkey" },
}

function safeJSON(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

export default async function HomePage() {
  // site_settings tablosundan içerik çek
  const supabase = await createClient()
  const { data: rows } = await supabase.from("site_settings").select("key, value")

  const settings: Record<string, string> = {}
  if (rows) {
    for (const row of rows) {
      settings[row.key] = row.value
    }
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJSON(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJSON(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJSON(faqSchema) }}
      />

      {/* 1. HERO */}
      <HeroSection settings={settings} />

      {/* 2. TICKER */}
      <StatsTicker settings={settings} />

      {/* 3. İSTATİSTİKLER — koyu yeşil bölüm */}
      <StatsSection settings={settings} />

      {/* 4. NASIL ÇALIŞIR */}
      <HowItWorksSection settings={settings} />

      {/* 4. NEDEN BİZ */}
      <WhySection settings={settings} />

      {/* 5. DANIŞMANLAR */}
      <FeaturedConsultantsSection settings={settings} />

      {/* 6. YORUMLAR */}
      <TestimonialsSection settings={settings} />

      {/* 7. KURUMSAL CTA */}
      <KurumsalCtaSection />

      {/* 8. KAYIT CTA */}
      <FinalCtaSection settings={settings} />

      {/* 9. SSS */}
      <FaqSection faqs={faqItems} />
    </>
  )
}
