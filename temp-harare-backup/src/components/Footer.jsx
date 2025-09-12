// Footer Component - src/components/Footer.jsx
import React from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import Logo from './Logo'

export default function Footer({ currentColors, className = '' }) {
  return (
    <>
      {/* Full-width border */}
      <div className={`border-t ${currentColors.border} mt-12`}></div>
      
      <footer 
        className={`${currentColors.footerBg} ${className}`} 
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
            {/* Brand Section */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Logo 
                  variant="horizontal" 
                  theme={currentColors.bg === 'bg-gray-900' ? 'dark' : 'light'} 
                  size="sm" 
                />
              </div>
              <p className={`text-sm ${currentColors.textMuted} mb-4 leading-relaxed`}>
                Zimbabwe&apos;s premier news aggregator, bringing you real-time updates from over 17 trusted local sources.
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <HeartIcon className="h-4 w-4 text-red-400" />
                <span className={`text-sm ${currentColors.textLight}`}>
                  Made with love for Zimbabwe
                </span>
              </div>
            </div>

            {/* News Sources Section */}
            <div className="text-center md:text-left">
              <h3 className={`text-sm font-semibold ${currentColors.textLight} uppercase tracking-wider mb-4`}>
                News Sources
              </h3>
              <div className={`text-sm ${currentColors.textMuted} space-y-2`}>
                <div>Herald, NewsDay, Chronicle</div>
                <div>ZBC News, The Standard</div>
                <div>NewZimbabwe, 263Chat</div>
                <div className="pt-2 text-xs">
                  + 12 more trusted sources
                </div>
              </div>
            </div>

            {/* Support & Links Section */}
            <div className="text-center md:text-left">
              <h3 className={`text-sm font-semibold ${currentColors.textLight} uppercase tracking-wider mb-4`}>
                Support Our Work
              </h3>
              <div className="space-y-3">
                <div className="flex justify-center md:justify-start">
                  <a
                    href="https://buymeacoffee.com/BRYANY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-sm transition-all hover:scale-105 shadow-md"
                  >
                    <span className="mr-2">☕</span>
                    Buy Me a Coffee
                  </a>
                </div>
                <p className={`text-xs ${currentColors.textMuted} leading-relaxed`}>
                  Help us keep improving and delivering quality news aggregation for Zimbabwe.
                </p>
              </div>
            </div>
          </div>

          {/* Divider - Full width */}
          <div className={`-mx-4 sm:-mx-6 lg:-mx-8 border-t ${currentColors.border} pt-8`}>
            <div className="px-4 sm:px-6 lg:px-8">
              {/* Bottom Section */}
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                
                {/* Copyright & Company */}
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                  <div className={`text-sm ${currentColors.textMuted}`}>
                    &copy; {new Date().getFullYear()} Harare Metro. All rights reserved.
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-sm ${currentColors.textMuted}`}>Powered by</span>
                    <a 
                      href="https://www.nyuchi.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors font-medium text-sm"
                    >
                      Nyuchi Web Services
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full opacity-75"></div>
                    <span className={`${currentColors.textMuted}`}>Live Updates</span>
                  </div>
                  <div className={`${currentColors.textMuted}`}>
                    Updated hourly
                  </div>
                </div>
              </div>

              {/* Mobile-optimized additional info */}
              <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-6 pt-4 border-t border-gray-700 md:hidden">
                <div className="px-4 sm:px-6 lg:px-8">
                  <p className={`text-xs ${currentColors.textMuted} text-center leading-relaxed`}>
                    Real-time news aggregation • Trusted sources • Zimbabwe-focused content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}