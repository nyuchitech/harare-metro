"use client"

import React from "react"
import { cn } from "@/lib/utils"

const Dialog = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
    {...props}
  >
    {children}
  </div>
))
Dialog.displayName = "Dialog"

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-4", className)}
    {...props}
  >
    {children}
  </div>
))
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}
    {...props}
  >
    {children}
  </h2>
))
DialogTitle.displayName = "DialogTitle"

export { Dialog, DialogContent, DialogHeader, DialogTitle }
