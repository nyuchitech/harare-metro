import { logger } from '../utils/logger'
// src/pages/SavedPage.jsx - Saved articles page
import React from 'react'
import SaveForLater from '../components/SaveForLater'
import { useHead } from '../hooks/useHead'

const SavedPage = ({ currentColors }) => {
  const [savedArticles, setSavedArticles] = React.useState([])

  // Load saved articles from localStorage
  React.useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('harare-metro_bookmarks') || '[]')
      setSavedArticles(bookmarks)
    } catch (error) {
      logger.error('Failed to load bookmarks:', error)
      setSavedArticles([])
    }

    // Listen for bookmark changes
    const handleBookmarksChanged = () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('harare-metro_bookmarks') || '[]')
        setSavedArticles(bookmarks)
      } catch (error) {
        logger.error('Failed to load bookmarks:', error)
      }
    }

    window.addEventListener('bookmarksChanged', handleBookmarksChanged)
    return () => window.removeEventListener('bookmarksChanged', handleBookmarksChanged)
  }, [])

  // SEO
  useHead({
    title: "Saved Articles - Harare Metro | Your Reading List",
    description: "Your saved articles from Zimbabwe's top news sources",
    keywords: "saved articles, bookmarks, reading list, Zimbabwe news"
  })

  const handleToggleSave = (article) => {
    try {
      const currentBookmarks = JSON.parse(localStorage.getItem('harare-metro_bookmarks') || '[]')
      const isBookmarked = currentBookmarks.some(b => b.link === article.link)
      
      let updatedBookmarks
      if (isBookmarked) {
        updatedBookmarks = currentBookmarks.filter(b => b.link !== article.link)
      } else {
        updatedBookmarks = [article, ...currentBookmarks]
      }
      
      localStorage.setItem('harare-metro_bookmarks', JSON.stringify(updatedBookmarks))
      setSavedArticles(updatedBookmarks)
      window.dispatchEvent(new CustomEvent('bookmarksChanged'))
    } catch (error) {
      logger.error('Failed to toggle bookmark:', error)
    }
  }

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

  const handleArticleClick = (article) => {
    // Track article view
    const historyEntry = {
      ...article,
      viewedAt: new Date().toISOString(),
      readingTime: Math.floor(Math.random() * 180) + 30
    }
    
    // Save to reading history
    try {
      const currentHistory = JSON.parse(localStorage.getItem('harare_metro_reading_history') || '[]')
      const updatedHistory = [historyEntry, ...currentHistory.slice(0, 99)]
      localStorage.setItem('harare_metro_reading_history', JSON.stringify(updatedHistory))
    } catch (error) {
      logger.error('Failed to save reading history:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <SaveForLater
        savedArticles={savedArticles}
        onToggleSave={handleToggleSave}
        onShare={handleShare}
        onArticleClick={handleArticleClick}
        currentColors={currentColors}
      />
    </div>
  )
}

export default SavedPage