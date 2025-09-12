import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - no transforms, consistent transitions
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
  {
    variants: {
      variant: {
        // Default glassmorphism button - uses CSS classes
        default: "",
        
        // Primary action button - uses CSS variables
        primary:
          "monochrome-primary rounded-full backdrop-blur-sm border",
        
        // Secondary action button - uses CSS variables
        secondary:
          "monochrome-secondary rounded-full backdrop-blur-sm border border-border hover:bg-accent hover:text-accent-foreground active:bg-muted active:text-muted-foreground",
        
        // Category filter button - uses CSS classes
        category: "category-button",
        
        // Icon-only button - uses CSS classes
        icon: "btn-icon",
        
        // Destructive action - uses CSS variables
        destructive:
          "rounded-full backdrop-blur-sm bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 active:bg-destructive/80",
        
        // Outline variant - uses CSS variables
        outline:
          "rounded-full backdrop-blur-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-muted active:text-muted-foreground",
        
        // Ghost variant - uses CSS variables
        ghost: 
          "rounded-full hover:bg-accent hover:text-accent-foreground active:bg-muted",
        
        // Link variant
        link: 
          "text-primary underline-offset-2 bg-transparent border-none hover:bg-transparent hover:text-primary-foreground active:bg-transparent active:text-primary-foreground focus-visible:ring-0",
      },
      size: {
        default: "h-10 px-4 py-3",
        sm: "h-6 px-3 py-1.5 text-xs",
        lg: "h-12 px-8 py-3",
        icon: "h-auto w-auto p-2",
        category: "h-10 px-4 py-2 gap-1",
        link: "h-auto w-auto p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false, 
  active = false,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  
  // Handle active state for category buttons
  const activeClasses = active && variant === "category" 
    ? "active" 
    : ""
  
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }), 
        activeClasses,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }