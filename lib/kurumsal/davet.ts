import "server-only"

export function davetKoduUret(): string {
  const alfabe = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alfabe[b % alfabe.length]).join("")
}

export function davetLinkiOlustur(kod: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base}/kurumsal-kayit?kod=${encodeURIComponent(kod)}`
}
