import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import {
  ItemFormModal,
  EditItemModal,
  ItemFilterBar,
  ItemsTable,
  ItemTransferModal,
  ItemDetailsModal,
} from '../components'
import { getLocations } from '../api'
import { useAlert, useAuth, useBatchMutations, useItems, useUpdateItemQuantity } from '../hooks'
import type { Location, Item, ItemFilters, ItemStock } from '../types'

const DEFAULT_FILTERS: ItemFilters = {
  search: '',
  locationId: null,
  stockStatus: 'all',
  expiryStatus: 'all',
  archivedStatus: 'active',
  ownership: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export default function Items() {
  const alert = useAlert()
  const { user } = useAuth()
  const currentUserId = user?.id
  const {
    updateBatchQtyMutation,
    openBatchUnitMutation,
    transferBatchMutation,
    deleteBatchMutation,
    restoreBatchMutation,
  } = useBatchMutations()

  // Pagination & Filter State
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)

  // Modal & Selected Item States
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [transferringStock, setTransferringStock] = useState<{
    stock: ItemStock
    item: Item
  } | null>(null)
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false)

  // Server-Paginated & Filtered Items Query
  const {
    data,
    isLoading: isLoadingItems,
    isFetching,
  } = useItems({
    page,
    limit: pageSize,
    ...filters,
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

  const handleDeleteBatch = (stock: ItemStock) => {
    if (!stock.id) return

    deleteBatchMutation.mutate(stock.id, {
      onSuccess: () => {
        alert.success(`Stock batch deleted`, {
          duration: 6000,
          undoLabel: 'Undo',
          onUndo: async () => {
            try {
              await restoreBatchMutation.mutateAsync(stock.id)
              alert.success(`Stock batch restored`)
            } catch (err) {
              console.error('Failed to restore stock batch:', err)
              alert.error('Failed to restore stock batch')
            }
          },
        })
      },
      onError: () => {
        alert.error('Failed to delete stock batch')
      },
    })
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
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
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
        items={items}
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
        onEditItem={(item: Item) => setEditingItem(item)}
        onOpenBatchUnit={handleOpenBatchUnit}
        onTransferBatch={(stock, parentItem) => setTransferringStock({ stock, item: parentItem })}
        onDeleteBatch={handleDeleteBatch}
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

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <EditItemModal
          isOpen={Boolean(editingItem)}
          item={editingItem}
          locations={locations}
          currentUserId={currentUserId}
          onClose={() => setEditingItem(null)}
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
