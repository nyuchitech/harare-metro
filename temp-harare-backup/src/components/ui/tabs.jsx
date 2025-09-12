import React, { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

const TabsContext = createContext({})

const Tabs = ({ value, onValueChange, className, children, ...props }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, className, children, ...props }) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, className, children, ...props }) => {
  const { value: selectedValue } = useContext(TabsContext)
  const isSelected = selectedValue === value

  if (!isSelected) return null

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
