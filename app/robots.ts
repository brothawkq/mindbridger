import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindbridger.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/danismanlar", "/danismanlar/", "/blog", "/blog/"],
        disallow: [
          "/panelim/",
          "/admin/",
          "/danisan/",
          "/kurumsal/",
          "/affiliate-panel/",
          "/api/",
          "/giris",
          "/kayit",
          "/danisan-kayit",
          "/kurumsal-kayit",
          "/sifremi-unuttum",
          "/sifremi-sifirla",
          "/e-posta-dogrulama",
          "/onay-bekleniyor",
          "/offline",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
