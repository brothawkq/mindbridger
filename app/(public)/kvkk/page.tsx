import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | MindBridger",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında MindBridger KVKK aydınlatma metni.",
  robots: { index: true, follow: true },
};

const BOLUMLER = [
  {
    baslik: "Veri Sorumlusunun Kimliği",
    icerik: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla MindBridger tarafından aşağıda açıklanan kapsamda işlenecektir.

İletişim: platform@mindbridger.com`,
  },
  {
    baslik: "İşlenen Kişisel Veriler ve İşleme Amaçları",
    icerik: `Kimlik verileri (ad, soyad, T.C. kimlik doğrulaması için)
→ Hesap oluşturma, kimlik doğrulama, yasal yükümlülük

İletişim verileri (e-posta, telefon)
→ Bildirim gönderimi, müşteri desteği, randevu hatırlatmaları

Finansal veriler (ödeme bilgileri, fatura adresi)
→ Ödeme işlemi, fatura düzenleme, muhasebe kaydı

Sağlık ve psikolojik veriler (seans notları, test sonuçları — yalnızca ilgili kişi paylaşırsa)
→ Terapi sürecinin yürütülmesi, danışan-danışman iletişimi

İşlem güvenliği verileri (IP adresi, giriş zamanı, cihaz bilgisi)
→ Platform güvenliği, sahteciliğin önlenmesi, yasal yükümlülük`,
  },
  {
    baslik: "Kişisel Verilerin İşlenme Hukuki Sebebi",
    icerik: `KVKK Madde 5 ve 6 kapsamında verileriniz şu hukuki sebeplere dayanılarak işlenmektedir:

• Sözleşmenin kurulması ve ifası (randevu, ödeme)
• Kanuni yükümlülüğün yerine getirilmesi (vergi, muhasebe)
• Veri sorumlusunun meşru menfaati (platform güvenliği)
• Açık rıza (psikolojik/sağlık verisi, pazarlama bildirimleri)`,
  },
  {
    baslik: "Kişisel Verilerin Aktarılması",
    icerik: `Kişisel verileriniz yurt içinde yalnızca şu durumlarda aktarılır:

• Yetkili kamu kurum ve kuruluşları (yasal zorunluluk hâlinde)
• Ödeme hizmeti sağlayıcısı iyzico (ödeme işlemi için)

Yurt dışına aktarım:
• Daily.co (ABD — video görüşme altyapısı, KVKK 9. madde kapsamında yeterli koruma taahhütlü)
• Resend (ABD — e-posta hizmeti, standart sözleşme maddeleri ile)

Psikolojik nitelikli veriler (seans notları, test sonuçları) hiçbir şekilde yurt dışına aktarılmaz.`,
  },
  {
    baslik: "Kişisel Verilerin Saklanma Süresi",
    icerik: `Kişisel verileriniz, işlenme amacının ortadan kalkması veya yasal saklama süresinin dolmasıyla silinir, yok edilir veya anonim hâle getirilir.

Saklama süreleri:
• Hesap verileri: Hesap silme talebinden itibaren 30 gün
• Ödeme ve fatura kayıtları: 10 yıl (Türk Ticaret Kanunu Madde 82)
• Log kayıtları: 90 gün (5651 sayılı Kanun kapsamında)
• Psikolojik veriler: Hesap silinmesiyle eş zamanlı kalıcı silme`,
  },
  {
    baslik: "İlgili Kişinin Hakları (KVKK Madde 11)",
    icerik: `KVKK'nın 11. maddesi uyarınca aşağıdaki haklarınızı kullanabilirsiniz:

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme
b) İşlenmişse buna ilişkin bilgi talep etme
c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
d) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme
e) Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme
f) KVKK Madde 7 çerçevesinde silinmesini veya yok edilmesini isteme
g) (e) ve (f) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme
h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme
i) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme`,
  },
  {
    baslik: "Başvuru Yöntemi",
    icerik: `Haklarınızı kullanmak için kimliğinizi doğrulayan belgelerle birlikte aşağıdaki yollardan başvurabilirsiniz:

E-posta: platform@mindbridger.com (konu: KVKK Başvurusu)

Başvurular KVKK Madde 13 uyarınca en geç 30 gün içinde yanıtlanır. Talebin reddedilmesi hâlinde Kişisel Verileri Koruma Kurumu'na şikâyette bulunma hakkınız saklıdır.

Son güncelleme: Mayıs 2026`,
  },
];

export default function KvkkPage() {
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "var(--mb-bg)",
        color: "var(--mb-text)",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      {/* ── Başlık ────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: "1.5px solid #325343",
          padding: "48px 24px 40px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--mb-muted)",
            marginBottom: 12,
          }}
        >
          Yasal
        </p>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--mb-text)",
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          KVKK Aydınlatma Metni
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--mb-muted)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel
          verilerinizin işlenmesine ilişkin aydınlatma metnidir.
        </p>
      </section>

      {/* ── İçerik ────────────────────────────────────────────── */}
      <article
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 24px 56px",
        }}
      >
        {BOLUMLER.map((bolum, i) => (
          <section
            key={bolum.baslik}
            style={{
              borderBottom: i < BOLUMLER.length - 1 ? "1.5px solid var(--mb-border)" : "none",
              paddingBottom: 32,
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--mb-text)",
                margin: "0 0 12px",
              }}
            >
              {bolum.baslik}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--mb-text)",
                lineHeight: 1.8,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {bolum.icerik}
            </p>
          </section>
        ))}
      </article>
    </main>
  );
}
