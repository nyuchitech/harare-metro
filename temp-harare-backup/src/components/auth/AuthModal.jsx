/* eslint-env browser */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Mail, Lock, User, Eye, EyeOff, RefreshCw, X, ArrowLeft, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { generateRandomUsername, isValidUsername, formatUsernameFromName } from '../../utils/usernameGenerator'

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { signIn, signUp, resetPassword, updatePassword, error, loading, user, profile } = useAuth()
  const navigate = useNavigate()
  
  // Close modal and redirect to profile when authentication succeeds
  useEffect(() => {
    if (user && isOpen) {
      onClose()
      // Redirect to user's profile page
      const username = profile?.username || user?.email?.split('@')[0] || 'user'
      navigate(`/@${username}`)
    }
  }, [user, profile, isOpen, onClose, navigate])
  
  const [activeTab, setActiveTab] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // For multi-step signup

  // Update active tab when initialMode changes
  useEffect(() => {
    if (initialMode === 'reset-password') {
      setActiveTab('reset')
      setIsSettingNewPassword(true)
    } else {
      setActiveTab(initialMode)
      setIsSettingNewPassword(false)
    }
  }, [initialMode])

  // Generate default username when switching to signup tab
  useEffect(() => {
    if (activeTab === 'signup' && !formData.username) {
      const defaultUsername = generateRandomUsername()
      setFormData(prev => ({ ...prev, username: defaultUsername }))
    }
  }, [activeTab, formData.username])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'username') {
      setUsernameError('')
    }
    
    if (field === 'fullName' && !formData.username) {
      const suggestion = formatUsernameFromName(value)
      setFormData(prev => ({ ...prev, username: suggestion }))
    }
  }

  const generateNewUsername = () => {
    const newUsername = generateRandomUsername()
    setFormData(prev => ({ ...prev, username: newUsername }))
    setUsernameError('')
  }

  const validateUsername = (username) => {
    if (!username) return 'Username is required'
    if (!isValidUsername(username)) {
      if (username.length < 3) return 'Username must be at least 3 characters'
      if (username.length > 20) return 'Username must be less than 20 characters'
      if (/^[0-9]/.test(username)) return 'Username cannot start with a number'
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores'
    }
    return ''
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!isSupabaseConfigured()) {
      setIsSubmitting(false)
      return
    }
    
    try {
      const { error } = await signIn(formData.email, formData.password)
      
      if (!error) {
        setFormData({ email: '', password: '', fullName: '', confirmPassword: '' })
      }
    } catch {
      // Error handling - let the auth hook handle error display
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      return
    }
    
    const usernameValidation = validateUsername(formData.username)
    if (usernameValidation) {
      setUsernameError(usernameValidation)
      return
    }
    
    setIsSubmitting(true)
    setUsernameError('')
    
    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        username: formData.username
      })
      if (!error) {
        setActiveTab('signin')
        setFormData({ email: '', password: '', fullName: '', username: '', confirmPassword: '' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      setUsernameError('Please enter your email address')
      return
    }
    
    setIsSubmitting(true)
    setUsernameError('')
    
    try {
      const { error } = await resetPassword(formData.email)
      if (!error) {
        setResetEmailSent(true)
      } else {
        setUsernameError(error.message || 'Failed to send reset link')
      }
    } catch {
      setUsernameError('Failed to send reset link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (!formData.password) {
      setUsernameError('Please enter a new password')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setUsernameError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setUsernameError('Password must be at least 6 characters long')
      return
    }
    
    setIsSubmitting(true)
    setUsernameError('')
    
    try {
      if (updatePassword) {
        const { error } = await updatePassword(formData.password)
        if (!error) {
          handleClose()
        } else {
          setUsernameError(error.message || 'Failed to update password')
        }
      } else {
        const { error } = await supabase.auth.updateUser({ password: formData.password })
        if (!error) {
          handleClose()
        } else {
          setUsernameError(error.message || 'Failed to update password')
        }
      }
    } catch {
      setUsernameError('Failed to update password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({ email: '', password: '', fullName: '', username: '', confirmPassword: '' })
    setActiveTab('signin')
    setResetEmailSent(false)
    setUsernameError('')
    setCurrentStep(1)
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full h-screen w-screen p-0 m-0 rounded-none border-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl sm:max-w-[500px] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:border sm:border-border/20 animate-fade-in-scale">
        {/* Premium backdrop with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/95 to-muted/30 backdrop-blur-xl sm:rounded-3xl" />
        
        {/* Zimbabwe Flag Strip - only on mobile */}
        <div className="zimbabwe-flag-strip opacity-90 sm:hidden" />
        
        <div className="h-full w-full flex flex-col relative z-10 sm:h-auto">
          {/* Premium Header */}
          <div className="flex items-center justify-between p-6 bg-background/80 backdrop-blur-lg border-b border-border/30 sm:rounded-t-3xl sm:bg-background/95">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-12 w-12 p-0 rounded-full bg-muted/40 hover:bg-muted/60 backdrop-blur-sm transition-all duration-200 hover:scale-105 glass-effect"
            >
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight sm:text-xl">
                {resetEmailSent ? 'Check Email' : 'Harare Metro'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium sm:text-xs">
                {resetEmailSent ? 'Password reset sent' : 'Zimbabwe&apos;s Premier News Hub'}
              </p>
            </div>
            
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide sm:rounded-b-3xl">
            {resetEmailSent ? (
              <div className="min-h-full flex items-center justify-center p-6 sm:p-8 sm:min-h-0">
                <div className="w-full max-w-md space-y-10 animate-fade-in-scale sm:space-y-8">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-zw-green/20 to-zw-green/10 rounded-2xl flex items-center justify-center shadow-lg border border-zw-green/20">
                      <CheckCircle className="w-12 h-12 text-zw-green animate-in zoom-in-50 duration-300 delay-200" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Check Your Email</h2>
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-lg">
                          We've sent a password reset link to
                        </p>
                        <p className="font-semibold text-foreground text-lg bg-muted/50 px-4 py-2 rounded-lg">{formData.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={() => {
                        setResetEmailSent(false)
                        setActiveTab('signin')
                      }}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    >
                      Back to Sign In
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => setResetEmailSent(false)}
                      className="w-full h-14 rounded-2xl font-semibold text-lg hover:bg-muted/60 transition-all duration-200"
                    >
                      Resend Link
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-full flex items-center justify-center p-6 sm:p-8 sm:min-h-0">
                <div className="w-full max-w-md space-y-10 animate-fade-in-scale sm:space-y-8">
                  {/* Premium Logo/Brand */}
                  <div className="text-center space-y-4 animate-slide-in-top">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-sm glass-effect sm:w-16 sm:h-16 animate-pulse-glow">
                      <span className="text-white text-3xl font-serif font-bold sm:text-2xl">HM</span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight sm:text-xl">
                        Welcome to Zimbabwe&apos;s News Hub
                      </h2>
                      <p className="text-muted-foreground text-lg font-medium sm:text-base">
                        Stay informed with trusted journalism
                      </p>
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                    {/* Premium Tab Navigation */}
                    <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-muted/60 p-2 backdrop-blur-sm border border-border/50">
                      <TabsTrigger 
                        value="signin" 
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-border/50 font-semibold transition-all duration-200 data-[state=active]:scale-[1.02]"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-border/50 font-semibold transition-all duration-200 data-[state=active]:scale-[1.02]"
                      >
                        Sign Up
                      </TabsTrigger>
                      <TabsTrigger 
                        value="reset" 
                        className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-border/50 font-semibold transition-all duration-200 data-[state=active]:scale-[1.02]"
                      >
                        Reset
                      </TabsTrigger>
                    </TabsList>

                    {/* Sign In Tab */}
                    <TabsContent value="signin" className="space-y-8 animate-slide-in-right sm:space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/50">
                          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSignIn} className="space-y-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="signin-email" className="text-base font-semibold text-foreground">Email Address</Label>
                            <div className="relative group enterprise-focus">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signin-email"
                                type="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm glass-effect sm:h-14 sm:text-base"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="signin-password" className="text-base font-semibold text-foreground">Password</Label>
                            <div className="relative group enterprise-focus">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signin-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="pl-12 pr-16 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm glass-effect sm:h-14 sm:text-base"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-zw-green transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-16 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm border border-zw-green/20 glass-effect sm:h-14 sm:text-lg"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin sm:h-5 sm:w-5" />
                              <span>Signing In...</span>
                            </>
                          ) : (
                            <span>Sign In to Continue</span>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup" className="space-y-8 animate-slide-in-left sm:space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/50">
                          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{error}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSignUp} className="space-y-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="signup-name" className="text-base font-semibold text-foreground">Full Name</Label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signup-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="signup-email" className="text-base font-semibold text-foreground">Email Address</Label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="signup-username" className="text-base font-semibold text-foreground">Username</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={generateNewUsername}
                                className="h-8 px-3 text-sm text-zw-green hover:text-zw-green/80 hover:bg-zw-green/10 rounded-lg transition-all duration-200 font-medium"
                              >
                                <RefreshCw className="mr-1 h-4 w-4" />
                                Generate
                              </Button>
                            </div>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signup-username"
                                type="text"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className={cn(
                                  "pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm",
                                  usernameError && "border-red-300 ring-2 ring-red-200 focus:border-red-400 focus:ring-red-200"
                                )}
                                required
                              />
                            </div>
                            {usernameError && (
                              <p className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{usernameError}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="signup-password" className="text-base font-semibold text-foreground">Password</Label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a secure password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="pl-12 pr-16 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-zw-green transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="signup-confirm-password" className="text-base font-semibold text-foreground">Confirm Password</Label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                              <Input
                                id="signup-confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={cn(
                                  "pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm",
                                  formData.password && formData.confirmPassword && 
                                  formData.password !== formData.confirmPassword && 
                                  "border-red-300 ring-2 ring-red-200 focus:border-red-400 focus:ring-red-200"
                                )}
                                required
                              />
                            </div>
                            {formData.password && formData.confirmPassword && 
                             formData.password !== formData.confirmPassword && (
                              <p className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">Passwords do not match</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-16 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm border border-zw-green/20"
                          disabled={isSubmitting || loading || 
                                   formData.password !== formData.confirmPassword ||
                                   !formData.username ||
                                   usernameError}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <span>Create Your Account</span>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Reset Password Tab */}
                    <TabsContent value="reset" className="space-y-8 animate-slide-in-bottom sm:space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/50">
                          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {usernameError && (
                        <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/50">
                          <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{usernameError}</AlertDescription>
                        </Alert>
                      )}

                      {isSettingNewPassword ? (
                        <div className="space-y-8">
                          <div className="text-center space-y-3">
                            <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">Set New Password</h3>
                            <p className="text-muted-foreground text-lg font-medium">
                              Enter your new password below
                            </p>
                          </div>

                          <form onSubmit={handleUpdatePassword} className="space-y-8">
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <Label htmlFor="new-password" className="text-base font-semibold text-foreground">New Password</Label>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                                  <Input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="pl-12 pr-16 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-zw-green transition-all duration-200 p-1 rounded-lg hover:bg-muted/50"
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium bg-muted/30 px-3 py-2 rounded-lg">
                                  Password must be at least 6 characters long
                                </p>
                              </div>

                              <div className="space-y-3">
                                <Label htmlFor="confirm-new-password" className="text-base font-semibold text-foreground">Confirm New Password</Label>
                                <div className="relative group">
                                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                                  <Input
                                    id="confirm-new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className="pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm"
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-16 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm border border-zw-green/20"
                              disabled={isSubmitting || loading || !formData.password || !formData.confirmPassword}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                  <span>Updating Password...</span>
                                </>
                              ) : (
                                <span>Update Password</span>
                              )}
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="text-center space-y-3">
                            <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">Reset Your Password</h3>
                            <p className="text-muted-foreground text-lg font-medium">
                              Enter your email and we&apos;ll send you a link to reset your password
                            </p>
                          </div>

                          <form onSubmit={handleResetPassword} className="space-y-8">
                            <div className="space-y-3">
                              <Label htmlFor="reset-email" className="text-base font-semibold text-foreground">Email Address</Label>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-zw-green transition-colors duration-200" />
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="Enter your email address"
                                  value={formData.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  className={cn(
                                    "pl-12 h-16 rounded-2xl bg-muted/30 border-2 border-border/50 focus:bg-background focus:border-zw-green/50 focus:ring-2 focus:ring-zw-green/20 text-lg transition-all duration-200 backdrop-blur-sm",
                                    usernameError && "border-red-300 ring-2 ring-red-200 focus:border-red-400 focus:ring-red-200"
                                  )}
                                  required
                                />
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-16 rounded-2xl bg-gradient-to-r from-zw-green to-zw-green/90 hover:from-zw-green/90 hover:to-zw-green/80 text-white text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm border border-zw-green/20"
                              disabled={isSubmitting || loading || !formData.email}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                  <span>Sending Reset Link...</span>
                                </>
                              ) : (
                                <span>Send Reset Link</span>
                              )}
                            </Button>
                          </form>
                          
                          <div className="text-center">
                            <Button 
                              variant="ghost" 
                              onClick={() => setActiveTab('signin')}
                              className="text-lg text-muted-foreground hover:text-foreground font-semibold hover:bg-muted/60 px-6 py-3 rounded-2xl transition-all duration-200"
                            >
                              Back to Sign In
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal