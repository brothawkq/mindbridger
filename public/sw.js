/**
 * MindBridger Service Worker
 *
 * Strateji:
 * - Statik varlıklar (/_next/static/*, /icons/*): Cache First
 * - Sayfa navigasyonu: Network First → çevrimdışıysa /offline'ı göster
 * - API çağrıları: Network Only (hassas veri / gerçek zamanlı)
 *
 * Çevrimdışı destek: /panelim/dashboard, /danisan/takvim (uygulama kabuğu)
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `mindbridger-${CACHE_VERSION}`;

/** Kurulum sırasında önbelleğe alınacak kritik kaynaklar */
const PRECACHE_URLS = ["/offline"];

// ─── Kurulum ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Aktivasyon: eski önbellekleri temizle ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keyList) =>
        Promise.all(
          keyList
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Yalnızca GET istekeleri işlenir
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Farklı origin istekleri (analytics, CDN) geçilir
  if (url.origin !== self.location.origin) return;

  // API çağrıları: Network Only
  if (url.pathname.startsWith("/api/")) return;

  // Statik varlıklar: Cache First → varsa önbellekten, yoksa ağdan al ve önbellekle
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response.ok) return response;
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clone))
            .catch(() => null);
          return response;
        });
      })
    );
    return;
  }

  // Sayfa navigasyonu: Network First → çevrimdışı sayfaya yedekle
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı sayfa yanıtını dinamik önbellekle
          if (
            response.ok &&
            (url.pathname === "/panelim/dashboard" ||
              url.pathname === "/danisan/takvim")
          ) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => null);
          }
          return response;
        })
        .catch(async () => {
          // Ağ yok — önbellekte varsa göster, yoksa offline sayfası
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/offline");
          return offlinePage ?? Response.error();
        })
    );
    return;
  }
});
