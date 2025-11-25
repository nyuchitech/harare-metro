// app/components/Logo.tsx
import React, { useEffect, useState } from 'react'

interface LogoProps {
  variant?: 'main' | 'horizontal' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'main',
  size = 'md',
  className = ''
}) => {
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    // Initial check
    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

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

  // SVG file paths with theme-aware colors
  const svgPaths = {
    main: `/hm-logo-main.svg`,
    horizontal: `/hm-logo-horizontal.svg`,
    compact: `/hm-logo-compact.svg`
  }

  return (
    <img 
      src={svgPaths[variant]}
      alt="Harare Metro Logo"
      width={width}
      height={height}
      className={`logo-${variant} ${isDark ? 'brightness-0 invert' : ''} ${className}`}
      style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
    />
  )
}

export default Logo