// src/AppRouter.jsx - URL-based routing with proper slugs
import React from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { logger } from './utils/logger'

// Layout components
import HeaderNavigation from './components/HeaderNavigation'
import MobileNavigation from './components/MobileNavigation'
import ErrorBoundary from './components/ErrorBoundary'
import AuthModal from './components/auth/AuthModal'

// Page components
import FeedPage from './pages/FeedPage'
import NewsBytesPage from './pages/NewsBytesPage' 
import SearchPage from './components/SearchPage'
import ProfilePage from './components/ProfilePage'
import InsightsPage from './pages/InsightsPage'
import SavedPage from './pages/SavedPage'

// Auth pages
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AuthConfirmPage from './pages/auth/AuthConfirmPage'

// Utils
import { useAnalytics } from './hooks/useAnalytics'

const AppRouter = () => {
  const { user, profile, isAuthenticated, loading: authLoading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Theme state (can be moved to context later)
  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })
  
  const [viewMode, setViewMode] = React.useState('grid')
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const [authModalMode] = React.useState('signin')

  // Analytics
  const { trackPageView } = useAnalytics()

  // Update theme
  React.useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Track page views
  React.useEffect(() => {
    if (trackPageView) {
      const pathname = location.pathname
      trackPageView(pathname, document.referrer)
    }
  }, [location.pathname, trackPageView])

  // Old password reset handling removed - now handled by /auth/confirm page

  // Zimbabwe-themed color system
  const currentColors = {
    bg: theme === 'dark' ? 'bg-black' : 'bg-white',
    headerBg: theme === 'dark' ? 'bg-black/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md',
    text: theme === 'dark' ? 'text-white' : 'text-gray-900',
    cardBg: theme === 'dark' ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-100',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    border: theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
  }

  // Navigation helpers
  const handleNavigation = (path) => {
    navigate(path)
  }

  const handleProtectedNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
      window.location.reload()
    } catch (error) {
      logger.error('Logout error:', error)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen ${currentColors.bg}`}>
          <div className="zimbabwe-flag-strip" aria-hidden="true" />
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zw-green mb-4"></div>
            <p className={`text-lg ${currentColors.textMuted}`}>Loading Harare Metro...</p>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${currentColors.bg} transition-colors duration-300`}>
        {/* Zimbabwe Flag Strip - Always present */}
        <div className="zimbabwe-flag-strip" aria-hidden="true" />
        
        {/* Header */}
        <HeaderNavigation
          theme={theme}
          setTheme={setTheme}
          currentView={location.pathname}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onSearchClick={() => handleNavigation('/search')}
          onBytesClick={() => handleNavigation('/news-bytes')}
          onProfileClick={() => handleProtectedNavigation('/profile')}
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          user={user}
          profile={profile}
          isAuthenticated={isAuthenticated}
        />

        {/* Main Content with padding for flag strip */}
        <div className="pt-2 pb-20 lg:pb-6 pl-3">
          <Routes>
            {/* Home/Feed Routes */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage currentColors={currentColors} viewMode={viewMode} />} />
            <Route path="/feed/:category" element={<FeedPage currentColors={currentColors} viewMode={viewMode} />} />
            
            {/* News Bytes */}
            <Route path="/news-bytes" element={<NewsBytesPage currentColors={currentColors} viewMode={viewMode} />} />
            
            {/* Search */}
            <Route path="/search" element={<SearchPage currentColors={currentColors} onClose={() => navigate(-1)} />} />
            <Route path="/search/:query" element={<SearchPage currentColors={currentColors} onClose={() => navigate(-1)} />} />
            
            {/* Profile Routes */}
            <Route path="/profile" element={
              isAuthenticated ? (
                <Navigate to={`/@${profile?.username || user?.email?.split('@')[0] || 'user'}`} replace />
              ) : (
                <Navigate to="/signin" replace />
              )
            } />
            <Route path="/@:username" element={
              <ProfilePage
                currentColors={currentColors}
                theme={theme}
                onThemeChange={setTheme}
                user={user}
                profile={profile}
                isAuthenticated={isAuthenticated}
                onClose={() => navigate(-1)}
              />
            } />
            
            {/* Protected Routes */}
            <Route path="/insights" element={
              isAuthenticated ? (
                <InsightsPage currentColors={currentColors} />
              ) : (
                <Navigate to="/signin" replace />
              )
            } />
            <Route path="/saved" element={
              isAuthenticated ? (
                <SavedPage currentColors={currentColors} />
              ) : (
                <Navigate to="/signin" replace />
              )
            } />
            
            {/* Auth Routes */}
            <Route path="/signin" element={
              !isAuthenticated ? (
                <SignInPage currentColors={currentColors} />
              ) : (
                <Navigate to="/feed" replace />
              )
            } />
            <Route path="/signup" element={
              !isAuthenticated ? (
                <SignUpPage currentColors={currentColors} />
              ) : (
                <Navigate to="/feed" replace />
              )
            } />
            <Route path="/reset-password" element={<ResetPasswordPage currentColors={currentColors} />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage currentColors={currentColors} />} />
            <Route path="/auth/callback" element={<AuthConfirmPage currentColors={currentColors} />} />
            
            {/* Legacy redirects for old hash-based routing */}
            <Route path="/home" element={<Navigate to="/feed" replace />} />
            <Route path="/bytes" element={<Navigate to="/news-bytes" replace />} />
            
            {/* 404 - redirect to feed */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation
          currentView={location.pathname}
          onHomeClick={() => handleNavigation('/feed')}
          onSearchClick={() => handleNavigation('/search')}
          onBytesClick={() => handleNavigation('/news-bytes')}
          onProfileClick={() => handleProtectedNavigation('/profile')}
          onSavedClick={() => handleProtectedNavigation('/saved')}
          onInsightsClick={() => handleProtectedNavigation('/insights')}
        />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </ErrorBoundary>
  )
}

export default AppRouter