import type { Route } from "./+types/home";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { Grid3x3, List, Loader2 } from "lucide-react";
import { buildApiUrl, buildClientImageUrl } from "../lib/api-utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Harare Metro - Zimbabwe's Premier News Platform" },
    { name: "description", content: "Stay informed with the latest news from Zimbabwe's most trusted sources. Breaking news, politics, business, sports, and more." },
    { name: "keywords", content: "Zimbabwe news, Harare news, Zimbabwe politics, African news, breaking news" },
    { property: "og:title", content: "Harare Metro - Zimbabwe's Premier News Platform" },
    { property: "og:description", content: "Zimbabwe's most comprehensive news aggregation platform" },
    { property: "og:type", content: "website" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';

  // Check if user is authenticated
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const isAuthenticated = !!tokenMatch;

  // Guests limited to 20 articles, authenticated users get full access
  const limit = url.searchParams.get('limit') || (isAuthenticated ? '24' : '20');
  const maxArticles = isAuthenticated ? undefined : 20;

  try {
    // Fetch articles from backend API
    const apiUrl = buildApiUrl(request, '/api/feeds', new URLSearchParams({ category, limit }));
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { articles?: any[]; total?: number; todayCount?: number; error?: string };

    // Limit articles for guests
    const articles = maxArticles ? (data.articles || []).slice(0, maxArticles) : (data.articles || []);

    // Fetch categories from backend API
    const categoriesUrl = buildApiUrl(request, '/api/categories');
    const categoriesResponse = await fetch(categoriesUrl);

    if (!categoriesResponse.ok) {
      throw new Error(`Categories API responded with ${categoriesResponse.status}: ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json() as { categories?: any[]; error?: string };

    return {
      articles,
      categories: categoriesData.categories || [],
      selectedCategory: category,
      total: data.total || 0,
      todayCount: data.todayCount || 0,
      isAuthenticated,
      isLimitedAccess: !isAuthenticated && articles.length >= 20
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    // Return fallback data
    return {
      articles: [],
      categories: [],
      selectedCategory: 'all',
      total: 0,
      todayCount: 0,
      isAuthenticated,
      isLimitedAccess: false,
      error: 'Failed to load articles. Please check if backend service is running.'
    };
  }
}

type ViewMode = 'grid' | 'list';

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles: initialArticles, categories, selectedCategory, total, todayCount, error, isAuthenticated, isLimitedAccess } = loaderData;
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Infinite scroll state
  const [displayedArticles, setDisplayedArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initialArticles.length < total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(initialArticles.length);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load more articles
  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        limit: '24',
        offset: offset.toString()
      });

      const response = await fetch(`/api/feeds?${params}`);
      const data = await response.json() as { articles?: any[]; total?: number };

      if (data.articles && data.articles.length > 0) {
        setDisplayedArticles(prev => [...prev, ...(data.articles || [])]);
        setOffset(prev => prev + (data.articles?.length || 0));
        setHasMore(offset + (data.articles?.length || 0) < total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more articles:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedCategory, offset, total, hasMore, isLoadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreArticles, hasMore, isLoadingMore]);

  // Reset when category changes
  useEffect(() => {
    setDisplayedArticles(initialArticles);
    setOffset(initialArticles.length);
    setHasMore(initialArticles.length < total);
  }, [initialArticles, total]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Zimbabwe Flag Strip */}
      <div className="zimbabwe-flag-strip" />

      {/* Header Navigation */}
      <HeaderNavigation
        currentView="/"
        onSearchClick={() => window.location.href = '/search'}
        onProfileClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
        onHomeClick={() => window.location.href = '/'}
        isAuthenticated={!!user}
        user={user}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 pl-6 sm:pl-10 lg:pl-12">
        {/* Stats Bar with View Toggle */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold">Latest News</h1>
            <p className="text-muted-foreground text-sm">Zimbabwe's most trusted sources</p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-zw-green text-zw-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-zw-green text-zw-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-zw-green font-medium">{todayCount} Articles Today</div>
              <div className="text-xs text-muted-foreground">Live Updates</div>
            </div>
          </div>
        </div>

        {/* Categories Filter - Simplified */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-2 pb-4 mb-4 scrollbar-hide overflow-x-auto">
              {/* All Categories Button */}
              <a
                href="/"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === 'all' || !selectedCategory
                    ? 'bg-zw-green text-white'
                    : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                All
              </a>
              {categories.slice(0, 15).map((category: any) => (
                <a
                  key={category.id}
                  href={`/?category=${category.id}`}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-zw-green text-white'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-2 text-destructive">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Failed to load articles. Please check if RSS service is running.</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayedArticles.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-card border border-border rounded-xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="font-serif text-xl font-bold mb-2">No Articles Yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                The RSS service needs to be configured to fetch news articles from Zimbabwe sources.
              </p>
              <div className="bg-muted rounded-xl p-4 text-xs text-zw-green font-mono">
                POST /api/admin/refresh-rss
              </div>
            </div>
          </div>
        )}

        {/* Articles - Grid or List View */}
        {displayedArticles.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              // Simple Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedArticles.map((article, index) => (
                  <a
                    key={article.id || index}
                    href={`/${article.source_id || article.source || 'unknown'}/${article.slug}`}
                    className="group block bg-card rounded-2xl overflow-hidden hover:bg-muted transition-colors duration-200"
                  >
                    {article.image_url && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={buildClientImageUrl(article.image_url)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <span className="font-medium text-zw-green">
                          {article.source || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>
                          {article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : 'Today'}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-xl leading-snug mb-3 line-clamp-3">
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="text-muted-foreground leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              // Simple List View
              <div className="space-y-6">
                {displayedArticles.map((article, index) => (
                  <a
                    key={article.id || index}
                    href={`/${article.source_id || article.source || 'unknown'}/${article.slug}`}
                    className="group block bg-card rounded-2xl overflow-hidden hover:bg-muted transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 p-5">
                      {article.image_url && (
                        <div className="w-full sm:w-56 aspect-video sm:aspect-square flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                          <img
                            src={buildClientImageUrl(article.image_url)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                          <span className="font-medium text-zw-green">
                            {article.source || 'Unknown'}
                          </span>
                          <span>•</span>
                          <span>
                            {article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : 'Today'}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-2xl leading-snug mb-3">
                          {article.title}
                        </h3>

                        {article.description && (
                          <p className="text-muted-foreground leading-relaxed line-clamp-3">
                            {article.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="py-8 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more articles...</span>
                </div>
              )}
              {isLimitedAccess && displayedArticles.length >= 20 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md mx-auto text-center">
                  <h3 className="font-serif text-xl font-bold text-white mb-3">
                    Sign in to Read More
                  </h3>
                  <p className="text-gray-400 mb-6">
                    You've viewed 20 articles. Create a free account to access unlimited news, personalized feeds, and exclusive features.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="/auth/login"
                      className="px-6 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-colors"
                    >
                      Sign In
                    </a>
                    <a
                      href="/auth/register"
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-full transition-colors"
                    >
                      Create Account
                    </a>
                  </div>
                </div>
              )}
              {!hasMore && displayedArticles.length > 0 && !isLimitedAccess && (
                <div className="text-muted-foreground text-sm">
                  You've reached the end of the feed
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center pb-24">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/hm-logo-compact.svg" alt="Harare Metro" className="w-6 h-6 text-foreground" />
            <span className="font-serif font-bold">Harare Metro</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Zimbabwe's most comprehensive news aggregation platform
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            🇿🇼 Built with pride for Zimbabwe's news community
          </p>
        </footer>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentView="/"
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
