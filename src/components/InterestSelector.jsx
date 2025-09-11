// src/components/InterestSelector.jsx - User interests selection component
import React, { useState, useEffect } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const InterestSelector = ({ 
  onInterestsChange, 
  initialInterests = [], 
  maxInterests = 5,
  onClose,
  showHeader = true 
}) => {
  const [selectedInterests, setSelectedInterests] = useState(initialInterests)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/config/categories')
        if (!response.ok) throw new Error('Failed to load categories')
        
        const data = await response.json()
        if (data.success) {
          // Filter out legacy categories and organize by groups
          const modernCategories = data.categories.filter(cat => 
            !['general', 'harare', 'agriculture', 'health', 'education', 'crime', 'environment'].includes(cat.id)
          )
          setCategories(modernCategories)
        } else {
          throw new Error(data.error || 'Failed to load categories')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadCategories()
  }, [])

  const handleInterestToggle = (categoryId) => {
    setSelectedInterests(prev => {
      let newInterests
      if (prev.includes(categoryId)) {
        // Remove if already selected
        newInterests = prev.filter(id => id !== categoryId)
      } else {
        // Add if not at max limit
        if (prev.length < maxInterests) {
          newInterests = [...prev, categoryId]
        } else {
          // Show warning and don't add
          return prev
        }
      }
      
      // Notify parent component
      if (onInterestsChange) {
        onInterestsChange(newInterests)
      }
      
      return newInterests
    })
  }

  const handleSave = () => {
    if (onInterestsChange) {
      onInterestsChange(selectedInterests)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleReset = () => {
    setSelectedInterests([])
    if (onInterestsChange) {
      onInterestsChange([])
    }
  }

  // Group categories by their main groups
  const categoryGroups = {
    'Entertainment & Media': categories.filter(cat => 
      ['movies_cinema', 'music_audio', 'gaming_esports', 'books_literature'].includes(cat.id)
    ),
    'Lifestyle & Culture': categories.filter(cat => 
      ['fashion_style', 'food_culinary', 'travel_adventure', 'fitness_wellness'].includes(cat.id)
    ),
    'Technology & Innovation': categories.filter(cat => 
      ['tech_gadgets', 'ai_future', 'crypto_blockchain'].includes(cat.id)
    ),
    'Social & Community': categories.filter(cat => 
      ['local_community', 'social_activism', 'relationships_dating'].includes(cat.id)
    ),
    'Business & Career': categories.filter(cat => 
      ['entrepreneurship', 'career_professional', 'finance_investing'].includes(cat.id)
    ),
    'Arts & Creativity': categories.filter(cat => 
      ['visual_arts', 'photography', 'design_creative'].includes(cat.id)
    ),
    'Education & Learning': categories.filter(cat => 
      ['science_research', 'history_culture', 'languages_learning'].includes(cat.id)
    ),
    'Sports & Recreation': categories.filter(cat => 
      ['sports_athletics', 'outdoor_nature', 'hobbies_crafts'].includes(cat.id)
    ),
    'News & Current Events': categories.filter(cat => 
      ['politics_governance', 'world_news', 'local_news'].includes(cat.id)
    ),
    'Spirituality & Philosophy': categories.filter(cat => 
      ['spirituality_religion', 'philosophy_thought', 'personal_development'].includes(cat.id)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading categories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-zw-green text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {showHeader && (
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-zw-green mr-3" />
            <h2 className="text-3xl font-bold text-white">Choose Your Interests</h2>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select up to {maxInterests} categories that interest you most. 
            This will help us prioritize content in your feed to show you the stories you care about.
          </p>
          <div className="mt-4 p-3 bg-zw-green/10 border border-zw-green/30 rounded-lg">
            <p className="text-sm text-zw-green">
              {selectedInterests.length}/{maxInterests} interests selected
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(categoryGroups).map(([groupName, groupCategories]) => (
          groupCategories.length > 0 && (
            <div key={groupName} className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                {groupName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCategories.map((category) => {
                  const isSelected = selectedInterests.includes(category.id)
                  const isDisabled = !isSelected && selectedInterests.length >= maxInterests
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => !isDisabled && handleInterestToggle(category.id)}
                      disabled={isDisabled}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all duration-200 text-left",
                        "hover:scale-105 hover:shadow-lg",
                        isSelected && "border-zw-green bg-zw-green/20",
                        !isSelected && !isDisabled && "border-gray-600 bg-gray-800 hover:border-gray-500",
                        isDisabled && "border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.emoji}</span>
                          <div>
                            <h4 className="font-medium text-white text-sm">{category.name}</h4>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-zw-green" />
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div 
                          className="absolute inset-0 rounded-lg border-2 border-zw-green"
                          style={{ backgroundColor: category.color + '20' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        ))}
      </div>

      {showHeader && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0}
            className={cn(
              "px-8 py-3 rounded-lg font-medium transition-colors",
              selectedInterests.length > 0
                ? "bg-zw-green text-white hover:bg-zw-green/90"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            Save Interests ({selectedInterests.length})
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default InterestSelector