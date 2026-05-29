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
  panelUrl: string;
}

export default function DanisanOnayMail({ isim, panelUrl }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Danışman başvurunuz onaylandı — MindBridger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          {/* Status banner */}
          <Section style={bannerSection}>
            <Text style={bannerText}>✓ Başvurunuz Onaylandı</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Tebrikler, {isim}!</Heading>
            <Text style={paragraph}>
              Danışman başvurunuz incelenmiş ve onaylanmıştır. Artık MindBridger
              platformunda aktif bir danışman olarak yer alabilirsiniz.
            </Text>

            <Text style={paragraph}>
              Başlamak için profilinizi tamamlayın ve müsaitlik takviminizi ayarlayın.
              Profiliniz %100 tamamlanmadan platformda görünür olmayacağınızı hatırlatırız.
            </Text>

            <Section style={checkList}>
              <Text style={checkItem}>→ Profil bilgilerinizi güncelleyin</Text>
              <Text style={checkItem}>→ Müsaitlik takviminizi ayarlayın</Text>
              <Text style={checkItem}>→ Banka bilgilerinizi doğrulayın</Text>
              <Text style={checkItem}>→ Profilinizi yayına alın</Text>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={panelUrl}>
                Danışman Paneline Git
              </Button>
            </Section>

            <Text style={paragraph}>
              Herhangi bir sorunuz için{" "}
              <Link href="mailto:destek@mindbridger.com" style={linkStyle}>
                destek@mindbridger.com
              </Link>{" "}
              adresine yazabilirsiniz.
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

DanisanOnayMail.PreviewProps = {
  isim: "Dr. Mehmet Yılmaz",
  panelUrl: "https://mindbridger.com/danisan/dashboard",
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

const checkList: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px solid #E0E0E0",
  padding: "12px 16px",
  margin: "16px 0",
};

const checkItem: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  margin: "0 0 6px",
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
