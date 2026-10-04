// Travel Studio Offline Service Worker Engine
// Trip: 2026 滇西北秘境巅峰穿越 11 日随行伴侣 (yunnan-2026)
// Cache Version: travel-studio-yunnan-2026-vac18010c

const CACHE_NAME = "travel-studio-yunnan-2026-vac18010c";
const TILE_CACHE_NAME = "travel-studio-tiles-yunnan-2026";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

// Install Event: Precaching App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell for offline travel');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets failed to load:', err);
      });
    })
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('travel-studio-') && key !== CACHE_NAME && key !== TILE_CACHE_NAME) {
            console.log('[SW] Evicting outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy 1: Map Tiles (Stale-While-Revalidate with Tile Cache)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('autonavi.com') ||
    url.hostname.includes('amap.com') ||
    url.pathname.includes('/tiles/')
  ) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((tileCache) => {
        return tileCache.match(event.request).then((cachedResponse) => {
          const networkFetch = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              tileCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline - return fallback or cached
            return cachedResponse;
          });
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }

  // Strategy 2: Google / Leaflet / Font CDN assets (Cache-first)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Strategy 3: App Shell & Pages (Network First with Cache Fallback)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
