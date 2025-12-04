const CACHE_NAME = 'coffee-v2';
const DYNAMIC_CACHE = 'coffee-dynamic-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/coffee.jpg',
    '/manifest.json',
    '/offline.html'
];

// 1. Install & Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

// 2. Activate & Cleanup
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                .map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// 3. Fetch Strategy
self.addEventListener('fetch', event => {
    // 🔴 NEW: Ignore Vite's "Hot Module Replacement" and internal requests
    const url = new URL(event.request.url);
    if (url.search.includes('token=') || url.pathname.includes('@vite')) {
        return; // Let the browser handle this directly (bypass SW)
    }

    // Network First for API
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
                    return res;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First for everything else
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                // Check if valid response before caching
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        }).catch(() => {
            if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/offline.html');
            }
        })
    );
});

// 4. Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'send-order') {
        event.waitUntil(
            // Mock API call
            fetch('/api/menu.json') // Using menu.json just to simulate a successful request
                .then(() => {
                    return self.clients.matchAll().then(clients => {
                        clients.forEach(client => client.postMessage('Замовлення відправлено! (Sync)'));
                    });
                })
        );
    }
});

// 5. Skip Waiting Listener
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});