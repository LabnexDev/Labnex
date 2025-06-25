const CACHE_NAME = 'labnex-v1.0.0';
const STATIC_CACHE = 'labnex-static-v1.0.0';
const DYNAMIC_CACHE = 'labnex-dynamic-v1.0.0';

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Assets that should be cached with long-term strategy
const LONG_TERM_ASSETS = [
  '/assets/',
  '/public/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(url.pathname)) {
    // Static assets: Cache-first with 1 year cache
    event.respondWith(cacheFirst(request, STATIC_CACHE, 31536000));
  } else if (isAssetFile(url.pathname)) {
    // Asset files: Cache-first with 1 month cache
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE, 2592000));
  } else if (isAPIRequest(url.pathname)) {
    // API requests: Network-first with short cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 300));
  } else {
    // HTML pages: Network-first with short cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 3600));
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName, maxAge = 3600) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time'));
      const now = new Date();
      if (now - cacheTime < maxAge * 1000) {
        return cachedResponse;
      }
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(cacheName);
      
      // Add cache timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName, maxAge = 3600) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(cacheName);
      
      // Add cache timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });
      
      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  } catch (error) {
    console.error('Network-first strategy failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time'));
      const now = new Date();
      if (now - cacheTime < maxAge * 1000) {
        return cachedResponse;
      }
    }
    return new Response('Network error', { status: 503 });
  }
}

// Helper functions to determine request type
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset || pathname.endsWith(asset));
}

function isAssetFile(pathname) {
  return pathname.startsWith('/assets/') || 
         pathname.includes('.js') || 
         pathname.includes('.css') || 
         pathname.includes('.svg') || 
         pathname.includes('.png') || 
         pathname.includes('.jpg') || 
         pathname.includes('.woff') || 
         pathname.includes('.woff2');
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/');
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any pending background tasks
    console.log('Performing background sync...');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

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