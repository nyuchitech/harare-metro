// src/pages/FeedPage.jsx - Main feed page with URL support
import React from 'react'
import { useParams } from 'react-router-dom'
import { useOptimizedFeeds } from '../hooks/useOptimizedFeeds'
import { useAnalytics } from '../hooks/useAnalytics'
import { useHead } from '../hooks/useHead'

// Components
import CategoryFilter from '../components/CategoryFilter'
import FilterControls from '../components/FilterControls'
import ArticleCard from '../components/ArticleCard'
import { ArrowUp, RefreshCw, X } from 'lucide-react'
import { cn } from '../lib/utils'

const FeedPage = ({ currentColors, viewMode = 'grid' }) => {
  const { category = 'all' } = useParams()
  const [selectedCategory, setSelectedCategory] = React.useState(category)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedTimeframe, setSelectedTimeframe] = React.useState('all')
  const [sortBy, setSortBy] = React.useState('newest')

  // Data hooks with optimized multi-tier caching
  const {
    feeds,
    loading,
    loadingMore,
    error,
    totalCount,
    hasMore,
    performanceMetrics,
    toggleLike,
    toggleBookmark,
    isLiked,
    isBookmarked,
    refreshFeeds,
    forceRefresh,
    scrollToTop,
    isEmpty,
    scrollDirection,
    hasReached25Percent,
    visibleArticles
  } = useOptimizedFeeds({
    selectedCategory,
    searchQuery,
    selectedTimeframe,
    sortBy,
    // Optimized feeds doesn't use itemsPerPage - uses intelligent preloading
    enableInfiniteScroll: true,
    autoRefresh: false,
    refreshInterval: 5 * 60 * 1000
  })

  const { trackCategoryClick } = useAnalytics()

  // Update category when URL changes
  React.useEffect(() => {
    if (category !== selectedCategory) {
      setSelectedCategory(category)
    }
  }, [category, selectedCategory])

  // SEO
  useHead({
    title: `Harare Metro - Zimbabwe News${selectedCategory !== 'all' ? ` - ${selectedCategory}` : ''}`,
    description: "Stay informed with the latest news from Zimbabwe",
    keywords: "Zimbabwe news, Harare Metro, politics, economy, sports"
  })

  // Fetch categories from KV API
  const [categories, setCategories] = React.useState([])
  
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/config/categories')
        const data = await response.json()
        if (data.success && data.categories) {
          // Add "All News" category at the beginning
          const allCategory = { id: 'all', name: 'All News', emoji: '📰' }
          setCategories([allCategory, ...data.categories])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Fallback to empty array - CategoryFilter will use its defaults
        setCategories([])
      }
    }
    
    fetchCategories()
  }, [])

  // Event handlers
  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory)
    if (trackCategoryClick) {
      trackCategoryClick(newCategory, 'category_filter')
    }
  }

  const handleShare = async (article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.link
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.link)
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const handleArticleView = (article) => {
    // Track article view
    const historyEntry = {
      ...article,
      viewedAt: new Date().toISOString(),
      readingTime: Math.floor(Math.random() * 180) + 30
    }
    
    // Save to reading history
    try {
      const currentHistory = JSON.parse(localStorage.getItem('harare_metro_reading_history') || '[]')
      const updatedHistory = [historyEntry, ...currentHistory.slice(0, 99)]
      localStorage.setItem('harare_metro_reading_history', JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to save reading history:', error)
    }
  }

  const handleBookmarkArticle = async (article) => {
    // Use optimized bookmark toggle with instant UI feedback
    try {
      await toggleBookmark(article)
      console.log('✅ Optimistic bookmark toggle completed')
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
    }
  }

  const handleForceRefresh = async () => {
    if (forceRefresh) {
      await forceRefresh()
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Error State */}
      {error && (
        <div className="mb-3">
          <div className={`bg-zw-red border-zw-red/20 border rounded-xl p-3 text-white`}>
            <div className="flex items-center">
              <X className="h-5 w-5 mr-3" />
              <div>
                <h3 className="text-sm font-medium">Error Loading News</h3>
                <p className="mt-1 text-sm text-white/90">
                  {error.message}
                </p>
              </div>
              <button
                onClick={handleForceRefresh}
                className="ml-auto text-white hover:text-white/80 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Refreshing Indicator */}
      {loading && (
        <div className="mb-3">
          <div className={`bg-zw-green border-zw-green/20 border rounded-xl p-3 text-white`}>
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
              <p className="text-sm">Refreshing news...</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-3">
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          feeds={feeds || []}
          categories={categories}
        />
      </div>

      {/* Filter Controls */}
      <div className="mb-3">
        <FilterControls
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={() => {}} // ViewMode is controlled by parent
          feeds={feeds || []}
          currentColors={currentColors}
        />
      </div>

      {/* Articles Display */}
      {feeds && feeds.length > 0 ? (
        viewMode === 'grid' ? (
          // Masonry Grid for card view
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {feeds.map((article, index) => (
              <div key={`${article.link || article.id}-${index}`} className="break-inside-avoid mb-4">
                <ArticleCard
                  article={article}
                  currentColors={currentColors}
                  onShare={handleShare}
                  isBookmarked={isBookmarked}
                  onToggleSave={handleBookmarkArticle}
                  viewMode={viewMode}
                  onArticleClick={handleArticleView}
                />
              </div>
            ))}
          </div>
        ) : (
          // Compact List for list view
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {feeds.map((article, index) => (
              <ArticleCard
                key={`${article.link || article.id}-${index}`}
                article={article}
                currentColors={currentColors}
                onShare={handleShare}
                savedArticles={bookmarkedArticles || []}
                onToggleSave={handleBookmarkArticle}
                viewMode={viewMode}
                onArticleClick={handleArticleView}
              />
            ))}
          </div>
        )
      ) : null}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
            <span className={`text-sm ${currentColors.textMuted}`}>
              Loading more articles...
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h3 className={`text-lg font-serif font-bold ${currentColors.text} mb-2`}>
            No articles found
          </h3>
          <p className={`${currentColors.textMuted} mb-4`}>
            {searchQuery 
              ? `No articles match "${searchQuery}"`
              : selectedCategory !== 'all' 
                ? `No articles in ${selectedCategory} category`
                : 'No articles available'
            }
          </p>
          <button
            onClick={handleForceRefresh}
            className={`px-4 py-2 bg-zw-green hover:bg-zw-green/90 text-white rounded-lg transition-all hover:scale-105`}
          >
            Refresh Articles
          </button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && feeds && feeds.length > 0 && !isEmpty && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <p className={`${currentColors.textMuted} mb-2`}>
            You've reached the end!
          </p>
          <p className={`text-sm ${currentColors.textMuted}`}>
            {totalCount} total articles loaded
          </p>
        </div>
      )}

      {/* Scroll to Top Button */}
      {hasReached25Percent && (
        <button
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-24 lg:bottom-6 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
            "bg-zw-green hover:bg-zw-green/90 text-white backdrop-blur-sm"
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </main>
  )
}

export default FeedPage