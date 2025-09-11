// Pure vertical scroll news experience with snap scrolling
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import {
  Share,
  Bookmark,
  Heart,
  Globe,
  RefreshCw,
  ArrowUp
} from 'lucide-react'
import ArticleModal from './ArticleModal'
import ShareModal from './ShareModal'
import { useAnalytics } from '../hooks/useAnalytics'

const NewsBytes = ({ 
  currentColors, 
  articles = [], 
  isLiked,
  isBookmarked,
  toggleLike,
  toggleBookmark,
  onShare,
  forceRefresh
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  const containerRef = useRef(null)
  const articlesRef = useRef([])
  const touchStartRef = useRef({ y: 0, time: 0 })
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)

  // Analytics hooks
  const { trackArticleView, trackUserInteraction } = useAnalytics()

  // Filter articles that have images for visual news bytes
  const validArticles = articles.filter(article => 
    article.optimizedImageUrl || article.imageUrl || article.image_url
  )

  // Track article view when current article changes
  useEffect(() => {
    if (validArticles[currentIndex]) {
      trackArticleView(validArticles[currentIndex])
    }
  }, [currentIndex, validArticles, trackArticleView])

  // Smooth snap scrolling to specific article
  const scrollToArticle = useCallback((index) => {
    const articleElement = articlesRef.current[index]
    if (articleElement && containerRef.current) {
      articleElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
      setCurrentIndex(index)
      
      // Show back to top if not at first article
      setShowBackToTop(index > 0)
    }
  }, [])

  // Handle scroll events with snap behavior
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isScrolling = false

    const handleScroll = () => {
      if (isScrolling) return
      
      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height
      
      // Find which article is currently most visible
      let mostVisibleIndex = 0
      let maxVisibleHeight = 0
      
      articlesRef.current.forEach((articleEl, index) => {
        if (!articleEl) return
        
        const articleRect = articleEl.getBoundingClientRect()
        const visibleHeight = Math.min(articleRect.bottom, containerRect.bottom) - 
                             Math.max(articleRect.top, containerRect.top)
        
        if (visibleHeight > maxVisibleHeight && visibleHeight > 0) {
          maxVisibleHeight = visibleHeight
          mostVisibleIndex = index
        }
      })
      
      if (mostVisibleIndex !== currentIndex) {
        setCurrentIndex(mostVisibleIndex)
        setShowBackToTop(mostVisibleIndex > 0)
      }
    }

    // Snap to nearest article when scrolling stops
    const handleScrollEnd = () => {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling = false
        
        // Find the article closest to the center of the viewport
        const containerRect = container.getBoundingClientRect()
        const viewportCenter = containerRect.top + containerRect.height / 2
        
        let closestIndex = 0
        let minDistance = Infinity
        
        articlesRef.current.forEach((articleEl, index) => {
          if (!articleEl) return
          
          const articleRect = articleEl.getBoundingClientRect()
          const articleCenter = articleRect.top + articleRect.height / 2
          const distance = Math.abs(viewportCenter - articleCenter)
          
          if (distance < minDistance) {
            minDistance = distance
            closestIndex = index
          }
        })
        
        // Snap to closest article if it's not already centered
        if (closestIndex !== currentIndex) {
          scrollToArticle(closestIndex)
        }
      }, 150) // Wait 150ms after scroll stops
      
      isScrolling = true
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('scroll', handleScrollEnd, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('scroll', handleScrollEnd)
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [currentIndex, scrollToArticle])

  // Touch and wheel navigation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      touchStartRef.current = {
        y: e.touches[0].clientY,
        time: Date.now()
      }
    }

    const handleTouchEnd = (e) => {
      const endTouch = e.changedTouches[0]
      const startTouch = touchStartRef.current
      const deltaY = startTouch.y - endTouch.clientY
      const deltaTime = Date.now() - startTouch.time
      
      // Quick swipe detection
      if (Math.abs(deltaY) > 50 && deltaTime < 300) {
        e.preventDefault()
        
        if (deltaY > 0 && currentIndex < validArticles.length - 1) {
          // Swipe up - next article
          scrollToArticle(currentIndex + 1)
        } else if (deltaY < 0 && currentIndex > 0) {
          // Swipe down - previous article  
          scrollToArticle(currentIndex - 1)
        } else if (deltaY < 0 && currentIndex === 0) {
          // Swipe down on first article - force refresh
          handleForceRefresh()
        }
      }
    }

    const handleWheel = (e) => {
      // Debounce wheel events
      if (isScrollingRef.current) return
      
      isScrollingRef.current = true
      setTimeout(() => {
        isScrollingRef.current = false
      }, 100)

      const delta = e.deltaY
      
      if (delta > 0 && currentIndex < validArticles.length - 1) {
        // Scroll down - next article
        e.preventDefault()
        scrollToArticle(currentIndex + 1)
      } else if (delta < 0 && currentIndex > 0) {
        // Scroll up - previous article
        e.preventDefault()  
        scrollToArticle(currentIndex - 1)
      } else if (delta < 0 && currentIndex === 0) {
        // Scroll up on first article - force refresh
        e.preventDefault()
        handleForceRefresh()
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)  
      container.removeEventListener('wheel', handleWheel)
    }
  }, [currentIndex, validArticles.length, scrollToArticle])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showShareModal || showArticleModal) {
        if (e.key === 'Escape') {
          setShowShareModal(false)
          setShowArticleModal(false)
        }
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (currentIndex > 0) {
            scrollToArticle(currentIndex - 1)
          } else {
            handleForceRefresh()
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (currentIndex < validArticles.length - 1) {
            scrollToArticle(currentIndex + 1)
          }
          break
        case 'Enter':
          e.preventDefault()
          setShowArticleModal(true)
          break
        case 'l':
          e.preventDefault()
          handleLike()
          break
        case 's':
          e.preventDefault()
          handleBookmark()
          break
        case 'r':
          e.preventDefault()
          handleForceRefresh()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, validArticles.length, showShareModal, showArticleModal, scrollToArticle])

  // Force refresh handler
  const handleForceRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    try {
      if (forceRefresh) {
        await forceRefresh()
      }
      
      // Reset to first article after refresh
      setTimeout(() => {
        scrollToArticle(0)
      }, 500)
      
    } catch (error) {
      console.error('Force refresh failed:', error)
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }, [isRefreshing, forceRefresh, scrollToArticle])

  // Interaction handlers
  const handleLike = useCallback(async () => {
    const article = validArticles[currentIndex]
    if (!article || !toggleLike) return

    try {
      const newState = await toggleLike(article)
      trackUserInteraction('like', article, newState)
    } catch (error) {
      console.error('Error liking article:', error)
    }
  }, [currentIndex, validArticles, toggleLike, trackUserInteraction])

  const handleBookmark = useCallback(async () => {
    const article = validArticles[currentIndex]
    if (!article || !toggleBookmark) return

    try {
      const newState = await toggleBookmark(article)
      trackUserInteraction('bookmark', article, newState)
    } catch (error) {
      console.error('Error bookmarking article:', error)
    }
  }, [currentIndex, validArticles, toggleBookmark, trackUserInteraction])

  const handleShare = useCallback(() => {
    const article = validArticles[currentIndex]
    if (!article) return

    trackUserInteraction('share', article, true)

    if (onShare) {
      onShare(article)
    } else {
      setShowShareModal(true)
    }
  }, [currentIndex, validArticles, onShare, trackUserInteraction])

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'now'
    if (diffInHours < 24) return `${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d`
    return date.toLocaleDateString()
  }, [])

  const scrollToTop = useCallback(() => {
    scrollToArticle(0)
  }, [scrollToArticle])

  // Loading state
  if (validArticles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4 text-white">
          <div className="text-6xl">📱</div>
          <h3 className="text-xl font-semibold">No Stories Available</h3>
          <p className="text-white/70 max-w-md">
            Pull down to refresh or try again later
          </p>
          <Button 
            variant="outline" 
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 text-white p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Refreshing stories...</span>
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {validArticles.map((article, index) => (
          <div
            key={`${article.link || article.id}-${index}`}
            ref={(el) => (articlesRef.current[index] = el)}
            className="h-screen w-full snap-start snap-always flex-shrink-0 relative overflow-hidden bg-black"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={article.optimizedImageUrl || article.imageUrl || article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                loading={index <= 2 ? 'eager' : 'lazy'}
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pt-safe pb-safe">
              {/* Top indicators */}
              <div className="flex justify-between items-start">
                <div className="text-white/60 text-sm">
                  {index + 1} / {validArticles.length}
                </div>
                {index === 0 && (
                  <div className="text-white/60 text-xs text-center">
                    <div>Pull down to refresh</div>
                    <div className="mt-1">↓</div>
                  </div>
                )}
              </div>

              {/* Bottom content */}
              <div className="flex justify-between items-end">
                {/* Left side - Content */}
                <div className="flex-1 max-w-[calc(100%-80px)] space-y-3">
                  {/* Source */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {article.source?.charAt(0).toUpperCase() || 'N'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {article.source || 'News'}
                      </p>
                    </div>
                    <span className="text-white/60 text-xs">
                      {formatTimeAgo(article.publishedAt || article.pubDate || article.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white text-lg font-bold leading-tight line-clamp-3">
                    {article.title}
                  </h2>
                  
                  {/* Category */}
                  {article.category && (
                    <Badge 
                      variant="secondary" 
                      className="bg-white/10 text-white border-white/20 text-xs"
                    >
                      {article.category}
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setShowArticleModal(true)}
                      className="bg-white/90 text-black hover:bg-white text-xs"
                    >
                      Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(article.link, '_blank')}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Source
                    </Button>
                  </div>
                </div>

                {/* Right side - Interaction buttons */}
                <div className="flex flex-col space-y-4 items-center">
                  {/* Like */}
                  <button
                    onClick={handleLike}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Heart 
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isLiked && isLiked(article.id || article.slug || article.link)
                          ? "fill-red-500 text-red-500" 
                          : "text-white"
                      )}
                    />
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Share className="h-6 w-6 text-white" />
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={handleBookmark}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Bookmark 
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isBookmarked && isBookmarked(article.id || article.slug || article.link)
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-white"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
        >
          <ArrowUp className="h-5 w-5 text-black" />
        </button>
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <ArticleModal
          article={validArticles[currentIndex]}
          onClose={() => setShowArticleModal(false)}
          currentColors={currentColors}
          onShare={onShare}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          article={validArticles[currentIndex]}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          currentColors={currentColors}
        />
      )}
    </div>
  )
}

export default NewsBytes