// src/hooks/useNewsSource.js - Hook for news source information and logos
import { useState, useEffect } from 'react'

// Cache for source profiles to avoid repeated API calls
const sourceProfileCache = new Map()
const logoCache = new Map()

export const useNewsSource = (sourceName) => {
  const [profile, setProfile] = useState(null)
  const [logo, setLogo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sourceName) {
      setLoading(false)
      return
    }

    const fetchSourceInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const cacheKey = sourceName.toLowerCase()
        if (sourceProfileCache.has(cacheKey)) {
          const cachedProfile = sourceProfileCache.get(cacheKey)
          const cachedLogo = logoCache.get(cacheKey)
          setProfile(cachedProfile)
          setLogo(cachedLogo)
          setLoading(false)
          return
        }

        // Fetch from API
        const response = await fetch(`/api/config/source-logo?source=${encodeURIComponent(sourceName)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch source information')
        }

        const data = await response.json()
        
        if (data.success) {
          // Cache the results
          sourceProfileCache.set(cacheKey, data.profile)
          logoCache.set(cacheKey, data.logo)
          
          setProfile(data.profile)
          setLogo(data.logo)
        } else {
          throw new Error(data.error || 'Failed to get source information')
        }
      } catch (err) {
        setError(err.message)
        // Set fallback profile
        const fallbackProfile = createFallbackProfile(sourceName)
        setProfile(fallbackProfile)
        setLogo(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSourceInfo()
  }, [sourceName])

  return { profile, logo, loading, error }
}

// Create fallback profile for unknown sources
const createFallbackProfile = (sourceName) => {
  const initials = sourceName?.split(' ').map(word => word[0]).join('').toUpperCase() || 'N'
  
  return {
    name: sourceName || 'Unknown Source',
    shortName: sourceName || 'Unknown',
    logo: null,
    favicon: null,
    domain: null,
    description: 'News source',
    established: null,
    category: 'general',
    credibility: 'unknown',
    colors: {
      primary: '#6c757d',
      secondary: '#495057'
    },
    initials
  }
}

// Hook to get all news sources
export const useAllNewsSources = () => {
  const [sources, setSources] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAllSources = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/config/news-sources')
        
        if (!response.ok) {
          throw new Error('Failed to fetch news sources')
        }

        const data = await response.json()
        
        if (data.success) {
          setSources(data.sources)
          
          // Cache all sources
          Object.entries(data.sources).forEach(([name, profile]) => {
            const cacheKey = name.toLowerCase()
            sourceProfileCache.set(cacheKey, profile)
          })
        } else {
          throw new Error(data.error || 'Failed to get news sources')
        }
      } catch (err) {
        setError(err.message)
        setSources({})
      } finally {
        setLoading(false)
      }
    }

    fetchAllSources()
  }, [])

  return { sources, loading, error }
}

export default useNewsSource