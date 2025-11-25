/**
 * NewsBytesLimitModal - Free view limit modal for anonymous users
 * Shown after 5 free NewsBytes views to encourage signup
 */

import { X, Zap, TrendingUp, Bookmark } from "lucide-react";

export function NewsBytesLimitModal({ isOpen, onClose, viewCount, limit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Material Design inspired with bottom sheet on mobile */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] text-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--zw-green))] to-[hsl(var(--zw-yellow))] flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-serif text-2xl font-bold">
              You've Reached Your Free Limit
            </h3>
            <p className="text-white/70 font-sans">
              You've viewed {viewCount} of {limit} free NewsBytes. Sign up to unlock unlimited stories and premium features.
            </p>
          </div>

          {/* Features - Material Design card style */}
          <div className="space-y-3">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--zw-green))]/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[hsl(var(--zw-green))]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Unlimited NewsBytes</h4>
                  <p className="text-white/70 text-xs">
                    Swipe through visual stories all day, every day
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--zw-yellow))]/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-[hsl(var(--zw-yellow))]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Your Personalized Feed</h4>
                  <p className="text-white/70 text-xs">
                    AI-curated news based on your interests and reading habits
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--zw-red))]/20 flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-5 h-5 text-[hsl(var(--zw-red))]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Save & Engage</h4>
                  <p className="text-white/70 text-xs">
                    Bookmark articles, comment, and join the conversation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Material Design elevated buttons */}
          <div className="space-y-3">
            <a
              href="/auth/register"
              className="block w-full px-6 py-4 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white text-center font-semibold rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              Create Free Account
            </a>
            <a
              href="/auth/login"
              className="block w-full px-6 py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-center font-semibold rounded-full transition-all"
            >
              Sign In
            </a>
            <button
              onClick={onClose}
              className="block w-full text-white/70 hover:text-white transition-colors py-2 font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
