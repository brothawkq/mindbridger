import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay Node.js-style dynamic require kullanıyor; Turbopack bundle etmemeli
  serverExternalPackages: ["iyzipay"],
  // Dev modunda N rozeti ve Route/Bundler popup'ını gizle
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [36, 40, 46, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 gün
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : "*.supabase.co";

    const csp = [
      "default-src 'self'",
      // Next.js inline scripts + Framer Motion dynamic styles
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.daily.co",
      "style-src 'self' 'unsafe-inline'",
      // Supabase storage görselleri, data URI, blob (kamera önizleme)
      `img-src 'self' data: blob: https://${supabaseHost}`,
      // API & WS bağlantıları
      [
        "connect-src 'self'",
        `https://${supabaseHost}`,
        `wss://${supabaseHost}`,
        "https://api.daily.co",
        "wss://*.daily.co",
        "https://sandbox-api.iyzipay.com",
        "https://api.iyzipay.com",
      ].join(" "),
      // Daily.co video iframe
      "frame-src https://*.daily.co",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
