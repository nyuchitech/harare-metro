import type { Route } from "./+types/$source.$slug";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { UserProfile } from "../components/auth/UserProfile";
import HeaderNavigation from "../components/HeaderNavigation";
import MobileNavigation from "../components/MobileNavigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { buildApiUrl, buildClientImageUrl } from "../lib/api-utils";
import {
  ArticleLikeButton,
  ArticleSaveButton,
  ArticleViewTracker,
  CommentList,
} from "../components/engagement";

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
    console.log('[ARTICLE] Fetching article:', { source, slug, apiUrl });

    const response = await fetch(apiUrl);
    console.log('[ARTICLE] Response status:', response.status);

    if (!response.ok) {
      console.error('[ARTICLE] API error:', response.status, response.statusText);
      return {
        article: null,
        error: `Failed to load article: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json() as { article?: any; error?: string };
    console.log('[ARTICLE] Data received:', { hasArticle: !!data.article, error: data.error });

    if (!data.article) {
      return {
        article: null,
        error: data.error || 'Article not found'
      };
    }

    return {
      article: data.article,
      error: null
    };
  } catch (error: any) {
    console.error('[ARTICLE] Failed to load article:', error);
    return {
      article: null,
      error: error.message || 'Article not found'
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
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={buildClientImageUrl(article.image_url)}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="p-6 sm:p-8">
              {/* Article Meta */}
              <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                <span className="font-medium text-zw-green">
                  {article.source || 'Unknown'}
                </span>
                <span>•</span>
                <span>
                  {article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : 'Today'}
                </span>
              </div>

              {/* Article Title */}
              <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight mb-6">
                {article.title}
              </h1>

              {/* Article Description/Summary */}
              {article.description && (
                <div className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {article.description}
                </div>
              )}

              {/* Article Content */}
              {article.content && (
                <div className="mb-8">
                  <div className="text-foreground text-lg leading-relaxed space-y-4">
                    {article.content.split('\n\n').map((paragraph: string, index: number) => (
                      paragraph.trim() && <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border">
                <ArticleLikeButton
                  articleId={article.id}
                  initialLiked={article.isLiked}
                  initialCount={article.likesCount || 0}
                  size="md"
                  showCount={true}
                />
                <ArticleSaveButton
                  articleId={article.id}
                  initialSaved={article.isSaved}
                  size="md"
                  showLabel={true}
                />
                <a
                  href={article.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-zw-green hover:bg-zw-green/90 text-white font-medium rounded-full transition-colors"
                >
                  <span>Read Original</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </article>
        )}

        {/* Comments Section */}
        {article && (
          <div className="mt-6">
            <CommentList
              articleId={article.id}
              initialComments={article.comments || []}
              initialCount={article.commentsCount || 0}
              showForm={true}
            />
          </div>
        )}

        {/* Article View Tracker */}
        {article && (
          <ArticleViewTracker
            articleId={article.id}
            articleTitle={article.title}
            articleSource={article.source}
            articleCategory={article.category}
          />
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