const CACHE_NAME = 'umra-guide-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Не трогаем внешние API
  if (
    url.includes('supabase.co') ||
    url.includes('api.telegram.org') ||
    url.includes('aladhan.com') ||
    url.includes('cbr-xml-daily.ru')
  ) {
    return;
  }

  // Защита от бага WebKit с редиректами на iPhone
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.redirected) {
            return fetch(response.url);
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Кеширование статики
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);
    })
  );
});
