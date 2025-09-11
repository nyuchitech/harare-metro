// src/components/FilterControls.jsx - Enhanced version with Lucide icons
import React, { useState } from 'react'
import { LayoutGrid, List, Filter, ChevronDown, Clock, ArrowUpDown } from 'lucide-react'
import { IconGroup } from './ui/icon-group'
import { IconButton } from './ui/icon-button'

const FilterControls = ({
  selectedTimeframe,
  setSelectedTimeframe,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  className = ''
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const timeframeOptions = [
    { id: 'all', label: 'All Time', icon: '📅' },
    { id: '1h', label: 'Last Hour', icon: '⏰' },
    { id: '6h', label: 'Last 6 Hours', icon: '🕕' },
    { id: '24h', label: 'Last 24 Hours', icon: '📆' },
    { id: '7d', label: 'Last 7 Days', icon: '📅' }
  ]

  const sortOptions = [
    { id: 'newest', label: 'Newest First', icon: '⬇️' },
    { id: 'oldest', label: 'Oldest First', icon: '⬆️' },
    { id: 'source', label: 'By Source', icon: '📰' },
    { id: 'category', label: 'By Category', icon: '📂' }
  ]

  // Check if filters are active (not default)
  const hasActiveFilters = selectedTimeframe !== 'all' || sortBy !== 'newest'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Filter Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${hasActiveFilters 
              ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-600/20' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {/* Filter Icon */}
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {hasActiveFilters && (
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {(selectedTimeframe !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0)}
            </span>
          )}
          {/* Chevron */}
          <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsFilterOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-72 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-4">
                
                {/* Timeframe Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-700 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Timeframe
                    </span>
                  </div>
                  <div className="space-y-1">
                    {timeframeOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedTimeframe(option.id)
                          setIsFilterOpen(false)
                        }}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 text-sm
                          ${selectedTimeframe === option.id 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {selectedTimeframe === option.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Section */}
                <div>
                  <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-700 mb-3">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Sort By
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id)
                          setIsFilterOpen(false)
                        }}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 text-sm
                          ${sortBy === option.id 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {sortBy === option.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Mode Toggle */}
      <IconGroup variant="contained" className="p-1">
        <IconButton
          variant="icon"
          size="icon"
          onClick={() => setViewMode?.('grid')}
          className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
          tooltip="Grid View"
        >
          <LayoutGrid className="w-4 h-4" />
        </IconButton>
        
        <IconButton
          variant="icon"
          size="icon"
          onClick={() => setViewMode?.('list')}
          className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
          tooltip="List View"
        >
          <List className="w-4 h-4" />
        </IconButton>
      </IconGroup>
    </div>
  )
}

export default FilterControls