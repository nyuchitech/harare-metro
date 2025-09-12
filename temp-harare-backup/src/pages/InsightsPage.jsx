import { logger } from '../utils/logger'
// src/pages/InsightsPage.jsx - Personal insights page
import React from 'react'
import PersonalInsights from '../components/PersonalInsights'
import { useOptimizedFeeds } from '../hooks/useOptimizedFeeds'
import { useHead } from '../hooks/useHead'

const InsightsPage = ({ currentColors }) => {
  const { feeds, performanceMetrics, getPerformanceInsights } = useOptimizedFeeds({
    selectedCategory: 'all',
    searchQuery: '',
    selectedTimeframe: 'all',
    sortBy: 'newest',
    // Using optimized feeds with intelligent performance tracking
  })

  const [readingHistory, setReadingHistory] = React.useState([])

  // Load reading history
  React.useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('harare_metro_reading_history') || '[]')
      setReadingHistory(history)
    } catch (error) {
      logger.error('Failed to load reading history:', error)
      setReadingHistory([])
    }
  }, [])

  // SEO
  useHead({
    title: "Personal Insights - Harare Metro | Your Reading Analytics",
    description: "Your personalized news reading insights and analytics",
    keywords: "reading insights, news analytics, personal stats, Zimbabwe news"
  })

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <PersonalInsights
        currentColors={currentColors}
        allFeeds={feeds || []}
        lastUpdated={performanceMetrics?.lastUpdate}
        performanceMetrics={getPerformanceInsights()}
        readingHistory={readingHistory}
      />
    </div>
  )
}

export default InsightsPage