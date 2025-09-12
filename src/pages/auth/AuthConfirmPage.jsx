import { logger } from '../../utils/logger'
// src/pages/auth/AuthConfirmPage.jsx - Dynamic auth confirmation page
// 
// This page handles multiple auth confirmation scenarios:
// 1. Email confirmation for new user signup (type=signup, token=...)
// 2. Password reset confirmation (type=recovery, access_token=..., refresh_token=...)
// 3. OAuth callback handling (access_token=..., refresh_token=...)
// 4. Generic auth confirmation with session detection
//
// URL Examples:
// - /auth/confirm?type=signup&token=abc123 (new user email confirmation)
// - /auth/confirm?type=recovery&access_token=abc&refresh_token=def (password reset)
// - /auth/confirm#access_token=abc&refresh_token=def (OAuth callback)
// - /auth/callback (legacy OAuth callback - redirects here)
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const AuthConfirmPage = ({ currentColors }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Processing your request...')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        // Get URL parameters
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        const error_description = searchParams.get('error_description')
        const error = searchParams.get('error')

        // Handle errors first
        if (error || error_description) {
          setStatus('error')
          setMessage(error_description || error || 'An error occurred during authentication')
          return
        }

        // Handle different confirmation types
        if (type === 'signup' || (token && !access_token)) {
          // Email confirmation for new user signup
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            })
            
            if (error) throw error
            
            setStatus('success')
            setMessage('Email confirmed successfully! You can now sign in.')
            
            // Redirect to sign in after 3 seconds
            setTimeout(() => {
              navigate('/signin')
            }, 3000)
            
          } catch (verifyError) {
            setStatus('error')
            setMessage('Invalid or expired confirmation link. Please try signing up again.')
          }
        } 
        else if (type === 'recovery' || access_token) {
          // Password reset flow
          try {
            if (access_token && refresh_token) {
              // Set session with tokens
              const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
              })
              
              if (error) throw error
              
              setStatus('password-reset')
              setMessage('Please enter your new password')
              setShowPasswordReset(true)
              
            } else {
              throw new Error('Missing tokens for password reset')
            }
          } catch (resetError) {
            setStatus('error')
            setMessage('Invalid or expired password reset link. Please request a new one.')
          }
        }
        else {
          // Generic confirmation - try to handle session
          const hash = window.location.hash
          if (hash) {
            const { data, error } = await supabase.auth.getSession()
            
            if (data?.session) {
              setStatus('success')
              setMessage('Authentication successful!')
              setTimeout(() => {
                navigate('/feed')
              }, 2000)
            } else {
              setStatus('error')
              setMessage('Unable to confirm authentication. Please try again.')
            }
          } else {
            setStatus('error')
            setMessage('Invalid confirmation link.')
          }
        }
        
      } catch (error) {
        logger.error('Auth confirmation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthConfirmation()
  }, [searchParams, navigate])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long')
      return
    }

    setIsUpdatingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setStatus('success')
      setMessage('Password updated successfully! Redirecting to your feed...')
      setShowPasswordReset(false)
      
      setTimeout(() => {
        navigate('/feed')
      }, 2000)
      
    } catch (error) {
      logger.error('Password update error:', error)
      setMessage('Failed to update password. Please try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zw-green mx-auto mb-4"></div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'password-reset':
        return (
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.879A6 6 0 0120 9z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen ${currentColors.bg} flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${currentColors.cardBg} rounded-lg shadow-lg p-8`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl mr-2">🇿🇼</span>
            <h1 className={`text-xl font-bold ${currentColors.text}`}>
              Harare Metro
            </h1>
          </div>
        </div>

        {/* Status Icon */}
        {getStatusIcon()}

        {/* Status Message */}
        <div className="text-center mb-6">
          <p className={`text-lg ${status === 'error' ? 'text-red-600' : currentColors.text}`}>
            {message}
          </p>
        </div>

        {/* Password Reset Form */}
        {showPasswordReset && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className={`block text-sm font-medium ${currentColors.text} mb-1`}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3 py-2 border ${currentColors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-zw-green ${currentColors.bg}`}
                placeholder="Enter your new password"
                required
                minLength={6}
                disabled={isUpdatingPassword}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${currentColors.text} mb-1`}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 border ${currentColors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-zw-green ${currentColors.bg}`}
                placeholder="Confirm your new password"
                required
                minLength={6}
                disabled={isUpdatingPassword}
              />
            </div>
            
            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full bg-zw-green text-white py-2 px-4 rounded-md hover:bg-zw-green/90 focus:outline-none focus:ring-2 focus:ring-zw-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {/* Navigation Links */}
        <div className="text-center mt-6 space-y-2">
          {status === 'error' && (
            <div className="space-y-2">
              <button
                onClick={() => navigate('/signin')}
                className="text-zw-green hover:underline text-sm"
              >
                Back to Sign In
              </button>
              <br />
              <button
                onClick={() => navigate('/signup')}
                className="text-zw-green hover:underline text-sm"
              >
                Create New Account
              </button>
            </div>
          )}
          
          <button
            onClick={() => navigate('/feed')}
            className={`text-sm ${currentColors.textMuted} hover:underline`}
          >
            Continue to Harare Metro
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthConfirmPage