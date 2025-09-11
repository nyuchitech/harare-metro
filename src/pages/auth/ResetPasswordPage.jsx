// src/pages/auth/ResetPasswordPage.jsx - Password reset page
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useHead } from '../../hooks/useHead'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const ResetPasswordPage = ({ currentColors }) => {
  const { resetPassword, error } = useAuth()
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)
  const [resetError, setResetError] = React.useState('')

  // SEO
  useHead({
    title: "Reset Password - Harare Metro | Recover Your Account",
    description: "Reset your password to regain access to your Harare Metro account",
    keywords: "reset password, forgot password, recover account, Harare Metro"
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setResetError('Please enter your email address')
      return
    }
    
    setIsSubmitting(true)
    setResetError('')
    
    try {
      const { error } = await resetPassword(email)
      if (!error) {
        setEmailSent(true)
      } else {
        setResetError(error.message || 'Failed to send reset link')
      }
    } catch (err) {
      setResetError('Failed to send reset link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/50">
            <Link
              to="/signin"
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <h1 className="text-lg font-serif font-bold">Check Email</h1>
            
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="min-h-full flex items-center justify-center">
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
                    <p className="font-semibold text-foreground">{email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Link to="/signin">
                    <Button className="w-full h-12 rounded-full bg-zw-green hover:bg-zw-green/90 text-white">
                      Back to Sign In
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setEmailSent(false)}
                    className="w-full h-12 rounded-full"
                  >
                    Resend Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/50">
          <Link
            to="/signin"
            className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <h1 className="text-lg font-serif font-bold">Reset Password</h1>
          
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
                Reset Your Password
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            {/* Error Alert */}
            {(error || resetError) && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error || resetError}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-zw-green"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-zw-green hover:bg-zw-green/90 text-white text-lg font-semibold"
                disabled={isSubmitting || !email}
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

              {/* Links */}
              <div className="text-center">
                <Link
                  to="/signin"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage