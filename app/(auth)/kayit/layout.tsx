import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Kayıt Ol | MindBridger",
  description: "MindBridger'a ücretsiz kayıt olun ve danışmanlarla tanışın.",
  robots: { index: false },
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
