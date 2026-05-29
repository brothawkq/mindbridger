import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  isim: string;
}

export default function DanisanKayitOnayBekliyorMail({ isim }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Danışman başvurunuz alındı — inceleme sürecindeyiz</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Brand */}
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Başvurunuz Alındı</Heading>
            <Text style={paragraph}>Merhaba {isim},</Text>
            <Text style={paragraph}>
              MindBridger'a danışman olarak başvurduğunuz için teşekkür ederiz.
              Başvurunuz başarıyla alındı ve inceleme sürecine alındı.
            </Text>

            <Section style={infoBox}>
              <Text style={infoLabel}>SÜRECİNİZ</Text>
              <Text style={infoItem}>
                ✓ Başvurunuz sisteme kaydedildi
              </Text>
              <Text style={infoItem}>
                ◦ Belgeleriniz ve bilgileriniz inceleniyor (24–48 saat)
              </Text>
              <Text style={infoItem}>
                ◦ Onay sonrası giriş yapabilir ve profilinizi oluşturabilirsiniz
              </Text>
            </Section>

            <Text style={paragraph}>
              İnceleme sürecinde ek bilgi veya belge talep edebiliriz. Bu
              durumda size ayrıca e-posta göndereceğiz.
            </Text>
            <Text style={paragraph}>
              Onay sonrası giriş sayfasından{" "}
              <Link href="https://mindbridger.com/giris" style={linkStyle}>
                hesabınıza erişebilirsiniz
              </Link>
              .
            </Text>
            <Text style={paragraph}>
              Sorularınız için{" "}
              <Link href="mailto:destek@mindbridger.com" style={linkStyle}>
                destek@mindbridger.com
              </Link>{" "}
              adresine yazabilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              Bu e-postayı siz talep etmediyseniz güvenle görmezden
              gelebilirsiniz.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

DanisanKayitOnayBekliyorMail.PreviewProps = {
  isim: "Dr. Mehmet Yılmaz",
} satisfies Props;

// Styles
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

const infoBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px solid #E0E0E0",
  padding: "16px 20px",
  margin: "20px 0",
};

const infoLabel: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#BDBDBD",
  textTransform: "uppercase",
  margin: "0 0 10px",
};

const infoItem: React.CSSProperties = {
  fontSize: "13px",
  color: "#212121",
  lineHeight: "1.6",
  margin: "0 0 6px",
};

const linkStyle: React.CSSProperties = {
  color: "#212121",
  fontWeight: "700",
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
