import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Loader2, User, Mail, Calendar, Settings, LogOut, Edit, Save, X } from 'lucide-react'
import { format } from 'date-fns'

const UserProfile = () => {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
    preferences: {
      theme: profile?.preferences?.theme || 'dark',
      notifications: profile?.preferences?.notifications || true,
      email_updates: profile?.preferences?.email_updates || false
    }
  })

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setEditData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const { error } = await updateProfile(editData)
      if (!error) {
        setIsEditing(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
      preferences: {
        theme: profile?.preferences?.theme || 'dark',
        notifications: profile?.preferences?.notifications || true,
        email_updates: profile?.preferences?.email_updates || false
      }
    })
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px] bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl rounded-3xl">
        <div className="text-center space-y-4 animate-fade-in-scale">
          <Loader2 className="h-12 w-12 animate-spin text-zw-green mx-auto" />
          <p className="text-muted-foreground font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 rounded-3xl glass-effect">
        <CardContent className="p-12 text-center">
          <div className="animate-slide-in-top space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-3xl flex items-center justify-center mx-auto shadow-2xl glass-effect animate-pulse-glow">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">Not Signed In</h3>
              <p className="text-muted-foreground text-lg font-medium">Please sign in to view your profile.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-scale">
      {/* Premium Profile Header */}
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 rounded-3xl glass-effect animate-slide-in-top">
        <CardHeader className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/20 shadow-2xl">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red text-white text-2xl font-serif font-bold">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zw-green rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-serif font-bold text-foreground tracking-tight">
                  {profile?.full_name || 'Anonymous User'}
                </CardTitle>
                <CardDescription className="flex items-center space-x-3 text-base">
                  <Mail className="h-5 w-5 text-zw-green" />
                  <span className="font-medium">{user.email}</span>
                </CardDescription>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-zw-yellow" />
                  <span className="text-sm text-muted-foreground font-medium">
                    Member since {profile?.created_at ? 
                      format(new Date(profile.created_at), 'MMM yyyy') : 
                      'Recently'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-12 w-12 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 glass-effect"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="h-12 w-12 rounded-2xl bg-muted/30 border-2 border-border/50 hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-12 w-12 rounded-2xl bg-muted/30 border-2 border-border/50 hover:bg-muted/60 transition-all duration-200 hover:scale-105 glass-effect"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Premium Profile Details */}
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 rounded-3xl glass-effect animate-slide-in-right">
        <CardHeader className="p-8 pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl font-serif font-bold text-foreground tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-zw-green/20 to-zw-green/10 rounded-2xl flex items-center justify-center">
              <User className="h-5 w-5 text-zw-green" />
            </div>
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="full-name" className="text-base font-semibold text-foreground">Full Name</Label>
              {isEditing ? (
                <div className="relative group enterprise-focus">
                  <Input
                    id="full-name"
                    value={editData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className="h-14 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm glass-effect"
                  />
                </div>
              ) : (
                <p className="text-lg text-foreground font-medium bg-muted/30 px-4 py-3 rounded-2xl glass-effect">
                  {profile?.full_name || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">Email Address</Label>
              <p className="text-lg text-foreground font-medium bg-muted/30 px-4 py-3 rounded-2xl glass-effect">
                {user.email}
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="avatar-url" className="text-base font-semibold text-foreground">Avatar URL</Label>
              {isEditing ? (
                <div className="relative group enterprise-focus">
                  <Input
                    id="avatar-url"
                    value={editData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="Enter avatar URL"
                    className="h-14 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm glass-effect"
                  />
                </div>
              ) : (
                <p className="text-lg text-foreground font-medium bg-muted/30 px-4 py-3 rounded-2xl glass-effect truncate">
                  {profile?.avatar_url || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">Account Status</Label>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={user.email_confirmed_at ? "default" : "secondary"}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl ${user.email_confirmed_at ? 'bg-zw-green text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  {user.email_confirmed_at ? "✓ Verified" : "⏳ Unverified"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Preferences */}
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 rounded-3xl glass-effect animate-slide-in-left">
        <CardHeader className="p-8 pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl font-serif font-bold text-foreground tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-zw-yellow/20 to-zw-yellow/10 rounded-2xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-zw-yellow" />
            </div>
            <span>Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-8 pt-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl glass-effect">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground">Dark Theme</Label>
                <p className="text-sm text-muted-foreground font-medium">
                  Use dark theme for the application
                </p>
              </div>
              {isEditing ? (
                <Switch
                  checked={editData.preferences.theme === 'dark'}
                  onCheckedChange={(checked) => 
                    handleInputChange('preferences.theme', checked ? 'dark' : 'light')
                  }
                  className="scale-125"
                />
              ) : (
                <Badge variant="outline" className="px-4 py-2 text-sm font-semibold rounded-xl capitalize">
                  {profile?.preferences?.theme || 'dark'}
                </Badge>
              )}
            </div>

            <Separator className="bg-border/30" />

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl glass-effect">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground">Push Notifications</Label>
                <p className="text-sm text-muted-foreground font-medium">
                  Receive notifications for new articles
                </p>
              </div>
              {isEditing ? (
                <Switch
                  checked={editData.preferences.notifications}
                  onCheckedChange={(checked) => 
                    handleInputChange('preferences.notifications', checked)
                  }
                  className="scale-125"
                />
              ) : (
                <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold rounded-xl ${profile?.preferences?.notifications ? 'bg-zw-green text-white' : 'bg-muted text-muted-foreground'}`}>
                  {profile?.preferences?.notifications ? 'On' : 'Off'}
                </Badge>
              )}
            </div>

            <Separator className="bg-border/30" />

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl glass-effect">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground">Email Updates</Label>
                <p className="text-sm text-muted-foreground font-medium">
                  Receive email updates and newsletters
                </p>
              </div>
              {isEditing ? (
                <Switch
                  checked={editData.preferences.email_updates}
                  onCheckedChange={(checked) => 
                    handleInputChange('preferences.email_updates', checked)
                  }
                  className="scale-125"
                />
              ) : (
                <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold rounded-xl ${profile?.preferences?.email_updates ? 'bg-zw-green text-white' : 'bg-muted text-muted-foreground'}`}>
                  {profile?.preferences?.email_updates ? 'On' : 'Off'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Account Actions */}
      <Card className="bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 rounded-3xl glass-effect animate-slide-in-bottom">
        <CardHeader className="p-8 pb-6">
          <CardTitle className="flex items-center space-x-3 text-2xl font-serif font-bold text-foreground tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-zw-red/20 to-zw-red/10 rounded-2xl flex items-center justify-center">
              <LogOut className="h-5 w-5 text-zw-red" />
            </div>
            <span>Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/10 border-2 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-[1.02] glass-effect font-semibold text-lg"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile