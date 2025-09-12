// Icon utility patterns matching the original migration design
import React from 'react'
import { IconButton } from './icon-button'
import { IconGroup } from './icon-group'
import { cn } from '@/lib/utils'

// Simple action button pattern
export const ActionIconButton = ({ icon: Icon, tooltip, className, ...props }) => (
  <IconButton 
    tooltip={tooltip}
    className={cn("btn-icon", className)}
    {...props}
  >
    <Icon className="h-4 w-4" />
  </IconButton>
)

// Theme toggle group pattern (common in the app)
export const ThemeToggleButtons = ({ theme, onThemeChange, className }) => {
  const { SunIcon, MoonIcon, ComputerDesktopIcon } = require('@heroicons/react/24/outline')
  
  return (
    <IconGroup className={cn("bg-card border rounded-lg p-0.5", className)}>
      <IconButton 
        variant={theme === 'light' ? "secondary" : "ghost"} 
        size="sm"
        tooltip="Light mode"
        onClick={() => onThemeChange('light')}
        className="btn-icon"
      >
        <SunIcon className="h-3 w-3" />
      </IconButton>
      
      <IconButton 
        variant={theme === 'dark' ? "secondary" : "ghost"} 
        size="sm"
        tooltip="Dark mode"
        onClick={() => onThemeChange('dark')}
        className="btn-icon"
      >
        <MoonIcon className="h-3 w-3" />
      </IconButton>
      
      <IconButton 
        variant={theme === 'system' ? "secondary" : "ghost"} 
        size="sm"
        tooltip="System theme"
        onClick={() => onThemeChange('system')}
        className="btn-icon"
      >
        <ComputerDesktopIcon className="h-3 w-3" />
      </IconButton>
    </IconGroup>
  )
}

// View toggle pattern (from the original app)
export const ViewToggleButtons = ({ currentView, setCurrentView, className }) => {
  const { Squares2X2Icon, VideoCameraIcon } = require('@heroicons/react/24/outline')
  
  return (
    <IconGroup className={cn("bg-card border rounded-lg p-0.5", className)}>
      <IconButton
        variant={currentView === 'grid' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setCurrentView('grid')}
        className="p-1.5 h-auto"
        tooltip="Grid view"
      >
        <Squares2X2Icon className="h-3 w-3" />
      </IconButton>
      
      <IconButton
        variant={currentView === 'bytes' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setCurrentView('bytes')}
        className="btn-icon"
        tooltip="Bytes view"
      >
        <VideoCameraIcon className="h-3 w-3" />
      </IconButton>
    </IconGroup>
  )
}
