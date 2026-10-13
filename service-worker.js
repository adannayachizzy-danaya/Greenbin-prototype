const CACHE_NAME = "greenbin-pwa-v3";

const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/app.js",
  "/auth-ui.js",
  "/my-reports.js",
  "/photo-ui.js",
  "/map-ui.js",
  "/icon/icon-192.png",
  "/icon/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of APP_FILES) {
        try { await cache.add(file); }
        catch (error) { console.warn("Could not cache:", file, error); }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("greenbin-pwa-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache private or live data
  if (url.pathname.startsWith("/api/") || url.pathname === "/admin.html") return;

  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return (await caches.match("/index.html")) || (await caches.match("/"));
        }

        return new Response("You are offline. Please try again later.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
