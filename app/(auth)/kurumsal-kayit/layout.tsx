import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Kurumsal Kayıt | MindBridger",
  description: "Şirketiniz için MindBridger kurumsal hesabı oluşturun.",
  robots: { index: false },
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
