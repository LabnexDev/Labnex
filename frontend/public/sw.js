const CACHE_VERSION = 'labnex-v2.0.0';
const STATIC_CACHE = `labnex-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `labnex-dynamic-${CACHE_VERSION}`;
const API_CACHE = `labnex-api-${CACHE_VERSION}`;

// Critical files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/screenshot-wide.svg',
  '/screenshot-narrow.svg',
  '/404.html'
];

// Files that should be cached with network-first strategy
const NETWORK_FIRST_FILES = [
  '/api/',
  '/auth/',
  '/dashboard/',
  '/projects/',
  '/test-cases/',
  '/notes/',
  '/snippets/'
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

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (!cacheName.includes(CACHE_VERSION)) {
                console.log('Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        }),
      // Claim all clients immediately
      self.clients.claim()
    ])
    .then(() => {
      console.log('Service worker activated and claiming clients');
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
            caches.open(API_CACHE)
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
      url.pathname.includes('.svg') ||
      url.pathname.includes('.woff') ||
      url.pathname.includes('.woff2')) {
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

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: '/icon-192.svg'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192.svg'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
  return Promise.resolve();
}

// Cache cleanup function
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!currentCaches.includes(cacheName)) {
        console.log('Cleaning up old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
} 