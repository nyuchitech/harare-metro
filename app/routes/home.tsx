import type { Route } from "./+types/home";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { Heart, Bookmark, ExternalLink } from "lucide-react";
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
  const limit = url.searchParams.get('limit') || '24';
  
  try {
    // Fetch articles from backend API
    const apiUrl = buildApiUrl(request, '/api/feeds', new URLSearchParams({ category, limit }));
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Fetch categories from backend API
    const categoriesUrl = buildApiUrl(request, '/api/categories');
    const categoriesResponse = await fetch(categoriesUrl);
    
    if (!categoriesResponse.ok) {
      throw new Error(`Categories API responded with ${categoriesResponse.status}: ${categoriesResponse.statusText}`);
    }
    
    const categoriesData = await categoriesResponse.json();
    
    return {
      articles: data.articles || [],
      categories: categoriesData.categories || [],
      selectedCategory: category,
      total: data.total || 0
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    // Return fallback data
    return {
      articles: [],
      categories: [],
      selectedCategory: 'all',
      total: 0,
      error: 'Failed to load articles. Please check if backend service is running.'
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, categories, selectedCategory, total, error } = loaderData;
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);


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
        {/* Stats Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold">Latest News</h1>
            <p className="text-muted-foreground text-sm">Zimbabwe's most trusted sources</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zw-green font-medium">{total} Articles</div>
            <div className="text-xs text-muted-foreground">Live Updates</div>
          </div>
        </div>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-3 pb-4 mb-4 scrollbar-hide overflow-x-auto">
              {/* All Categories Button */}
              <a
                href="/"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border-2 ${
                  selectedCategory === 'all' || !selectedCategory
                    ? 'bg-zw-green text-zw-white border-zw-green shadow-sm'
                    : 'bg-card border-border text-foreground hover:bg-muted hover:scale-[1.02]'
                }`}
              >
                🏠 All
              </a>
              {categories.slice(0, 15).map((category, index) => {
                // Assign mineral colors cyclically with matching borders
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
                ]
                const { bg, border } = mineralColorPairs[index % mineralColorPairs.length]
                
                return (
                  <a
                    key={category.id}
                    href={`/?category=${category.id}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border-2 ${
                      selectedCategory === category.id
                        ? 'bg-zw-green text-zw-white border-zw-green shadow-sm'
                        : `bg-card ${border} text-foreground hover:${bg} hover:shadow-sm hover:scale-[1.02]`
                    }`}
                  >
                    {category.emoji} {category.name}
                  </a>
                )
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
              <span>Failed to load articles. Please check if RSS service is running.</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {articles.length === 0 && !error && (
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

        {/* Articles Masonry Grid */}
        {articles.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 space-y-0">
            {articles.map((article, index) => (
              <article 
                key={article.id || index}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-all duration-200 hover:shadow-lg break-inside-avoid mb-6"
              >
                {article.image_url && (
                  <div className="overflow-hidden">
                    <img 
                      src={buildClientImageUrl(article.image_url)} 
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
        currentView="/"
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
