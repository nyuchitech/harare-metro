// Harare Metro Service Worker
// Provides offline functionality and caching for better performance

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `harare-metro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `harare-metro-dynamic-${CACHE_VERSION}`;
const API_CACHE = `harare-metro-api-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_CACHE_URLS = [
  "/",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/assets/AuthContext-Bcybxm-Q.js",
  "/assets/HeaderNavigation-CRKiylJd.js",
  "/assets/MobileNavigation-B3PfpJZ3.js",
  "/assets/article-CbqoJQdP.js",
  "/assets/bytes-CPPy-GVI.js",
  "/assets/chunk-QMGIS6GS-0grGa6rK.js",
  "/assets/entry.client-BP6oDRkJ.js",
  "/assets/home-CaHPWwif.js",
  "/assets/root-CAFGpRm4.css",
  "/assets/root-QXPlZEFa.js",
  "/assets/search-L7PuF32W.js",
  "/assets/supabase.client-DIUNiKP5.js",
  "/default-source-icon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon.ico",
  "/favicon.png",
  "/hm-logo-compact.svg",
  "/hm-logo-horizontal.svg",
  "/hm-logo-main.svg",
  "/logo.png",
  "/og-image.png",
  "/robots.txt",
  "/sitemap.xml",
  "/twitter-image.png"
];

// Zimbabwe-specific cache configuration
const CACHE_STRATEGIES = {
  // News articles - cache for 30 minutes
  api: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxEntries: 100
  },
  // Static assets - cache for 7 days
  static: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 50
  },
  // Images - cache for 1 day
  images: {
    ttl: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 200
  }
};

// Install event - cache static assets and fetch categories
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('[SW] Caching static assets...');
          return cache.addAll(STATIC_CACHE_URLS);
        })
        .then(() => {
          console.log('[SW] Static assets cached successfully');
        }),
      
      // Fetch categories on install
      fetchCategories()
        .then(categories => {
          console.log('[SW] Initial categories fetch completed:', categories.length, 'categories');
        })
    ])
    .then(() => {
      console.log('[SW] Service Worker installation completed');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('[SW] Failed to install service worker:', error);
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('harare-metro-') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    // Image requests - Cache First
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    // Static assets - Cache First
    event.respondWith(handleStaticRequest(request));
  } else {
    // Navigation requests - Network First with offline fallback
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests - Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      const clonedResponse = networkResponse.clone();
      
      // Add timestamp for TTL
      const responseWithTimestamp = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: {
          ...Object.fromEntries(clonedResponse.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      await cache.put(request, responseWithTimestamp);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > CACHE_STRATEGIES.api.ttl;
      
      if (!isExpired) {
        console.log('[SW] Serving from cache:', url.pathname);
        return cachedResponse;
      }
    }
    
    // Return offline response for news feeds
    if (url.pathname.includes('/feeds') || url.pathname.includes('/categories')) {
      const categories = await fetchCategories();
      return new Response(JSON.stringify({
        offline: true,
        message: 'You are currently offline. Showing cached content when available.',
        articles: [],
        categories: categories
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle image requests - Cache First strategy
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Return placeholder for failed images
    return getPlaceholderImage();
  } catch (error) {
    return getPlaceholderImage();
  }
}

// Handle static asset requests - Cache First strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort - basic offline message
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Harare Metro - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: #f5f5f5; }
            .offline { color: #00A651; }
            .flag-strip { position: fixed; top: 0; left: 0; width: 8px; height: 100vh; background: linear-gradient(to bottom, #00A651 0% 20%, #FDD116 20% 40%, #EF3340 40% 60%, #000000 60% 80%, #FFFFFF 80% 100%); }
          </style>
        </head>
        <body>
          <div class="flag-strip"></div>
          <h1 class="offline">Harare Metro</h1>
          <h2>You're currently offline</h2>
          <p>Check your internet connection and try again.</p>
          <p>Zimbabwe's premier news platform will be back online shortly.</p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper functions
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname) ||
         url.pathname.includes('/image') ||
         request.destination === 'image';
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.includes('/assets/') ||
         STATIC_CACHE_URLS.includes(url.pathname);
}

function getPlaceholderImage() {
  // Return a simple 1x1 transparent PNG
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return new Response(transparentPixel, {
    headers: { 'Content-Type': 'image/png' }
  });
}

// Dynamic categories cache
let categoriesCache = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Fetch categories from API with caching
async function fetchCategories() {
  const now = Date.now();
  
  // Return cached categories if still valid
  if (categoriesCache && (now - categoriesCacheTime) < CATEGORIES_CACHE_TTL) {
    return categoriesCache;
  }
  
  try {
    console.log('[SW] Fetching categories from API...');
    const response = await fetch('/api/categories');
    
    if (response.ok) {
      const data = await response.json();
      categoriesCache = data.categories;
      categoriesCacheTime = now;
      console.log('[SW] Categories updated:', categoriesCache.length, 'categories');
      return categoriesCache;
    }
  } catch (error) {
    console.warn('[SW] Failed to fetch categories:', error);
  }
  
  // Return fallback categories if API fails
  return getOfflineCategories();
}

function getOfflineCategories() {
  return [
    { id: 'all', name: 'All News', emoji: '📰' },
    { id: 'politics', name: 'Politics', emoji: '🏛️' },
    { id: 'economy', name: 'Economy', emoji: '💰' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'technology', name: 'Technology', emoji: '💻' },
    { id: 'harare', name: 'Harare', emoji: '🏙️' }
  ];
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(refreshCacheOnReconnect());
  } else if (event.tag === 'categories-sync') {
    event.waitUntil(refreshCategories());
  }
});

async function refreshCacheOnReconnect() {
  console.log('[SW] Background sync triggered - refreshing cache and categories');
  try {
    // Clear expired API cache entries
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cachedAt = response.headers.get('sw-cached-at');
      
      if (cachedAt && (Date.now() - parseInt(cachedAt)) > CACHE_STRATEGIES.api.ttl) {
        await cache.delete(request);
        console.log('[SW] Deleted expired cache entry:', request.url);
      }
    }
    
    // Refresh categories
    await refreshCategories();
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function refreshCategories() {
  console.log('[SW] Refreshing categories from database...');
  try {
    // Force refresh categories by clearing cache
    categoriesCache = null;
    categoriesCacheTime = 0;
    
    // Fetch fresh categories
    const categories = await fetchCategories();
    console.log('[SW] Categories refreshed:', categories.length, 'categories');
    
    // Schedule next category refresh (every 30 minutes)
    setTimeout(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_CATEGORIES_SYNC'
        });
      }
    }, 30 * 60 * 1000);
    
  } catch (error) {
    console.error('[SW] Categories refresh failed:', error);
  }
}

// Message handling for manual cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache());
  }
  
  if (event.data && event.data.type === 'REFRESH_CATEGORIES') {
    event.waitUntil(refreshCategories());
  }
  
  if (event.data && event.data.type === 'SCHEDULE_CATEGORIES_SYNC') {
    // Register background sync for categories
    self.registration.sync.register('categories-sync');
  }
});

async function updateCache() {
  console.log('[SW] Manual cache update requested');
  try {
    // Clear all caches and refresh
    await refreshCacheOnReconnect();
    
    // Also refresh categories
    await refreshCategories();
    
    console.log('[SW] Manual cache update completed');
  } catch (error) {
    console.error('[SW] Manual cache update failed:', error);
  }
}