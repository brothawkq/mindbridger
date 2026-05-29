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
  sifirlamaUrl: string;
}

export default function SifreSifirla({ isim, sifirlamaUrl }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Şifre sıfırlama isteği — MindBridger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>Şifrenizi Sıfırlayın</Heading>
            <Text style={paragraph}>Merhaba {isim},</Text>
            <Text style={paragraph}>
              MindBridger hesabınız için şifre sıfırlama isteği aldık. Yeni
              şifrenizi belirlemek için aşağıdaki butona tıklayın.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={sifirlamaUrl}>
                Şifremi Sıfırla
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠ Bu bağlantı <strong>1 saat</strong> geçerlidir. Süre dolduktan
                sonra yeni bir istek oluşturmanız gerekecektir.
              </Text>
            </Section>

            <Text style={smallText}>
              Butona tıklayamıyorsanız aşağıdaki bağlantıyı kopyalayın:
            </Text>
            <Link href={sifirlamaUrl} style={linkBreak}>
              {sifirlamaUrl}
            </Link>

            <Text style={noteText}>
              Bu isteği siz yapmadıysanız e-postayı güvenle silebilirsiniz.
              Hesabınıza yetkisiz erişim şüpheniz varsa{" "}
              <Link href="mailto:destek@mindbridger.com" style={linkStyle}>
                bize bildirin
              </Link>
              .
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

SifreSifirla.PreviewProps = {
  isim: "Hasan Kılıç",
  sifirlamaUrl:
    "https://mindbridger.com/sifremi-sifirla?token=xyz&type=recovery",
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

const warningBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px dashed #BDBDBD",
  padding: "10px 14px",
  margin: "0 0 16px",
};

const warningText: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  margin: "0",
};

const smallText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0 0 6px",
};

const linkBreak: React.CSSProperties = {
  fontSize: "11px",
  color: "#212121",
  wordBreak: "break-all",
  display: "block",
  marginBottom: "16px",
};

const noteText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BDBDBD",
  margin: "0",
  lineHeight: "1.6",
};

const linkStyle: React.CSSProperties = {
  color: "#BDBDBD",
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
