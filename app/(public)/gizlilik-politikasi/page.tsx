import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | MindBridger",
  description:
    "MindBridger gizlilik politikası: kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.",
  robots: { index: true, follow: true },
};

const BOLUMLER = [
  {
    baslik: "1. Veri Sorumlusu",
    icerik: `Bu Gizlilik Politikası, MindBridger platformunu ("Platform") işleten şirket tarafından hazırlanmıştır. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.

İletişim: platform@mindbridger.com`,
  },
  {
    baslik: "2. Toplanan Kişisel Veriler",
    icerik: `Platform kullanımınız sırasında aşağıdaki veriler toplanabilir:

• Ad, soyad, e-posta adresi, telefon numarası
• Hesap giriş bilgileri (şifre bcrypt ile şifrelenerek saklanır)
• Profil fotoğrafı ve biyografi (gönüllü olarak paylaşılır)
• Randevu geçmişi, ödeme kayıtları, fatura bilgileri
• Psikolojik test sonuçları, günlük notlar, seans notları (hassas veri)
• Cihaz bilgileri, IP adresi, tarayıcı türü
• Platform kullanım davranışları (sayfa görüntüleme, tıklama)`,
  },
  {
    baslik: "3. Verilerin İşlenme Amaçları",
    icerik: `Toplanan kişisel veriler şu amaçlarla işlenmektedir:

• Hesap oluşturma ve kimlik doğrulama
• Randevu, seans ve ödeme işlemlerinin yürütülmesi
• Danışman-danışan eşleştirmesi
• Müşteri desteği ve şikâyet yönetimi
• Platform güvenliği ve sahteciliğin önlenmesi
• Yasal yükümlülüklerin yerine getirilmesi
• Hizmet kalitesini artırmaya yönelik istatistiksel analizler (anonim)`,
  },
  {
    baslik: "4. Hassas Veri",
    icerik: `Sağlık ve psikolojik nitelik taşıyan veriler (seans notları, test sonuçları, günlük kayıtlar) KVKK'nın 6. maddesi kapsamında özel nitelikli kişisel veri olarak kabul edilir.

Bu veriler:
• AES-256 şifreleme ile saklanır
• Yalnızca ilgili danışan ve müşteriye görünür
• Üçüncü taraflarla hiçbir koşulda paylaşılmaz
• Platform yöneticileri tarafından içeriğe erişilemez; yalnızca anonim istatistikler görülebilir`,
  },
  {
    baslik: "5. Verilerin Paylaşımı",
    icerik: `Kişisel verileriniz şu durumlar dışında üçüncü taraflarla paylaşılmaz:

• Ödeme işlemleri: iyzico (PCI-DSS uyumlu ödeme altyapısı)
• Video görüşme altyapısı: Daily.co (seans odası oluşturma)
• E-posta bildirimleri: Resend (işlem e-postaları)
• Yasal zorunluluk: Mahkeme kararı veya yasal düzenleme gereği
• Açık rıza: Kullanıcının açıkça onay verdiği hâller

Yukarıdaki hizmet sağlayıcılar yalnızca hizmetin ifası için gerekli minimum veriyi alır ve kendi gizlilik taahhütleriyle bağlıdır.`,
  },
  {
    baslik: "6. Çerezler",
    icerik: `Platform, oturum yönetimi ve güvenlik amacıyla zorunlu çerezler kullanmaktadır. Analiz veya reklam amaçlı üçüncü taraf çerez kullanılmamaktadır.

Zorunlu çerezler:
• Oturum çerezi (supabase-auth-token): Giriş durumunuzu saklar, tarayıcı kapatılınca silinir
• CSRF koruma çerezi: Güvenlik saldırılarına karşı koruma sağlar`,
  },
  {
    baslik: "7. Veri Saklama Süreleri",
    icerik: `• Hesap verileri: Hesap silme talebinden itibaren 30 gün
• Ödeme kayıtları: 10 yıl (Türk Ticaret Kanunu)
• Audit log kayıtları: 90 gün
• İptal edilmiş randevu verileri: 2 yıl
• Psikolojik veri (seans notu, test sonucu): Hesap silmeyle birlikte kalıcı silme`,
  },
  {
    baslik: "8. Kullanıcı Hakları",
    icerik: `KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:

• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde / yurt dışında aktarıldığı üçüncü kişileri bilme
• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
• Verilerin silinmesini veya yok edilmesini talep etme
• İşlemenin otomatik sistemlerle yapılması hâlinde ortaya çıkan sonuca itiraz etme

Talepleriniz için: platform@mindbridger.com`,
  },
  {
    baslik: "9. Güvenlik Önlemleri",
    icerik: `Verilerinizin güvenliği için alınan teknik önlemler:

• TLS 1.2+ ile şifreli iletişim
• AES-256 ile hassas veri şifreleme
• bcrypt (minimum 12 tur) ile şifre hashleme
• Rol bazlı erişim kontrolü (RLS)
• Brute-force koruması (5 başarısız giriş → 15 dakika kilit)
• IP kara listesi (50 başarısız giriş → 24 saat engel)
• Günlük otomatik veritabanı yedekleme`,
  },
  {
    baslik: "10. Politika Güncellemeleri",
    icerik: `Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklikler e-posta ile bildirilir. Güncel politika her zaman bu sayfada yayımlanır.

Son güncelleme: Mayıs 2026`,
  },
];

export default function GizlilikPolitikasiPage() {
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
          Gizlilik Politikası
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--mb-muted)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Bu politika, MindBridger platformunda kişisel verilerinizin nasıl
          toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
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
