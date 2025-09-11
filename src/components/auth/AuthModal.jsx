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
      <DialogContent className="max-w-full h-screen w-screen p-0 m-0 rounded-none border-0 bg-background">
        {/* Zimbabwe Flag Strip */}
        <div className="zimbabwe-flag-strip"></div>
        
        <div className="h-full w-full flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-10 w-10 p-0 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-xl font-serif font-bold text-foreground">
                {resetEmailSent ? 'Check Email' : 'Harare Metro'}
              </h1>
            </div>
            
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {resetEmailSent ? (
              <div className="min-h-full flex items-center justify-center p-6">
                <div className="w-full max-w-sm space-y-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-zw-green/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-zw-green" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-serif font-bold text-foreground">Check Your Email</h2>
                      <p className="text-muted-foreground">
                        We've sent a password reset link to
                      </p>
                      <p className="font-semibold text-foreground">{formData.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={() => {
                        setResetEmailSent(false)
                        setActiveTab('signin')
                      }}
                      className="w-full h-12 rounded-full bg-zw-green hover:bg-zw-green/90 text-white"
                    >
                      Back to Sign In
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => setResetEmailSent(false)}
                      className="w-full h-12 rounded-full"
                    >
                      Resend Link
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-full flex items-center justify-center p-6">
                <div className="w-full max-w-sm space-y-8">
                  {/* Logo/Brand */}
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl font-serif font-bold">HM</span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-foreground">
                      Welcome to Zimbabwe's News Hub
                    </h2>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tab Navigation */}
                    <TabsList className="grid w-full grid-cols-3 h-12 rounded-full bg-muted p-1">
                      <TabsTrigger 
                        value="signin" 
                        className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Sign Up
                      </TabsTrigger>
                      <TabsTrigger 
                        value="reset" 
                        className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Reset
                      </TabsTrigger>
                    </TabsList>

                    {/* Sign In Tab */}
                    <TabsContent value="signin" className="mt-8 space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSignIn} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signin-email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signin-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-14 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white text-lg font-semibold"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            'Sign In'
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup" className="mt-8 space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signup-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={generateNewUsername}
                                className="h-auto p-1 text-xs text-zw-green hover:text-zw-green/80"
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Generate
                              </Button>
                            </div>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signup-username"
                                type="text"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className={cn(
                                  "pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green",
                                  usernameError && "ring-2 ring-zw-red"
                                )}
                                required
                              />
                            </div>
                            {usernameError && (
                              <p className="text-sm text-zw-red">{usernameError}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="signup-confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={cn(
                                  "pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green",
                                  formData.password && formData.confirmPassword && 
                                  formData.password !== formData.confirmPassword && 
                                  "ring-2 ring-zw-red"
                                )}
                                required
                              />
                            </div>
                            {formData.password && formData.confirmPassword && 
                             formData.password !== formData.confirmPassword && (
                              <p className="text-sm text-zw-red">Passwords do not match</p>
                            )}
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-14 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white text-lg font-semibold"
                          disabled={isSubmitting || loading || 
                                   formData.password !== formData.confirmPassword ||
                                   !formData.username ||
                                   usernameError}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            'Create Account'
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Reset Password Tab */}
                    <TabsContent value="reset" className="mt-8 space-y-6">
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {usernameError && (
                        <Alert variant="destructive" className="rounded-2xl">
                          <AlertDescription>{usernameError}</AlertDescription>
                        </Alert>
                      )}

                      {isSettingNewPassword ? (
                        <div className="space-y-6">
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-serif font-bold">Set New Password</h3>
                            <p className="text-muted-foreground text-sm">
                              Enter your new password below
                            </p>
                          </div>

                          <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Password must be at least 6 characters long
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="confirm-new-password" className="text-sm font-medium">Confirm New Password</Label>
                                <div className="relative">
                                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    id="confirm-new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className="pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-14 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white text-lg font-semibold"
                              disabled={isSubmitting || loading || !formData.password || !formData.confirmPassword}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Updating Password...
                                </>
                              ) : (
                                'Update Password'
                              )}
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-serif font-bold">Reset Your Password</h3>
                            <p className="text-muted-foreground text-sm">
                              Enter your email and we'll send you a link to reset your password
                            </p>
                          </div>

                          <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="Enter your email address"
                                  value={formData.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  className={cn(
                                    "pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green",
                                    usernameError && "ring-2 ring-zw-red"
                                  )}
                                  required
                                />
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-14 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white text-lg font-semibold"
                              disabled={isSubmitting || loading || !formData.email}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Sending Reset Link...
                                </>
                              ) : (
                                'Send Reset Link'
                              )}
                            </Button>
                          </form>
                          
                          <div className="text-center">
                            <Button 
                              variant="ghost" 
                              onClick={() => setActiveTab('signin')}
                              className="text-sm text-muted-foreground hover:text-foreground"
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