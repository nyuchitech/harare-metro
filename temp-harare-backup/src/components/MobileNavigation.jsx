// src/components/MobileNavigation.jsx
import React from 'react'
import { cn } from '@/lib/utils'
import { 
  LayoutGrid,
  Video,
  Search,
  User
} from 'lucide-react'

const MobileNavigation = ({ 
  currentView, 
  _setCurrentView,
  onHomeClick,
  onSearchClick,
  onBytesClick,
  onProfileClick,
  _onSavedClick,
  _onInsightsClick,
  _likedCount,
  _bookmarkedCount,
  className = ''
}) => {
  const navigation = [
    { 
      id: 'home', 
      name: 'Feed', 
      icon: LayoutGrid, 
      action: onHomeClick || (() => {})
    },
    { 
      id: 'bytes', 
      name: 'Bytes', 
      icon: Video, 
      action: onBytesClick || (() => {})
    },
    { 
      id: 'search', 
      name: 'Search', 
      icon: Search, 
      action: onSearchClick || (() => {})
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: User, 
      action: onProfileClick || (() => {})
    }
  ]

  return (
    <nav className={cn(
      // Glassmorphism navigation bar
      "lg:hidden fixed bottom-0 left-0 right-0 z-50",
      "bg-white/90 dark:bg-black/90 backdrop-blur-md",
      "border-t border-black/10 dark:border-white/10",
      className
    )}>
      <div className="safe-area-bottom">
        {/* Navigation container with glassmorphism */}
        <div className="px-4 py-2">
          <div className="flex justify-around items-center w-full">
            {navigation.map((item) => {
              // Match against current pathname for active state
              const isActive = 
                (item.id === 'home' && (currentView === '/feed' || currentView === '/' || currentView.startsWith('/feed/'))) ||
                (item.id === 'search' && currentView.startsWith('/search')) ||
                (item.id === 'bytes' && currentView === '/news-bytes') ||
                (item.id === 'profile' && (currentView === '/profile' || currentView.startsWith('/@')))
              
              const IconComponent = item.icon
              
              return (
                <div key={item.id} className="flex flex-col items-center">
                  <div
                    onClick={item.action}
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200 cursor-pointer",
                      isActive && cn(
                        // Active state with glassmorphism
                        "bg-black/10 dark:bg-white/10",
                        "text-black dark:text-white",
                        "backdrop-blur-sm border border-black/20 dark:border-white/20"
                      ),
                      !isActive && cn(
                        // Inactive state
                        "text-black/60 dark:text-white/60",
                        "hover:text-black dark:hover:text-white",
                        "hover:bg-black/5 dark:hover:bg-white/5"
                      )
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        item.action()
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  {/* Active indicator dot */}
                  <div className={cn(
                    "w-1 h-1 rounded-full mt-1 transition-all duration-200",
                    isActive 
                      ? "bg-black dark:bg-white opacity-100" 
                      : "bg-transparent opacity-0"
                  )} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default MobileNavigation