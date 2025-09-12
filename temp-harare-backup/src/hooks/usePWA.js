import { logger } from '../utils/logger'
// PWA Hook - TEMPORARILY DISABLED

/*
import { useState, useEffect, useCallback } from 'react'

export function usePWA() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallPromptAvailable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallPromptAvailable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Check cache status
  const checkCacheStatus = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const cache = await caches.open('harare-metro-v1')
        const keys = await cache.keys()
        
        setCacheStatus({
          size: keys.length,
          lastUpdated: localStorage.getItem('cache_last_updated'),
          cacheNames: cacheNames
        })
      }
    } catch (error) {
      logger.debug('Error checking cache status:', error)
    }
  }

  // Enhanced refresh that checks cache first
  const refreshWithCacheCheck = async (apiCall) => {
    try {
      // 1. Check if we have cached data and when it was last updated
      await checkCacheStatus()
      
      // 2. Check worker cache status via API
      const cacheCheckResponse = await fetch('/api/admin/refresh-status')
      const cacheInfo = await cacheCheckResponse.json()
      
      logger.debug('🔍 Cache status before refresh:', cacheInfo)
      
      // 3. Determine if refresh is needed
      const lastRefresh = new Date(cacheInfo.backgroundRefresh?.lastRefresh || 0)
      const stalenessThreshold = 5 * 60 * 1000 // 5 minutes
      const isStale = Date.now() - lastRefresh.getTime() > stalenessThreshold
      
      if (isStale || !cacheInfo.backgroundRefresh?.cachedArticles) {
        logger.debug('📥 Cache is stale, triggering refresh...')
        
        // 4. Trigger background refresh on worker
        await fetch('/api/admin/force-refresh', { method: 'POST' })
        
        // 5. Wait a moment for cache to update
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // 6. Now make the API call
      const result = await apiCall()
      
      // 7. Update local cache timestamp
      localStorage.setItem('cache_last_updated', new Date().toISOString())
      
      return result
      
    } catch (error) {
      logger.debug('Enhanced refresh failed:', error)
      // Fallback to regular API call
      return await apiCall()
    }
  }

  const installApp = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallPromptAvailable(false)
    }
    
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return { 
    isOffline, 
    isInstallPromptAvailable, 
    isInstalled, 
    installApp,
    cacheStatus,
    checkCacheStatus,
    refreshWithCacheCheck
  }
}
*/

// Simple fallback export
export function usePWA() {
  return {
    isOffline: false,
    isInstallPromptAvailable: false,
    isInstalled: false,
    refreshWithCacheCheck: async () => {
      window.location.reload()
    },
    installApp: () => {},
    clearCache: async () => {}
  }
}
