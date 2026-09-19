const CACHE_NAME = 'umra-guide-cache-v3';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.PNG',
  'https://telegram.org/js/telegram-web-app.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Запросы к базе данных Supabase не кэшируем через SW — у них свой кэш в localStorage
  if (url.origin.includes('supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (url.hostname.includes('cartocdn.com') || url.hostname.includes('openstreetmap.org') || PRECACHE.includes(e.request.url)) {
              cache.put(e.request, clone);
            }
          });
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
