"use client"

import { useEffect } from "react"

/**
 * Service Worker kaydı — sadece production'da ve HTTPS'de çalışır.
 * Layout'a import edilir; herhangi bir UI render etmez.
 */
export default function SwRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return
    }

    const kaydol = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        registration.addEventListener("updatefound", () => {
          const yeniSW = registration.installing
          if (!yeniSW) return

          yeniSW.addEventListener("statechange", () => {
            if (
              yeniSW.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Yeni sürüm hazır — sessizce güncelle (kullanıcıyı rahatsız etme)
              yeniSW.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })
      } catch (err) {
        // SW kaydı başarısız olsa bile uygulama çalışmaya devam eder
        console.warn("[SW] Kayıt başarısız:", err)
      }
    }

    if (document.readyState === "complete") {
      void kaydol()
    } else {
      window.addEventListener("load", () => void kaydol(), { once: true })
    }
  }, [])

  return null
}
