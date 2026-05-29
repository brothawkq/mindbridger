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
  sonRandevuTarih: string;   // "2 ay önce"
  danisanIsim?: string;      // Son çalışılan danışman varsa
  oneriler?: string[];       // Maksimum 3 öneri
}

export default function ChurnMail({
  isim,
  sonRandevuTarih,
  danisanIsim,
  oneriler = [],
}: Props) {
  return (
    <Html lang="tr">
      <Head />
      <Preview>Sizi özledik, {isim} — MindBridger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>Sizi Özledik</Heading>
            <Text style={paragraph}>Merhaba {isim},</Text>
            <Text style={paragraph}>
              Son randevunuzdan bu yana {sonRandevuTarih} geçti.
              {danisanIsim
                ? ` ${danisanIsim} ile çalışmayı sürdürmek ister misiniz?`
                : " Kendinize iyi bakmayı unutmayın."}
            </Text>

            <Text style={paragraph}>
              Ruh sağlığınız için düzenli seans almak büyük fark yaratır.
              Dilediğiniz zaman kaldığınız yerden devam edebilirsiniz.
            </Text>

            {oneriler.length > 0 && (
              <Section style={tipBox}>
                <Text style={tipLabel}>HATIRLATMA</Text>
                {oneriler.map((oneri, i) => (
                  <Text key={i} style={tipItem}>
                    → {oneri}
                  </Text>
                ))}
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={buttonPrimary} href="https://mindbridger.com/panelim/randevularim">
                Randevu Al
              </Button>
            </Section>

            <Text style={noteText}>
              Bildirim almak istemiyorsanız{" "}
              <Link href="https://mindbridger.com/panelim/profil" style={linkStyle}>
                bildirim tercihlerinizi
              </Link>{" "}
              güncelleyebilirsiniz.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} MindBridger. Tüm hakları saklıdır.
            </Text>
            <Text style={footerText}>
              <Link
                href="https://mindbridger.com/abonelik-iptal"
                style={footerLink}
              >
                Aboneliği iptal et
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ChurnMail.PreviewProps = {
  isim: "Sevgili Kullanıcı",
  sonRandevuTarih: "2 ay",
  danisanIsim: "Dr. Mert Aslan",
  oneriler: [
    "Düzenli seans almak kaygıyı %40 azaltır",
    "Haftalık 50 dakika büyük fark yaratır",
    "Paket satın alarak tasarruf edebilirsiniz",
  ],
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

const tipBox: React.CSSProperties = {
  backgroundColor: "#F5F5F5",
  border: "1.5px solid #E0E0E0",
  padding: "12px 16px",
  margin: "16px 0",
};

const tipLabel: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: "700",
  color: "#BDBDBD",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const tipItem: React.CSSProperties = {
  fontSize: "12px",
  color: "#212121",
  margin: "0 0 4px",
};

const buttonSection: React.CSSProperties = {
  margin: "24px 0",
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
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#BDBDBD",
  textDecoration: "underline",
};
