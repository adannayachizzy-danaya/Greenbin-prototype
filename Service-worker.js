const CACHE_NAME = "greenbin-pwa-v2";

const APP_FILES = [
"/",
"/index.html",
"/manifest.json",
"/icon/icon-192.png",
"/icon/icon-512.png"
];

self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then(async (cache) => {
for (const file of APP_FILES) {
try {
await cache.add(file);
} catch (error) {
console.warn("Could not cache:", file, error);
}
}
})
);

self.skipWaiting();
});

self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then((cacheNames) =>
Promise.all(
cacheNames
.filter((name) => name.startsWith("greenbin-pwa-") && name !== CACHE_NAME)
.map((name) => caches.delete(name))
)
).then(() => self.clients.claim())
);
});

self.addEventListener("fetch", (event) => {
if (event.request.method !== "GET") {
return;
}

const requestURL = new URL(event.request.url);

if (requestURL.origin !== self.location.origin) {
return;
}

event.respondWith(
fetch(event.request)
.then((response) => {
if (response && response.ok) {
const responseCopy = response.clone();

      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(event.request, responseCopy)
        )
      );
    }

    return response;
  })
  .catch(async () => {
    const cachedResponse = await caches.match(event.request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (event.request.mode === "navigate") {
      return (
        await caches.match("/index.html") ||
        await caches.match("/")
      );
    }

    return new Response(
      "You are offline. Please try again later.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  })

);
});
