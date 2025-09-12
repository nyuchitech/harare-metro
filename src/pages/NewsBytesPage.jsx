import { logger } from '../utils/logger'
// src/pages/NewsBytesPage.jsx - News Bytes page
import React from 'react'
import NewsBytes from '../components/NewsBytes'
import { useOptimizedFeeds } from '../hooks/useOptimizedFeeds'
import { useHead } from '../hooks/useHead'

const NewsBytesPage = ({ currentColors, viewMode }) => {
  const { feeds, toggleLike, toggleBookmark, isLiked, isBookmarked, forceRefresh } = useOptimizedFeeds({
    selectedCategory: 'all',
    searchQuery: '',
    selectedTimeframe: 'all',
    sortBy: 'newest',
    // Optimized feeds uses intelligent preloading instead of fixed itemsPerPage
  })

  // SEO
  useHead({
    title: "News Bytes - Harare Metro | Visual News from Zimbabwe",
    description: "Quick visual news updates from Zimbabwe's top sources",
    keywords: "Zimbabwe news bytes, visual news, quick updates"
  })

  // Filter articles with images for bytes view
  // Filter articles with images for visual news bytes display
  const articlesWithImages = feeds ? feeds.filter(article => 
    article.optimizedImageUrl || article.imageUrl || article.image_url
  ) : []

  const handleShare = async (article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.link
        })
      } catch (error) {
        logger.error('Share failed:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.link)
      } catch (error) {
        logger.error('Copy failed:', error)
      }
    }
  }

  // Direct use of optimized functions - no wrapper needed

  return (
    <NewsBytes 
      currentColors={currentColors}
      articles={feeds}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
      toggleLike={toggleLike}
      toggleBookmark={toggleBookmark}
      onShare={handleShare}
      forceRefresh={forceRefresh}
    />
  )
}

export default NewsBytesPage