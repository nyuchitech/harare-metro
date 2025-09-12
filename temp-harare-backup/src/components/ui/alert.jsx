// src/components/ui/alert.jsx
import React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
      variant === "default" && "bg-background text-foreground",
      variant === "destructive" && "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }