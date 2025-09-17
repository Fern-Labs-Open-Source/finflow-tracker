// Service Worker for FinFlow Tracker
const CACHE_NAME = 'finflow-v1.0.0'
const urlsToCache = [
  '/',
  '/dashboard',
  '/accounts',
  '/portfolio',
  '/api/portfolio/quick-stats',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip chrome-extension and non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // API calls - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(request, responseToCache)
            }
          })
          
          return response
        })
        .catch(() => {
          // Try to return cached version on network failure
          return caches.match(request)
        })
    )
    return
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        // Update cache in background
        fetch(request).then((freshResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, freshResponse.clone())
          })
        }).catch(() => {})
        
        return response
      }
      
      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-accounts') {
    event.waitUntil(syncAccounts())
  }
})

async function syncAccounts() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    
    // Find pending account updates
    const pendingUpdates = requests.filter(req => 
      req.url.includes('/api/accounts') && req.method === 'POST'
    )
    
    // Retry pending updates
    for (const request of pendingUpdates) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          // Remove from cache if successful
          await cache.delete(request)
        }
      } catch (error) {
        console.error('Sync failed for:', request.url)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications for important updates
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'FinFlow Update'
  const options = {
    body: data.body || 'You have new updates',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data.url || '/dashboard'
  event.waitUntil(
    clients.openWindow(url)
  )
})
