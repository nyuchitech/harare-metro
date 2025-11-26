import { useState, useEffect } from 'react';
import { X, Heart, Bookmark, ExternalLink, Share2 } from 'lucide-react';
import { buildClientImageUrl } from '../lib/api-utils';

interface Article {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  source: string;
  source_id: string;
  slug: string;
  published_at?: string;
  original_url: string;
  category_id?: string;
}

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || '',
          url: `/${article.source_id}/${article.slug}`
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/${article.source_id}/${article.slug}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <span className="text-xs px-3 py-1.5 bg-zw-green/20 text-zw-green rounded-full font-medium">
            {article.source}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Article Image */}
        {article.image_url && (
          <div className="relative w-full aspect-video bg-muted">
            <img
              src={buildClientImageUrl(article.image_url)}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              {article.published_at ? new Date(article.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Today'}
            </span>
            {article.category_id && (
              <>
                <span>•</span>
                <span className="capitalize">{article.category_id}</span>
              </>
            )}
          </div>

          {/* Description */}
          {article.description && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed">
                {article.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  isLiked
                    ? 'bg-zw-red/20 text-zw-red'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                aria-label="Like article"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">Like</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  isSaved
                    ? 'bg-zw-yellow/20 text-zw-yellow'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                aria-label="Bookmark article"
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">Save</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
                aria-label="Share article"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>

          {/* Original Source Link */}
          <div className="pt-4 border-t border-border">
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-zw-green hover:bg-zw-green/90 text-zw-white font-medium rounded-full transition-colors"
            >
              <span>Read Full Article</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="text-xs text-muted-foreground mt-3">
              Opens in a new tab • {new URL(article.original_url).hostname}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
