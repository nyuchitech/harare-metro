// Auto-updated to use ShadCN UI approach
import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { IconGroup } from '@/components/ui/icon-group'
import { cn } from '@/lib/utils'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import EnhancedAnalyticsSection from './EnhancedAnalyticsSection'
import { useAnalytics } from '../hooks/useAnalytics'
import Footer from './Footer'

const SearchPage = ({ 
  currentColors, 
  allFeeds, 
  onClose, 
  onSelectArticle, 
  lastUpdated,
  recentSearches = [],
  onAddRecentSearch 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const { trackSearch, trackArticleView } = useAnalytics()

  // Categories for filtering
  const CATEGORIES = [
    { id: 'all', label: 'All News', icon: '📰' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'economy', label: 'Economy', icon: '💰' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'harare', label: 'Harare', icon: '🏙️' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
    { id: 'environment', label: 'Environment', icon: '🌍' },
    { id: 'crime', label: 'Crime & Security', icon: '🚔' },
    { id: 'international', label: 'International', icon: '🌐' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '✨' },
    { id: 'finance', label: 'Finance', icon: '💳' }
  ]

  // Search results with analytics tracking
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase().trim()
    const results = allFeeds
      .filter(article => 
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.source?.toLowerCase().includes(query) ||
        article.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      )
      .slice(0, 10) // Show more results for search mode
    
    return results
  }, [allFeeds, searchQuery])

  // Handle search with analytics tracking
  const handleSearch = async (query) => {
    if (query.trim()) {
      // Track the search
      await trackSearch(query, { category: 'all', source: 'all' })
      
      // Add to recent searches
      if (onAddRecentSearch) {
        onAddRecentSearch(query.trim())
      }
      
      // Set search mode to show results
      setIsSearchMode(true)
      setShowAnalytics(false)
    }
  }

  // Handle article selection with analytics tracking
  const handleSelectArticle = async (article) => {
    // Track article view
    await trackArticleView(article)
    
    // Call parent handler
    onSelectArticle(article)
    onClose()
  }

  // Handle keyword search from analytics
  const handleKeywordSearch = async (keyword) => {
    setSearchQuery(keyword)
    await handleSearch(keyword)
  }

  // Toggle between search and analytics modes
  const toggleMode = () => {
    if (isSearchMode) {
      setIsSearchMode(false)
      setShowAnalytics(true)
      setSearchQuery('')
    } else {
      setShowAnalytics(!showAnalytics)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSearchMode) {
          setIsSearchMode(false)
          setSearchQuery('')
          setShowAnalytics(true)
        } else {
          onClose()
        }
      } else if (e.key === 'Enter' && searchQuery.trim()) {
        handleSearch(searchQuery)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchMode, searchQuery, onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div className={`absolute inset-x-0 top-0 h-full ${currentColors.bg} overflow-y-auto`}>
        <div className="max-w-6xl mx-auto min-h-full flex flex-col">
          {/* Header */}
          <div className={`sticky top-0 ${currentColors.headerBg} backdrop-blur-lg border-b ${currentColors.border} p-4 z-10`}>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-3 rounded-lg ${currentColors.text} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                aria-label="Close search"
              >
                <IconButton tooltip="XMarkIcon" className="h-4 w-4"><IconButton><XMarkIcon className="h-4 w-4" /></IconButton></IconButton>
              </button>
              
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon 
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${currentColors.textMuted}`}
                  />
                  <input
                    type="search"
                    placeholder="Search Zimbabwe news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    className={`w-full pl-10 pr-4 py-3 text-base ${currentColors.cardBg} ${currentColors.text} border ${currentColors.border} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setIsSearchMode(false)
                        setShowAnalytics(true)
                      }}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      <IconButton tooltip="XMarkIcon" className="h-4 w-4"><IconButton><XMarkIcon className="h-4 w-4" /></IconButton></IconButton>
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Toggle Button */}
              <button
                onClick={toggleMode}
                className={`flex items-center px-4 py-2 rounded-lg transition-all font-medium ${
                  showAnalytics && !isSearchMode
                    ? 'bg-blue-500 text-white shadow-lg'
                    : `${currentColors.categoryButton} hover:scale-105`
                }`}
                aria-label={isSearchMode ? "Show analytics" : "Toggle analytics"}
              >
                <IconButton tooltip="ChartBarIcon" className="h-4 w-4"><IconButton><ChartBarIcon className="h-4 w-4" /></IconButton></IconButton>
                {isSearchMode ? 'Analytics' : (showAnalytics ? 'Hide Analytics' : 'Show Analytics')}
              </button>
            </div>

            {/* Quick Search Button */}
            {searchQuery && !isSearchMode && (
              <div className="mt-3">
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className={`w-full py-3 px-4 rounded-xl ${currentColors.accent} text-white font-medium transition-all hover:opacity-90 flex items-center justify-center shadow-lg`}
                >
                  <IconButton tooltip="MagnifyingGlassIcon" className="h-4 w-4"><IconButton><MagnifyingGlassIcon className="h-4 w-4" /></IconButton></IconButton>
                  Search for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* Content Area - Flex grow to push footer down */}
          <div className="flex-1">
            {/* Search Results Mode */}
            {isSearchMode && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className={`text-xl font-bold ${currentColors.text} mb-2`}>
                    Search Results for "{searchQuery}"
                  </h2>
                  <p className={`${currentColors.textMuted}`}>
                    Found {searchResults.length} articles
                  </p>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((article, index) => (
                      <button
                        key={`${article.link || article.guid}-${index}`}
                        onClick={() => handleSelectArticle(article)}
                        className={`w-full text-left p-4 rounded-xl border ${currentColors.border} ${currentColors.cardBg} hover:shadow-lg transition-all group`}
                      >
                        <div className="flex items-start gap-4">
                          {article.optimizedImageUrl && (
                            <img
                              src={article.optimizedImageUrl}
                              alt={article.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold ${currentColors.text} group-hover:text-blue-600 transition-colors line-clamp-2 mb-2`}>
                              {article.title}
                            </h3>
                            {article.description && (
                              <p className={`text-sm ${currentColors.textMuted} line-clamp-2 mb-2`}>
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs">
                              <span className={`${currentColors.textMuted}`}>
                                {article.source}
                              </span>
                              <span className={`${currentColors.textMuted}`}>
                                {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'Recent'}
                              </span>
                              {article.category && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                  {article.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${currentColors.textMuted}`}>
                    <IconButton tooltip="MagnifyingGlassIcon" className="h-4 w-4"><IconButton><MagnifyingGlassIcon className="h-4 w-4" /></IconButton></IconButton>
                    <p className="text-lg mb-2">No articles found</p>
                    <p className="text-sm">Try different keywords or check your spelling</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Mode */}
            {showAnalytics && !isSearchMode && (
              <EnhancedAnalyticsSection
                currentColors={currentColors}
                allFeeds={allFeeds}
                searchQuery={searchQuery}
                recentSearches={recentSearches}
                onKeywordSearch={handleKeywordSearch}
              />
            )}

            {/* Default Mode - Search Suggestions */}
            {!showAnalytics && !isSearchMode && searchQuery && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className={`text-xl font-bold ${currentColors.text} mb-2`}>
                    Search Suggestions
                  </h2>
                  <p className={`${currentColors.textMuted}`}>
                    Found {searchResults.length} matches for "{searchQuery}"
                  </p>
                </div>

                {searchResults.length > 0 && (
                  <div className={`${currentColors.cardBg} border ${currentColors.border} rounded-xl p-4 shadow-lg`}>
                    <h4 className={`text-sm font-medium ${currentColors.text} mb-3`}>
                      Quick Results:
                    </h4>
                    <div className="space-y-2 mb-4">
                      {searchResults.slice(0, 5).map((article, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSelectArticle(article)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${currentColors.categoryButton} hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                        >
                          <div className={`text-sm font-medium ${currentColors.text} line-clamp-1 mb-1`}>
                            {article.title}
                          </div>
                          <div className={`text-xs ${currentColors.textMuted}`}>
                            {article.source} • {article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'Recent'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSearch(searchQuery)}
                      className={`w-full py-2 px-4 rounded-lg ${currentColors.accent} text-white text-sm font-medium transition-colors hover:opacity-90 shadow-md`}
                    >
                      View All {searchResults.length} Results
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <Footer currentColors={currentColors} />
        </div>
      </div>
    </div>
  )
}

export default SearchPage
