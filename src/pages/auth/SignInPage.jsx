// src/pages/auth/SignInPage.jsx - Sign in page
import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useHead } from '../../hooks/useHead'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

const SignInPage = ({ currentColors }) => {
  const { signIn, error, loading, user, isAuthenticated } = useAuth()
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return <Navigate to="/feed" replace />
  }

  // SEO
  useHead({
    title: "Sign In - Harare Metro | Zimbabwe News",
    description: "Sign in to access your personalized news experience",
    keywords: "sign in, login, Zimbabwe news, Harare Metro"
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await signIn(formData.email, formData.password)
      // Navigation will be handled by redirect above
    } catch (err) {
      console.error('Sign in error:', err)
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
          
          <h1 className="text-lg font-serif font-bold">Sign In</h1>
          
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
                Welcome Back
              </h2>
              <p className="text-muted-foreground text-sm">
                Sign in to continue reading Zimbabwe's latest news
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
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

              {/* Links */}
              <div className="text-center space-y-4">
                <Link
                  to="/reset-password"
                  className="text-sm text-zw-green hover:text-zw-green/80"
                >
                  Forgot your password?
                </Link>
                
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-zw-green hover:text-zw-green/80 font-medium"
                  >
                    Sign up
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

export default SignInPage