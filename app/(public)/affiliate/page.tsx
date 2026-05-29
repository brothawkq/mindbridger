import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate Programı | MindBridger",
  description:
    "MindBridger Affiliate Programı ile her yönlendirdiğiniz seans üzerinden %10 komisyon kazanın. Başvuru ücretsiz, ödeme şeffaf.",
  robots: { index: true, follow: true },
};

const NASIL_CALISIR = [
  {
    numara: "01",
    baslik: "Başvuru Yap",
    aciklama:
      "Hesabınıza giriş yapın ve affiliate başvuru formunu doldurun. Platform bilgilerinizi paylaşın — genellikle 24-48 saat içinde yanıt verilir.",
  },
  {
    numara: "02",
    baslik: "Bağlantını Paylaş",
    aciklama:
      "Onayın ardından size özel referans kodunuz ve izleme bağlantınız oluşturulur. Sosyal medya, blog veya podcastte paylaşın.",
  },
  {
    numara: "03",
    baslik: "Komisyon Kazan",
    aciklama:
      "Referans bağlantınızdan gelen kullanıcı tamamlanmış seans yaptıkça seans bedelinin %10'u hesabınıza tanımlanır.",
  },
  {
    numara: "04",
    baslik: "Ödeme Al",
    aciklama:
      "Aylık minimum ödeme eşiği olan 500 ₺'ye ulaştığınızda IBAN hesabınıza ödeme yapılır. Ödeme her ayın 15'inde işleme girer.",
  },
];

const SARTLAR = [
  { baslik: "Komisyon Oranı", deger: "%10", aciklama: "Tamamlanan her seans üzerinden" },
  { baslik: "Ödeme Eşiği", deger: "500 ₺", aciklama: "Aylık minimum ödeme tutarı" },
  { baslik: "Çerez Süresi", deger: "30 gün", aciklama: "Referans takip penceresi" },
  { baslik: "Ödeme Günü", deger: "Her ayın 15'i", aciklama: "Eşik aşılırsa otomatik ödeme" },
];

const KIMLER_UYGUNDUR = [
  "Psikoloji / PDR blog veya içerik üreticileri",
  "Mental sağlık alanında podcast sunucuları",
  "YouTube'da terapi ve kişisel gelişim içerikleri üretenler",
  "Instagram / TikTok'ta mental sağlık farkındalığı paylaşanlar",
  "Danışmanlık ve koçluk alanında çalışan profesyoneller",
  "Üniversite psikoloji kulüpleri ve öğrenci toplulukları",
];

export default function AffiliatePage() {
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
            Affiliate Programı
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "#F5F7F5", margin: "0 0 16px", lineHeight: 1.2 }}>
            Mental Sağlığa Katkı Sağla, <br />
            %10 Komisyon Kazan
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,247,245,0.75)", maxWidth: 600, lineHeight: 1.7, margin: "0 0 28px" }}>
            MindBridger Affiliate Programı ile kitlenize online terapi hizmetini tanıtın.
            Referans bağlantınızdan gerçekleşen her tamamlanmış seans için gelir elde edin.
            Başvuru tamamen ücretsizdir.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/kayit"
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
              Ücretsiz Başvur
            </Link>
            <Link
              href="/giris"
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
              Giriş Yap ve Başvur
            </Link>
          </div>
        </div>
      </section>

      {/* ── Komisyon Koşulları ────────────────────────────────── */}
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
          Program Koşulları
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            border: "1.5px solid var(--pub-border)",
          }}
        >
          {SARTLAR.map((s, i) => (
            <div
              key={s.baslik}
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
                {s.baslik}
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 6,
                }}
              >
                {s.deger}
              </p>
              <p style={{ fontSize: 11, color: "var(--pub-muted)", margin: 0 }}>
                {s.aciklama}
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
          Nasıl Çalışır?
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1.5px solid var(--pub-border)",
          }}
        >
          {NASIL_CALISIR.map((adim, i) => (
            <div
              key={adim.numara}
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
                  color: "var(--pub-border)",
                  margin: "0 0 12px",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {adim.numara}
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--pub-text)",
                  marginBottom: 8,
                }}
              >
                {adim.baslik}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--pub-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {adim.aciklama}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Kimler Başvurabilir ───────────────────────────────── */}
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
                marginBottom: 16,
              }}
            >
              Kimler Başvurabilir?
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {KIMLER_UYGUNDUR.map((k) => (
                <li
                  key={k}
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 13,
                    color: "var(--pub-text)",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      color: "var(--pub-primary)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {k}
                </li>
              ))}
            </ul>
          </div>
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
              Şeffaf Takip
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--pub-text)",
                marginBottom: 8,
              }}
            >
              Gerçek Zamanlı Panel
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--pub-muted)",
                lineHeight: 1.7,
                margin: "0 0 16px",
              }}
            >
              Affiliate panelinizden tıklama sayısı, dönüşüm oranı, kazanılan komisyon ve
              ödeme geçmişini anlık olarak takip edebilirsiniz.
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--pub-text)",
                marginBottom: 8,
              }}
            >
              Birden Fazla Link
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--pub-muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Farklı kanallar için özel UTM parametreli bağlantılar oluşturabilirsiniz.
              Hangi kanalın en çok dönüşüm sağladığını kolayca analiz edin.
            </p>
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
            backgroundColor: "var(--pub-surface)",
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
                color: "var(--pub-muted)",
                marginBottom: 12,
              }}
            >
              Başlamak İçin
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--pub-text)",
                margin: "0 0 8px",
              }}
            >
              Hesap Oluşturun, Hemen Başvurun
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--pub-muted)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Ücretsiz hesap oluşturun → Affiliate başvurusunu gönderin → Onay sonrası
              referans linkiniz hazır. Sorularınız için:{" "}
              <a
                href="mailto:affiliate@mindbridger.com"
                style={{ color: "var(--pub-text)", fontWeight: 700 }}
              >
                affiliate@mindbridger.com
              </a>
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link
              href="/kayit"
              style={{
                display: "inline-block",
                padding: "13px 28px",
                backgroundColor: "var(--pub-primary)",
                color: "var(--pub-primary-text)",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Ücretsiz Başvur →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
