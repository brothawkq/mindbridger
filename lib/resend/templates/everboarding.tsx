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

type EverboardingAdim =
  | "ilk_giris"
  | "profil_eksik"
  | "ilk_randevu"
  | "ilk_seans_tamamlandi"
  | "test_oner"
  | "gunluk_oner"
  | "blog_oner";

interface AdimIcerik {
  baslik: string;
  mesaj: string;
  ctaMetin: string;
  ctaUrl: string;
  ipucuListesi?: string[];
}

const ADIM_ICERIGI: Record<EverboardingAdim, AdimIcerik> = {
  ilk_giris: {
    baslik: "MindBridger'a Hoş Geldiniz",
    mesaj:
      "Hesabınız hazır! İlk adımınızı atmak için size uygun bir danışman bulmak yalnızca birkaç tık uzağınızda.",
    ctaMetin: "Danışman Bul",
    ctaUrl: "https://mindbridger.com/danismanlar",
    ipucuListesi: [
      "AI eşleştirme ile size en uygun danışmanı bulun",
      "Ücretsiz tanışma seansı sunan danışmanlarla başlayın",
      "Psikolojik testlerle kendinizi daha iyi tanıyın",
    ],
  },
  profil_eksik: {
    baslik: "Profilinizi Tamamlayın",
    mesaj:
      "Daha iyi bir deneyim için profilinizi tamamlamanızı öneririz. Bu sayede danışmanınız sizi daha iyi tanıyabilir.",
    ctaMetin: "Profilimi Tamamla",
    ctaUrl: "https://mindbridger.com/panelim/profil",
    ipucuListesi: [
      "Seans hedeflerinizi belirtin",
      "İletişim tercihlerinizi ayarlayın",
      "KVKK onayınızı güncelleyin",
    ],
  },
  ilk_randevu: {
    baslik: "İlk Randevunuzu Alın",
    mesaj:
      "Danışmanlarımızı inceleyip ilk randevunuzu kolayca alabilirsiniz. İlk seans genellikle tanışma ve hedef belirleme üzerine geçer.",
    ctaMetin: "Randevu Al",
    ctaUrl: "https://mindbridger.com/danismanlar",
  },
  ilk_seans_tamamlandi: {
    baslik: "İlk Seansınız Tamamlandı",
    mesaj:
      "Harika bir adım attınız! Düzenli seanslar ile sürecinizi daha etkin yönetebilirsiniz. Bir sonraki randevunuzu almayı unutmayın.",
    ctaMetin: "Randevu Al",
    ctaUrl: "https://mindbridger.com/panelim/randevularim",
    ipucuListesi: [
      "Ödevlerinizi takip edin",
      "Ruh hali günlüğü tutmaya başlayın",
      "Danışmanınızla mesajlaşarak iletişimi sürdürün",
    ],
  },
  test_oner: {
    baslik: "Kendinizi Tanıyın",
    mesaj:
      "Platformumuzda profesyonelce hazırlanmış psikolojik testler bulunmaktadır. Sonuçlarınızı danışmanınızla paylaşarak süreci hızlandırabilirsiniz.",
    ctaMetin: "Testlere Git",
    ctaUrl: "https://mindbridger.com/testler",
  },
  gunluk_oner: {
    baslik: "Ruh Hali Günlüğünüzü Tutun",
    mesaj:
      "Günlük ruh hali kaydı tutmak duygusal farkındalığınızı artırır ve danışmanınızın sizi daha iyi anlamasına yardımcı olur.",
    ctaMetin: "Günlük Yaz",
    ctaUrl: "https://mindbridger.com/panelim/gunluk",
  },
  blog_oner: {
    baslik: "Uzman İçeriklerini Keşfedin",
    mesaj:
      "Danışmanlarımız tarafından yazılan blog yazıları ruh sağlığı konusunda değerli bilgiler sunmaktadır.",
    ctaMetin: "Blog'a Git",
    ctaUrl: "https://mindbridger.com/blog",
  },
};

interface Props {
  isim: string;
  adim: EverboardingAdim;
}

export default function EverboardingMail({ isim, adim }: Props) {
  const icerik = ADIM_ICERIGI[adim];

  return (
    <Html lang="tr">
      <Head />
      <Preview>{icerik.baslik} — MindBridger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>MindBridger</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>{icerik.baslik}</Heading>
            <Text style={paragraph}>Merhaba {isim},</Text>
            <Text style={paragraph}>{icerik.mesaj}</Text>

            {icerik.ipucuListesi && icerik.ipucuListesi.length > 0 && (
              <Section style={tipBox}>
                <Text style={tipLabel}>ÖNERİLER</Text>
                {icerik.ipucuListesi.map((ipucu, i) => (
                  <Text key={i} style={tipItem}>
                    → {ipucu}
                  </Text>
                ))}
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={icerik.ctaUrl}>
                {icerik.ctaMetin}
              </Button>
            </Section>

            <Text style={noteText}>
              Yardıma ihtiyacınız olursa{" "}
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
            <Text style={footerText}>
              Bu e-postayı almak istemiyorsanız{" "}
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

EverboardingMail.PreviewProps = {
  isim: "Ayşe Kaya",
  adim: "ilk_giris",
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
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#BDBDBD",
  textDecoration: "underline",
};
