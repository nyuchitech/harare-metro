import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'reset';
}

export const AuthModal<AuthModalProps> = ({ isOpen, onClose, initialTab = 'signin' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { signIn, signUp, signInWithOAuth, resetPassword, isConfigured } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (activeTab === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else {
          setMessage({ type: 'success', text: 'Sign in successful!' });
          setTimeout(onClose, 1000);
        }
      } else if (activeTab === 'signup') {
        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, {
          display_name: displayName,
          full_name: displayName
        });
        
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Check your email for the confirmation link!' 
          });
        }
      } else if (activeTab === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Password reset email sent! Check your inbox.' 
          });
        }
      }
    } catch () {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
    // OAuth redirect will happen, so we don't set loading to false
  };

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-center mb-4 font-serif text-white">
            Authentication Unavailable
          </h2>
          <p className="text-gray-400 text-center mb-6">
            Supabase is not configured. Please check your environment variables.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 font-serif text-white">
            {activeTab === 'signin' ? 'Welcome Back' : 
             activeTab === 'signup' ? 'Join Harare Metro' : 
             'Reset Password'}
          </h2>
          <p className="text-gray-400">
            {activeTab === 'signin' ? 'Sign in to your account' : 
             activeTab === 'signup' ? 'Create your account' : 
             'Enter your email to reset your password'}
          </p>
        </div>

        {/* Tabs */}
        {activeTab !== 'reset' && (
          <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'signin'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* OAuth Buttons */}
        {activeTab !== 'reset' && (
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>

            <div className="text-center text-gray-400 text-sm">
              or
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name (Sign Up only) */}
          {activeTab === 'signup' && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password (not for reset) */}
          {activeTab !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Password"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Confirm Password (Sign Up only) */}
          {activeTab === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm password"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'error' 
                ? 'bg-red-900/50 border border-red-600 text-red-300' 
                : 'bg-green-900/50 border border-green-600 text-green-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {activeTab === 'signin' ? 'Sign In' : 
             activeTab === 'signup' ? 'Create Account' : 
             'Send Reset Link'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          {activeTab === 'signin' && (
            <button
              onClick={() => setActiveTab('reset')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Forgot your password?
            </button>
          )}
          
          {activeTab === 'reset' && (
            <button
              onClick={() => setActiveTab('signin')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;