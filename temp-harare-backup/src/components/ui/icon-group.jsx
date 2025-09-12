//src/components/ui/icon-group.jsx
import * as React from "react"
import { cn } from "@/lib/utils"

const IconGroup = React.forwardRef(({ 
  className, 
  orientation = "horizontal", 
  variant = "default",
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base styling with glassmorphism container
      "flex items-center transition-colors",
      // Orientation with tighter spacing
      orientation === "vertical" && "flex-col gap-1",
      orientation === "horizontal" && "flex-row gap-1",
      // Variant styling
      variant === "default" && "",
      variant === "contained" && cn(
        "p-1 rounded-full backdrop-blur-sm border",
        "bg-black/5 border-black/15 dark:bg-white/5 dark:border-white/15"
      ),
      variant === "separated" && "gap-2",
      variant === "compact" && "gap-0",
      className
    )}
    {...props}
  />
))
IconGroup.displayName = "IconGroup"

// Utility component for common icon group patterns
const IconGroupToolbar = React.forwardRef(({ className, ...props }, ref) => (
  <IconGroup
    ref={ref}
    variant="contained"
    className={cn("bg-black/10 dark:bg-white/10", className)}
    {...props}
  />
))
IconGroupToolbar.displayName = "IconGroupToolbar"

// Floating action button group
const IconGroupFAB = React.forwardRef(({ className, ...props }, ref) => (
  <IconGroup
    ref={ref}
    orientation="vertical"
    variant="contained"
    className={cn(
      "fixed bottom-2 right-2 z-50 shadow-lg",
      "bg-white/90 dark:bg-black/90 backdrop-blur-md",
      "border-white/50 dark:border-black/50",
      className
    )}
    {...props}
  />
))
IconGroupFAB.displayName = "IconGroupFAB"

export { IconGroup, IconGroupToolbar, IconGroupFAB }