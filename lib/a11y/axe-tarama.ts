/**
 * axe-core a11y tarama yardımcısı
 *
 * Kullanım (browser console veya test ortamında):
 *   import { a11yTara } from '@/lib/a11y/axe-tarama'
 *   const sonuc = await a11yTara()
 *   console.table(sonuc.ihlaller)
 *
 * Yalnızca development ve test ortamlarında çalıştırılmalıdır.
 */

export interface A11yIhlal {
  id: string
  etki: "critical" | "serious" | "moderate" | "minor"
  aciklama: string
  url: string
  eleman: string
}

export interface A11yTaramaSonucu {
  ihlaller: A11yIhlal[]
  gecenler: number
  toplam: number
  tarih: string
}

export async function a11yTara(
  kapsam: Element = document.body
): Promise<A11yTaramaSonucu> {
  if (typeof window === "undefined") {
    throw new Error("a11yTara yalnızca tarayıcı ortamında çalışır.")
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("a11yTara production ortamında çalıştırılamaz.")
  }

  // axe-core dinamik olarak yüklenir — production bundle'ına girmez
  const axe = await import("axe-core")

  const sonuc = await axe.default.run(kapsam, {
    runOnly: {
      type: "tag",
      // WCAG 2.1 AA kuralları
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
    },
  })

  const ihlaller: A11yIhlal[] = sonuc.violations.flatMap((v) =>
    v.nodes.map((node) => ({
      id: v.id,
      etki: (v.impact ?? "minor") as A11yIhlal["etki"],
      aciklama: v.description,
      url: v.helpUrl,
      eleman: node.html.slice(0, 120),
    }))
  )

  return {
    ihlaller,
    gecenler: sonuc.passes.length,
    toplam: sonuc.passes.length + sonuc.violations.length,
    tarih: new Date().toISOString(),
  }
}

/**
 * Konsola renkli özet basar.
 * Tarayıcı console'una yapıştırılabilir:
 *   import('@/lib/a11y/axe-tarama').then(m => m.a11yRapor())
 */
export async function a11yRapor(kapsam?: Element): Promise<void> {
  const sonuc = await a11yTara(kapsam)

  if (sonuc.ihlaller.length === 0) {
    console.log(`✅ a11y: İhlal bulunamadı. ${sonuc.gecenler} kural geçti.`)
    return
  }

  const kritikler = sonuc.ihlaller.filter((i) => i.etki === "critical" || i.etki === "serious")
  console.warn(
    `⚠️ a11y: ${sonuc.ihlaller.length} ihlal (${kritikler.length} kritik/ciddi)`
  )
  console.table(
    sonuc.ihlaller.map((i) => ({
      etki: i.etki,
      kural: i.id,
      eleman: i.eleman.slice(0, 80),
    }))
  )
}
