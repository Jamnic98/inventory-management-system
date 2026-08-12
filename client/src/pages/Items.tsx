import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { ItemFormModal, ItemFilterBar, ItemsTable } from '../components'
import { getItems, updateItemQuantity, getLocations } from '../api'
import { useAuth } from '../hooks/useAuth'
import type { Location, Item, ItemFilters } from '../types'

const DEFAULT_FILTERS: ItemFilters = {
  search: '',
  locationId: null,
  stockStatus: 'all',
  expiryStatus: 'all',
  sortBy: 'label',
  sortOrder: 'asc',
}

// Helper to get effective expiration date for dynamic filtering
const getEffectiveExpiration = (item: Item): Date | null => {
  let openExpiry: Date | null = null
  if (item.openedOn && item.useWithinDays) {
    openExpiry = new Date(item.openedOn)
    openExpiry.setDate(openExpiry.getDate() + item.useWithinDays)
  }

  const hardExpiry = item.expirationDate ? new Date(item.expirationDate) : null

  if (openExpiry && hardExpiry) {
    return openExpiry < hardExpiry ? openExpiry : hardExpiry
  }
  return openExpiry || hardExpiry
}

export default function Items() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)

  const { user } = useAuth()
  const currentUserId = user?.id

  // Modal & Selected Item States
  // TODO: include
  // const [/* selectedItem, */ setSelectedItem] = useState<Item | null>(null)
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [fetchedItems, fetchedLocations] = await Promise.all([
          getItems(),
          getLocations ? getLocations() : Promise.resolve([]),
        ])
        setItems(fetchedItems)
        setLocations(fetchedLocations)
      } catch (error) {
        console.error('Failed to load items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Map locations by ID for quick table lookup e.g. { 1: "Pantry" }
  const locationsMap = useMemo(() => {
    return locations.reduce<Record<number, string>>((acc, loc) => {
      if (loc.id !== undefined) {
        acc[loc.id] = loc.label
      }
      return acc
    }, {})
  }, [locations])

  // Filter & Sort Items in memory
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items
      .filter((item) => {
        // Text Search filter (Label)
        if (filters.search && !item.label?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false
        }

        // Location filter
        if (filters.locationId !== null && item.locationId !== filters.locationId) {
          return false
        }

        // Low Stock filter
        if (filters.stockStatus === 'low_stock') {
          const isLow =
            item.quantity != null &&
            item.lowStockThreshold != null &&
            item.quantity <= item.lowStockThreshold

          if (!isLow) return false
        }

        // Expiry filter
        if (filters.expiryStatus !== 'all') {
          const effExpiry = getEffectiveExpiration(item)
          if (!effExpiry) return false

          const now = new Date()
          const diffDays = Math.ceil((effExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (filters.expiryStatus === 'expired' && diffDays >= 0) return false
          if (filters.expiryStatus === 'expiring_soon' && (diffDays < 0 || diffDays > 7)) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // Sorting logic
        const order = filters.sortOrder === 'asc' ? 1 : -1

        if (filters.sortBy === 'label') {
          return (a.label || '').localeCompare(b.label || '') * order
        }

        if (filters.sortBy === 'quantity') {
          return ((a.quantity || 0) - (b.quantity || 0)) * order
        }

        if (filters.sortBy === 'expirationDate') {
          const dateA = getEffectiveExpiration(a)?.getTime() || Infinity
          const dateB = getEffectiveExpiration(b)?.getTime() || Infinity
          return (dateA - dateB) * order
        }

        if (filters.sortBy === 'createdAt') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return (dateA - dateB) * order
        }

        return 0
      })
  }, [items, filters])

  // Optimistic quantity update handler
  const handleUpdateQuantity = async (id: number, newQuantity: number) => {
    // Instantly update UI (Optimistic Update)
    setItems((prev) =>
      prev ? prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)) : null
    )

    // Persist to API backend
    try {
      if (updateItemQuantity) {
        await updateItemQuantity(id, newQuantity)
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
      // Revert/refetch if server sync fails
      const freshItems = await getItems()
      setItems(freshItems)
    }
  }

  // Handle selecting an item for details modal/drawer
  const handleSelectItem = (/* item: Item */) => {
    // setSelectedItem(item)
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading inventory...</div>
  }

  return (
    <div className="space-y-4">
      {/* PRIMARY PAGE HEADER WITH ADD BUTTON */}
      <div className="flex justify-between items-center pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold">Items</h1>
          <p className="text-xs text-gray-500">
            {filteredItems.length} of {items?.length || 0} total items
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm transition-colors flex items-center gap-1"
        >
          <span>
            <Plus />
          </span>
          <span className="hidden sm:inline">Add Item</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <ItemFilterBar
        filters={filters}
        locations={locations}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* ITEMS TABLE */}
      {items && (
        <ItemsTable
          items={filteredItems}
          locationsMap={locationsMap}
          onUpdateQuantity={handleUpdateQuantity}
          onSelectItem={handleSelectItem}
        />
      )}

      {/* ADD ITEM MODAL */}
      {isAddOpen && (
        <ItemFormModal
          isOpen={isAddOpen}
          locations={locations}
          initialBarcode={''}
          currentUserId={currentUserId}
          onClose={() => setIsAddOpen(false)}
          onItemAdded={(newItem: Item) => {
            setItems((prev) => (prev ? [newItem, ...prev] : [newItem]))
          }}
        />
      )}
    </div>
  )
}
