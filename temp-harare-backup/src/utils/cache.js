// src/utils/cache.js - Cache management utility

export class CacheManager {
  constructor() {
    this.cache = new Map()
    this.CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  isValid(key) {
    const cached = this.cache.get(key)
    return cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

// Create and export a default instance
export const cache = new CacheManager()

// Export as default as well for flexibility
export default CacheManager