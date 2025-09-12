// src/components/InterestSelector.jsx - User interests selection component with Lucide icons
import React, { useState, useEffect } from 'react'
import { 
  Check, X, Sparkles, Film, Music, Gamepad2, BookOpen,
  Shirt, ChefHat, MapPin as Travel, Heart, Laptop,
  Brain, Bitcoin, Users, TrendingUp, Briefcase,
  DollarSign, Palette, Camera, Lightbulb, Atom,
  Clock, Globe2, Trophy, Mountain, Scissors,
  Building, Newspaper, Church, Home as HomeIcon
} from 'lucide-react'
import { cn } from '../lib/utils'

// Icon mapping for categories
const getIconForCategory = (categoryId, isSelected) => {
  const iconClass = `h-5 w-5 ${isSelected ? 'text-zw-green' : 'text-muted-foreground'}`
  
  const iconMap = {
    'movies_cinema': <Film className={iconClass} />,
    'music_audio': <Music className={iconClass} />,
    'gaming_esports': <Gamepad2 className={iconClass} />,
    'books_literature': <BookOpen className={iconClass} />,
    'fashion_style': <Shirt className={iconClass} />,
    'food_culinary': <ChefHat className={iconClass} />,
    'travel_adventure': <Travel className={iconClass} />,
    'fitness_wellness': <Heart className={iconClass} />,
    'tech_gadgets': <Laptop className={iconClass} />,
    'ai_future': <Brain className={iconClass} />,
    'crypto_blockchain': <Bitcoin className={iconClass} />,
    'local_community': <Users className={iconClass} />,
    'social_activism': <TrendingUp className={iconClass} />,
    'relationships_dating': <Heart className={iconClass} />,
    'entrepreneurship': <Lightbulb className={iconClass} />,
    'career_professional': <Briefcase className={iconClass} />,
    'finance_investing': <DollarSign className={iconClass} />,
    'visual_arts': <Palette className={iconClass} />,
    'photography': <Camera className={iconClass} />,
    'design_creative': <Lightbulb className={iconClass} />,
    'science_research': <Atom className={iconClass} />,
    'history_culture': <Clock className={iconClass} />,
    'languages_learning': <Globe2 className={iconClass} />,
    'sports_athletics': <Trophy className={iconClass} />,
    'outdoor_nature': <Mountain className={iconClass} />,
    'hobbies_crafts': <Scissors className={iconClass} />,
    'politics_governance': <Building className={iconClass} />,
    'world_news': <Newspaper className={iconClass} />,
    'local_news': <HomeIcon className={iconClass} />,
    'spirituality_religion': <Church className={iconClass} />,
    'philosophy_thought': <Brain className={iconClass} />,
    'personal_development': <TrendingUp className={iconClass} />
  }
  
  return iconMap[categoryId] || <Sparkles className={iconClass} />
}

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
      <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl rounded-3xl">
        <div className="text-center space-y-4 animate-fade-in-scale">
          <div className="w-12 h-12 bg-gradient-to-br from-zw-green/20 to-zw-green/10 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-zw-green animate-pulse" />
          </div>
          <div className="text-muted-foreground font-medium">Loading categories...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl rounded-3xl">
        <div className="space-y-6 animate-slide-in-top">
          <div className="w-16 h-16 bg-gradient-to-br from-zw-red/20 to-zw-red/10 rounded-2xl flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-zw-red" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-serif font-bold text-foreground">Error Loading Categories</h3>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-zw-green to-zw-green/90 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in-scale">
      {showHeader && (
        <div className="text-center mb-12 animate-slide-in-top">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-3xl flex items-center justify-center shadow-2xl glass-effect animate-pulse-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif font-bold text-foreground tracking-tight">Choose Your Interests</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Select up to {maxInterests} categories that interest you most. 
              This will help us prioritize content in your feed to show you the stories you care about.
            </p>
          </div>
          <div className="mt-8 p-4 bg-gradient-to-r from-zw-green/10 to-zw-green/5 border-2 border-zw-green/30 rounded-2xl glass-effect">
            <p className="text-lg font-semibold text-zw-green">
              {selectedInterests.length}/{maxInterests} interests selected
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(categoryGroups).map(([groupName, groupCategories]) => (
          groupCategories.length > 0 && (
            <div key={groupName} className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-foreground border-b-2 border-zw-green/30 pb-3 mb-2 tracking-tight">
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
                        "relative p-5 rounded-2xl border-2 transition-all duration-200 text-left backdrop-blur-sm glass-effect",
                        "hover:scale-105 hover:shadow-xl",
                        isSelected && "border-zw-green/50 bg-gradient-to-br from-zw-green/10 to-zw-green/5",
                        !isSelected && !isDisabled && "border-border/50 bg-muted/30 hover:border-zw-green/30 hover:bg-muted/50",
                        isDisabled && "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-200",
                            isSelected ? "bg-zw-green/20" : "bg-muted/30"
                          )}>
                            {getIconForCategory(category.id, isSelected)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-base">{category.name}</h4>
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
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 pt-8 border-t-2 border-border/30">
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-muted/30 border-2 border-border/50 text-foreground rounded-2xl hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect font-semibold"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0}
            className={cn(
              "px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg",
              selectedInterests.length > 0
                ? "bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white glass-effect border border-zw-green/20"
                : "bg-muted/30 text-muted-foreground cursor-not-allowed border-2 border-border/30"
            )}
          >
            Save Interests ({selectedInterests.length})
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-8 py-4 bg-muted/30 border-2 border-border/50 text-foreground rounded-2xl hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect font-semibold flex items-center justify-center"
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