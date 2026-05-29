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
  musteriIsim: string;
  danisanIsim: string;
  tarih: string;
  saat: string;
  seansTuru: string;
  tutar: string;            // "800 TL"
  faturaNo: string;         // "MBR-2026-000123"
  faturaUrl: string;        // Signed URL for PDF
  randevuUrl: string;
}

export default function OdemeOnayMail({
  musteriIsim,
  danisanIsim,
  tarih,
  saat,
  seansTuru,
  tutar,
  faturaNo,
  faturaUrl,
  randevuUrl,
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Ödeme onaylandı — {faturaNo} · {tutar}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          {/* Banner */}
          <Section style={bannerSection}>
            <Text style={bannerText}>✓ Ödeme Başarıyla Tamamlandı</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Ödeme Onayı</Heading>
            <Text style={paragraph}>
              Merhaba {musteriIsim}, ödemeniz başarıyla alındı.
              Randevunuz onay için danışmanınıza iletildi.
            </Text>

            {/* Ödeme Detayları */}
            <Section style={detailBox}>
              <Text style={detailLabel}>ÖDEME DETAYLARI</Text>
              <Row style={detailRow}>
                <Column style={detailKey}>Fatura No</Column>
                <Column style={detailValue}>{faturaNo}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Danışman</Column>
                <Column style={detailValue}>{danisanIsim}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Tarih</Column>
                <Column style={detailValue}>{tarih}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Saat</Column>
                <Column style={detailValue}>{saat} (UTC+3)</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Seans Türü</Column>
                <Column style={detailValue}>{seansTuru}</Column>
              </Row>
              <Row style={detailRowLast}>
                <Column style={detailKey}>Tutar</Column>
                <Column style={detailValueBold}>{tutar}</Column>
              </Row>
            </Section>

            {/* Fatura PDF */}
            <Section style={invoiceSection}>
              <Text style={invoiceTitle}>Faturanız Hazır</Text>
              <Text style={invoiceDesc}>
                Faturanız bu e-postaya ek olarak oluşturulmuştur.
                Ayrıca aşağıdaki bağlantıdan da indirebilirsiniz.
              </Text>
              <Link href={faturaUrl} style={invoiceLink}>
                📄 Faturayı İndir (PDF)
              </Link>
            </Section>

            {/* CTA */}
            <Section style={buttonSection}>
              <Button style={button} href={randevuUrl}>
                Randevumu Görüntüle
              </Button>
            </Section>

            <Text style={noteText}>
              İade talepleri için randevu saatinden 24 saat öncesine kadar{" "}
              <Link href={randevuUrl} style={linkStyle}>
                panelimden
              </Link>{" "}
              veya{" "}
              <Link href="mailto:destek@mindbridger.com" style={linkStyle}>
                destek@mindbridger.com
              </Link>{" "}
              adresi üzerinden başvurabilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              Bu e-posta ödeme belgesi niteliği taşımaktadır. Fatura eki yasal geçerliliğe
              sahiptir.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

OdemeOnayMail.PreviewProps = {
  musteriIsim: "Baran Yılmaz",
  danisanIsim: "Dr. Selin Kaya",
  tarih: "22 Haziran 2026",
  saat: "11:00",
  seansTuru: "Online",
  tutar: "800 TL",
  faturaNo: "MBR-2026-000123",
  faturaUrl: "https://mindbridger.com/api/fatura/xyz/pdf",
  randevuUrl: "https://mindbridger.com/panelim/randevularim/xyz456",
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

const bannerSection: React.CSSProperties = {
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
  width: "100px",
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

const invoiceSection: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px solid #E0E0E0",
  padding: "14px 16px",
  margin: "16px 0",
};

const invoiceTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#212121",
  margin: "0 0 4px",
};

const invoiceDesc: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0 0 8px",
};

const invoiceLink: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  textDecoration: "underline",
};

const buttonSection: React.CSSProperties = {
  margin: "20px 0",
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
