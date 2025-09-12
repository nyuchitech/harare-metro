// Auto-updated to use ShadCN UI approach
import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { IconGroup } from '@/components/ui/icon-group'
import { cn } from '@/lib/utils'
import { 
  BookmarkIcon,
  ClockIcon,
  TrashIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  TagIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const SaveForLater = ({
  savedArticles = [],
  onToggleSave,
  onShare,
  onArticleClick,
  currentColors,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  // Get unique categories from saved articles
  const availableCategories = useMemo(() => {
    const categories = [...new Set(savedArticles.map(article => article.category).filter(Boolean))]
    return ['all', ...categories.sort()]
  }, [savedArticles])

  // Filter and sort saved articles
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = savedArticles

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchLower) ||
        article.description?.toLowerCase().includes(searchLower) ||
        article.source?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.savedAt || a.pubDate) - new Date(b.savedAt || b.pubDate)
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'source':
          return a.source.localeCompare(b.source)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'newest':
        default:
          return new Date(b.savedAt || b.pubDate) - new Date(a.savedAt || a.pubDate)
      }
    })

    return filtered
  }, [savedArticles, searchQuery, selectedCategory, sortBy])

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category) => {
    const colors = {
      politics: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      economy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      business: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      technology: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      health: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
    }
    return colors[category?.toLowerCase()] || colors.general
  }

  if (savedArticles.length === 0) {
    return (
      <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-8 text-center ${className}`}>
        <IconButton tooltip="ClockIcon" className="h-4 w-4"><IconButton><ClockIcon className="h-4 w-4" /></IconButton></IconButton>
        <h3 className={`text-xl font-semibold ${currentColors.text} mb-2`}>
          No Saved Articles
        </h3>
        <p className={`${currentColors.textMuted}`}>
          Articles you save for later will appear here. Look for the bookmark icon on articles to save them.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconButton tooltip="BookmarkIcon" className="h-4 w-4"><IconButton><BookmarkIcon className="h-4 w-4" /></IconButton></IconButton>
          <h2 className={`text-2xl font-bold ${currentColors.text}`}>
            Saved for Later
          </h2>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentColors.categoryButton}`}>
            {savedArticles.length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <IconButton tooltip="MagnifyingGlassIcon" className="h-4 w-4"><IconButton><MagnifyingGlassIcon className="h-4 w-4" /></IconButton></IconButton>
            <input
              type="text"
              placeholder="Search saved articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 ${currentColors.input} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <IconButton tooltip="XMarkIcon" className="h-4 w-4"><IconButton><XMarkIcon className="h-4 w-4" /></IconButton></IconButton>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? currentColors.categoryButtonActive
                    : currentColors.categoryButton
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${currentColors.text}`}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${currentColors.input} border rounded-lg px-2 py-1 text-sm`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="source">By Source</option>
              <option value="category">By Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className={`text-sm ${currentColors.textMuted}`}>
        Showing {filteredAndSortedArticles.length} of {savedArticles.length} saved articles
        {searchQuery && ` for "${searchQuery}"`}
        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
      </div>

      {/* Saved Articles List */}
      <div className="space-y-4">
        {filteredAndSortedArticles.map((article, index) => (
          <div
            key={`${article.link}-${index}`}
            className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 transition-all hover:shadow-lg`}
          >
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 min-w-0">
                {/* Article Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-semibold ${currentColors.text} line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors`}
                      onClick={() => onArticleClick?.(article)}>
                    {article.title}
                  </h3>
                </div>

                {/* Article Meta */}
                <div className="flex items-center space-x-4 mb-3 text-sm">
                  <span className={`font-medium ${currentColors.text}`}>
                    {article.source}
                  </span>
                  {article.category && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                  )}
                  <span className={`flex items-center space-x-1 ${currentColors.textMuted}`}>
                    <IconButton tooltip="CalendarIcon" className="h-4 w-4"><IconButton><CalendarIcon className="h-4 w-4" /></IconButton></IconButton>
                    <span>Saved {formatDate(article.savedAt)}</span>
                  </span>
                </div>

                {/* Article Description */}
                {article.description && (
                  <p className={`${currentColors.textMuted} text-sm line-clamp-2 mb-3`}>
                    {article.description}
                  </p>
                )}

                {/* Article Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleSave(article)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                    title="Remove from saved"
                  >
                    <IconButton tooltip="TrashIcon" className="h-4 w-4"><IconButton><TrashIcon className="h-4 w-4" /></IconButton></IconButton>
                    <span className="text-xs">Remove</span>
                  </button>
                  
                  <button
                    onClick={() => onShare?.(article)}
                    className={`flex items-center space-x-1 ${currentColors.textMuted} hover:${currentColors.text} transition-colors`}
                    title="Share article"
                  >
                    <IconButton tooltip="ShareIcon" className="h-4 w-4"><IconButton><ShareIcon className="h-4 w-4" /></IconButton></IconButton>
                    <span className="text-xs">Share</span>
                  </button>
                  
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-1 ${currentColors.textMuted} hover:text-blue-600 transition-colors`}
                    title="Read full article"
                  >
                    <IconButton tooltip="ArrowTopRightOnSquareIcon" className="h-4 w-4"><IconButton><ArrowTopRightOnSquareIcon className="h-4 w-4" /></IconButton></IconButton>
                    <span className="text-xs">Read Full</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAndSortedArticles.length === 0 && savedArticles.length > 0 && (
        <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-8 text-center`}>
          <IconButton tooltip="MagnifyingGlassIcon" className="h-4 w-4"><IconButton><MagnifyingGlassIcon className="h-4 w-4" /></IconButton></IconButton>
          <h3 className={`text-xl font-semibold ${currentColors.text} mb-2`}>
            No Saved Articles Found
          </h3>
          <p className={`${currentColors.textMuted}`}>
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}

export default SaveForLater
