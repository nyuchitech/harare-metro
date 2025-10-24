// app/components/HeaderNavigation.tsx
import React, { useState, useEffect } from 'react'
import { 
  Search,
  Sun,
  Moon,
  User as UserIcon,
  Home
} from 'lucide-react'
import Logo from './Logo'
import type { User, Profile } from '~/types/api'

interface HeaderNavigationProps {
  onSearchClick?: () => void
  onProfileClick?: () => void
  onHomeClick?: () => void
  currentView?: string
  isAuthenticated?: boolean
  user?: User | null
  profile?: Profile | null
  className?: string
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ 
  onSearchClick,
  onProfileClick,
  onHomeClick,
  currentView = '/',
  isAuthenticated = false,
  user = null,
  profile = null,
  className = ''
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Theme detection and management
  useEffect(() => {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (prefersDark) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const navigation = [
    { id: 'home', name: 'Feed', icon: Home },
    { id: 'search', name: 'Search', icon: Search }
  ]

  const handleNavClick = (navId: string) => {
    switch(navId) {
      case 'search':
        onSearchClick?.()
        break
      case 'profile':
        onProfileClick?.()
        break
      case 'home':
        onHomeClick?.()
        break
      default:
        break
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <header className={`
      sticky top-0 z-50
      bg-background/90 backdrop-blur-md glass
      border-b border-border
      pt-safe
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-16">
          
          {/* Mobile: Centered Logo, Desktop: Left Logo */}
          <div className="flex items-center lg:flex-none">
            {/* Mobile: Centered Logo */}
            <div className="lg:hidden flex-1 flex justify-center">
              <button
                onClick={() => handleNavClick('home')}
                className="flex-shrink-0 touch-target"
                aria-label="Go to home page"
              >
                <Logo 
                  variant="compact"
                  size="sm"
                  className="flex-shrink-0 text-foreground"
                />
              </button>
            </div>
            
            {/* Desktop: Horizontal Logo */}
            <div className="hidden lg:block">
              <button
                onClick={() => handleNavClick('home')}
                className="flex-shrink-0 touch-target"
                aria-label="Go to home page"
              >
                <Logo 
                  variant="horizontal"
                  size="md"
                  className="flex-shrink-0 text-foreground"
                />
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3 lg:flex-none">
            
            {/* Desktop Navigation - Icons only */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => {
                const isActive = currentView === item.id || 
                  (item.id === 'home' && (currentView === '/' || currentView.startsWith('/feed')))
                const IconComponent = item.icon
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      p-2 rounded-full transition-all duration-200 touch-target
                      hover:bg-muted/50
                      ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                    `}
                    aria-label={item.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                )
              })}
            </nav>

            {/* Theme Toggle - Icon only */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full transition-all duration-200 touch-target
                text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Profile/Auth Icon */}
            <button
              onClick={() => handleNavClick('profile')}
              className={`
                hidden lg:block p-2 rounded-full transition-all duration-200 touch-target
                hover:bg-muted/50
                ${currentView === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}
              aria-label={isAuthenticated ? "View Profile" : "Sign In"}
              title={isAuthenticated ? `Profile: ${profile?.full_name || user?.email?.split('@')[0] || 'User'}` : "Sign In"}
            >
              {isAuthenticated ? (
                <div className="relative">
                  <UserIcon className="h-5 w-5" />
                  {/* Online indicator */}
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-zw-green rounded-full border border-background"></div>
                </div>
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderNavigation