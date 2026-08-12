// src/pages/Items.tsx
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import {
  ItemFormModal,
  ItemFilterBar,
  ItemsTable,
  ItemTransferModal,
  ItemDetailsModal,
} from '../components'
import { getLocations, transferItem } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useItems, useUpdateItemQuantity } from '../hooks/useItems'
import type { Location, Item, ItemFilters } from '../types'

const DEFAULT_FILTERS: ItemFilters = {
  search: '',
  locationId: null,
  stockStatus: 'all',
  expiryStatus: 'all',
  sortBy: 'label',
  sortOrder: 'asc',
}

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
  const { user } = useAuth()
  const currentUserId = user?.id

  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)

  // Modal & Selected Item States
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [transferringItem, setTransferringItem] = useState<Item | null>(null)
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false)

  // 🚀 Fetch Items using your custom useItems hook
  const { data: items = [], isLoading: isLoadingItems } = useItems()

  // 🚀 Hook for Quantity Mutations (includes built-in optimistic UI updates)
  const updateQuantityMutation = useUpdateItemQuantity()

  // Locations Query
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  })

  const loading = isLoadingItems || isLoadingLocations

  // Map locations by ID for quick table lookup
  const locationsMap = useMemo(() => {
    return locations.reduce<Record<number, string>>((acc, loc) => {
      if (loc.id !== undefined) {
        acc[loc.id] = loc.label
      }
      return acc
    }, {})
  }, [locations])

  // Map locations into LocationOption[] format for ItemTransferModal
  const locationOptions = useMemo(() => {
    return locations
      .filter((loc): loc is Location & { id: number } => loc.id !== undefined)
      .map((loc) => ({ id: loc.id, label: loc.label }))
  }, [locations])

  // Filter & Sort Items in memory
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items
      .filter((item) => {
        if (filters.search && !item.label?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false
        }

        if (filters.locationId !== null && item.locationId !== filters.locationId) {
          return false
        }

        if (filters.stockStatus === 'low_stock') {
          const isLow =
            item.quantity != null &&
            item.lowStockThreshold != null &&
            item.quantity <= item.lowStockThreshold

          if (!isLow) return false
        }

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

  // 🚀 Trigger Optimistic Quantity Update Mutation
  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    updateQuantityMutation.mutate({ id, quantity: newQuantity })
  }

  // Handle item transfer submit
  const handleTransferSubmit = async (
    itemId: number,
    targetLocationId: number,
    transferQty: number
  ) => {
    try {
      if (transferItem) {
        await transferItem(itemId, targetLocationId, transferQty)
      }
    } catch (error) {
      console.error('Failed to transfer item:', error)
      throw error
    }
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

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
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
          onSelectItem={(item: Item) => setSelectedItem(item)}
          onTransferItem={(item: Item) => setTransferringItem(item)}
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
          onItemAdded={() => {
            setIsAddOpen(false) // Closes the modal after adding an item
          }}
        />
      )}

      {/* Details Modal opens whenever selectedItem is not null */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* ITEM TRANSFER MODAL */}
      <ItemTransferModal
        isOpen={Boolean(transferringItem)}
        item={transferringItem}
        locations={locationOptions}
        onClose={() => setTransferringItem(null)}
        onTransfer={handleTransferSubmit}
      />
    </div>
  )
}
