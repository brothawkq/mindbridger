import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fiyatlandırma | MindBridger",
  description:
    "MindBridger'da seans ücretleri danışmana göre değişir. İlk 15 dakika ücretsiz tanışma görüşmesi. Bütçenize uygun danışmanı filtreleyin.",
  robots: { index: true, follow: true },
};

const OZELLIKLER = [
  { baslik: "İlk Görüşme", deger: "Ücretsiz", aciklama: "15 dakika tanışma görüşmesi" },
  { baslik: "Bireysel Seans", deger: "200 – 1.500 ₺", aciklama: "Danışmana göre değişir" },
  { baslik: "Çift / Aile Seansı", deger: "300 – 2.000 ₺", aciklama: "50 dakika" },
  { baslik: "Asenkron Mesajlaşma", deger: "100 – 400 ₺", aciklama: "Haftalık paket" },
];

const KURUMSAL_OZELLIKLER = [
  "Çalışan başına aylık bütçe tanımı",
  "Bireysel gizlilik korunur, şirkete yalnızca kullanım istatistiği",
  "İK paneli: kullanım oranı, harcama takibi",
  "Çoklu danışman havuzu",
  "Aylık fatura ve XLSX raporu",
  "Öncelikli destek hattı",
];

export default function FiyatlandirmaPage() {
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
            Fiyatlandırma
          </p>
          <h1 style={{
            fontSize: 36, fontWeight: 700, color: "#F5F7F5",
            margin: "0 0 16px", lineHeight: 1.2,
          }}>
            Şeffaf ve Esnek Fiyatlar
          </h1>
          <p style={{
            fontSize: 15, color: "rgba(245,247,245,0.75)",
            maxWidth: 600, lineHeight: 1.7, margin: 0,
          }}>
            Danışmanlar kendi ücretlerini belirler. Platform herhangi bir üyelik
            ücreti almaz — yalnızca tamamlanan seans üzerinden %20 komisyon uygulanır.
          </p>
        </div>
      </section>

      {/* ── Bireysel Fiyatlar ──────────────────────────────────── */}
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
          Bireysel Kullanım
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1.5px solid var(--pub-border)",
          }}
        >
          {OZELLIKLER.map((o, i) => (
            <div
              key={o.baslik}
              style={{
                padding: "24px 20px",
                borderLeft: i > 0 ? "1.5px solid var(--pub-border)" : "none",
                backgroundColor: "var(--pub-surface)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "var(--pub-muted)",
                  marginBottom: 8,
                }}
              >
                {o.baslik}
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 6,
                }}
              >
                {o.deger}
              </p>
              <p style={{ fontSize: 11, color: "var(--pub-muted)", margin: 0 }}>
                {o.aciklama}
              </p>
            </div>
          ))}
        </div>

        {/* Önemli not */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            border: "1.5px solid var(--pub-border)",
            backgroundColor: "var(--pub-surface)",
            fontSize: 12,
            color: "var(--pub-muted)",
            lineHeight: 1.6,
          }}
        >
          💡 <strong style={{ color: "var(--pub-text)" }}>Kayan ücret:</strong> Bazı
          danışmanlar bütçesi sınırlı danışanlar için indirimli ücret uygular.
          Danışman profillerinde "Kayan Ücret" rozetini arayın.
        </div>

        <div style={{ marginTop: 20 }}>
          <Link
            href="/danismanlar"
            style={{
              display: "inline-block",
              padding: "11px 24px",
              backgroundColor: "var(--pub-primary)",
              color: "var(--pub-primary-text)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Danışmanları Gör ve Fiyatları Karşılaştır
          </Link>
        </div>
      </section>

      {/* ── Ödeme & İptal ─────────────────────────────────────── */}
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
          Ödeme ve İptal
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {[
            {
              baslik: "Güvenli Ödeme",
              metin:
                "Ödemeler iyzico altyapısıyla PCI-DSS uyumlu şekilde gerçekleşir. Kart bilgileriniz MindBridger sunucularında saklanmaz.",
            },
            {
              baslik: "Ücretsiz İptal",
              metin:
                "Seans saatinden 24 saat öncesine kadar ücretsiz iptal. İptal durumunda ödeme 3–5 iş günü içinde iade edilir.",
            },
            {
              baslik: "Kabul Edilen Yöntemler",
              metin: "Kredi kartı, banka kartı, sanal kart. Havale/EFT ile ödeme desteklenmez.",
            },
            {
              baslik: "Fatura",
              metin:
                "Her seans sonrası otomatik e-fatura oluşturulur ve hesabınızda görüntülenebilir.",
            },
          ].map((k) => (
            <div
              key={k.baslik}
              style={{
                border: "1.5px solid var(--pub-border)",
                padding: "20px",
                backgroundColor: "var(--pub-surface)",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--pub-text)", marginBottom: 8 }}>
                {k.baslik}
              </p>
              <p style={{ fontSize: 12, color: "var(--pub-muted)", lineHeight: 1.6, margin: 0 }}>
                {k.metin}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Kurumsal ──────────────────────────────────────────── */}
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
            padding: "32px",
            backgroundColor: "var(--pub-surface)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div>
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
              Kurumsal
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--pub-text)",
                margin: "0 0 16px",
              }}
            >
              Çalışanlarınıza Terapi Desteği Sunun
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {KURUMSAL_OZELLIKLER.map((o) => (
                <li key={o} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--pub-text)" }}>
                  <span style={{ color: "var(--pub-primary)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 32 }}>
            <Link
              href="/kurumsal"
              style={{
                display: "inline-block",
                padding: "11px 24px",
                backgroundColor: "var(--pub-primary)",
                color: "var(--pub-primary-text)",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Kurumsal Bilgi Al
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
