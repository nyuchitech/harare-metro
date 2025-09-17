import type { Route } from "./+types/$source.$slug";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { Heart, Bookmark, ExternalLink, ArrowLeft } from "lucide-react";
import { buildApiUrl } from "../lib/api-utils";

export function meta({ params }: Route.MetaArgs) {
  const { source, slug } = params;
  return [
    { title: `${source} - Harare Metro` },
    { name: "description", content: "Read the latest news from Zimbabwe's trusted sources" },
    { name: "keywords", content: "Zimbabwe news, Harare news, African news, breaking news" },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { source, slug } = params;
  
  try {
    // Fetch single article from our D1 API using source_id and slug
    const apiUrl = buildApiUrl(request, `/api/article/by-source-slug`, new URLSearchParams({ source, slug }));
    const response = await fetch(apiUrl);
    const data = await response.json() as { article?: any; error?: string };
    
    if (!data.article) {
      throw new Error('Article not found');
    }
    
    return {
      article: data.article,
      error: null
    };
  } catch (error) {
    console.error('Failed to load article:', error);
    return {
      article: null,
      error: 'Article not found'
    };
  }
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const { article, error } = loaderData;
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Zimbabwe Flag Strip */}
      <div className="zimbabwe-flag-strip" />
      
      {/* Header Navigation */}
      <HeaderNavigation
        currentView="/article"
        onSearchClick={() => window.location.href = '/search'}
        onProfileClick={() => user ? setShowUserProfile(true) : setShowAuthModal(true)}
        onHomeClick={() => window.location.href = '/'}
        isAuthenticated={!!user}
        user={user}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-6 pl-6 sm:pl-10 lg:pl-12">
        
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-card border border-border rounded-xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="font-serif text-xl font-bold mb-2">Article Not Found</h3>
              <p className="text-muted-foreground text-sm mb-6">
                The article you're looking for could not be found.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-zw-green hover:bg-zw-green/90 text-zw-white font-medium rounded-full transition-colors"
              >
                Back to Home
              </a>
            </div>
          </div>
        )}

        {/* Article Content */}
        {article && (
          <article className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Article Image */}
            {article.image_url && (
              <div className="overflow-hidden">
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            )}
            
            <div className="p-6 sm:p-8">
              {/* Article Meta */}
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm px-3 py-1 bg-zw-green/20 text-zw-green rounded-full">
                  {article.source || 'Unknown'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : 'Today'}
                </span>
              </div>
              
              {/* Article Title */}
              <h1 className="font-serif font-bold text-2xl sm:text-3xl leading-tight mb-6">
                {article.title}
              </h1>
              
              {/* Article Description/Summary */}
              {article.description && (
                <div className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {article.description}
                </div>
              )}
              
              {/* Article Content */}
              {article.content && (
                <div className="prose max-w-none mb-8">
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border">
                <div className="flex items-center space-x-4">
                  <button 
                    className="inline-flex items-center space-x-2 p-3 rounded-full hover:bg-muted transition-colors touch-target"
                    aria-label="Like article"
                  >
                    <Heart className="h-5 w-5 text-muted-foreground hover:text-zw-red" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button 
                    className="inline-flex items-center space-x-2 p-3 rounded-full hover:bg-muted transition-colors touch-target"
                    aria-label="Bookmark article"
                  >
                    <Bookmark className="h-5 w-5 text-muted-foreground hover:text-zw-yellow" />
                    <span className="text-sm">Save</span>
                  </button>
                </div>
                
                <a 
                  href={article.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-zw-green hover:bg-zw-green/90 text-zw-white font-medium rounded-full transition-colors"
                >
                  <span>Read Original</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </article>
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
        currentView="/article"
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