const CACHE_NAME = 'graciosas-pwa-v3';
const CORE_FILES = [
  './',
  './index.html',
  './pix.html',
  './manifest.webmanifest',
  './img/logo.png',
  './img/app-icon.svg',
  './img/hero.jpg',
  './img/cafe.jpg',
  './img/logo-app.png',
  './img/estante.jpg',
  './img/selo-semente.png',
  './img/selo-constancia.png',
  './img/selo-graciosa.png',
  './img/pix-semente.png',
  './img/pix-constancia.png',
  './img/pix-graciosa.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(CORE_FILES.map(async (file) => {
        try { await cache.add(file); } catch (error) { /* mantém a instalação mesmo se um recurso falhar */ }
      }));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('graciosas-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('./index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});