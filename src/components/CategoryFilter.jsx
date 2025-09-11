// src/components/CategoryFilter.jsx - Enhanced version with Lucide icons
import React from 'react'
import { X } from 'lucide-react'

const CategoryFilter = ({ 
  selectedCategory, 
  setSelectedCategory, 
  feeds = [],
  categories = [],
  showStats = true
}) => {
  // Default categories if none provided from API
  const defaultCategories = [
    { id: 'all', name: 'All News', emoji: '📰' },
    { id: 'politics', name: 'Politics', emoji: '🏛️' },
    { id: 'economy', name: 'Economy', emoji: '💰' },
    { id: 'business', name: 'Business', emoji: '💼' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'harare', name: 'Harare', emoji: '🏙️' },
    { id: 'technology', name: 'Technology', emoji: '💻' },
    { id: 'agriculture', name: 'Agriculture', emoji: '🌾' },
    { id: 'health', name: 'Health', emoji: '🏥' },
    { id: 'education', name: 'Education', emoji: '🎓' },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎭' },
    { id: 'environment', name: 'Environment', emoji: '🌍' },
    { id: 'crime', name: 'Crime & Security', emoji: '🚔' },
    { id: 'international', name: 'International', emoji: '🌐' },
    { id: 'lifestyle', name: 'Lifestyle', emoji: '✨' },
    { id: 'finance', name: 'Finance', emoji: '💳' }
  ]

  // Use API categories if available, otherwise use defaults
  const availableCategories = categories.length > 0 ? categories : defaultCategories

  // Calculate category counts
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return feeds.length
    return feeds.filter(article => 
      article.category && article.category.toLowerCase() === categoryId.toLowerCase()
    ).length
  }

  // Filter categories that have articles (or show all if we have API categories)
  const categoriesToShow = availableCategories.filter(category => 
    category.id === 'all' || getCategoryCount(category.id) > 0 || categories.length > 0
  )

  return (
    <div className="space-y-4">
      {/* Horizontal Scrolling Category Buttons */}
      <div className="overflow-x-auto">
        <div className="flex space-x-3 items-center overflow-x-auto px-2 pb-2 min-w-max">
          {categoriesToShow.map(category => {
            const count = getCategoryCount(category.id)
            const isSelected = selectedCategory === category.id
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                  whitespace-nowrap flex-shrink-0 min-w-max
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                  }
                `}
                aria-label={`Filter by ${category.name} category (${count} articles)`}
              >
                <span className="text-base">{category.emoji}</span>
                <span>{category.name}</span>
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-bold
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {showStats && selectedCategory !== 'all' && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {availableCategories.find(c => c.id === selectedCategory)?.emoji}
              </span>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-100">
                  Filtered by: {availableCategories.find(c => c.id === selectedCategory)?.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-200">
                  Showing {getCategoryCount(selectedCategory)} articles
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 p-1"
              aria-label="Clear filter"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryFilter