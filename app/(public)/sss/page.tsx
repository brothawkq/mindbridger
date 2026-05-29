import type { Metadata } from "next";
import SssAccordion from "./SssAccordion";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular | MindBridger",
  description:
    "MindBridger hakkında sık sorulan sorular: online terapi, randevu, ödeme, gizlilik ve danışman bilgileri.",
  robots: { index: true, follow: true },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com";

export const SSS_LISTESI = [
  {
    soru: "Online terapi yüz yüze terapi kadar etkili mi?",
    cevap:
      "Araştırmalar, video görüşme yoluyla yapılan online terapinin yüz yüze terapi kadar etkili olduğunu göstermektedir. MindBridger'da lisanslı psikolog ve PDR danışmanlarıyla güvenli video seansları yapabilirsiniz.",
  },
  {
    soru: "MindBridger'da seans ücreti ne kadar?",
    cevap:
      "Danışmanlar kendi ücretlerini belirler; seans ücretleri değişmekle birlikte çoğu danışman ilk 15 dakikalık ücretsiz tanışma görüşmesi sunar. Fiyat filtresiyle bütçenize uygun danışmanı kolayca bulabilirsiniz.",
  },
  {
    soru: "Randevumu iptal edebilir miyim?",
    cevap:
      "Evet, seans saatinden 24 saat öncesine kadar randevunuzu ücretsiz iptal edebilirsiniz. İptal durumunda ödeme iadesi otomatik olarak 3–5 iş günü içinde gerçekleşir.",
  },
  {
    soru: "Danışman bilgilerim gizli mi?",
    cevap:
      "Evet. Tüm seans kayıtları, notlar ve kişisel bilgileriniz şifrelenerek saklanır; üçüncü taraflarla paylaşılmaz. Gizlilik KVKK kapsamında güvence altındadır.",
  },
  {
    soru: "Kurumsal çalışanlar için terapi hizmeti var mı?",
    cevap:
      "Evet. MindBridger Kurumsal, şirketlerin çalışanlarına toplu terapi paketi sunmasına olanak tanır. İK departmanları panel üzerinden kullanım raporlarını takip edebilir.",
  },
  {
    soru: "Danışmanlar nasıl doğrulanıyor?",
    cevap:
      "Her danışman başvurusu kimlik belgesi, diploma ve uzmanlık belgesi ile birlikte yapılır. Platform ekibi belgeleri manuel olarak inceleyip onaylar; bu süreç ortalama 24–48 saat sürer. Onaylanmadan profil yayımlanamaz.",
  },
  {
    soru: "Video görüşme için ne gerekiyor?",
    cevap:
      "Modern bir tarayıcı (Chrome, Firefox, Edge, Safari) ve kamera ile mikrofon yeterlidir. Herhangi bir uygulama indirmenize gerek yoktur. Video bağlantısı randevu saatinden 10 dakika önce aktif olur.",
  },
  {
    soru: "Ödeme güvenli mi?",
    cevap:
      "Evet. Ödeme altyapısı iyzico üzerinden PCI-DSS uyumlu olarak çalışmaktadır. Kart bilgileriniz MindBridger sunucularında saklanmaz.",
  },
  {
    soru: "Danışman olmak için ne yapmalıyım?",
    cevap:
      "Danışman Kayıt sayfasından kişisel bilgilerinizi, uzmanlık alanlarınızı ve belgelerinizi yükleyerek başvurabilirsiniz. Onay sonrası profiliniz yayımlanır ve randevu almaya başlayabilirsiniz.",
  },
  {
    soru: "Seans sırasında kayıt yapılıyor mu?",
    cevap:
      "Hayır. MindBridger video seanslarını kaydetmez. Görüşmeler yalnızca iki taraf arasında gerçekleşir; hiçbir kayıt tutulmaz.",
  },
];

// JSON-LD FAQPage schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SSS_LISTESI.map((item) => ({
    "@type": "Question",
    name: item.soru,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.cevap,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: APP_URL },
    { "@type": "ListItem", position: 2, name: "SSS", item: `${APP_URL}/sss` },
  ],
};

export default function SssPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      <main
        style={{
          flex: 1,
          backgroundColor: "var(--pub-bg)",
          color: "var(--pub-text)",
          fontFamily: "system-ui, Arial, sans-serif",
        }}
      >
        {/* ── Hero ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "#325343" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
              marginBottom: 12,
            }}>
              Yardım Merkezi
            </p>
            <h1 style={{
              fontSize: 36, fontWeight: 700, color: "#F5F7F5",
              margin: "0 0 16px", lineHeight: 1.2,
            }}>
              Sık Sorulan Sorular
            </h1>
            <p style={{
              fontSize: 15, color: "rgba(245,247,245,0.75)",
              maxWidth: 560, lineHeight: 1.7, margin: 0,
            }}>
              Yanıtını bulamadığınız bir sorunuz varsa{" "}
              <a href="/iletisim" style={{ color: "#A6DE9B", fontWeight: 700, textDecoration: "none" }}>
                iletişim formumuzdan
              </a>{" "}
              ulaşabilirsiniz.
            </p>
          </div>
        </section>

        {/* ── Accordion ───────────────────────────────────────── */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 64px" }}>
          <SssAccordion sorular={SSS_LISTESI} />
        </section>
      </main>
    </>
  );
}
