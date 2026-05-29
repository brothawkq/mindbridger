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
  aliciIsim: string;
  karsiTarafIsim: string;
  tarih: string;
  saat: string;
  seansTuru: string;
  sure: string;
  kalanSure: string;       // "24 saat" | "2 saat" | "15 dakika"
  randevuUrl: string;
  videoUrl?: string;        // Online seans ise aktif link
}

export default function RandevuHatirlama({
  aliciIsim,
  karsiTarafIsim,
  tarih,
  saat,
  seansTuru,
  sure,
  kalanSure,
  randevuUrl,
  videoUrl,
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Randevu hatırlatması — {tarih} {saat} · {kalanSure} kaldı</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={reminderBadge}>⏰ Hatırlatma — {kalanSure}</Text>
            <Heading style={heading}>Randevunuz Yaklaşıyor</Heading>
            <Text style={paragraph}>
              Merhaba {aliciIsim}, <strong>{karsiTarafIsim}</strong> ile randevunuz
              <strong> {kalanSure}</strong> sonra başlayacak.
            </Text>

            <Section style={detailBox}>
              <Text style={detailLabel}>RANDEVU BİLGİLERİ</Text>
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
            </Section>

            {videoUrl && seansTuru === "Online" && (
              <>
                <Section style={buttonSection}>
                  <Button style={buttonPrimary} href={videoUrl}>
                    Görüşmeye Katıl →
                  </Button>
                </Section>
                <Text style={noteText}>
                  Bağlantı randevu saatinden 10 dakika önce aktif olur.
                </Text>
              </>
            )}

            {!videoUrl && (
              <Section style={buttonSection}>
                <Button style={buttonPrimary} href={randevuUrl}>
                  Randevuyu Görüntüle
                </Button>
              </Section>
            )}

            <Text style={paragraph}>
              Randevuya katılamayacaksanız en kısa sürede{" "}
              <Link href={randevuUrl} style={linkStyle}>
                iptal edin
              </Link>
              . Geç iptal veya gelmeme durumunda ücret iadesi yapılmayabilir.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              Hatırlatma e-postalarını kapatmak için{" "}
              <Link
                href="https://mindbridger.com/panelim/profil"
                style={footerLink}
              >
                bildirim tercihlerinizi
              </Link>{" "}
              güncelleyebilirsiniz.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

RandevuHatirlama.PreviewProps = {
  aliciIsim: "Canan Yıldız",
  karsiTarafIsim: "Dr. Berke Doğan",
  tarih: "20 Haziran 2026",
  saat: "15:00",
  seansTuru: "Online",
  sure: "50 dakika",
  kalanSure: "2 saat",
  randevuUrl: "https://mindbridger.com/panelim/randevularim/xyz456",
  videoUrl: "https://mindbridge.daily.co/room-abc",
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

const reminderBadge: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#BDBDBD",
  letterSpacing: "0.8px",
  margin: "0 0 8px",
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

const buttonSection: React.CSSProperties = {
  margin: "20px 0",
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
};

const noteText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0 0 12px",
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
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#BDBDBD",
  textDecoration: "underline",
};
