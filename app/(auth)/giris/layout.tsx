import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Giriş Yap | MindBridger",
  description: "MindBridger hesabınıza giriş yapın.",
  robots: { index: false },
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
