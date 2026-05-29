import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda | MindBridger",
  description:
    "MindBridger, Türkiye'de psikolog ve PDR danışmanlarını bireysel ve kurumsal müşterilerle buluşturan online terapi platformudur.",
  robots: { index: true, follow: true },
};

const DEGERLER = [
  {
    baslik: "Gizlilik",
    aciklama:
      "Tüm seans kayıtları, notlar ve kişisel veriler KVKK kapsamında şifrelenerek saklanır. Hiçbir bilgi üçüncü taraflarla paylaşılmaz.",
  },
  {
    baslik: "Güvenilirlik",
    aciklama:
      "Platformumuzdaki tüm danışmanlar kimlik, lisans ve uzmanlık belgesi doğrulamasından geçer. Admin onayı olmadan profil yayımlanamaz.",
  },
  {
    baslik: "Erişilebilirlik",
    aciklama:
      "Online veya yüz yüze seans seçeneği, esnek fiyat aralıkları ve kayan ücret uygulaması ile psikolojik desteği herkese ulaştırıyoruz.",
  },
  {
    baslik: "Kalite",
    aciklama:
      "Her seans sonrası değerlendirme sistemi, danışman performans takibi ve sürekli geri bildirim döngüsü hizmet kalitesini güvence altına alır.",
  },
];

export default function HakkimizdaPage() {
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "var(--pub-bg)",
        color: "var(--pub-text)",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#325343" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px",
            textTransform: "uppercase", color: "rgba(245,247,245,0.5)",
            marginBottom: 12,
          }}>
            Hakkımızda
          </p>
          <h1 style={{
            fontSize: 36, fontWeight: 700, color: "#F5F7F5",
            margin: "0 0 16px", lineHeight: 1.2,
          }}>
            Türkiye'nin Zihinsel Sağlık Platformu
          </h1>
          <p style={{
            fontSize: 15, color: "rgba(245,247,245,0.75)",
            maxWidth: 600, lineHeight: 1.7, margin: 0,
          }}>
            MindBridger; lisanslı psikolog ve PDR danışmanlarını bireysel ve
            kurumsal müşterilerle buluşturan, Türkiye'ye özgü online terapi
            marketplace'idir.
          </p>
        </div>
      </section>

      {/* ── Misyon / Vizyon ───────────────────────────────────── */}
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
          }}
        >
          <div
            style={{
              border: "1.5px solid var(--pub-border)",
              padding: "28px 24px",
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
              Misyonumuz
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--pub-text)", margin: 0 }}>
              Türkiye'de psikolojik desteğe erişimi kolaylaştırmak; nitelikli,
              lisanslı danışmanları güvenli ve şeffaf bir platformda kullanıcılarla
              buluşturmak.
            </p>
          </div>

          <div
            style={{
              border: "1.5px solid var(--pub-border)",
              padding: "28px 24px",
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
              Vizyonumuz
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--pub-text)", margin: 0 }}>
              Zihinsel sağlığı herkes için ulaşılabilir kılmak; bireylerin ve
              kurumların psikolojik refahını artıracak en güvenilir dijital
              terapi ekosistemi olmak.
            </p>
          </div>
        </div>
      </section>

      {/* ── Rakamlar ──────────────────────────────────────────── */}
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
          Rakamlarla MindBridger
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1.5px solid var(--pub-border)",
          }}
        >
          {[
            { deger: "500+", etiket: "Onaylı Danışman" },
            { deger: "15.000+", etiket: "Tamamlanan Seans" },
            { deger: "%97", etiket: "Memnuniyet Oranı" },
            { deger: "7/24", etiket: "Destek" },
          ].map((item, i) => (
            <div
              key={item.etiket}
              style={{
                padding: "24px 20px",
                borderLeft: i > 0 ? "1.5px solid var(--pub-border)" : "none",
                backgroundColor: "var(--pub-surface)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 4,
                }}
              >
                {item.deger}
              </div>
              <div style={{ fontSize: 11, color: "var(--pub-muted)" }}>
                {item.etiket}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Değerler ──────────────────────────────────────────── */}
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
          Değerlerimiz
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {DEGERLER.map((d) => (
            <div
              key={d.baslik}
              style={{
                border: "1.5px solid var(--pub-border)",
                padding: "20px",
                backgroundColor: "var(--pub-surface)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 8,
                }}
              >
                {d.baslik}
              </p>
              <p style={{ fontSize: 12, color: "var(--pub-muted)", lineHeight: 1.6, margin: 0 }}>
                {d.aciklama}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nasıl Çalışır ─────────────────────────────────────── */}
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
          Platform Modeli
        </p>
        <p style={{ fontSize: 13, color: "var(--pub-text)", lineHeight: 1.7, marginBottom: 16 }}>
          MindBridger bir marketplace platformudur. Danışmanlar kendi ücretlerini
          belirler; platform her başarılı seans üzerinden %20 komisyon alır.
          Ödeme altyapısı iyzico üzerinden PCI-DSS uyumlu olarak yürütülür.
        </p>
        <p style={{ fontSize: 13, color: "var(--pub-muted)", lineHeight: 1.7, margin: 0 }}>
          Danışman başvuruları kimlik, diploma ve lisans belgesi doğrulamasından
          geçer. Onay süreci ortalama 24–48 saattir. Onaylanan danışmanlar profil
          yayınlayabilir ve randevu alabilir.
        </p>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "40px 24px 56px",
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/danismanlar"
          style={{
            display: "inline-block",
            padding: "11px 28px",
            backgroundColor: "#A6DE9B",
            color: "#325343",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            border: "none",
            borderRadius: 100,
          }}
        >
          Danışman Bul
        </Link>
        <Link
          href="/iletisim"
          style={{
            display: "inline-block",
            padding: "11px 28px",
            backgroundColor: "transparent",
            color: "#325343",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            border: "1.5px solid #325343",
            borderRadius: 100,
          }}
        >
          İletişime Geç
        </Link>
      </section>
    </main>
  );
}
