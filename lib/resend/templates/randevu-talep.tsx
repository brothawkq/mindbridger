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
  danisanIsim: string;
  musteriIsim: string;
  tarih: string;        // "15 Haziran 2026"
  saat: string;         // "14:00"
  seansTuru: string;    // "Online / Yüz Yüze"
  sure: string;         // "50 dakika"
  fiyat: string;        // "800 TL"
  onayUrl: string;
  redUrl: string;
}

export default function RandevuTalepMail({
  danisanIsim,
  musteriIsim,
  tarih,
  saat,
  seansTuru,
  sure,
  fiyat,
  onayUrl,
  redUrl,
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Yeni randevu talebi: {musteriIsim} — {tarih} {saat}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>Yeni Randevu Talebi</Heading>
            <Text style={paragraph}>
              Sayın {danisanIsim}, <strong>{musteriIsim}</strong> size randevu talebi
              gönderdi.
            </Text>

            {/* Randevu Detayları */}
            <Section style={detailBox}>
              <Text style={detailLabel}>RANDEVU DETAYLARI</Text>
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
              <Row style={detailRow}>
                <Column style={detailKey}>Süre</Column>
                <Column style={detailValue}>{sure}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Ücret</Column>
                <Column style={detailValue}><strong>{fiyat}</strong></Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              Talebi onaylamak veya reddetmek için aşağıdaki butonları kullanabilir ya
              da{" "}
              <Link href="https://mindbridger.com/danisan/randevular" style={linkStyle}>
                danışman panelinizden
              </Link>{" "}
              işlem yapabilirsiniz.
            </Text>

            {/* Aksiyon Butonları */}
            <Row style={actionRow}>
              <Column>
                <Button style={buttonPrimary} href={onayUrl}>
                  Onayla
                </Button>
              </Column>
              <Column>
                <Button style={buttonOutline} href={redUrl}>
                  Reddet
                </Button>
              </Column>
            </Row>

            <Text style={noteText}>
              Bu talebi 48 saat içinde yanıtlamazsanız otomatik olarak iptal edilecektir.
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

RandevuTalepMail.PreviewProps = {
  danisanIsim: "Dr. Zeynep Arslan",
  musteriIsim: "Fatih Öztürk",
  tarih: "15 Haziran 2026",
  saat: "14:00",
  seansTuru: "Online",
  sure: "50 dakika",
  fiyat: "800 TL",
  onayUrl: "https://mindbridger.com/api/randevular/abc123/onayla",
  redUrl: "https://mindbridger.com/api/randevular/abc123/reddet",
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

const detailKey: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  width: "100px",
};

const detailValue: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
};

const actionRow: React.CSSProperties = {
  margin: "24px 0 16px",
};

const buttonPrimary: React.CSSProperties = {
  backgroundColor: "#212121",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "700",
  padding: "11px 24px",
  textDecoration: "none",
  display: "inline-block",
  borderRadius: "0",
  marginRight: "12px",
};

const buttonOutline: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  color: "#212121",
  fontSize: "13px",
  fontWeight: "700",
  padding: "9px 22px",
  textDecoration: "none",
  display: "inline-block",
  borderRadius: "0",
  border: "1.5px solid #212121",
};

const noteText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0",
  fontStyle: "italic",
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
