// src/components/CategoryFilter.jsx - Enhanced version with Lucide icons
import React from 'react'
import { 
  X, Newspaper, Building, DollarSign, Briefcase, 
  Trophy, MapPin, Laptop, Wheat, Heart, 
  GraduationCap, Clapperboard, Leaf, Shield, 
  Globe, Sparkles, CreditCard, Home
} from 'lucide-react'

const CategoryFilter = ({ 
  selectedCategory, 
  setSelectedCategory, 
  feeds = [],
  categories = [],
  showStats = true
}) => {
  // Default categories with Lucide icons for consistent branding
  const defaultCategories = [
    { id: 'all', name: 'All News', icon: Home, color: 'text-muted-foreground' },
    { id: 'politics', name: 'Politics', icon: Building, color: 'text-blue-600' },
    { id: 'economy', name: 'Economy', icon: DollarSign, color: 'text-green-600' },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'text-purple-600' },
    { id: 'sports', name: 'Sports', icon: Trophy, color: 'text-orange-600' },
    { id: 'harare', name: 'Harare', icon: MapPin, color: 'text-red-600' },
    { id: 'technology', name: 'Technology', icon: Laptop, color: 'text-indigo-600' },
    { id: 'agriculture', name: 'Agriculture', icon: Wheat, color: 'text-yellow-600' },
    { id: 'health', name: 'Health', icon: Heart, color: 'text-pink-600' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: 'text-cyan-600' },
    { id: 'entertainment', name: 'Entertainment', icon: Clapperboard, color: 'text-rose-600' },
    { id: 'environment', name: 'Environment', icon: Leaf, color: 'text-emerald-600' },
    { id: 'crime', name: 'Crime & Security', icon: Shield, color: 'text-slate-600' },
    { id: 'international', name: 'International', icon: Globe, color: 'text-blue-500' },
    { id: 'lifestyle', name: 'Lifestyle', icon: Sparkles, color: 'text-violet-600' },
    { id: 'finance', name: 'Finance', icon: CreditCard, color: 'text-teal-600' }
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
    <div className="space-y-6">
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
                  flex items-center space-x-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 
                  whitespace-nowrap flex-shrink-0 min-w-max backdrop-blur-sm glass-effect
                  ${isSelected 
                    ? 'bg-gradient-to-r from-zw-green to-zw-green/90 text-white shadow-lg scale-105 border border-zw-green/20' 
                    : 'bg-muted/30 border-2 border-border/50 text-foreground hover:bg-muted/60 hover:scale-105'
                  }
                `}
                aria-label={`Filter by ${category.name} category (${count} articles)`}
              >
                <category.icon className={`h-4 w-4 ${isSelected ? 'text-white' : category.color}`} />
                <span>{category.name}</span>
                <span className={`
                  px-3 py-1 text-xs rounded-xl font-bold
                  ${isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-muted text-muted-foreground'
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
        <div className="bg-gradient-to-r from-zw-green/10 to-zw-green/5 border-2 border-zw-green/30 rounded-2xl p-5 glass-effect">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-zw-green/20 rounded-2xl flex items-center justify-center">
                {React.createElement(availableCategories.find(c => c.id === selectedCategory)?.icon || Newspaper, {
                  className: "h-6 w-6 text-zw-green"
                })}
              </div>
              <div>
                <p className="text-base font-semibold text-zw-green">
                  Filtered by: {availableCategories.find(c => c.id === selectedCategory)?.name}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Showing {getCategoryCount(selectedCategory)} articles
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className="w-10 h-10 bg-zw-green/10 hover:bg-zw-green/20 rounded-xl flex items-center justify-center text-zw-green transition-all duration-200 hover:scale-105"
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