// src/components/PersonalInsights.jsx - Enhanced user-specific insights
import React, { useState, useMemo, useEffect } from 'react'
import {
  User,
  Clock,
  Heart,
  Bookmark,
  Eye,
  TrendingUp,
  BarChart3,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
  GraduationCap,
  Globe,
  Newspaper,
  ArrowUpRight,
  Flame,
  Zap,
  Star,
  Target
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { useAnalytics } from '../hooks/useAnalytics'

const PersonalInsights = ({ currentColors, allFeeds, lastUpdated }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [selectedInsightType, setSelectedInsightType] = useState('overview')
  const { trackCategoryClick } = useAnalytics()

  // Get user's interaction data from localStorage
  const getUserData = () => {
    const readArticles = JSON.parse(localStorage.getItem('harare-metro_read_articles') || '[]')
    const likedArticles = JSON.parse(localStorage.getItem('harare-metro_liked_articles') || '[]')
    const bookmarkedArticles = JSON.parse(localStorage.getItem('harare-metro_bookmarks') || '[]')
    const searchHistory = JSON.parse(localStorage.getItem('harare-metro_search_history') || '[]')
    const categoryClicks = JSON.parse(localStorage.getItem('harare-metro_category_clicks') || '{}')
    const readingTime = JSON.parse(localStorage.getItem('harare-metro_reading_time') || '{}')
    const visitHistory = JSON.parse(localStorage.getItem('harare-metro_visit_history') || '[]')
    
    return {
      readArticles,
      likedArticles,
      bookmarkedArticles,
      searchHistory,
      categoryClicks,
      readingTime,
      visitHistory
    }
  }

  // Calculate comprehensive personal insights
  const personalInsights = useMemo(() => {
    // Early return if allFeeds is not available
    if (!allFeeds || !Array.isArray(allFeeds) || allFeeds.length === 0) {
      return {
        readingBehavior: {
          articlesRead: 0,
          totalTimeReading: 0,
          avgTimePerArticle: 0,
          readingSpeed: 200,
          completionRate: 0,
          readingStreak: 0,
          favoriteReadingTime: 12
        },
        categoryPreferences: [],
        sourcePreferences: [],
        timePatterns: {
          hourlyActivity: Array(24).fill(0),
          dailyActivity: Array(7).fill(0),
          peakHour: 12,
          peakDay: 'Monday',
          totalSessions: 0
        },
        recommendations: [],
        achievements: [],
        engagement: {
          engagementRate: 0,
          likeRate: 0,
          bookmarkRate: 0,
          diversityScore: 0
        },
        userData: getUserData()
      }
    }

    const userData = getUserData()
    const now = new Date()
    const timeRanges = {
      '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    const selectedRange = timeRanges[selectedTimeRange]

    // Reading behavior analysis
    const readingBehavior = analyzeReadingBehavior(userData, selectedRange, allFeeds)
    
    // Category preferences
    const categoryPreferences = analyzeCategoryPreferences(userData, allFeeds)
    
    // Source preferences
    const sourcePreferences = analyzeSourcePreferences(userData, allFeeds)
    
    // Time-based patterns
    const timePatterns = analyzeTimePatterns(userData, selectedRange)
    
    // Content recommendations
    const recommendations = generateRecommendations(userData, allFeeds, categoryPreferences)
    
    // Reading goals and achievements
    const achievements = calculateAchievements(userData, selectedRange)
    
    // Engagement metrics
    const engagement = calculateEngagementMetrics(userData, selectedRange)

    return {
      readingBehavior,
      categoryPreferences,
      sourcePreferences,
      timePatterns,
      recommendations,
      achievements,
      engagement,
      userData
    }
  }, [allFeeds, selectedTimeRange])

  // Helper functions for analysis
  function analyzeReadingBehavior(userData, timeRange, feeds) {
    // Safety check for feeds
    if (!feeds || !Array.isArray(feeds)) {
      return {
        articlesRead: 0,
        totalTimeReading: 0,
        avgTimePerArticle: 0,
        readingSpeed: 200,
        completionRate: 0,
        readingStreak: 0,
        favoriteReadingTime: 12
      }
    }

    const recentReads = userData.readArticles.filter(article => 
      new Date(article.timestamp) > timeRange
    )
    
    const avgReadingTime = userData.readingTime
    const totalReadTime = Object.values(avgReadingTime).reduce((sum, time) => sum + time, 0)
    const avgTimePerArticle = totalReadTime / Math.max(Object.keys(avgReadingTime).length, 1)
    
    // Reading speed calculation (words per minute)
    const wordsRead = recentReads.reduce((sum, read) => {
      const article = feeds.find(f => f.id === read.id || f.link === read.link)
      return sum + (article?.description?.split(' ').length || 200)
    }, 0)
    
    const timeSpent = recentReads.reduce((sum, read) => sum + (avgReadingTime[read.id] || 120), 0)
    const readingSpeed = timeSpent > 0 ? Math.round((wordsRead / (timeSpent / 60))) : 200

    return {
      articlesRead: recentReads.length,
      totalTimeReading: totalReadTime,
      avgTimePerArticle: Math.round(avgTimePerArticle),
      readingSpeed,
      completionRate: calculateCompletionRate(recentReads, avgReadingTime),
      readingStreak: calculateReadingStreak(userData.visitHistory),
      favoriteReadingTime: getMostActiveHour(userData.visitHistory)
    }
  }

  function analyzeCategoryPreferences(userData, feeds) {
    // Safety check for feeds
    if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
      return []
    }

    const categoryStats = {}
    const allCategories = [...new Set(feeds.map(f => f.category).filter(Boolean))]
    
    // Initialize categories
    allCategories.forEach(cat => {
      categoryStats[cat] = {
        views: 0,
        likes: 0,
        bookmarks: 0,
        searches: 0,
        score: 0,
        trend: 0
      }
    })

    // Count interactions
    userData.readArticles.forEach(read => {
      const article = feeds.find(f => f.id === read.id || f.link === read.link)
      if (article && article.category && categoryStats[article.category]) {
        categoryStats[article.category].views++
      }
    })

    userData.likedArticles.forEach(like => {
      const article = feeds.find(f => f.id === like.id || f.link === like.link)
      if (article && article.category && categoryStats[article.category]) {
        categoryStats[article.category].likes++
      }
    })

    userData.bookmarkedArticles.forEach(bookmark => {
      const article = feeds.find(f => f.id === bookmark.id || f.link === bookmark.link)
      if (article && article.category && categoryStats[article.category]) {
        categoryStats[article.category].bookmarks++
      }
    })

    // Calculate preference scores
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category]
      stats.score = (stats.views * 1) + (stats.likes * 3) + (stats.bookmarks * 5)
    })

    return Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.score - a.score)
      .slice(0, 10)
      .map(([category, stats]) => ({ category, ...stats }))
  }

  function analyzeSourcePreferences(userData, feeds) {
    // Safety check for feeds
    if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
      return []
    }

    const sourceStats = {}
    
    userData.readArticles.forEach(read => {
      const article = feeds.find(f => f.id === read.id || f.link === read.link)
      if (article && article.source) {
        if (!sourceStats[article.source]) {
          sourceStats[article.source] = { reads: 0, likes: 0, bookmarks: 0, score: 0 }
        }
        sourceStats[article.source].reads++
      }
    })

    userData.likedArticles.forEach(like => {
      const article = feeds.find(f => f.id === like.id || f.link === like.link)
      if (article && article.source && sourceStats[article.source]) {
        sourceStats[article.source].likes++
      }
    })

    userData.bookmarkedArticles.forEach(bookmark => {
      const article = feeds.find(f => f.id === bookmark.id || f.link === bookmark.link)
      if (article && article.source && sourceStats[article.source]) {
        sourceStats[article.source].bookmarks++
      }
    })

    // Calculate scores
    Object.keys(sourceStats).forEach(source => {
      const stats = sourceStats[source]
      stats.score = (stats.reads * 1) + (stats.likes * 2) + (stats.bookmarks * 3)
    })

    return Object.entries(sourceStats)
      .sort(([,a], [,b]) => b.score - a.score)
      .slice(0, 8)
      .map(([source, stats]) => ({ source, ...stats }))
  }

  function analyzeTimePatterns(userData, timeRange) {
    const hourlyActivity = Array(24).fill(0)
    const dailyActivity = Array(7).fill(0)
    
    userData.visitHistory
      .filter(visit => new Date(visit.timestamp) > timeRange)
      .forEach(visit => {
        const date = new Date(visit.timestamp)
        hourlyActivity[date.getHours()]++
        dailyActivity[date.getDay()]++
      })

    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))
    const peakDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      dailyActivity.indexOf(Math.max(...dailyActivity))
    ]

    return {
      hourlyActivity,
      dailyActivity,
      peakHour,
      peakDay,
      totalSessions: userData.visitHistory.filter(v => new Date(v.timestamp) > timeRange).length
    }
  }

  function generateRecommendations(userData, feeds, categoryPreferences) {
    // Safety check for feeds
    if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
      return []
    }

    const topCategories = categoryPreferences.slice(0, 3).map(p => p.category)
    const readArticleIds = new Set(userData.readArticles.map(r => r.id || r.link))
    
    const recommended = feeds
      .filter(article => 
        !readArticleIds.has(article.id || article.link) &&
        (topCategories.includes(article.category) || article.priority > 3)
      )
      .sort((a, b) => {
        const aCategoryRank = topCategories.indexOf(a.category)
        const bCategoryRank = topCategories.indexOf(b.category)
        
        if (aCategoryRank !== -1 && bCategoryRank !== -1) {
          return aCategoryRank - bCategoryRank
        }
        if (aCategoryRank !== -1) return -1
        if (bCategoryRank !== -1) return 1
        
        return (b.priority || 0) - (a.priority || 0)
      })
      .slice(0, 10)

    return recommended
  }

  function calculateAchievements(userData, timeRange) {
    const recentReads = userData.readArticles.filter(r => new Date(r.timestamp) > timeRange)
    const achievements = []

    // Reading streak
    const streak = calculateReadingStreak(userData.visitHistory)
    if (streak >= 7) achievements.push({ type: 'streak', value: streak, title: 'Reading Streak', icon: Flame })
    
    // Articles read milestone
    if (recentReads.length >= 50) achievements.push({ type: 'reads', value: recentReads.length, title: 'News Explorer', icon: Eye })
    else if (recentReads.length >= 25) achievements.push({ type: 'reads', value: recentReads.length, title: 'Regular Reader', icon: Bookmark })
    else if (recentReads.length >= 10) achievements.push({ type: 'reads', value: recentReads.length, title: 'Getting Started', icon: Sparkles })
    
    // Category expertise
    const topCategory = userData.readArticles.reduce((acc, read) => {
      acc[read.category] = (acc[read.category] || 0) + 1
      return acc
    }, {})
    
    const expertCategory = Object.entries(topCategory).sort(([,a], [,b]) => b - a)[0]
    if (expertCategory && expertCategory[1] >= 20) {
      achievements.push({ type: 'expert', value: expertCategory[0], title: `${expertCategory[0]} Expert`, icon: GraduationCap })
    }

    // Early bird / Night owl
    const morningReads = userData.visitHistory.filter(v => {
      const hour = new Date(v.timestamp).getHours()
      return hour >= 6 && hour <= 9
    }).length
    
    const nightReads = userData.visitHistory.filter(v => {
      const hour = new Date(v.timestamp).getHours()
      return hour >= 22 || hour <= 5
    }).length

    if (morningReads > nightReads && morningReads >= 10) {
      achievements.push({ type: 'time', value: 'morning', title: 'Early Bird', icon: Zap })
    } else if (nightReads >= 10) {
      achievements.push({ type: 'time', value: 'night', title: 'Night Owl', icon: Star })
    }

    return achievements
  }

  function calculateEngagementMetrics(userData, timeRange) {
    const recentReads = userData.readArticles.filter(r => new Date(r.timestamp) > timeRange)
    const recentLikes = userData.likedArticles.filter(l => new Date(l.timestamp) > timeRange)
    const recentBookmarks = userData.bookmarkedArticles.filter(b => new Date(b.timestamp) > timeRange)
    
    return {
      engagementRate: recentReads.length > 0 ? ((recentLikes.length + recentBookmarks.length) / recentReads.length * 100) : 0,
      likeRate: recentReads.length > 0 ? (recentLikes.length / recentReads.length * 100) : 0,
      bookmarkRate: recentReads.length > 0 ? (recentBookmarks.length / recentReads.length * 100) : 0,
      diversityScore: calculateDiversityScore(userData, timeRange)
    }
  }

  // Helper functions
  function calculateCompletionRate(reads, readingTimes) {
    if (reads.length === 0) return 0
    const completed = reads.filter(read => {
      const time = readingTimes[read.id] || 0
      return time > 30 // Read for more than 30 seconds
    }).length
    return Math.round((completed / reads.length) * 100)
  }

  function calculateReadingStreak(visitHistory) {
    if (visitHistory.length === 0) return 0
    
    const dates = visitHistory
      .map(v => new Date(v.timestamp).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a))
    
    let streak = 0
    const today = new Date().toDateString()
    let currentDate = new Date()
    
    for (let i = 0; i < dates.length; i++) {
      const checkDate = currentDate.toDateString()
      if (dates.includes(checkDate)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  function getMostActiveHour(visitHistory) {
    const hourCounts = visitHistory.reduce((acc, visit) => {
      const hour = new Date(visit.timestamp).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})
    
    const mostActive = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]
    return mostActive ? parseInt(mostActive[0]) : 12
  }

  function calculateDiversityScore(userData, timeRange) {
    const recentReads = userData.readArticles.filter(r => new Date(r.timestamp) > timeRange)
    const uniqueCategories = new Set(recentReads.map(r => r.category)).size
    const uniqueSources = new Set(recentReads.map(r => r.source)).size
    
    // Score based on variety (max 100)
    return Math.min(100, (uniqueCategories * 10) + (uniqueSources * 5))
  }

  const timeRangeOptions = [
    { value: '1d', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' }
  ]

  const insightTypes = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'habits', label: 'Reading Habits', icon: Clock },
    { value: 'preferences', label: 'Preferences', icon: Heart },
    { value: 'recommendations', label: 'For You', icon: Lightbulb }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${currentColors.text} flex items-center`}>
          <User className="w-6 h-6 mr-2 text-blue-500" />
          Your Reading Insights
        </h2>
        <div className="flex space-x-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeRange(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedTimeRange === option.value
                  ? 'bg-blue-500 text-white shadow-lg'
                  : `${currentColors.categoryButton} hover:scale-105`
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insight Type Selector - Horizontal Scrolling like CategoryFilter */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-3 items-center overflow-x-auto p-2">
          {insightTypes.map(type => {
            const isSelected = selectedInsightType === type.value
            
            return (
              <Button
                key={type.value}
                variant="category"
                size="category"
                active={isSelected}
                onClick={() => setSelectedInsightType(type.value)}
                aria-label={`View ${type.label} insights`}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-category">{type.label}</span>
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      {/* Overview Section */}
      {selectedInsightType === 'overview' && (
        <div className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${currentColors.text}`}>
                    {personalInsights.readingBehavior.articlesRead}
                  </p>
                  <p className={`text-sm ${currentColors.textMuted}`}>Articles Read</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-xs text-blue-600">Last {selectedTimeRange}</span>
                  </div>
                </div>
                <Eye className={`w-8 h-8 ${currentColors.textMuted}`} />
              </div>
            </div>

            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold text-green-600`}>
                    {personalInsights.readingBehavior.readingStreak}
                  </p>
                  <p className={`text-sm ${currentColors.textMuted}`}>Day Streak</p>
                  <div className="flex items-center mt-1">
                    <Flame className="w-3 h-3 text-orange-500 mr-1" />
                    <span className="text-xs text-orange-600">Keep it up!</span>
                  </div>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold text-purple-600`}>
                    {Math.round(personalInsights.engagement.engagementRate)}%
                  </p>
                  <p className={`text-sm ${currentColors.textMuted}`}>Engagement</p>
                  <div className="flex items-center mt-1">
                    <Heart className="w-3 h-3 text-purple-500 mr-1" />
                    <span className="text-xs text-purple-600">Likes & Bookmarks</span>
                  </div>
                </div>
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold text-blue-600`}>
                    {personalInsights.readingBehavior.readingSpeed}
                  </p>
                  <p className={`text-sm ${currentColors.textMuted}`}>WPM</p>
                  <div className="flex items-center mt-1">
                    <Zap className="w-3 h-3 text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600">Reading Speed</span>
                  </div>
                </div>
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Achievements */}
          {personalInsights.achievements.length > 0 && (
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
              <h3 className={`text-lg font-semibold ${currentColors.text} mb-3 flex items-center`}>
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Recent Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalInsights.achievements.map((achievement, index) => {
                  const IconComponent = achievement.icon
                  return (
                    <div key={index} className="flex items-center p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700">
                      <IconComponent className="w-8 h-8 text-yellow-600 mr-3" />
                      <div>
                        <div className={`font-medium ${currentColors.text}`}>{achievement.title}</div>
                        <div className="text-xs text-yellow-600">
                          {achievement.type === 'streak' && `${achievement.value} days`}
                          {achievement.type === 'reads' && `${achievement.value} articles`}
                          {achievement.type === 'expert' && `${achievement.value} specialist`}
                          {achievement.type === 'time' && `${achievement.value} reader`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reading Habits Section */}
      {selectedInsightType === 'habits' && (
        <div className="space-y-4">
          {/* Time Patterns */}
          <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${currentColors.text} mb-4 flex items-center`}>
              <Clock className="w-5 h-5 mr-2" />
              Your Reading Patterns
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hourly Activity */}
              <div>
                <h4 className={`text-sm font-medium ${currentColors.text} mb-3`}>Daily Activity</h4>
                <div className="flex items-end space-x-1 h-16">
                  {personalInsights.timePatterns.hourlyActivity.map((count, hour) => {
                    const maxCount = Math.max(...personalInsights.timePatterns.hourlyActivity)
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t min-h-[2px] w-full"
                          style={{ height: `${height}%` }}
                          title={`${hour}:00 - ${count} visits`}
                        ></div>
                        {hour % 6 === 0 && (
                          <span className="text-xs text-gray-500 mt-1">{hour}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-3">
                <div className={`flex items-center text-sm ${currentColors.text}`}>
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Peak reading: {personalInsights.timePatterns.peakHour}:00</span>
                </div>
                <div className={`flex items-center text-sm ${currentColors.text}`}>
                  <Calendar className="w-4 h-4 mr-2 text-green-500" />
                  <span>Favorite day: {personalInsights.timePatterns.peakDay}</span>
                </div>
                <div className={`flex items-center text-sm ${currentColors.text}`}>
                  <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                  <span>Sessions: {personalInsights.timePatterns.totalSessions}</span>
                </div>
                <div className={`flex items-center text-sm ${currentColors.text}`}>
                  <Zap className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Completion rate: {personalInsights.readingBehavior.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reading Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 text-center`}>
              <div className={`text-xl font-bold ${currentColors.text}`}>
                {Math.round(personalInsights.readingBehavior.avgTimePerArticle / 60)}m
              </div>
              <div className={`text-sm ${currentColors.textMuted}`}>Avg Reading Time</div>
            </div>
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 text-center`}>
              <div className={`text-xl font-bold ${currentColors.text}`}>
                {Math.round(personalInsights.engagement.diversityScore)}
              </div>
              <div className={`text-sm ${currentColors.textMuted}`}>Diversity Score</div>
            </div>
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 text-center`}>
              <div className={`text-xl font-bold ${currentColors.text}`}>
                {Math.round(personalInsights.engagement.likeRate)}%
              </div>
              <div className={`text-sm ${currentColors.textMuted}`}>Like Rate</div>
            </div>
            <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4 text-center`}>
              <div className={`text-xl font-bold ${currentColors.text}`}>
                {Math.round(personalInsights.engagement.bookmarkRate)}%
              </div>
              <div className={`text-sm ${currentColors.textMuted}`}>Bookmark Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      {selectedInsightType === 'preferences' && (
        <div className="space-y-4">
          {/* Category Preferences */}
          <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${currentColors.text} mb-4 flex items-center`}>
              <Tag className="w-5 h-5 mr-2" />
              Your Favorite Categories
            </h3>
            <div className="space-y-3">
              {personalInsights.categoryPreferences.slice(0, 6).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <div className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${currentColors.text} capitalize`}>{category.category}</div>
                      <div className="flex items-center space-x-3 text-sm">
                        <span className={`${currentColors.textMuted}`}>{category.views} reads</span>
                        <span className="text-red-600">{category.likes} likes</span>
                        <span className="text-blue-600">{category.bookmarks} bookmarks</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${currentColors.text}`}>{category.score}</div>
                    <div className="text-xs text-gray-500">engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Preferences */}
          <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${currentColors.text} mb-4 flex items-center`}>
              <Newspaper className="w-5 h-5 mr-2" />
              Trusted Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {personalInsights.sourcePreferences.slice(0, 8).map((source, index) => (
                <div key={source.source} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 bg-blue-500`}></div>
                    <div>
                      <div className={`font-medium ${currentColors.text}`}>{source.source}</div>
                      <div className="text-xs text-gray-500">{source.reads} articles read</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${currentColors.text}`}>{source.score}</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {selectedInsightType === 'recommendations' && (
        <div className="space-y-4">
          <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${currentColors.text} mb-4 flex items-center`}>
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Recommended for You
            </h3>
            
            {personalInsights.recommendations.length > 0 ? (
              <div className="space-y-3">
                {personalInsights.recommendations.slice(0, 8).map((article, index) => (
                  <div key={article.id || article.link} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {article.optimizedImageUrl && (
                      <img
                        src={article.optimizedImageUrl}
                        alt={article.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${currentColors.text} line-clamp-2 mb-1`}>
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`${currentColors.textMuted}`}>{article.source}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          {article.category}
                        </span>
                        {article.priority > 3 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className={`w-12 h-12 ${currentColors.textMuted} mx-auto mb-3`} />
                <p className={`${currentColors.textMuted}`}>
                  Start reading more articles to get personalized recommendations!
                </p>
              </div>
            )}
          </div>

          {/* Reading Goals */}
          <div className={`${currentColors.cardBg} ${currentColors.border} border rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${currentColors.text} mb-4 flex items-center`}>
              <Target className="w-5 h-5 mr-2 text-green-500" />
              Suggested Goals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center mb-2">
                  <Eye className="w-4 h-4 text-green-600 mr-2" />
                  <span className={`font-medium ${currentColors.text}`}>Daily Reading Goal</span>
                </div>
                <p className="text-sm text-green-600">
                  Read {Math.max(3, Math.ceil(personalInsights.readingBehavior.articlesRead / 7))} articles per day
                </p>
              </div>
              
              <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center mb-2">
                  <Globe className="w-4 h-4 text-purple-600 mr-2" />
                  <span className={`font-medium ${currentColors.text}`}>Explore New Topics</span>
                </div>
                <p className="text-sm text-purple-600">
                  Try reading more {personalInsights.categoryPreferences.length < 3 ? 'international' : 'technology'} news
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalInsights