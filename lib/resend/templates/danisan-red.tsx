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
  gerekcesi: string;
}

export default function DanisanRedMail({ isim, gerekcesi }: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Danışman başvurunuz hakkında bilgilendirme — MindBridger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>Başvurunuz Hakkında</Heading>
            <Text style={paragraph}>Sayın {isim},</Text>
            <Text style={paragraph}>
              MindBridger platformuna yaptığınız danışman başvurusunu inceledik.
              Maalesef bu aşamada başvurunuzu kabul edemiyoruz.
            </Text>

            <Section style={reasonBox}>
              <Text style={reasonLabel}>DEĞERLENDİRME NOTU</Text>
              <Text style={reasonText}>{gerekcesi}</Text>
            </Section>

            <Text style={paragraph}>
              Eksikliklerinizi giderdikten sonra yeniden başvurabilirsiniz. Başvurunuzu
              güncellemek için{" "}
              <Link href="https://mindbridger.com/danisan-kayit" style={linkStyle}>
                danışman kayıt sayfasını
              </Link>{" "}
              ziyaret edebilirsiniz.
            </Text>

            <Text style={paragraph}>
              Daha fazla bilgi için{" "}
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

DanisanRedMail.PreviewProps = {
  isim: "Dr. Ali Demir",
  gerekcesi:
    "Sunulan belgelerin doğrulanması için ek diploma veya sertifika kopyası gerekmektedir.",
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

const reasonBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  borderLeft: "3px solid #212121",
  padding: "12px 16px",
  margin: "16px 0",
};

const reasonLabel: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: "700",
  color: "#BDBDBD",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const reasonText: React.CSSProperties = {
  fontSize: "13px",
  color: "#212121",
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
  margin: "0",
};
