const CACHE_VERSION = 'v1';
const STATIC_CACHE = `demo-pwa-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `demo-pwa-runtime-${CACHE_VERSION}`;

const self = this;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  const acceptHeader = request.headers.get('accept') || '';

  if (shouldBypassRuntimeCache(request)) {
    return;
  }

  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(handlePageRequest(request));
    return;
  }

  const pathname = new URL(request.url).pathname;
  if (PRECACHE_URLS.includes(pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    fetchAndCache(request).catch(() => caches.match(request))
  );
});

function handlePageRequest(request) {
  return fetchAndCache(request).catch(async () => {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match('/index.html');
  });
}

function shouldBypassRuntimeCache(request) {
  try {
    const url = new URL(request.url);
    if (url.origin !== 'https://api.openweathermap.org') {
      return false;
    }
    return url.pathname.startsWith('/geo/1.0/');
  } catch (error) {
    return false;
  }
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return response;
  }

  const cacheName = request.mode === 'navigate' ? STATIC_CACHE : RUNTIME_CACHE;
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

