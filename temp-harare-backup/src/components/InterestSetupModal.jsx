/* eslint-env browser */
/* global setTimeout */
import { logger } from '../utils/logger'
// src/components/InterestSetupModal.jsx - Modal for setting up user interests
import React, { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import InterestSelector from './InterestSelector'
import useUserInterests from '../hooks/useUserInterests'

const InterestSetupModal = ({ isOpen, onClose, isFirstTime = false }) => {
  const { interests, saveInterests, saving } = useUserInterests()
  const [selectedInterests, setSelectedInterests] = useState(interests)
  const [step, setStep] = useState('select') // 'select' | 'success'

  const handleInterestsChange = (newInterests) => {
    setSelectedInterests(newInterests)
  }

  const handleSave = async () => {
    try {
      await saveInterests(selectedInterests)
      setStep('success')
      
      // Auto-close after showing success message
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      logger.error('Failed to save interests:', error)
      // Handle error - could show toast notification
    }
  }

  const handleSkip = () => {
    if (isFirstTime) {
      // Save empty interests for first-time users so they don't see this again
      saveInterests([]).catch(logger.error)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isFirstTime ? 'Welcome to Harare Metro!' : 'Update Your Interests'}
            </h2>
            <p className="text-gray-400 mt-1">
              {isFirstTime 
                ? 'Let\'s personalize your news feed' 
                : 'Modify your content preferences'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'select' && (
            <div className="p-6">
              <InterestSelector
                initialInterests={selectedInterests}
                onInterestsChange={handleInterestsChange}
                showHeader={false}
                maxInterests={5}
              />
            </div>
          )}

          {step === 'success' && (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-zw-green mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Interests Saved!
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Your feed will now prioritize content from your selected categories. 
                You can update your interests anytime in your profile settings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'select' && (
          <div className="p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedInterests.length > 0 ? (
                  <span className="text-zw-green">
                    {selectedInterests.length}/5 interests selected
                  </span>
                ) : (
                  <span>Select at least one interest to continue</span>
                )}
              </div>
              
              <div className="flex gap-3">
                {isFirstTime && (
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={selectedInterests.length === 0 || saving}
                  className={cn(
                    "px-8 py-3 rounded-lg font-medium transition-colors",
                    selectedInterests.length > 0 && !saving
                      ? "bg-zw-green text-white hover:bg-zw-green/90"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {saving ? 'Saving...' : 'Save Interests'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InterestSetupModal