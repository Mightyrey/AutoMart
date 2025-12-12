// AutoMart Service Worker für PWA-Funktionalität

const CACHE_NAME = 'automart-v1.0.0';
const STATIC_CACHE = 'automart-static-v1';
const DYNAMIC_CACHE = 'automart-dynamic-v1';

// Dateien für statisches Caching
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/components.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/api.js',
    '/js/cart.js',
    '/js/products.js',
    '/js/ui.js',
    '/js/app.js',
    // External CDN resources
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// URLs die nicht gecacht werden sollen
const NO_CACHE_URLS = [
    '/api/',
    'analytics.google.com',
    'google-analytics.com'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
    console.log('SW: Service Worker installing');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('SW: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('SW: Failed to cache static assets:', error);
            })
    );
    
    // Sofort aktivieren ohne auf andere Tabs zu warten
    self.skipWaiting();
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
    console.log('SW: Service Worker activating');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Alte Cache-Versionen löschen
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Service Worker übernimmt sofort die Kontrolle
                return self.clients.claim();
            })
    );
});

// Fetch Event Handler - Cache Strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Nur GET-Requests cachen
    if (request.method !== 'GET') {
        return;
    }
    
    // URLs ausschließen die nicht gecacht werden sollen
    if (NO_CACHE_URLS.some(noCache => url.href.includes(noCache))) {
        return;
    }
    
    // Verschiedene Cache-Strategien basierend auf Ressourcentyp
    if (isStaticAsset(request)) {
        // Cache First für statische Assets
        event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request)) {
        // Network First für API-Calls
        event.respondWith(networkFirst(request));
    } else {
        // Stale While Revalidate für alles andere
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Cache First Strategy (für statische Assets)
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Erfolgreiche Antworten cachen
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('SW: Cache first failed:', error);
        
        // Fallback für offline
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Network First Strategy (für API-Calls)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Erfolgreiche API-Antworten für kurze Zeit cachen
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Network failed, trying cache');
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch((error) => {
        console.error('SW: Network request failed:', error);
        throw error;
    });
    
    // Cached Response sofort zurückgeben, wenn verfügbar
    return cachedResponse || fetchPromise;
}

// Helper Functions
function isStaticAsset(request) {
    return request.url.includes('.css') ||
           request.url.includes('.js') ||
           request.url.includes('.png') ||
           request.url.includes('.jpg') ||
           request.url.includes('.jpeg') ||
           request.url.includes('.svg') ||
           request.url.includes('.woff') ||
           request.url.includes('.woff2') ||
           request.url.includes('fonts.googleapis.com') ||
           request.url.includes('fontawesome');
}

function isAPIRequest(request) {
    return request.url.includes('/api/') ||
           request.url.includes('/order/') ||
           request.url.includes('/products/') ||
           request.url.includes('/pickup/');
}

// Background Sync für Offline-Funktionalität
self.addEventListener('sync', (event) => {
    console.log('SW: Background sync triggered');
    
    if (event.tag === 'background-sync-orders') {
        event.waitUntil(syncOfflineOrders());
    }
});

// Offline-Bestellungen synchronisieren
async function syncOfflineOrders() {
    try {
        console.log('SW: Syncing offline orders');
        
        // Hier könnten offline gespeicherte Bestellungen verarbeitet werden
        const offlineOrders = await getOfflineOrders();
        
        for (const order of offlineOrders) {
            try {
                await fetch('/api/order/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(order)
                });
                
                // Erfolgreich synchronisierte Bestellung entfernen
                await removeOfflineOrder(order.id);
                
            } catch (error) {
                console.error('SW: Failed to sync order:', order.id, error);
            }
        }
        
    } catch (error) {
        console.error('SW: Background sync failed:', error);
    }
}

// Offline-Bestellungen aus IndexedDB abrufen
async function getOfflineOrders() {
    return new Promise((resolve) => {
        const request = indexedDB.open('AutoMartDB', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['offlineOrders'], 'readonly');
            const store = transaction.objectStore('offlineOrders');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result || []);
            };
        };
        
        request.onerror = () => {
            resolve([]);
        };
    });
}

// Offline-Bestellung entfernen
async function removeOfflineOrder(orderId) {
    return new Promise((resolve) => {
        const request = indexedDB.open('AutoMartDB', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['offlineOrders'], 'readwrite');
            const store = transaction.objectStore('offlineOrders');
            const deleteRequest = store.delete(orderId);
            
            deleteRequest.onsuccess = () => {
                resolve();
            };
        };
        
        request.onerror = () => {
            resolve(); // Fehler ignorieren
        };
    });
}

// Push Notifications (für zukünftige Erweiterungen)
self.addEventListener('push', (event) => {
    console.log('SW: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Neue Benachrichtigung von AutoMart',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'AutoMart öffnen',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Schließen',
                icon: '/assets/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('AutoMart', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('SW: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message Handler für Kommunikation mit Main Thread
self.addEventListener('message', (event) => {
    console.log('SW: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

console.log('SW: Service Worker loaded');