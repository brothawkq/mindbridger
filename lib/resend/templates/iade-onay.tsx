import {
  Body,
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
  musteriIsim: string;
  faturaNo: string;
  randevuTarih: string;
  iadeTutar: string;       // "800 TL" veya "400 TL (kısmi)"
  iadeYontemi: string;     // "Kredi Kartı"
  iadeGun: number;         // Beklenen iş günü
  sebep?: string;
}

export default function IadeOnayMail({
  musteriIsim,
  faturaNo,
  randevuTarih,
  iadeTutar,
  iadeYontemi,
  iadeGun,
  sebep,
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>İade işleminiz başlatıldı — {iadeTutar} · {faturaNo}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>İade Onayı</Heading>
            <Text style={paragraph}>
              Merhaba {musteriIsim}, iade talebiniz onaylandı ve işlem başlatıldı.
            </Text>

            <Section style={detailBox}>
              <Text style={detailLabel}>İADE BİLGİLERİ</Text>
              <Row style={detailRow}>
                <Column style={detailKey}>Fatura No</Column>
                <Column style={detailValue}>{faturaNo}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Randevu Tarihi</Column>
                <Column style={detailValue}>{randevuTarih}</Column>
              </Row>
              {sebep && (
                <Row style={detailRow}>
                  <Column style={detailKey}>Sebep</Column>
                  <Column style={detailValue}>{sebep}</Column>
                </Row>
              )}
              <Row style={detailRowLast}>
                <Column style={detailKey}>İade Tutarı</Column>
                <Column style={detailValueBold}>{iadeTutar}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>İade Yöntemi</Column>
                <Column style={detailValue}>{iadeYontemi}</Column>
              </Row>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                ⏳ İade tutarı, ödeme yönteminize bağlı olarak{" "}
                <strong>{iadeGun} iş günü</strong> içinde hesabınıza yansıyacaktır.
              </Text>
            </Section>

            <Text style={paragraph}>
              İade sürecinizle ilgili soru veya sorunlarınız için{" "}
              <Link href="mailto:destek@mindbridger.com" style={linkStyle}>
                destek@mindbridger.com
              </Link>{" "}
              adresine yazabilirsiniz.
            </Text>

            <Text style={noteText}>
              İade politikamız hakkında daha fazla bilgi almak için{" "}
              <Link
                href="https://mindbridger.com/iade-politikasi"
                style={linkStyle}
              >
                iade politikamızı
              </Link>{" "}
              inceleyebilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

IadeOnayMail.PreviewProps = {
  musteriIsim: "Derya Şahin",
  faturaNo: "MBR-2026-000456",
  randevuTarih: "25 Haziran 2026",
  iadeTutar: "800 TL",
  iadeYontemi: "Kredi Kartı",
  iadeGun: 5,
  sebep: "Danışman tarafından iptal edildi",
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
  padding: "20px 24px 16px",
};

const brandText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#212121",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderTop: "1.5px solid #212121",
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
  marginBottom: "4px",
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

const detailValueBold: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#212121",
};

const infoBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px solid #E0E0E0",
  padding: "10px 14px",
  margin: "16px 0",
};

const infoText: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  margin: "0",
  lineHeight: "1.6",
};

const noteText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0",
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
  margin: "0",
};
