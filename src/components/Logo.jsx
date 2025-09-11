// src/components/Logo.jsx
import React from 'react'
import { cn } from '@/lib/utils'

const Logo = ({ 
  variant = 'main', // 'main', 'horizontal', 'compact'
  theme = 'light',   // 'light', 'dark'
  size = 'md',       // 'sm', 'md', 'lg'
  className = ''
}) => {
  const sizes = {
    sm: {
      main: { width: 120, height: 36 },
      horizontal: { width: 180, height: 30 },
      compact: { width: 48, height: 24 }
    },
    md: {
      main: { width: 200, height: 60 },
      horizontal: { width: 300, height: 50 },
      compact: { width: 80, height: 40 }
    },
    lg: {
      main: { width: 280, height: 84 },
      horizontal: { width: 420, height: 70 },
      compact: { width: 112, height: 56 }
    }
  }

  const { width, height } = sizes[size][variant]

  // SVG file paths
  const svgPaths = {
    main: '/hm-logo-main.svg',
    horizontal: '/hm-logo-horizontal.svg',
    compact: '/hm-logo-compact.svg'
  }

  // For dark theme, we'll apply CSS filter to invert colors
  const filterStyle = theme === 'dark' ? {
    filter: 'invert(1) brightness(1)',
  } : {}

  return (
    <img 
      src={svgPaths[variant]}
      alt="Harare Metro Logo"
      width={width}
      height={height}
      style={filterStyle}
      className={cn(`logo-${variant}`, className)}
    />
  )
}

export default Logo