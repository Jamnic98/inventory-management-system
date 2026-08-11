import { useState } from 'react'
import {
  AlarmPlus,
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Timer,
} from 'lucide-react'

import type { ItemFilters, Location } from '../../types'

interface ItemFilterBarProps {
  filters: ItemFilters
  locations: Location[]
  onChange: (filters: ItemFilters) => void
  onReset?: () => void
}

export default function ItemFilterBar({
  filters,
  locations,
  onChange,
  onReset,
}: ItemFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = <K extends keyof ItemFilters>(key: K, value: ItemFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const activeFilterCount = [
    // Quick Filter Pills
    filters.stockStatus !== 'all',
    filters.expiryStatus !== 'all',
    filters.archivedStatus && filters.archivedStatus !== 'active',

    // Advanced Dropdowns
    filters.locationId !== null,
    filters.ownership && filters.ownership !== 'all',
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2 p-2.5 border rounded-lg bg-white text-sm shadow-sm">
      {/* Search Bar + Advanced Filters Toggle Button */}
      <div className="flex items-center gap-2 w-full min-w-0">
        <input
          type="text"
          placeholder="Search items by name..."
          className="flex-1 min-w-0 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        {/* Filter Toggle Button showing TOTAL active filter count */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-md transition-colors h-9.5 ${
            isExpanded || activeFilterCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Advanced Filter & Sort Controls (Dropdown Panel) */}
      {isExpanded && (
        <div>
          {' '}
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 py-0.5 flex-wrap">
            {/* Low Stock Toggle */}
            <button
              type="button"
              className={` px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filters.stockStatus === 'low_stock'
                  ? 'bg-amber-500 text-white border-amber-600 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() =>
                updateFilter(
                  'stockStatus',
                  filters.stockStatus === 'low_stock' ? 'all' : 'low_stock'
                )
              }
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock</span>
              </div>
            </button>

            {/* Expiring Soon Toggle */}
            <button
              type="button"
              className={` px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filters.expiryStatus === 'expiring_soon'
                  ? 'bg-amber-500 text-white border-amber-600 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() =>
                updateFilter(
                  'expiryStatus',
                  filters.expiryStatus === 'expiring_soon' ? 'all' : 'expiring_soon'
                )
              }
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Timer className="w-3.5 h-3.5" />
                <span>Expiring Soon</span>
              </div>
            </button>

            {/* Expired Toggle */}
            <button
              type="button"
              className={` px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filters.expiryStatus === 'expired'
                  ? 'bg-red-600 text-white border-red-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() =>
                updateFilter('expiryStatus', filters.expiryStatus === 'expired' ? 'all' : 'expired')
              }
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <AlarmPlus className="w-3.5 h-3.5" />
                <span>Expired</span>
              </div>
            </button>

            {/* Archived Filter Pill */}
            <button
              type="button"
              className={` px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filters.archivedStatus === 'archived'
                  ? 'bg-purple-600 text-white border-purple-700 font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() =>
                updateFilter(
                  'archivedStatus',
                  filters.archivedStatus === 'archived' ? 'active' : 'archived'
                )
              }
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Archive className="w-3.5 h-3.5" />
                <span>Archived</span>
              </div>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t mt-1">
            {/* FILTER DROPDOWNS (Clean White) */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-70">
              {/* Location */}
              <select
                className="p-1.5 border rounded-md bg-white text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.locationId ?? ''}
                onChange={(e) =>
                  updateFilter('locationId', e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>

              {/* Ownership */}
              <select
                className="p-1.5 border rounded-md bg-white text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.ownership || 'all'}
                onChange={(e) =>
                  updateFilter('ownership', e.target.value as 'all' | 'personal' | 'shared')
                }
              >
                <option value="all">All Ownership</option>
                <option value="personal">Personal Items</option>
                <option value="shared">Shared Items</option>
              </select>
            </div>

            {/* SORT CONTROLS (Grouped in a subtle grey pill) */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-md border border-gray-200/60 shrink-0">
              <span className="text-[11px] font-medium text-gray-500 pl-1.5">Sort:</span>

              <select
                className="p-1 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none"
                value={filters.sortBy || 'expirationDate'}
                onChange={(e) => updateFilter('sortBy', e.target.value as ItemFilters['sortBy'])}
              >
                <option value="expirationDate">Expiration</option>
                <option value="label">Name</option>
                <option value="quantity">Quantity</option>
                <option value="createdAt">Date Added</option>
              </select>

              <button
                type="button"
                title="Toggle sort direction"
                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() =>
                  updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {filters.sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
              </button>
            </div>

            {/* RESET ACTION */}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-auto sm:ml-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
