// ArticleCard.jsx - Updated with no hover animations, clean Lucide icons
import React, { useState, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { IconButton } from './ui/icon-button'
import { 
  Share2, 
  Image,
  ExternalLink,
  Eye,
  Clock
} from 'lucide-react'
import { cn } from '../lib/utils'
import ArticleModal from './ArticleModal'
import ShareModal from './ShareModal'
import { useAnalytics } from '../hooks/useAnalytics'

function ArticleCard({ 
  article, 
  onShare,
  currentColors,
  savedArticles = [],
  onToggleSave,
  viewMode = 'grid',
  onLike,
  onBookmark
}) {
  const { trackArticleClick, trackUserInteraction } = useAnalytics()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Check for any available image URL
  const imageUrl = article.optimizedImageUrl || article.imageUrl
  const hasImage = imageUrl && !imageError

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleReadMore = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const handleShareClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowShareModal(true)
  }, [])

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false)
  }, [])

  const handleOriginalClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(article.link, '_blank', 'noopener,noreferrer')
  }, [article.link])

  const handleCardClick = useCallback((e) => {
    // Only open modal if not clicking on buttons
    if (!e.target.closest('button') && !e.target.closest('a')) {
      setShowModal(true)
    }
  }, [])

  const handleLike = () => {
    const newLikeState = onLike(article)
    trackUserInteraction('like', article, newLikeState)
  }

  const handleBookmark = () => {
    const newBookmarkState = onBookmark(article)
    trackUserInteraction('bookmark', article, newBookmarkState)
  }

  // List view (Reddit-style) - NO HOVER ANIMATIONS
  if (viewMode === 'list') {
    return (
      <>
        <div 
          className={cn(
            "flex items-start gap-3 p-3 cursor-pointer",
            "border-b border-gray-100 dark:border-gray-800"
          )}
          onClick={handleCardClick}
        >
          {/* Small thumbnail for list view */}
          {hasImage && (
            <div className="flex-shrink-0 w-16 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(
              "text-sm font-medium leading-tight mb-1",
              "line-clamp-2"
            )}>
              {article.title}
              {article.priority && (
                <span className="ml-2 text-xs">🇿🇼</span>
              )}
            </h3>
            
            {/* Meta info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span className="font-medium">{article.source}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(article.pubDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {article.wordCount && (
                <>
                  <span>•</span>
                  <span>{Math.ceil(article.wordCount / 200)} min read</span>
                </>
              )}
            </div>
            
            {/* Description */}
            {article.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {article.description.length > 400 
                  ? `${article.description.substring(0, 400)}...`
                  : article.description
                }
              </p>
            )}
            
            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {article.keywords.slice(0, 2).map((keyword, keywordIndex) => (
                  <Badge
                    key={`${article.guid}-keyword-${keywordIndex}`}
                    variant="outline"
                    className="text-xs px-1 py-0"
                  >
                    #{keyword}
                  </Badge>
                ))}
                {article.keywords.length > 2 && (
                  <Badge variant="ghost" className="text-xs px-1 py-0">
                    +{article.keywords.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleShareClick}
              tooltip="Share"
            >
              <Share2 className="h-3 w-3" />
            </IconButton>
            
            <Button
              onClick={handleReadMore}
              variant="ghost"
              size="sm"
              className="text-xs px-2"
            >
              Read
            </Button>
          </div>
        </div>

        {/* Modals */}
        {showModal && (
          <ArticleModal
            article={article}
            onClose={handleCloseModal}
            currentColors={currentColors}
            onShare={onShare}
            savedArticles={savedArticles}
            onToggleSave={onToggleSave}
          />
        )}

        {showShareModal && (
          <ShareModal
            article={article}
            isOpen={showShareModal}
            onClose={handleCloseShareModal}
            currentColors={currentColors}
          />
        )}
      </>
    )
  }

  // Grid view (Masonry-style) - NO HOVER ANIMATIONS
  return (
    <>
      <Card 
        className={cn(
          "article-card overflow-hidden cursor-pointer break-inside-avoid"
        )}
        onClick={handleCardClick}
      >
        {/* Image Section */}
        {hasImage && (
          <div className="relative w-full overflow-hidden">
            {!imageLoaded && (
              <div className="aspect-video flex items-center justify-center bg-muted">
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground mb-2" />
                  <div className="text-xs text-muted-foreground">Loading...</div>
                </div>
              </div>
            )}
            
            <img
              src={imageUrl}
              alt={article.title}
              className={cn(
                "w-full h-auto object-cover",
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />

            {/* Priority badge overlay */}
            {article.priority && (
              <div className="absolute top-2 left-2">
                <Badge variant="primary" size="sm" className="gap-1">
                  🇿🇼 Priority
                </Badge>
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <CardContent className="p-4">
          {/* Source as heading and Date */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-primary mb-1">
              {article.source}
            </h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(article.pubDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-lg font-semibold leading-tight mb-3">
            {article.title}
            {article.priority && !hasImage && (
              <span className="ml-2 text-sm">🇿🇼</span>
            )}
          </h2>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {article.description.length > 400 
                ? `${article.description.substring(0, 400)}...`
                : article.description
              }
            </p>
          )}

          {/* Keywords */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1.5">
                {article.keywords.slice(0, 4).map((keyword, keywordIndex) => (
                  <Badge
                    key={`${article.guid}-keyword-${keywordIndex}`}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    #{keyword}
                  </Badge>
                ))}
                {article.keywords.length > 4 && (
                  <Badge variant="ghost" size="sm" className="text-xs">
                    +{article.keywords.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Word count and reading time */}
          {article.wordCount && (
            <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
              <span>{article.wordCount} words</span>
              <span>•</span>
              <span>{Math.ceil(article.wordCount / 200)} min read</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleReadMore}
                variant="primary"
                size="sm"
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Read More
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOriginalClick}
                className="gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Original
              </Button>
            </div>

            <IconButton
              variant="icon"
              size="icon"
              onClick={handleShareClick}
              tooltip="Share article"
            >
              <Share2 className="h-4 w-4" />
            </IconButton>
          </div>
        </CardContent>
      </Card>

      {/* Article Modal */}
      {showModal && (
        <ArticleModal
          article={article}
          onClose={handleCloseModal}
          currentColors={currentColors}
          onShare={onShare}
          savedArticles={savedArticles}
          onToggleSave={onToggleSave}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          article={article}
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          currentColors={currentColors}
        />
      )}
    </>
  )
}

export default ArticleCard