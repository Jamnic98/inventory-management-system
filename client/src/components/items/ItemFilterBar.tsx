import { useState, useMemo } from 'react'
import {
  AlarmPlus,
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Timer,
} from 'lucide-react'

import Select, { type SelectOption } from '../Select'
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

  // Check if ANY filter (including search) is currently active
  const hasActiveFilters = activeFilterCount > 0 || Boolean(filters.search?.trim())

  // Location Options for CustomSelect
  const locationOptions: SelectOption<number | string>[] = useMemo(() => {
    return [
      { value: '', label: 'All Locations' },
      ...locations.map((loc) => ({
        value: loc.id,
        label: loc.label,
        badge: loc.userId ? '🔒' : undefined,
      })),
    ]
  }, [locations])

  const ownershipOptions: SelectOption[] = [
    { value: 'all', label: 'All Ownership' },
    { value: 'personal', label: 'Personal Items' },
    { value: 'shared', label: 'Shared Items' },
  ]

  const sortOptions: SelectOption[] = [
    { value: 'expirationDate', label: 'Expiration' },
    { value: 'label', label: 'Label' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'createdAt', label: 'Date Added' },
  ]

  return (
    <div className="flex flex-col gap-2 p-2.5 border border-gray-200 rounded-lg bg-white text-sm shadow-sm">
      {/* Search Bar + Advanced Filters Toggle Button */}
      <div className="flex items-center gap-2 w-full min-w-0">
        <input
          type="text"
          placeholder="Search items by label..."
          className="flex-1 min-w-0 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        {/* Filter Toggle Button showing TOTAL active filter count */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-md transition-colors h-9.5 cursor-pointer ${
            isExpanded || activeFilterCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-xs font-bold text-white bg-blue-600 rounded-full">
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
        <div className="space-y-3 pt-1">
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 py-0.5 flex-wrap">
            {/* Low Stock Toggle */}
            <button
              type="button"
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
            {/* FILTER DROPDOWNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2 flex-1 min-w-0">
              {/* Location Select */}
              <div className="w-full md:w-44 min-w-0">
                <Select
                  options={locationOptions}
                  value={filters.locationId ?? ''}
                  onChange={(val) => updateFilter('locationId', val ? Number(val) : null)}
                  placeholder="All Locations"
                />
              </div>

              {/* Ownership Select */}
              <div className="w-full md:w-40 min-w-0">
                <Select
                  options={ownershipOptions}
                  value={filters.ownership || 'all'}
                  onChange={(val) =>
                    updateFilter('ownership', (val || 'all') as 'all' | 'personal' | 'shared')
                  }
                  placeholder="All Ownership"
                />
              </div>
            </div>

            {/* SORT CONTROLS */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-md border border-gray-200 shrink-0 w-full sm:w-auto">
              <span className="text-xs font-medium text-gray-500 pl-1.5 shrink-0">Sort:</span>

              <div className="w-32 min-w-0">
                <Select
                  options={sortOptions}
                  value={filters.sortBy || 'expirationDate'}
                  onChange={(val) => updateFilter('sortBy', val as ItemFilters['sortBy'])}
                  placeholder="Sort by"
                />
              </div>

              <button
                type="button"
                title="Toggle sort direction"
                className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer shrink-0"
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
                disabled={!hasActiveFilters}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all ml-auto sm:ml-0 cursor-pointer ${
                  hasActiveFilters
                    ? 'text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 shadow-xs'
                    : 'text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
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
