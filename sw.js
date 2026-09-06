const CACHE_VERSION = 'ht-v2.6.4';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_ASSETS = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-512-maskable.png',
  './assets/apple-touch-icon.png',
];

const CACHEABLE_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data || {}).url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const current = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => !current.includes(n)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(request)); return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE)); return;
  }
  if (CACHEABLE_ORIGINS.some(o => url.origin === o)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE)); return;
  }
});

async function networkFirstHTML(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(STATIC_CACHE)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || caches.match('./index.html');
  }
}

async function cacheFirst(req, name) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(name)).put(req, res.clone());
    return res;
  } catch { return new Response('Offline', { status: 503 }); }
}

async function staleWhileRevalidate(req, name) {
  const cache  = await caches.open(name);
  const cached = await cache.match(req);
  const fresh  = fetch(req)
    .then(r => { if (r.ok) cache.put(req, r.clone()); return r; })
    .catch(() => null);
  return cached || fresh;
}