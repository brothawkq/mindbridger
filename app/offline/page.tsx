import OfflineRetryButton from "./OfflineRetryButton"

export const metadata = {
  title: "Çevrimdışı | MindBridger",
  robots: { index: false },
}

export default function OfflinePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}>⚡</div>

      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#212121",
          marginBottom: 8,
        }}
      >
        İnternet Bağlantısı Yok
      </h1>

      <p
        style={{
          fontSize: 13,
          color: "#757575",
          maxWidth: 320,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        Şu anda çevrimdışısınız. İnternet bağlantınızı kontrol edin ve tekrar
        deneyin.
      </p>

      <OfflineRetryButton />

      <p style={{ fontSize: 11, color: "#BDBDBD", marginTop: 20 }}>
        Daha önce ziyaret ettiğiniz sayfalar çevrimdışı kullanılabilir
        olabilir.
      </p>
    </div>
  )
}
