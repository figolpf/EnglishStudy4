const CACHE_NAME = 'yl4-v15';
const PRECACHE = [
  "./",
  "./index.html",
  "./extra-books.js",
  "./audio-list.js",
  "./manifest.json",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const names = await caches.keys();
    for (const name of names) {
      if (name === CACHE_NAME) continue;
      try {
        const old = await caches.open(name);
        const reqs = await old.keys();
        for (const req of reqs) {
          if (!req.url.includes('/audio/')) continue;
          if (await cache.match(req)) continue;
          const resp = await old.match(req);
          if (resp) await cache.put(req, resp);
        }
      } catch (err) {}
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        if (resp.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
