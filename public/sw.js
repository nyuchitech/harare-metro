// Service Worker for Harare Metro PWA

const CACHE_NAME = 'harare-metro-v1.0.0'
const API_CACHE_NAME = 'harare-metro-api-v1.0.0'

// Check if we're in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === 'www.hararemetro.co.zw'

// Files to cache for offline functionality (skip in development)
const STATIC_CACHE_URLS = isDevelopment ? [] : [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// API endpoints to cache (always cache these)
const API_CACHE_URLS = [
  '/api/feeds',
  '/api/health',
  '/api/admin/refresh-status'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker')
  
  if (isDevelopment) {
    console.log('SW: Development mode - skipping static cache')
    self.skipWaiting()
    return
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching static assets')
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('SW: Service worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip service worker for development server requests
  if (isDevelopment && (
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('@vite/client') ||
    url.pathname.includes('src/main.jsx') ||
    url.pathname.includes('node_modules') ||
    url.searchParams.has('import') ||
    url.searchParams.has('t') // Vite timestamp query
  )) {
    console.log('SW: Skipping dev request:', url.pathname)
    return // Let the request go through normally
  }
  
  // Handle API requests (always cache these)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, response.clone())
            }
            return response
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(event.request)
          })
      })
    )
    return
  }
  
  // Skip all other caching in development
  if (isDevelopment) {
    return // Let request go through normally
  }
  
  // Production caching strategy for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        
        return response
      })
    })
  )
})

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }
})