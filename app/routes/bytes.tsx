import type { Route } from "./+types/bytes";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { Heart, Bookmark, Share, Globe, RefreshCw, ExternalLink } from "lucide-react";
import { buildApiUrl } from "../lib/api-utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "News Bytes - Harare Metro" },
    { name: "description", content: "TikTok-style visual news from Zimbabwe's most trusted sources" },
    { name: "keywords", content: "Zimbabwe news bytes, visual news, quick news, breaking news, Harare news" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Check if user is authenticated - bytes are for logged-in users only
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const isAuthenticated = !!tokenMatch;

  // If not authenticated, return empty data with auth required flag
  if (!isAuthenticated) {
    return {
      articles: [],
      total: 0,
      error: null,
      requiresAuth: true
    };
  }

  try {
    // Fetch articles with images for bytes view
    const apiUrl = buildApiUrl(request, '/api/feeds', new URLSearchParams({ limit: '50', with_images: 'true' }));
    const response = await fetch(apiUrl);
    const data = await response.json() as { articles?: any[]; total?: number; error?: string };

    // Filter articles that have images
    const articlesWithImages = (data.articles || []).filter((article: any) =>
      article.image_url
    );

    return {
      articles: articlesWithImages,
      total: articlesWithImages.length,
      error: null,
      requiresAuth: false
    };
  } catch (error) {
    console.error('Failed to load news bytes:', error);
    return {
      articles: [],
      total: 0,
      error: 'Failed to load news bytes',
      requiresAuth: false
    };
  }
}

export default function Bytes({ loaderData }: Route.ComponentProps) {
  const { articles, error, requiresAuth } = loaderData;
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const articlesRef = useRef<HTMLDivElement[]>([]);
  const touchStartRef = useRef({ y: 0, time: 0 });
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format consistently
  }, []);

  // Smooth snap scrolling to specific article
  const scrollToArticle = useCallback((index: number) => {
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
        
        // Find the article closest to the center of the viewport
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
        
        // Snap to closest article if it's not already centered
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

  // Touch navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endTouch = e.changedTouches[0];
      const startTouch = touchStartRef.current;
      const deltaY = startTouch.y - endTouch.clientY;
      const deltaTime = Date.now() - startTouch.time;
      
      // Quick swipe detection
      if (Math.abs(deltaY) > 50 && deltaTime < 300) {
        e.preventDefault();
        
        if (deltaY > 0 && currentIndex < articles.length - 1) {
          // Swipe up - next article
          scrollToArticle(currentIndex + 1);
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
  }, [currentIndex, articles.length, scrollToArticle]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
          if (currentIndex < articles.length - 1) {
            scrollToArticle(currentIndex + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          window.location.href = `/${articles[currentIndex]?.source_id}/${articles[currentIndex]?.slug}`;
          break;
        case 'r':
          e.preventDefault();
          handleRefresh();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, articles.length, scrollToArticle]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Refresh the page
      window.location.reload();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isRefreshing]);

  const handleShare = useCallback((article: any) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: window.location.origin + `/${article.source_id}/${article.slug}`
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/${article.source_id}/${article.slug}`);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    scrollToArticle(0);
  }, [scrollToArticle]);

  // Auth gate for unauthenticated users
  if (requiresAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />
        <div className="text-center space-y-6 px-6 max-w-md">
          <div className="text-6xl">🔒</div>
          <h3 className="font-serif text-2xl font-bold">News Bytes</h3>
          <p className="text-white/70">
            TikTok-style visual news is exclusive to registered users. Sign in to enjoy unlimited visual stories, personalized content, and engagement features.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/auth/login"
              className="px-6 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-colors"
            >
              Sign In
            </a>
            <a
              href="/auth/register"
              className="px-6 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold rounded-full transition-colors"
            >
              Create Account
            </a>
            <a
              href="/"
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading/Error states
  if (error || articles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="text-6xl">📱</div>
          <h3 className="text-xl font-semibold">No Visual Stories Available</h3>
          <p className="text-white/70 max-w-md">
            {error ? error : "No articles with images found. Pull down to refresh or try again later."}
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 text-white p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Refreshing stories...</span>
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {articles.map((article: any, index: number) => (
          <div
            key={`${article.id}-${index}`}
            ref={(el) => {
              if (el) articlesRef.current[index] = el;
            }}
            className="h-screen w-full snap-start snap-always flex-shrink-0 relative overflow-hidden bg-black"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                loading={index <= 2 ? 'eager' : 'lazy'}
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pt-safe pb-32">
              {/* Spacer for top safe area */}
              <div className="pt-safe" />

              {/* Bottom content */}
              <div className="flex justify-between items-end">
                {/* Left side - Content */}
                <div className="flex-1 max-w-[calc(100%-80px)] space-y-3">
                  {/* Source */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {article.source?.charAt(0).toUpperCase() || 'N'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {article.source || 'News'}
                      </p>
                    </div>
                    <span className="text-white/60 text-xs">
                      {formatTimeAgo(article.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white text-lg font-bold leading-tight line-clamp-3">
                    {article.title}
                  </h2>
                  
                  {/* Category */}
                  {article.category && (
                    <span className="inline-block bg-white/10 text-white border border-white/20 text-xs px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <a
                      href={`/${article.source_id}/${article.slug}`}
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-white/90 text-black hover:bg-white text-xs font-medium rounded-full transition-colors"
                    >
                      Read More
                    </a>
                    <a
                      href={article.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs rounded-full transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Right side - Interaction buttons */}
                <div className="flex flex-col space-y-4 items-center">
                  {/* Like */}
                  <button
                    onClick={() => user ? {} : setShowAuthModal(true)}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Heart className="h-6 w-6 text-white" />
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => handleShare(article)}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Share className="h-6 w-6 text-white" />
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => user ? {} : setShowAuthModal(true)}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Bookmark className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentView="/bytes"
        isAuthenticated={!!user}
        username={user?.username || undefined}
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
    </div>
  );
}