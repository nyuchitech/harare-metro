/* eslint-disable */
import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  UserCircle,
  Settings,
  Bell,
  Eye,
  BarChart3,
  Clock,
  Bookmark,
  Share,
  Smartphone,
  Sun,
  Moon,
  Globe,
  ShieldCheck,
  Info,
  TrendingUp,
  Flame,
  Newspaper,
  Check,
  User,
  Heart,
  Target,
  Lightbulb,
  Edit,
  Camera,
  Mail,
  Calendar,
  ArrowLeft,
  MoreHorizontal,
  Star,
  Award,
  Activity
} from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import SaveForLater from './SaveForLater'
import PersonalInsights from './PersonalInsights'
import RoleManager from './RoleManager'

const ProfilePage = ({
  currentColors,
  theme,
  onThemeChange,
  savedArticles = [],
  onToggleSave,
  onShare,
  onArticleClick,
  userStats = {},
  allFeeds = [],
  lastUpdated,
  className = '',
  user,
  profile,
  isAuthenticated,
  onClose
}) => {
  const { username } = useParams()
  const { userRoles, getUserRole, hasRole, isAdmin } = useAuth()
  const [activeView, setActiveView] = useState('profile') // 'profile' | 'edit' | 'settings'
  
  // Check if viewing own profile or another user's profile
  const isOwnProfile = useMemo(() => {
    if (!user || !username) return false
    const currentUsername = profile?.username || user?.email?.split('@')[0] || 'user'
    return username === currentUsername
  }, [user, profile, username])
  
  // Get profile data for the requested username
  const viewingProfile = useMemo(() => {
    if (isOwnProfile) {
      return profile || {
        id: user?.id,
        email: user?.email,
        username: user?.email?.split('@')[0] || 'user',
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        avatar_url: user?.user_metadata?.avatar_url,
        role: 'creator',
        created_at: user?.created_at
      }
    }
    // For now, return null for other users' profiles (can be extended later)
    return null
  }, [isOwnProfile, profile, user])
  
  // Enhanced user data with personal insights integration and real auth data
  const userData = useMemo(() => {
    const readArticles = JSON.parse(localStorage.getItem('harare-metro_read_articles') || '[]')
    const likedArticles = JSON.parse(localStorage.getItem('harare-metro_liked_articles') || '[]')
    const bookmarkedArticles = JSON.parse(localStorage.getItem('harare-metro_bookmarks') || '[]')
    const visitHistory = JSON.parse(localStorage.getItem('harare-metro_visit_history') || '[]')
    
    const memberSince = visitHistory.length > 0 
      ? new Date(Math.min(...visitHistory.map(v => new Date(v.timestamp))))
      : new Date('2024-01-15')
    
    const daysSince = Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24))
    
    // Calculate reading streak
    const calculateStreak = () => {
      if (visitHistory.length === 0) return 0
      
      const dates = visitHistory
        .map(v => new Date(v.timestamp).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index)
        .sort((a, b) => new Date(b) - new Date(a))
      
      let streak = 0
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

    // Get favorite category
    const categoryCount = readArticles.reduce((acc, read) => {
      const article = allFeeds.find(f => f.id === read.id || f.link === read.link)
      if (article && article.category) {
        acc[article.category] = (acc[article.category] || 0) + 1
      }
      return acc
    }, {})
    
    const favoriteCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Technology'

    return {
      name: viewingProfile?.full_name || viewingProfile?.email || 'News Reader',
      email: viewingProfile?.email || 'user@example.com',
      role: viewingProfile?.role || 'creator',
      joinDate: viewingProfile?.created_at ? new Date(viewingProfile.created_at).toISOString().split('T')[0] : memberSince.toISOString().split('T')[0],
      readingStats: {
        articlesRead: readArticles.length || userStats.articlesRead || 247,
        timeSpent: userStats.timeSpent || '5.2h',
        favoriteCategory: favoriteCategory,
        readingStreak: calculateStreak() || userStats.readingStreak || 12,
        totalLikes: likedArticles.length,
        totalBookmarks: bookmarkedArticles.length,
        totalSessions: visitHistory.length,
        daysSince
      }
    }
  }, [allFeeds, userStats, viewingProfile, user])

  // If viewing another user's profile and not found, show not found message
  if (!isOwnProfile && !viewingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in-scale">
          <div className="w-20 h-20 bg-gradient-to-br from-zw-red/20 to-zw-red/10 rounded-3xl flex items-center justify-center shadow-2xl glass-effect mb-6">
            <UserCircle className="w-10 h-10 text-zw-red" />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">User not found</h2>
            <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
              The profile @{username} doesn&apos;t exist or is not available.
            </p>
            {onClose && (
              <Button onClick={onClose} variant="outline" className="mt-6 h-14 px-8 rounded-2xl bg-muted/30 border-2 border-border/50 hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect font-semibold">
                <ArrowLeft className="w-5 h-5 mr-3" />
                Go back
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getProfileAvatar = () => {
    const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    return (
      <div className="w-24 h-24 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-sm glass-effect animate-pulse-glow">
        <span className="text-white text-3xl font-serif font-bold drop-shadow-lg">
          {initials}
        </span>
      </div>
    )
  }

  const ProfileView = () => (
    <div className="space-y-6">
      {/* Premium Profile Header */}
      <div className="text-center space-y-6 animate-slide-in-top">
        {getProfileAvatar()}
        
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
            {userData.name}
          </h1>
          
          <div className="flex items-center justify-center space-x-3 text-base text-muted-foreground font-medium">
            <span className="bg-muted/50 px-3 py-1 rounded-lg">@newsreader</span>
            <span>•</span>
            <span className="bg-muted/50 px-3 py-1 rounded-lg">
              Joined {new Date(userData.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-sm mx-auto font-medium leading-relaxed">
            Passionate about news, technology, and staying informed. 
            <span className="text-zw-green font-semibold"> #HarareMetro</span>
          </p>
        </div>

        {/* Premium Quick Actions - Only show for own profile */}
        {isOwnProfile && (
          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={() => setActiveView('edit')}
              variant="outline" 
              className="h-12 px-6 rounded-2xl bg-muted/30 border-2 border-border/50 hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect font-semibold"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            
            <Button 
              onClick={() => setActiveView('settings')}
              variant="outline" 
              className="h-12 px-6 rounded-2xl bg-muted/30 border-2 border-border/50 hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect font-semibold"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        )}

        {/* Premium Verification Badge */}
        <div className="flex justify-center">
          <Badge className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-zw-green/20 to-zw-green/10 border-2 border-zw-green/30 text-zw-green rounded-full font-semibold">
            <Check className="h-4 w-4" />
            <span>Verified Member</span>
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">
            {userData.readingStats.articlesRead}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Read
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">
            {userData.readingStats.totalLikes}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Liked
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">
            {userData.readingStats.totalBookmarks}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Saved
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">
            {userData.readingStats.readingStreak}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Streak
          </div>
        </div>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center bg-zw-green/5 border-zw-green/20">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-zw-green/20 rounded-full flex items-center justify-center">
              <Flame className="h-5 w-5 text-zw-green" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {userData.readingStats.readingStreak} Days
              </div>
              <div className="text-xs text-muted-foreground">
                Reading Streak
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 text-center bg-zw-yellow/5 border-zw-yellow/20">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-zw-yellow/20 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-zw-yellow/80" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                Top Reader
              </div>
              <div className="text-xs text-muted-foreground">
                This Week
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 text-center bg-zw-red/5 border-zw-red/20">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-zw-red/20 rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-zw-red" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {userData.readingStats.favoriteCategory}
              </div>
              <div className="text-xs text-muted-foreground">
                Favorite Topic
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 text-center bg-muted/50">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {userData.readingStats.daysSince}
              </div>
              <div className="text-xs text-muted-foreground">
                Days Active
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Access Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-full">
          <TabsTrigger value="insights" className="rounded-full text-xs">
            <BarChart3 className="h-4 w-4 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-full text-xs">
            <Bookmark className="h-4 w-4 mr-1" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full text-xs">
            <Activity className="h-4 w-4 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="mt-6">
          <PersonalInsights 
            currentColors={currentColors} 
            allFeeds={allFeeds || []}
            lastUpdated={lastUpdated}
          />
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <SaveForLater
            savedArticles={savedArticles}
            onToggleSave={onToggleSave}
            onShare={onShare}
            onArticleClick={onArticleClick}
            currentColors={currentColors}
          />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-serif font-bold">Activity Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Your reading activity will appear here
                  </p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const EditView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setActiveView('profile')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-serif font-bold">Edit Profile</h2>
      </div>

      {/* Profile Picture */}
      <div className="text-center space-y-4">
        {getProfileAvatar()}
        <Button variant="outline" size="sm" className="rounded-full">
          <Camera className="h-4 w-4 mr-2" />
          Change Avatar
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
          <Input 
            id="displayName"
            defaultValue={userData.name}
            className="mt-2 h-12 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
            placeholder="Your display name"
          />
        </div>
        
        <div>
          <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
          <Textarea 
            id="bio"
            className="mt-2 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green resize-none"
            placeholder="Tell us about yourself..."
            defaultValue="Passionate about news, technology, and staying informed. #HarareMetro"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="website" className="text-sm font-medium">Website</Label>
          <Input 
            id="website"
            defaultValue="hararemetro.co.zw"
            className="mt-2 h-12 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
            placeholder="Your website URL"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button 
          className="w-full h-12 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white"
          onClick={() => setActiveView('profile')}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )

  const SettingsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setActiveView('profile')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-serif font-bold">Settings</h2>
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {/* Appearance */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">
                  {theme === 'dark' ? 'Dark mode is enabled' : 'Light mode is enabled'}
                </div>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={onThemeChange}
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium flex items-center space-x-2">
                  <span>Push Notifications</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Get notified about breaking news
                </div>
              </div>
            </div>
            <Switch disabled />
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium flex items-center space-x-2">
                  <span>Privacy Settings</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Control your data preferences
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* About */}
        <Card className="p-4 bg-muted/30">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-white text-lg font-serif font-bold">HM</span>
            </div>
            <div>
              <h3 className="font-serif font-bold">Harare Metro</h3>
              <p className="text-sm text-muted-foreground">
                Version 2.1.0 • Built with ❤️ in Zimbabwe
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-serif font-bold">Profile</h1>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'edit' && isOwnProfile && <EditView />}
          {activeView === 'settings' && isOwnProfile && <SettingsView />}
          {/* Fallback to profile view for non-own profiles */}
          {(activeView === 'edit' || activeView === 'settings') && !isOwnProfile && <ProfileView />}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage