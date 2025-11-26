/**
 * NewsBytes Screen - TikTok-style vertical swipe news feed
 * Mobile-first full-screen experience with image-based articles
 *
 * Features:
 * - Vertical swipe navigation
 * - Full-screen article cards
 * - Engagement buttons (like, share, save)
 * - Pull-to-refresh
 * - 5 free views for anonymous users
 * - Login gate after limit
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NewsByteCard } from "../../components/newsbytes/NewsByteCard";
import { NewsBytesAuthGate } from "../../components/newsbytes/NewsBytesAuthGate";
import { NewsBytesEmptyState } from "../../components/newsbytes/NewsBytesEmptyState";
import { NewsBytesLimitModal } from "../../components/newsbytes/NewsBytesLimitModal";
import MobileNavigation from "../../components/MobileNavigation";
import { AuthModal } from "../../components/auth/AuthModal";
import { UserProfile } from "../../components/auth/UserProfile";
import { RefreshCw } from "lucide-react";

export function NewsBytesScreen({ articles, requiresAuth, error }) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const containerRef = useRef(null);
  const articlesRef = useRef([]);
  const touchStartRef = useRef({ y: 0, time: 0 });
  const scrollTimeoutRef = useRef(null);

  // Free view limit for anonymous users
  const FREE_VIEW_LIMIT = 5;

  // Check view limit for anonymous users
  useEffect(() => {
    if (!user && viewCount >= FREE_VIEW_LIMIT) {
      setShowLimitModal(true);
    }
  }, [user, viewCount]);

  // Track views
  useEffect(() => {
    if (articles && articles.length > 0) {
      setViewCount(currentIndex + 1);
    }
  }, [currentIndex, articles]);

  // Smooth snap scrolling to specific article
  const scrollToArticle = useCallback((index) => {
    const articleElement = articlesRef.current[index];
    if (articleElement && containerRef.current) {
      articleElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setCurrentIndex(index);
    }
  }, []);

  // Handle scroll events with snap behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return;

      const containerRect = container.getBoundingClientRect();

      // Find which article is currently most visible
      let mostVisibleIndex = 0;
      let maxVisibleHeight = 0;

      articlesRef.current.forEach((articleEl, index) => {
        if (!articleEl) return;

        const articleRect = articleEl.getBoundingClientRect();
        const visibleHeight = Math.min(articleRect.bottom, containerRect.bottom) -
                             Math.max(articleRect.top, containerRect.top);

        if (visibleHeight > maxVisibleHeight && visibleHeight > 0) {
          maxVisibleHeight = visibleHeight;
          mostVisibleIndex = index;
        }
      });

      if (mostVisibleIndex !== currentIndex) {
        setCurrentIndex(mostVisibleIndex);
      }
    };

    // Snap to nearest article when scrolling stops
    const handleScrollEnd = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling = false;

        const containerRect = container.getBoundingClientRect();
        const viewportCenter = containerRect.top + containerRect.height / 2;

        let closestIndex = 0;
        let minDistance = Infinity;

        articlesRef.current.forEach((articleEl, index) => {
          if (!articleEl) return;

          const articleRect = articleEl.getBoundingClientRect();
          const articleCenter = articleRect.top + articleRect.height / 2;
          const distance = Math.abs(viewportCenter - articleCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        if (closestIndex !== currentIndex) {
          scrollToArticle(closestIndex);
        }
      }, 150);

      isScrolling = true;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('scroll', handleScrollEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('scroll', handleScrollEnd);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [currentIndex, scrollToArticle]);

  // Touch navigation with swipe gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartRef.current = {
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e) => {
      const endTouch = e.changedTouches[0];
      const startTouch = touchStartRef.current;
      const deltaY = startTouch.y - endTouch.clientY;
      const deltaTime = Date.now() - startTouch.time;

      // Quick swipe detection
      if (Math.abs(deltaY) > 50 && deltaTime < 300) {
        e.preventDefault();

        if (deltaY > 0 && currentIndex < articles.length - 1) {
          // Swipe up - next article (but check limit for anonymous users)
          if (!user && viewCount >= FREE_VIEW_LIMIT) {
            setShowLimitModal(true);
          } else {
            scrollToArticle(currentIndex + 1);
          }
        } else if (deltaY < 0 && currentIndex > 0) {
          // Swipe down - previous article
          scrollToArticle(currentIndex - 1);
        } else if (deltaY < 0 && currentIndex === 0) {
          // Swipe down on first article - refresh
          handleRefresh();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, articles, scrollToArticle, user, viewCount]);

  // Keyboard navigation (for desktop testing)
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            scrollToArticle(currentIndex - 1);
          } else {
            handleRefresh();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!user && viewCount >= FREE_VIEW_LIMIT) {
            setShowLimitModal(true);
          } else if (currentIndex < articles.length - 1) {
            scrollToArticle(currentIndex + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (articles[currentIndex]) {
            window.location.href = `/${articles[currentIndex].source_id}/${articles[currentIndex].slug}`;
          }
          break;
        case 'r':
          e.preventDefault();
          handleRefresh();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, articles, scrollToArticle, user, viewCount]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      window.location.reload();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isRefreshing]);

  // Auth gate for unauthenticated users
  if (requiresAuth) {
    return <NewsBytesAuthGate />;
  }

  // Empty state
  if (error || !articles || articles.length === 0) {
    return (
      <NewsBytesEmptyState
        error={error}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <div className="relative">
      {/* Zimbabwe flag strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 text-white p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Refreshing stories...</span>
          </div>
        </div>
      )}

      {/* View count indicator for anonymous users */}
      {!user && (
        <div className="fixed top-4 right-4 z-40 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {viewCount}/{FREE_VIEW_LIMIT} free
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {articles.map((article, index) => (
          <div
            key={`${article.id}-${index}`}
            ref={(el) => {
              if (el) articlesRef.current[index] = el;
            }}
            className="h-screen w-full snap-start snap-always flex-shrink-0"
          >
            <NewsByteCard
              article={article}
              isActive={index === currentIndex}
              onAuthRequired={() => setShowAuthModal(true)}
              user={user}
            />
          </div>
        ))}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentView="/bytes"
        isAuthenticated={!!user}
        username={user?.username}
        onHomeClick={() => window.location.href = '/'}
        onSearchClick={() => window.location.href = '/search'}
        onProfileClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
        onBytesClick={() => window.location.href = '/bytes'}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      {/* Limit Modal for anonymous users */}
      <NewsBytesLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        viewCount={viewCount}
        limit={FREE_VIEW_LIMIT}
      />
    </div>
  );
}
