import type { Metadata } from "next";
import { Overpass, Inter } from "next/font/google";
import "./globals.css";

const overpass = Overpass({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-overpass",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import PageTransition from "@/components/shared/PageTransition";
import Toaster from "@/components/shared/Toast";
import ChatbotDynamic from "@/components/shared/ChatbotDynamic";
import SwRegistration from "@/components/shared/SwRegistration";
import IdleTimeout from "@/components/shared/IdleTimeout";

export const metadata: Metadata = {
  title: {
    default: "MindBridger — Online Terapi Platformu",
    template: "%s | MindBridger",
  },
  description:
    "Türkiye'nin online terapi platformu. Psikolog ve PDR danışmanlarına kolayca ulaşın.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com"
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindBridger",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    siteName: "MindBridger",
    locale: "tr_TR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : ""

  // Kullanıcı rolünü çek — chatbot davranışı için
  let userRole: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      userRole = profil?.role ?? null;
    }
  } catch {
    // Auth hatası → visitor davranışı
  }

  return (
    <html lang="tr" suppressHydrationWarning className={`${overpass.variable} ${inter.variable}`}>
      <head>
        {/* Supabase preconnect — veritabanı + storage bağlantı gecikmesini azaltır */}
        {supabaseHostname && (
          <>
            <link rel="preconnect" href={`https://${supabaseHostname}`} />
            <link rel="dns-prefetch" href={`https://${supabaseHostname}`} />
          </>
        )}
      </head>
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--mb-bg)",
          color: "var(--mb-text)",
          fontFamily: "system-ui, Arial, sans-serif",
          fontSize: 13,
        }}
      >
        {/* Public header — panel sayfalarında otomatik gizlenir */}
        <Header />

        {/* Sayfa geçiş animasyonu + içerik */}
        <PageTransition>
          <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </main>
        </PageTransition>

        {/* Public footer — panel sayfalarında da gösterilmez (isteğe bağlı) */}
        <Footer />

        {/* Global bileşenler */}
        <Toaster />
        <ChatbotDynamic userRole={userRole} />

        {/* Service Worker kaydı (production-only, no-op in dev) */}
        <SwRegistration />

        {/* 30 dk hareketsizlik → otomatik oturum sonlandırma (CONFLICTS.md §1) */}
        <IdleTimeout />
      </body>
    </html>
  )
}
