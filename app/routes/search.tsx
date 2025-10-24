import type { Route } from "./+types/search";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { Heart, Bookmark, ExternalLink } from "lucide-react";
import { buildApiUrl } from "../lib/api-utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search - Harare Metro" },
    { name: "description", content: "Search Zimbabwe news articles from trusted sources" },
    { name: "keywords", content: "Zimbabwe news search, Harare news search, African news search" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || null;
  const limit = url.searchParams.get('limit') || '24';
  
  try {
    // Always fetch categories from D1 database for suggestions
    const categoriesUrl = buildApiUrl(request, '/api/categories');
    const categoriesResponse = await fetch(categoriesUrl);
    const categoriesData = await categoriesResponse.json() as { categories?: any[]; error?: string };
    
    if (!query) {
      return {
        results: [],
        query: '',
        total: 0,
        categories: categoriesData.categories || []
      };
    }
  } catch (error) {
    if (!query) {
      return {
        results: [],
        query: '',
        total: 0,
        categories: []
      };
    }
  }
  
  try {
    // Build search URL with parameters
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit
    });
    if (category) {
      searchParams.set('category', category);
    }
    
    // Fetch search results from our D1 API
    const apiUrl = buildApiUrl(request, '/api/search', searchParams);
    const response = await fetch(apiUrl);
    const data = await response.json() as { results?: any[]; query?: string; total?: number; error?: string };
    
    // Fetch categories for filter from D1 database
    const categoriesUrl = buildApiUrl(request, '/api/categories');
    const categoriesResponse = await fetch(categoriesUrl);
    const categoriesData = await categoriesResponse.json() as { categories?: any[]; error?: string };
    
    return {
      results: data.results || [],
      query: data.query || query,
      total: data.total || 0,
      categories: categoriesData.categories || [],
      selectedCategory: category
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      results: [],
      query,
      total: 0,
      categories: [],
      error: 'Search failed. Please try again.'
    };
  }
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const { results, query, total, categories, selectedCategory, error } = loaderData;
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Zimbabwe Flag Strip */}
      <div className="zimbabwe-flag-strip" />
      
      {/* Header Navigation */}
      <HeaderNavigation
        currentView="/search"
        onSearchClick={() => window.location.href = '/search'}
        onProfileClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
        onHomeClick={() => window.location.href = '/'}
        isAuthenticated={!!user}
        user={user}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 pl-6 sm:pl-10 lg:pl-12">
        
        {/* Search Form */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold mb-4">Search News</h1>
          <form method="GET" className="relative max-w-2xl">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search Zimbabwe news..."
              className="w-full h-14 pl-12 pr-24 bg-input border border-border rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <svg className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <button
              type="submit"
              className="absolute right-2 top-2 h-10 px-6 bg-zw-green hover:bg-zw-green/90 text-zw-white text-sm font-medium rounded-full transition-colors"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Search Info */}
        {query && (
          <div className="mb-6">
            <h2 className="font-serif text-xl font-bold mb-2">
              Search Results for "{query}"
            </h2>
            <p className="text-muted-foreground">
              Found {total} article{total !== 1 ? 's' : ''} from Zimbabwe news sources
            </p>
          </div>
        )}

        {/* Category Filters */}
        {categories.length > 0 && query && (
          <div className="mb-6">
            <div className="flex gap-3 pb-4 scrollbar-hide overflow-x-auto">
              <a
                href={`/search?q=${encodeURIComponent(query)}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border-2 ${
                  !selectedCategory
                    ? 'bg-zw-green text-zw-white border-zw-green shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-muted hover:scale-[1.02]'
                }`}
              >
                🏠 All Categories
              </a>
              {categories.map((category: any, index: number) => {
                const mineralColorPairs = [
                  { bg: 'bg-mineral-gold', border: 'border-mineral-gold' },
                  { bg: 'bg-mineral-chrome', border: 'border-mineral-chrome' },
                  { bg: 'bg-mineral-platinum', border: 'border-mineral-platinum' },
                  { bg: 'bg-mineral-diamond', border: 'border-mineral-diamond' },
                  { bg: 'bg-mineral-iron', border: 'border-mineral-iron' },
                  { bg: 'bg-mineral-copper', border: 'border-mineral-copper' },
                  { bg: 'bg-mineral-nickel', border: 'border-mineral-nickel' },
                  { bg: 'bg-mineral-emerald', border: 'border-mineral-emerald' },
                  { bg: 'bg-mineral-tin', border: 'border-mineral-tin' },
                  { bg: 'bg-mineral-lithium', border: 'border-mineral-lithium' },
                  { bg: 'bg-mineral-tantalite', border: 'border-mineral-tantalite' },
                  { bg: 'bg-mineral-aquamarine', border: 'border-mineral-aquamarine' },
                  { bg: 'bg-mineral-amethyst', border: 'border-mineral-amethyst' },
                  { bg: 'bg-mineral-granite', border: 'border-mineral-granite' },
                  { bg: 'bg-mineral-marble', border: 'border-mineral-marble' },
                  { bg: 'bg-mineral-coal', border: 'border-mineral-coal' }
                ];
                const { bg, border } = mineralColorPairs[index % mineralColorPairs.length];
                
                return (
                  <a
                    key={category.id}
                    href={`/search?q=${encodeURIComponent(query)}&category=${category.id}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border-2 ${
                      selectedCategory === category.id
                        ? 'bg-zw-green text-zw-white border-zw-green shadow-sm'
                        : `bg-card ${border} text-foreground hover:${bg} hover:shadow-sm hover:scale-[1.02]`
                    }`}
                  >
                    {category.emoji} {category.name}
                  </a>
                );
              })}
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
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* No Query State */}
        {!query && (
          <div className="text-center py-16">
            <div className="bg-card border border-border rounded-xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-serif text-xl font-bold mb-2">Search Zimbabwe News</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Find articles from trusted Zimbabwe news sources. Search by keywords, topics, or current events.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.slice(0, 6).map((category) => (
                  <a
                    key={category.id}
                    href={`/search?q=${category.name.toLowerCase()}`}
                    className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-sm rounded-full transition-colors"
                  >
                    {category.emoji} {category.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {query && results.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-card border border-border rounded-xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="font-serif text-xl font-bold mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                No articles found for "{query}". Try different keywords or browse categories.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-zw-green hover:bg-zw-green/90 text-zw-white font-medium rounded-full transition-colors"
              >
                Browse All News
              </a>
            </div>
          </div>
        )}

        {/* Search Results Masonry Grid */}
        {results.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 space-y-0">
            {results.map((article: any, index: number) => (
              <article 
                key={article.id || index}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-all duration-200 hover:shadow-lg break-inside-avoid mb-6"
              >
                {article.image_url && (
                  <div className="overflow-hidden">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-zw-green/20 text-zw-green rounded-full">
                      {article.source || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : 'Today'}
                    </span>
                  </div>
                  
                  <h3 className="font-serif font-bold text-lg leading-tight mb-3">
                    {article.title}
                  </h3>
                  
                  {article.description && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <a 
                        href={`/${article.source_id}/${article.slug}`}
                        className="inline-flex items-center space-x-1 text-zw-green text-sm font-medium hover:text-zw-green/80 transition-colors"
                      >
                        <span>Read More</span>
                      </a>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-2 rounded-full hover:bg-muted transition-colors touch-target"
                          aria-label="Like article"
                        >
                          <Heart className="h-4 w-4 text-muted-foreground hover:text-zw-red" />
                        </button>
                        <button 
                          className="p-2 rounded-full hover:bg-muted transition-colors touch-target"
                          aria-label="Bookmark article"
                        >
                          <Bookmark className="h-4 w-4 text-muted-foreground hover:text-zw-yellow" />
                        </button>
                      </div>
                    </div>
                    
                    <a 
                      href={article.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
                    >
                      <span>Original Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
        currentView="/search"
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