// PWA Prompt - TEMPORARILY DISABLED

/*
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const PWAPrompt = ({ onInstall, currentColors }) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleInstall = async () => {
    const success = await onInstall()
    if (success) {
      setIsVisible(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ArrowDownTrayIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-md">Install Harare Metro</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="btn-icon"
              aria-label="Close"
              data-slot="close-button"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Install our app for faster access and offline reading.
          </p>
          
          <div className="flex space-x-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              Install
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PWAPrompt
*/

// Simple disabled component
export default function PWAPrompt() {
  return null
}
