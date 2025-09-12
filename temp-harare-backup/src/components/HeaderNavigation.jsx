// src/components/HeaderNavigation.jsx
import React from 'react'
import { cn } from '@/lib/utils'
import { 
  Search,
  Sun,
  Moon,
  User,
  LayoutGrid
} from 'lucide-react'
import Logo from './Logo'

const HeaderNavigation = ({ 
  theme, 
  setTheme, 
  onSearchClick, 
  _onBytesClick,
  onProfileClick,
  _onAuthClick,
  _onLogout,
  currentView,
  setCurrentView,
  _viewMode,
  _setViewMode,
  _title = "Harare Metro",
  isAuthenticated = false,
  user = null,
  profile = null
}) => {
  const navigation = [
    { id: 'home', name: 'Feed', icon: LayoutGrid },
    { id: 'search', name: 'Search', icon: Search }
  ]

  const handleNavClick = (navId) => {
    setCurrentView?.(navId)
    
    // Trigger appropriate actions
    switch(navId) {
      case 'search':
        onSearchClick?.()
        break
      case 'profile':
        onProfileClick?.()
        break
      case 'home':
        setCurrentView?.('home')
        break
      default:
        break
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme?.(newTheme)
  }

  return (
    <header className={cn(
      "sticky top-0 z-50",
      "bg-white/90 dark:bg-black/90 backdrop-blur-md",
      "border-b border-black/10 dark:border-white/10"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-16">
          
          {/* Mobile: Centered Logo, Desktop: Left Logo */}
          <div className="flex items-center lg:flex-none">
            {/* Mobile: Spacer + Centered Logo */}
            <div className="lg:hidden flex-1 flex justify-center">
              <div
                onClick={() => handleNavClick('home')}
                className="flex-shrink-0 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavClick('home')
                  }
                }}
                aria-label="Go to home page"
              >
                <Logo 
                  variant="compact"
                  theme={theme}
                  size="sm"
                  className="flex-shrink-0"
                />
              </div>
            </div>
            
            {/* Desktop: Horizontal Logo */}
            <div className="hidden lg:block">
              <div
                onClick={() => handleNavClick('home')}
                className="flex-shrink-0 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNavClick('home')
                  }
                }}
                aria-label="Go to home page"
              >
                <Logo 
                  variant="horizontal"
                  theme={theme}
                  size="md"
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3 lg:flex-none">
            
            {/* Desktop Navigation - Direct Lucide icons with invisible wrappers */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => {
                const isActive = currentView === item.id
                const IconComponent = item.icon
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "p-2 cursor-pointer transition-all duration-200 rounded-full hover:bg-black/5 dark:hover:bg-white/5",
                      isActive && "text-black dark:text-white",
                      !isActive && "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleNavClick(item.id)
                      }
                    }}
                    aria-label={item.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                )
              })}
            </nav>

            {/* Theme Toggle - Direct Lucide icon with invisible wrapper */}
            <div
              onClick={handleThemeToggle}
              className="p-2 cursor-pointer text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-all duration-200 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleThemeToggle()
                }
              }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </div>

            {/* Profile/Auth Icon - Show user state */}
            <div
              onClick={() => handleNavClick('profile')}
              className={cn(
                "hidden lg:block p-2 cursor-pointer transition-all duration-200 rounded-full hover:bg-black/5 dark:hover:bg-white/5",
                currentView === 'profile' && "text-black dark:text-white",
                currentView !== 'profile' && "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleNavClick('profile')
                }
              }}
              aria-label={isAuthenticated ? "View Profile" : "Sign In"}
              title={isAuthenticated ? `Profile: ${profile?.username || user?.email?.split('@')[0] || 'User'}` : "Sign In"}
            >
              {isAuthenticated ? (
                <div className="relative">
                  <User className="h-5 w-5" />
                  {/* Online indicator */}
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-black"></div>
                </div>
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderNavigation