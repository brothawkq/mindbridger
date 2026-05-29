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
  danisanUnvan: string;
  tarih: string;
  saat: string;
  seansTuru: string;
  sure: string;
  fiyat: string;
  randevuUrl: string;
}

export default function RandevuOnayMail({
  musteriIsim,
  danisanIsim,
  danisanUnvan,
  tarih,
  saat,
  seansTuru,
  sure,
  fiyat,
  randevuUrl,
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Randevunuz onaylandı — {tarih} {saat}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          {/* Onay Banner */}
          <Section style={bannerSection}>
            <Text style={bannerText}>✓ Randevunuz Onaylandı</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Randevu Detayları</Heading>
            <Text style={paragraph}>
              Merhaba {musteriIsim}, randevunuz <strong>{danisanIsim}</strong>{" "}
              tarafından onaylandı.
            </Text>

            {/* Detay Tablosu */}
            <Section style={detailBox}>
              <Text style={detailLabel}>RANDEVU BİLGİLERİ</Text>
              <Row style={detailRow}>
                <Column style={detailKey}>Danışman</Column>
                <Column style={detailValue}>
                  {danisanIsim}
                  {danisanUnvan ? ` — ${danisanUnvan}` : ""}
                </Column>
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
              <Row style={detailRow}>
                <Column style={detailKey}>Süre</Column>
                <Column style={detailValue}>{sure}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailKey}>Ücret</Column>
                <Column style={detailValue}><strong>{fiyat}</strong></Column>
              </Row>
            </Section>

            {seansTuru === "Online" && (
              <Section style={infoBox}>
                <Text style={infoText}>
                  💻 Görüşme bağlantısı randevu saatinden <strong>10 dakika önce</strong>{" "}
                  aktif olacaktır. Randevunuzu{" "}
                  <Link href={randevuUrl} style={linkStyle}>
                    panelimden
                  </Link>{" "}
                  takip edebilirsiniz.
                </Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={randevuUrl}>
                Randevumu Görüntüle
              </Button>
            </Section>

            <Text style={noteText}>
              Randevuyu iptal etmek isterseniz en az 24 saat öncesinde{" "}
              <Link href={randevuUrl} style={linkStyle}>
                panel üzerinden
              </Link>{" "}
              işlem yapabilirsiniz.
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

RandevuOnayMail.PreviewProps = {
  musteriIsim: "Emre Çelik",
  danisanIsim: "Dr. Selin Kaya",
  danisanUnvan: "Psikolog",
  tarih: "18 Haziran 2026",
  saat: "10:00",
  seansTuru: "Online",
  sure: "50 dakika",
  fiyat: "750 TL",
  randevuUrl: "https://mindbridger.com/panelim/randevularim/abc123",
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

const detailKey: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  width: "100px",
};

const detailValue: React.CSSProperties = {
  fontSize: "12px",
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
