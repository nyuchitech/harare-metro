// app/components/MobileNavigation.tsx
import React from 'react'
import { Link } from 'react-router'
import {
  Home,
  Search,
  User,
  Video,
  LogIn
} from 'lucide-react'

interface MobileNavigationProps {
  currentView?: string
  onHomeClick?: () => void
  onSearchClick?: () => void
  onProfileClick?: () => void
  onBytesClick?: () => void
  className?: string
  isAuthenticated?: boolean
  username?: string
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView = '/',
  onHomeClick,
  onSearchClick,
  onProfileClick,
  onBytesClick,
  className = '',
  isAuthenticated = false,
  username
}) => {
  const navigation = [
    {
      id: 'home',
      name: 'Feed',
      icon: Home,
      action: onHomeClick || (() => {}),
      href: '/'
    },
    {
      id: 'bytes',
      name: 'Bytes',
      icon: Video,
      action: onBytesClick || (() => {}),
      href: '/bytes'
    },
    {
      id: 'search',
      name: 'Search',
      icon: Search,
      action: onSearchClick || (() => {}),
      href: '/search'
    },
    {
      id: 'profile',
      name: isAuthenticated ? 'Profile' : 'Login',
      icon: isAuthenticated ? User : LogIn,
      action: onProfileClick || (() => {}),
      href: isAuthenticated ? (username ? `/@${username}` : '/auth/login') : '/auth/login'
    }
  ]

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50
      lg:hidden
      bg-background/90 backdrop-blur-md glass
      border-t border-border
      pb-safe
      ${className}
    `}>
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
                {/* Use Link for proper navigation */}
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`
                      p-3 rounded-full transition-all duration-200 touch-target
                      ${isActive ?
                        'bg-zw-green/10 text-zw-green' :
                        'text-muted-foreground hover:text-zw-green hover:bg-zw-green/5'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </Link>
                ) : (
                  <button
                    onClick={item.action}
                    className={`
                      p-3 rounded-full transition-all duration-200 touch-target
                      ${isActive ?
                        'bg-zw-green/10 text-zw-green' :
                        'text-muted-foreground hover:text-zw-green hover:bg-zw-green/5'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </button>
                )}

                {/* Active indicator dot */}
                <div className={`
                  w-1 h-1 rounded-full mt-1 transition-all duration-200
                  ${isActive ? 'bg-zw-green opacity-100' : 'bg-transparent opacity-0'}
                `} />
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default MobileNavigation