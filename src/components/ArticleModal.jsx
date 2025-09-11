// src/components/ArticleModal.jsx - Modern Harare Metro article modal with source branding
import React, { useState, useEffect, useRef } from 'react'
import { 
  X,
  Share2, 
  Heart,
  Globe,
  Clock,
  Bookmark,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { cn } from '../lib/utils'
import ShareModal from './ShareModal'
import { useNewsSource } from '../hooks/useNewsSource'

const ArticleModal = ({ 
  article, 
  onClose, 
  currentColors, 
  onShare, 
  savedArticles = [],
  onToggleSave 
}) => {
  // Early return if no article
  if (!article) {
    console.log('ArticleModal: No article provided, not rendering')
    return null
  }

  console.log('ArticleModal: Rendering modal for article:', article.title)

  const [isLiked, setIsLiked] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(true) // Default to fullscreen
  const [fontSize, setFontSize] = useState(16)
  const [expandedContent, setExpandedContent] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  // News source information
  const { profile: sourceProfile, logo: sourceLogo } = useNewsSource(article?.source)
  
  const modalRef = useRef(null)
  const contentRef = useRef(null)
  const scrollTimeoutRef = useRef(null)

  // Check if article is saved
  const isBookmarked = savedArticles.some(saved => saved.link === article.link)

  // Calculate reading time
  useEffect(() => {
    if (article?.description) {
      const words = article.description.split(' ').length
      const avgWordsPerMinute = 200
      setEstimatedReadTime(Math.ceil(words / avgWordsPerMinute))
    }
  }, [article])

  // Track reading progress and auto-hide header
  useEffect(() => {
    if (!contentRef.current) return

    const handleScroll = () => {
      const element = contentRef.current
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight - element.clientHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setReadingProgress(Math.min(100, Math.max(0, progress)))

      // Show header on scroll, then hide after delay
      setShowHeader(true)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setShowHeader(false)
      }, 2000)
    }

    const element = contentRef.current
    element.addEventListener('scroll', handleScroll)
    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('ArticleModal: Escape key pressed, closing modal')
        onClose()
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(!isFullscreen)
      } else if (e.key === '+' || e.key === '=') {
        setFontSize(prev => Math.min(24, prev + 2))
      } else if (e.key === '-') {
        setFontSize(prev => Math.max(12, prev - 2))
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHeader(!showHeader)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isFullscreen, showHeader])

  // Auto-hide header after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHeader(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Close modal when clicking outside content area
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('ArticleModal: Backdrop clicked, closing modal')
      onClose()
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(article)
    } else {
      setShowShareModal(true)
    }
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  const toggleSave = () => {
    if (onToggleSave) {
      onToggleSave(article)
    }
  }

  const handleCloseModal = () => {
    console.log('ArticleModal: Close button clicked')
    onClose()
  }

  const showHeaderTemporarily = () => {
    setShowHeader(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowHeader(false)
    }, 2000)
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black z-50 transition-opacity duration-300"
        onClick={handleBackdropClick}
      >
        {/* Background Image with Overlay */}
        {(article.optimizedImageUrl || article.imageUrl || article.image) && (
          <div className="absolute inset-0">
            <img
              src={article.optimizedImageUrl || article.imageUrl || article.image}
              alt={article.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-black/80" />
          </div>
        )}

        <div 
          ref={modalRef}
          className="relative w-full h-full flex flex-col"
        >
          {/* Reading Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-black/20 backdrop-blur-sm z-30">
            <div 
              className="h-full bg-gradient-to-r from-zw-green via-zw-yellow to-zw-red transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>

          {/* Header - Auto-hiding */}
          <div className={cn(
            "absolute top-0 left-0 right-0 z-30 transition-all duration-300",
            showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          )}>
            <div className="bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Source Logo/Avatar */}
                  <div className="relative">
                    {sourceLogo ? (
                      <img
                        src={sourceLogo}
                        alt={`${article.source} logo`}
                        className="w-10 h-10 rounded-full object-cover bg-white p-0.5"
                        onError={(e) => {
                          // Fallback to initials on error
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                        sourceLogo ? "absolute inset-0 hidden" : "flex",
                        "bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red"
                      )}
                    >
                      {sourceProfile?.initials || article.source?.charAt(0).toUpperCase() || 'N'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm text-white">{sourceProfile?.name || article.source || 'Unknown Source'}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{formatTimeAgo(article.publishedAt || article.pubDate || article.published)}</span>
                      {sourceProfile?.credibility && (
                        <>
                          <span>•</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            sourceProfile.credibility === 'high' && "bg-green-500/20 text-green-300",
                            sourceProfile.credibility === 'medium' && "bg-yellow-500/20 text-yellow-300",
                            sourceProfile.credibility === 'low' && "bg-red-500/20 text-red-300",
                            sourceProfile.credibility === 'unknown' && "bg-gray-500/20 text-gray-300"
                          )}>
                            {sourceProfile.credibility} trust
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{estimatedReadTime} min read</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Font Size Controls */}
                  <div className="flex items-center space-x-1 mr-3">
                    <button
                      onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                      className="p-1.5 rounded text-xs hover:bg-white/10 text-white transition-colors touch-manipulation"
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                      className="p-1.5 rounded text-xs hover:bg-white/10 text-white transition-colors touch-manipulation"
                    >
                      A+
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors touch-manipulation"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors touch-manipulation"
                    title="Close (Esc)"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto pt-16 pb-20"
            style={{ fontSize: `${fontSize}px` }}
            onClick={showHeaderTemporarily}
          >
            <div className="max-w-4xl mx-auto">
              {/* Article Image */}
              {(article.optimizedImageUrl || article.imageUrl || article.image) && (
                <div className="aspect-video w-full mb-8">
                  <img
                    src={article.optimizedImageUrl || article.imageUrl || article.image}
                    alt={article.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="px-6">
                {/* Category */}
                {article.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zw-green/20 text-zw-green border border-zw-green/30">
                      #{article.category}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
                  {article.title}
                </h1>

                {/* Article Meta */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-8 pb-4 border-b border-gray-800">
                  <div className="flex items-center space-x-4">
                    <span>{article.source || 'Unknown Source'}</span>
                    <span>•</span>
                    <time>
                      {new Date(article.pubDate || article.publishedAt || article.published).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{estimatedReadTime} min read</span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="prose prose-lg prose-invert max-w-none mb-8">
                  {article.description && (
                    <div className="text-gray-300 leading-relaxed mb-8">
                      {article.description.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                          <p key={index} className="mb-4">
                            {paragraph.trim()}
                          </p>
                        )
                      ))}
                    </div>
                  )}

                  {/* Additional Content (if available) */}
                  {article.content && (
                    <div className="text-gray-300 leading-relaxed mb-8">
                      <div 
                        className={cn(
                          "prose prose-invert max-w-none",
                          !expandedContent && "line-clamp-6"
                        )}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                      {article.content.length > 500 && (
                        <button
                          onClick={() => setExpandedContent(!expandedContent)}
                          className="mt-4 inline-flex items-center text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
                        >
                          {expandedContent ? (
                            <>
                              <span>Show Less</span>
                              <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span>Show More</span>
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {article.keywords && article.keywords.length > 0 && (
                  <div className="mb-8 pt-6 border-t border-gray-800">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read Original Link */}
                <div className="border-t border-gray-800 pt-6 mb-16">
                  <div className="flex flex-col sm:flex-row gap-6 items-center justify-bewteen">
                    <div>
                      <p className="text-gray-400 mb-2 items-center justify-center">
                        Want to read the complete article?
                      </p>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium bg-zw-green/20 text-zw-green backdrop-blur-sm border border-zw-green/30 hover:bg-zw-green/30 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <span>Visit Original Article</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions - Auto-hiding */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 z-30 transition-all duration-300",
            showHeader ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}>
            <div className="bg-black/80 backdrop-blur-sm border-t border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleSave}
                    className={cn(
                      "p-3 rounded-full transition-all duration-200 hover:scale-110 touch-manipulation",
                      isBookmarked 
                        ? 'text-purple-400 hover:text-purple-300' 
                        : 'text-gray-400 hover:text-gray-300'
                    )}
                    title={isBookmarked ? "Remove from saved" : "Save article"}
                  >
                    <Bookmark className={cn("h-6 w-6", isBookmarked && "fill-current")} />
                  
                  </button>

                  <button
                    onClick={toggleLike}
                    className={cn(
                      "p-3 rounded-full transition-all duration-200 hover:scale-110 touch-manipulation",
                      isLiked 
                        ? 'text-red-500 hover:text-red-400' 
                        : 'text-gray-400 hover:text-gray-300'
                    )}
                    title={isLiked ? "Unlike" : "Like article"}
                  >
                    <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full text-gray-400 hover:text-gray-300 transition-all duration-200 hover:scale-110 touch-manipulation"
                    title="Share article"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  <span className="hidden sm:inline">Press </span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300">Esc</kbd>
                  <span className="hidden sm:inline"> to close • </span>
                  <span className="sm:hidden"> • </span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300">H</kbd>
                  <span className="hidden sm:inline"> to toggle controls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tap hint for mobile */}
          <div className="lg:hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className={cn(
              "bg-black/50 rounded-lg px-3 py-2 transition-opacity duration-300",
              showHeader ? "opacity-0" : "opacity-60"
            )}>
              <div className="text-white text-xs text-center">
                Tap to show controls
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          article={article}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          currentColors={currentColors}
        />
      )}
    </>
  )
}

export default ArticleModal