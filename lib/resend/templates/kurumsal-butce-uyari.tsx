import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  yoneticiIsim: string;
  firmaAdi: string;
  donem: string;            // "Haziran 2026"
  toplamButce: string;      // "50.000 TL"
  kullanilanButce: string;  // "42.000 TL"
  kalanButce: string;       // "8.000 TL"
  kullanimYuzde: number;    // 84
  uyariEsik: number;        // 80 (%)
  panelUrl: string;
}

export default function KurumsalButceUyariMail({
  yoneticiIsim,
  firmaAdi,
  donem,
  toplamButce,
  kullanilanButce,
  kalanButce,
  kullanimYuzde,
  uyariEsik,
  panelUrl,
}: Props) {
  const kritik = kullanimYuzde >= 90;

  return (
    <Html lang="tr">
      <Head />
      <Preview>
        {`${kritik ? "⚠ Kritik: " : ""}Bütçe uyarısı — ${firmaAdi} · ${kullanimYuzde}% kullanıldı`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
            <Text style={brandSub}>Kurumsal Panel</Text>
          </Section>

          <Hr style={divider} />

          {/* Uyarı Banner */}
          <Section style={kritik ? bannerCritical : bannerWarning}>
            <Text style={bannerText}>
              {kritik ? "⚠ KRİTİK: " : "⚠ "}Bütçe Kullanım Uyarısı — %{kullanimYuzde}
            </Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Bütçe Kullanım Bildirimi</Heading>
            <Text style={paragraph}>Sayın {yoneticiIsim},</Text>
            <Text style={paragraph}>
              <strong>{firmaAdi}</strong> şirketinizin {donem} dönemi kurumsal sağlık
              bütçesi, belirlenen uyarı eşiği olan <strong>%{uyariEsik}</strong>'e
              ulaşmıştır.
            </Text>

            {/* Bütçe Özeti */}
            <Section style={detailBox}>
              <Text style={detailLabel}>BÜTÇE ÖZETİ — {donem}</Text>
              <Row style={detailRow}>
                <Column style={detailKey}>Toplam Bütçe</Column>
                <Column style={detailValue}>{toplamButce}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Kullanılan</Column>
                <Column style={detailValue}>{kullanilanButce}</Column>
              </Row>
              <Row style={detailRowLast}>
                <Column style={detailKey}>Kalan</Column>
                <Column style={kritik ? detailValueCritical : detailValueWarn}>
                  {kalanButce}
                </Column>
              </Row>
            </Section>

            {/* Progress Bar (text-based) */}
            <Section style={progressSection}>
              <Text style={progressLabel}>%{kullanimYuzde} kullanıldı</Text>
              <Section style={progressBg}>
                <Section
                  style={{
                    ...progressFill,
                    width: `${Math.min(kullanimYuzde, 100)}%`,
                    backgroundColor: kritik ? "#212121" : "#212121",
                  }}
                >
                  <Text style={progressFillText}>&nbsp;</Text>
                </Section>
              </Section>
            </Section>

            {kritik && (
              <Section style={criticalBox}>
                <Text style={criticalText}>
                  Mevcut kullanım hızıyla bütçeniz ay sonundan önce tükenebilir.
                  Bütçeyi artırmak veya kullanım politikasını gözden geçirmek için
                  lütfen paneli inceleyin.
                </Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={panelUrl}>
                Kurumsal Panele Git
              </Button>
            </Section>

            <Text style={noteText}>
              Bütçe ayarlarını ve uyarı eşiklerini{" "}
              <Link href={panelUrl} style={linkStyle}>
                kurumsal panel üzerinden
              </Link>{" "}
              yönetebilirsiniz. Sorularınız için{" "}
              <Link href="mailto:kurumsal@mindbridger.com" style={linkStyle}>
                kurumsal@mindbridger.com
              </Link>{" "}
              adresine yazın.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              Bu e-posta {firmaAdi} hesabı için otomatik gönderilmiştir.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

KurumsalButceUyariMail.PreviewProps = {
  yoneticiIsim: "Gökhan Boz",
  firmaAdi: "Teknoloji A.Ş.",
  donem: "Haziran 2026",
  toplamButce: "50.000 TL",
  kullanilanButce: "42.000 TL",
  kalanButce: "8.000 TL",
  kullanimYuzde: 84,
  uyariEsik: 80,
  panelUrl: "https://mindbridger.com/kurumsal-panel/butce",
} satisfies Props;

const main: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  fontFamily: "system-ui, Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#FFFFFF",
  border: "1.5px solid #E0E0E0",
};

const brandSection: React.CSSProperties = {
  padding: "16px 24px 12px",
};

const brandText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#212121",
  margin: "0",
};

const brandSub: React.CSSProperties = {
  fontSize: "10px",
  color: "#BDBDBD",
  margin: "2px 0 0",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
};

const divider: React.CSSProperties = {
  borderTop: "1.5px solid #212121",
  margin: "0",
};

const bannerWarning: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  borderLeft: "4px solid #212121",
  padding: "10px 24px",
};

const bannerCritical: React.CSSProperties = {
  backgroundColor: "#212121",
  padding: "10px 24px",
};

const bannerText: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#FFFFFF",
  margin: "0",
};

const contentSection: React.CSSProperties = {
  padding: "28px 24px",
};

const heading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#212121",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "13px",
  color: "#212121",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const detailBox: React.CSSProperties = {
  border: "1.5px solid #E0E0E0",
  padding: "12px 16px",
  margin: "16px 0",
};

const detailLabel: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: "700",
  color: "#BDBDBD",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const detailRow: React.CSSProperties = {
  marginBottom: "4px",
};

const detailRowLast: React.CSSProperties = {
  borderTop: "1px solid #E0E0E0",
  paddingTop: "8px",
  marginTop: "4px",
};

const detailKey: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  width: "120px",
};

const detailValue: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
};

const detailValueWarn: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#212121",
};

const detailValueCritical: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#212121",
};

const progressSection: React.CSSProperties = {
  margin: "16px 0",
};

const progressLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0 0 4px",
};

const progressBg: React.CSSProperties = {
  backgroundColor: "#E0E0E0",
  border: "1px solid #BDBDBD",
  height: "8px",
};

const progressFill: React.CSSProperties = {
  height: "8px",
  backgroundColor: "#212121",
};

const progressFillText: React.CSSProperties = {
  fontSize: "1px",
  color: "transparent",
  margin: "0",
};

const criticalBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  borderLeft: "3px solid #212121",
  padding: "10px 14px",
  margin: "16px 0",
};

const criticalText: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  margin: "0",
  lineHeight: "1.6",
};

const buttonSection: React.CSSProperties = {
  margin: "24px 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#212121",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "700",
  padding: "11px 24px",
  textDecoration: "none",
  display: "inline-block",
  borderRadius: "0",
};

const noteText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0",
  lineHeight: "1.6",
};

const linkStyle: React.CSSProperties = {
  color: "#212121",
  textDecoration: "underline",
};

const footer: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#F5F5F5",
};

const footerText: React.CSSProperties = {
  fontSize: "10px",
  color: "#BDBDBD",
  margin: "0 0 4px",
};
