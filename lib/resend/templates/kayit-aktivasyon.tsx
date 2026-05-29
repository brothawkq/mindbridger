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
  Section,
  Text,
} from "@react-email/components";

interface Props {
  isim: string;
  aktivasyonUrl: string;
}

export default function KayitAktivasyonMail({ isim, aktivasyonUrl }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>MindBridger hesabınızı etkinleştirin</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Brand */}
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>E-posta Adresinizi Doğrulayın</Heading>
            <Text style={paragraph}>Merhaba {isim},</Text>
            <Text style={paragraph}>
              MindBridger'a hoş geldiniz! Hesabınızı etkinleştirmek için aşağıdaki
              butona tıklayın. Bu bağlantı <strong>24 saat</strong> geçerlidir.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={aktivasyonUrl}>
                Hesabımı Etkinleştir
              </Button>
            </Section>

            <Text style={smallText}>
              Butona tıklayamıyorsanız aşağıdaki bağlantıyı tarayıcınıza kopyalayın:
            </Text>
            <Link href={aktivasyonUrl} style={linkStyle}>
              {aktivasyonUrl}
            </Link>

            <Text style={paragraph}>
              Bu e-postayı siz talep etmediyseniz güvenle görmezden gelebilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              Bu e-postayı almak istemiyorsanız{" "}
              <Link href="https://mindbridger.com/abonelik-iptal" style={footerLink}>
                aboneliğinizi iptal edebilirsiniz
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

KayitAktivasyonMail.PreviewProps = {
  isim: "Ayşe Kaya",
  aktivasyonUrl: "https://mindbridger.com/e-posta-dogrulama?token=abc123",
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

const buttonSection: React.CSSProperties = {
  margin: "24px 0",
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

const smallText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0 0 6px",
};

const linkStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#212121",
  wordBreak: "break-all",
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
