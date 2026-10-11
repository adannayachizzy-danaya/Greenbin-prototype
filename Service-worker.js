const CACHE_NAME = "greenbin-pwa-v1";

const APP_FILES = [
"/",
"/index.html",
"/manifest.json"
];

self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
return cache.addAll(APP_FILES);
})
);

self.skipWaiting();
});

self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then((cacheNames) => {
return Promise.all(
cacheNames
.filter((name) => name !== CACHE_NAME)
.map((name) => caches.delete(name))
);
})
);

self.clients.claim();
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

      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseCopy);
      });
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

    return new Response("You are offline. Please try again later.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  })

);
});
