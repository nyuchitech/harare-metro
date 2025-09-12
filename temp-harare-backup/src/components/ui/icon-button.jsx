//src/components/ui/icon-button.jsx
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const IconButton = React.forwardRef(({ 
  children, 
  className, 
  variant = "icon", // Use the new icon variant by default
  size = "icon",
  tooltip,
  ...props 
}, ref) => {
  const button = (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        // Remove the scale effect as it conflicts with our no-transform rule
        "transition-colors", 
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )

  if (tooltip) {
    return (
      <div className="group relative">
        {button}
        <div className={cn(
          // Glassmorphism tooltip styling
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          "px-3 py-1.5 text-xs font-medium rounded-full",
          "bg-black/80 text-white backdrop-blur-sm border border-white/20",
          "dark:bg-white/90 dark:text-black dark:border-black/20",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none whitespace-nowrap z-50",
          // Add small arrow pointer
          "before:content-[''] before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2",
          "before:border-4 before:border-transparent before:border-t-black/80",
          "dark:before:border-t-white/90"
        )}>
          {tooltip}
        </div>
      </div>
    )
  }

  return button
})
IconButton.displayName = "IconButton"

export { IconButton }