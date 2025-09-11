// Legacy useFeeds hook - DEPRECATED
// All functionality has been moved to useOptimizedFeeds for TikTok-like performance
// This file provides compatibility redirects only

import { useOptimizedFeeds } from './useOptimizedFeeds'

// Main export - redirects to useOptimizedFeeds  
export function useFeeds(params) {
  console.warn('useFeeds is deprecated. Components should import useOptimizedFeeds directly for better performance.')
  return useOptimizedFeeds(params)
}

// Legacy compatibility exports - all redirect to useOptimizedFeeds
export const useAPI = () => {
  console.warn('useAPI is deprecated. All operations now use multi-tier caching.')
  return {
    loading: false,
    error: null,
    userId: 'legacy',
    clearError: () => {},
    multiTierCaching: true
  }
}

export const useUserData = () => {
  console.warn('useUserData is deprecated. Use useOptimizedFeeds instead.')
  const feeds = useOptimizedFeeds()
  return {
    likes: feeds.optimisticLikes || new Map(),
    bookmarks: feeds.optimisticBookmarks || new Map(), 
    loading: false,
    toggleLike: feeds.toggleLike,
    toggleBookmark: feeds.toggleBookmark,
    isLiked: feeds.isLiked,
    isBookmarked: feeds.isBookmarked,
    optimisticUpdates: true
  }
}

export const useScrollAndFeed = (params) => {
  console.warn('useScrollAndFeed is deprecated. Use useOptimizedFeeds instead.')
  const feeds = useOptimizedFeeds(params)
  return {
    displayedFeeds: feeds.feeds,
    loadingMore: feeds.loadingMore,
    hasMore: feeds.hasMore,
    currentPage: feeds.currentPage,
    loadMoreFeeds: feeds.loadMoreFeeds,
    refreshFeeds: feeds.refreshFeeds,
    scrollDirection: feeds.scrollDirection,
    hasReached25Percent: feeds.hasReached25Percent,
    scrollToTop: feeds.scrollToTop,
    performanceOptimized: true
  }
}

// Mock articles for fallback - now with TikTok-style optimization
function generateMockArticles(count = 24) {
  console.warn('Using mock articles - MultiTierCacheManager may not be initialized properly')
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i + 1}`,
    slug: `mock-article-${i + 1}`,
    title: `Mock Article ${i + 1}`,
    description: `This is a mock article for development and fallback purposes with TikTok-like optimization.`,
    content: `Mock content for article ${i + 1}. This is used when the MultiTierCacheManager is not available or during development.`,
    author: 'Mock Author',
    source: 'Mock Source',
    category: ['Politics', 'Economy', 'Sports', 'Technology'][i % 4],
    publishedAt: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
    imageUrl: `https://picsum.photos/400/300?random=${i + 1}`,
    optimizedImageUrl: `https://picsum.photos/400/300?random=${i + 1}`,
    image_url: `https://picsum.photos/400/300?random=${i + 1}`,
    view_count: Math.floor(Math.random() * 100),
    mobilePreview: true,
    optimisticState: true,
    preloadReady: true
  }))
}

export { generateMockArticles }
export default useFeeds