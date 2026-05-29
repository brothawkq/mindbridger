import "server-only"

/** Temel referral kayıt linki — /kayit?ref=KOD */
export function referralLinkOlustur(referralKod: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return `${base}/kayit?ref=${encodeURIComponent(referralKod)}`
}

/** UTM parametreli link — analitik takibi için */
export function utmLinkOlustur(
  referralKod: string,
  options?: {
    source?: string   // utm_source  (örn: "blog", "instagram")
    medium?: string   // utm_medium  (örn: "organic", "paid")
    campaign?: string // utm_campaign (örn: "aralik-2026")
  }
): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const params = new URLSearchParams()
  params.set("ref", referralKod)
  if (options?.source) params.set("utm_source", options.source)
  if (options?.medium) params.set("utm_medium", options.medium)
  if (options?.campaign) params.set("utm_campaign", options.campaign)
  return `${base}/kayit?${params.toString()}`
}

/** 8 haneli benzersiz referral kodu üret (alfanumerik, karışık olmayan harfler) */
export function referralKodUret(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("")
}
