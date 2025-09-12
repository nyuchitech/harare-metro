import { logger } from '../../utils/logger'
// src/pages/auth/SignUpPage.jsx - Sign up page
import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useHead } from '../../hooks/useHead'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, User, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { generateRandomUsername, isValidUsername, formatUsernameFromName } from '../../utils/usernameGenerator'

const SignUpPage = ({ currentColors }) => {
  const { signUp, error, loading, user, isAuthenticated } = useAuth()
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [usernameError, setUsernameError] = React.useState('')

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return <Navigate to="/feed" replace />
  }

  // Generate default username when component mounts
  React.useEffect(() => {
    if (!formData.username) {
      const defaultUsername = generateRandomUsername()
      setFormData(prev => ({ ...prev, username: defaultUsername }))
    }
  }, [formData.username])

  // SEO
  useHead({
    title: "Sign Up - Harare Metro | Join Zimbabwe's News Community",
    description: "Create your account to get personalized news from Zimbabwe",
    keywords: "sign up, register, Zimbabwe news, Harare Metro, create account"
  })

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

  const handleSubmit = async (e) => {
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
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        username: formData.username
      })
      // Navigation will be handled by redirect above
    } catch (err) {
      logger.error('Sign up error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/50">
          <Link
            to="/feed"
            className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <h1 className="text-lg font-serif font-bold">Sign Up</h1>
          
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-8">
            {/* Logo/Brand */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-zw-green via-zw-yellow to-zw-red rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-serif font-bold">HM</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground">
                Join Harare Metro
              </h2>
              <p className="text-muted-foreground text-sm">
                Create your account to get personalized Zimbabwe news
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
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
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
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
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
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
                      id="username"
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
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
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
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

              {/* Links */}
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/signin"
                    className="text-zw-green hover:text-zw-green/80 font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage