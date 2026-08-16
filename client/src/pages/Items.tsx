import { useMemo, useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import {
  ItemFormModal,
  ItemFilterBar,
  ItemsTable,
  ItemTransferModal,
  ItemDetailsModal,
} from '../components'
import { getLocations } from '../api'
import { useAuth, useBatchMutations, useItems, useUpdateItemQuantity } from '../hooks'
import type { Location, Item, ItemFilters, ItemStock } from '../types'

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
  const { updateBatchQtyMutation, openBatchUnitMutation, transferBatchMutation } =
    useBatchMutations()

  // Pagination & Filter State
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)

  // Modal & Selected Item States
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [transferringStock, setTransferringStock] = useState<{
    stock: ItemStock
    item: Item
  } | null>(null)
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false)

  // Debounced search term for API queries
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)

    return () => clearTimeout(handler)
  }, [filters.search])

  // Reset to page 1 whenever debounced search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Server-Paginated Items Query
  const {
    data,
    isLoading: isLoadingItems,
    isFetching,
  } = useItems({
    page,
    limit: pageSize,
    search: debouncedSearch,
    locationId: filters.locationId ?? undefined,
  })

  const items = data?.data || []
  const pagination = data?.pagination

  // Hook for Item-Level Quantity Mutations
  const updateQuantityMutation = useUpdateItemQuantity()
  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    updateQuantityMutation.mutate({ id, quantity: newQuantity })
  }

  // Locations Query
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  })

  // Only block the UI on INITIAL load
  const isInitialLoad = (isLoadingItems && !data) || isLoadingLocations

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

  // Client-side filtering & sorting on current page dataset
  const processedItems = useMemo(() => {
    if (!items) return []

    return items
      .filter((item) => {
        // Stock Status Filters
        if (filters.stockStatus === 'low_stock') {
          const isLow =
            item.quantity != null &&
            item.quantity > 0 &&
            item.lowStockThreshold != null &&
            item.quantity <= item.lowStockThreshold

          if (!isLow) return false
        }

        if (filters.stockStatus === 'out_of_stock') {
          const isOutOfStock = item.quantity == null || item.quantity === 0

          if (!isOutOfStock) return false
        }

        // Expiry Status Filters
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

  // Handlers
  const handleFilterChange = (newFilters: ItemFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const handleUpdateBatchQuantity = (stockId: number, newQuantity: number) => {
    updateBatchQtyMutation.mutate({ stockId, quantity: newQuantity })
  }

  const handleOpenBatchUnit = (stockId: number) => {
    openBatchUnitMutation.mutate(stockId)
  }

  const handleTransferSubmit = async (targetLocationId: number, transferQty: number) => {
    if (!transferringStock) return
    await transferBatchMutation.mutateAsync({
      stockId: transferringStock.stock.id,
      targetLocationId,
      quantity: transferQty,
    })
    setTransferringStock(null)
  }

  if (isInitialLoad) {
    return <div className="p-4 text-sm text-gray-500">Loading inventory...</div>
  }

  return (
    <div className="space-y-4">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center pb-2 border-b">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Items
            {isFetching && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          </h1>
          <p className="text-xs text-gray-500">
            Showing {items.length} of {pagination?.totalItems || 0} total items
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <ItemFilterBar
        filters={filters}
        locations={locations}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* ITEMS TABLE */}
      <ItemsTable
        items={processedItems}
        totalItems={pagination?.totalItems || 0}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        locationsMap={locationsMap}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateBatchQuantity={handleUpdateBatchQuantity}
        onSelectItem={(item: Item) => setSelectedItem(item)}
        onOpenBatchUnit={handleOpenBatchUnit}
        onTransferBatch={(stock, parentItem) => setTransferringStock({ stock, item: parentItem })}
      />

      {/* ADD ITEM MODAL */}
      {isAddOpen && (
        <ItemFormModal
          isOpen={isAddOpen}
          locations={locations}
          initialBarcode=""
          currentUserId={currentUserId}
          onClose={() => setIsAddOpen(false)}
        />
      )}

      {/* DETAILS MODAL */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* ITEM TRANSFER MODAL */}
      {transferringStock && (
        <ItemTransferModal
          isOpen={Boolean(transferringStock)}
          item={transferringStock.item}
          stock={transferringStock.stock}
          locations={locationOptions}
          isLoading={transferBatchMutation.isPending}
          onClose={() => setTransferringStock(null)}
          onTransfer={(targetLocId, qty) => handleTransferSubmit(targetLocId, qty)}
        />
      )}
    </div>
  )
}
