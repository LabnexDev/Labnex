const CACHE_NAME = 'labnex-v1.0.0';
const STATIC_CACHE = 'labnex-static-v1.0.0';
const DYNAMIC_CACHE = 'labnex-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index-CwzpkHum.css',
  '/assets/react-Cx0f49jy.js',
  '/assets/ui-Cv2Eptpo.js',
  '/assets/index-_6JGQd_s.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (except for our API)
  if (!url.origin.includes('labnex.dev') && !url.origin.includes('localhost')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.includes('.css') || 
      url.pathname.includes('.js') ||
      url.pathname.includes('.png') ||
      url.pathname.includes('.jpg') ||
      url.pathname.includes('.svg')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Handle HTML pages with network-first strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request);
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
  return Promise.resolve();
} 