import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kurumsal Çözümler | MindBridger",
  description:
    "MindBridger Kurumsal ile çalışanlarınıza online terapi desteği sunun. İK paneli, kullanım raporları, esnek bütçe tanımı. Hemen başvurun.",
  robots: { index: true, follow: true },
};

const OZELLIKLER = [
  {
    baslik: "Esnek Bütçe Tanımı",
    aciklama:
      "Çalışan başına aylık limit belirleyin. Kullanılmayan bütçe bir sonraki aya devretmez; maliyet kontrolü tamamen sizde.",
  },
  {
    baslik: "İK Paneli",
    aciklama:
      "Gerçek zamanlı kullanım oranı, harcama takibi ve departman bazlı raporlar. Çalışan gizliliği korunur — içerik hiçbir zaman görünmez.",
  },
  {
    baslik: "Onaylı Danışman Havuzu",
    aciklama:
      "500+ lisanslı psikolog ve PDR danışmanı. Diploma ve uzmanlık belgeleri platform tarafından manuel doğrulanmıştır.",
  },
  {
    baslik: "Video + Asenkron Destek",
    aciklama:
      "Çalışanlar canlı video seans veya asenkron mesajlaşma seçeneğiyle istedikleri zaman destek alır.",
  },
  {
    baslik: "KVKK Uyumlu",
    aciklama:
      "Tüm seans verileri AES-256 ile şifrelenir. Şirkete yalnızca anonim kullanım istatistikleri paylaşılır.",
  },
  {
    baslik: "Aylık Fatura ve Rapor",
    aciklama:
      "Otomatik e-fatura + XLSX raporu her ay hesabınıza düşer. Muhasebe entegrasyonu kolaydır.",
  },
];

const PAKETLER = [
  {
    isim: "Starter",
    calisanSayisi: "10–50 çalışan",
    fiyat: "Çalışan başına ₺200/ay",
    ozellikler: [
      "Aylık 2 seans hakkı / çalışan",
      "İK paneli (temel)",
      "E-posta destek",
      "Aylık XLSX rapor",
    ],
    vurgulu: false,
  },
  {
    isim: "Business",
    calisanSayisi: "51–500 çalışan",
    fiyat: "Çalışan başına ₺350/ay",
    ozellikler: [
      "Aylık 4 seans hakkı / çalışan",
      "İK paneli (gelişmiş + departman filtresi)",
      "Öncelikli destek hattı",
      "Aylık fatura + detaylı rapor",
      "Asenkron mesajlaşma dahil",
    ],
    vurgulu: true,
  },
  {
    isim: "Enterprise",
    calisanSayisi: "500+ çalışan",
    fiyat: "Özel fiyatlandırma",
    ozellikler: [
      "Sınırsız seans hakkı",
      "Özel danışman havuzu",
      "API entegrasyonu",
      "SLA garantisi",
      "Yerinde eğitim ve onboarding",
      "Özel hesap yöneticisi",
    ],
    vurgulu: false,
  },
];

const ROI_VERILERI = [
  { deger: "%34", etiket: "Çalışan devir hızı düşüşü", kaynak: "APA, 2023" },
  { deger: "4.2×", etiket: "Her 1 ₺ yatırıma geri dönüş", kaynak: "WHO Raporu" },
  { deger: "%28", etiket: "İş kaynaklı hastalık izni azalması", kaynak: "Deloitte, 2022" },
  { deger: "%41", etiket: "Çalışan bağlılığı artışı", kaynak: "Gallup, 2023" },
];

export default function KurumsalPage() {
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "var(--pub-bg)",
        color: "var(--pub-text)",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px",
            textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
            marginBottom: 12,
          }}>
            Kurumsal
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F5F7F5", margin: "0 0 16px", lineHeight: 1.2 }}>
            Çalışanlarınıza Profesyonel <br />
            Psikolojik Destek Sunun
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,247,245,0.75)", maxWidth: 600, lineHeight: 1.7, margin: "0 0 28px" }}>
            MindBridger Kurumsal, şirketlerin çalışanlarına güvenilir, gizli ve ölçülebilir
            terapi desteği sunmasını sağlar. İK panelinizden bütçeyi kontrol edin,
            çalışan gizliliği her zaman korunur.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/kurumsal-kayit"
              style={{
                display: "inline-block",
                padding: "11px 28px",
                backgroundColor: "#A6DE9B",
                color: "#325343",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                borderRadius: 100,
              }}
            >
              Kurumsal Başvur
            </Link>
            <a
              href="mailto:kurumsal@mindbridger.com"
              style={{
                display: "inline-block",
                padding: "11px 28px",
                backgroundColor: "transparent",
                color: "#F5F7F5",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                border: "1.5px solid rgba(245,247,245,0.4)",
                borderRadius: 100,
              }}
            >
              Bilgi Al: kurumsal@mindbridger.com
            </a>
          </div>
        </div>
      </section>

      {/* ── ROI Verileri ──────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1.5px solid var(--pub-border)",
          padding: "40px 24px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--pub-muted)",
            marginBottom: 24,
          }}
        >
          Araştırma Verileri
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1.5px solid var(--pub-border)",
          }}
        >
          {ROI_VERILERI.map((v, i) => (
            <div
              key={v.etiket}
              style={{
                padding: "24px 20px",
                borderLeft: i > 0 ? "1.5px solid var(--pub-border)" : "none",
                backgroundColor: "var(--pub-surface)",
              }}
            >
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  margin: "0 0 6px",
                  lineHeight: 1,
                }}
              >
                {v.deger}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--pub-text)",
                  margin: "0 0 6px",
                  lineHeight: 1.4,
                }}
              >
                {v.etiket}
              </p>
              <p style={{ fontSize: 10, color: "var(--pub-muted)", margin: 0 }}>
                {v.kaynak}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Özellikler ────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1.5px solid var(--pub-border)",
          padding: "40px 24px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--pub-muted)",
            marginBottom: 24,
          }}
        >
          Platform Özellikleri
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {OZELLIKLER.map((o) => (
            <div
              key={o.baslik}
              style={{
                border: "1.5px solid var(--pub-border)",
                padding: "20px",
                backgroundColor: "var(--pub-surface)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 8,
                }}
              >
                {o.baslik}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--pub-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {o.aciklama}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Paketler ──────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1.5px solid var(--pub-border)",
          padding: "40px 24px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--pub-muted)",
            marginBottom: 24,
          }}
        >
          Paketler
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {PAKETLER.map((p) => (
            <div
              key={p.isim}
              style={{
                border: p.vurgulu ? "1.5px solid #325343" : "1.5px solid var(--pub-border)",
                padding: "24px 20px",
                backgroundColor: p.vurgulu ? "#325343" : "var(--pub-surface)",
                color: p.vurgulu ? "#FFFFFF" : "var(--pub-text)",
              }}
            >
              {p.vurgulu && (
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "#BDBDBD",
                    marginBottom: 8,
                  }}
                >
                  En Popüler
                </p>
              )}
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: "0 0 4px",
                }}
              >
                {p.isim}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: p.vurgulu ? "#BDBDBD" : "var(--pub-muted)",
                  marginBottom: 16,
                }}
              >
                {p.calisanSayisi}
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  margin: "0 0 20px",
                  color: p.vurgulu ? "#FFFFFF" : "var(--pub-text)",
                }}
              >
                {p.fiyat}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {p.ozellikler.map((o) => (
                  <li
                    key={o}
                    style={{
                      display: "flex",
                      gap: 8,
                      fontSize: 12,
                      color: p.vurgulu ? "#FFFFFF" : "var(--pub-text)",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: p.vurgulu ? "#FFFFFF" : "var(--pub-primary)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
              <Link
                href="/kurumsal-kayit"
                style={{
                  display: "inline-block",
                  padding: "9px 20px",
                  backgroundColor: p.vurgulu ? "#FFFFFF" : "var(--pub-primary)",
                  color: p.vurgulu ? "#325343" : "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                Başvur
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gizlilik Güvencesi ────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1.5px solid var(--pub-border)",
          padding: "40px 24px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            border: "1.5px solid var(--pub-border)",
            padding: "24px",
            backgroundColor: "var(--pub-surface)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--pub-muted)",
              marginBottom: 12,
            }}
          >
            Gizlilik Güvencesi
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 24,
            }}
          >
            {[
              {
                baslik: "Şirket İçerik Görmez",
                metin:
                  "Seans içerikleri, notlar veya kişisel terapi bilgileri şirketle hiçbir koşulda paylaşılmaz.",
              },
              {
                baslik: "Sadece Anonim İstatistik",
                metin:
                  "İK panelinde yalnızca 'X çalışan kullandı, Y seans gerçekleşti' gibi anonim veriler görünür.",
              },
              {
                baslik: "KVKK Uyumlu",
                metin:
                  "6698 sayılı KVKK kapsamında tüm veriler işlenir. Çalışanlar kendi verilerini silme hakkına sahiptir.",
              },
            ].map((g) => (
              <div key={g.baslik}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--pub-text)",
                    marginBottom: 6,
                  }}
                >
                  {g.baslik}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--pub-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {g.metin}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "40px 24px 56px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            border: "1.5px solid #325343",
            padding: "40px 32px",
            backgroundColor: "#325343",
            color: "#FFFFFF",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#BDBDBD",
                marginBottom: 12,
              }}
            >
              Kurumsal Başvuru
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: "0 0 8px",
                lineHeight: 1.3,
              }}
            >
              Ekibiniz İçin Terapi Desteği <br />
              Bugün Başlayın
            </h2>
            <p style={{ fontSize: 13, color: "#BDBDBD", margin: 0, lineHeight: 1.6 }}>
              Başvurunuzu aldıktan sonra 1–2 iş günü içinde ekibimiz sizinle iletişime geçer.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link
              href="/kurumsal-kayit"
              style={{
                display: "inline-block",
                padding: "13px 32px",
                backgroundColor: "#FFFFFF",
                color: "#325343",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Kurumsal Başvur →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
