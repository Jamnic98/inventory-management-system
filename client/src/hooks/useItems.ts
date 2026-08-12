import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addItem,
  addStockBatch,
  deleteItemById,
  deleteStockBatch,
  getArchivedItems,
  getItemByBarcode,
  getItemById,
  getItems,
  restoreItemById,
  updateItemQuantity,
  updateStockBatch,
} from '../api/items'
import type { AddItemData, AddStockBatchData, Item, ItemStock } from '../types'

// Central Query Keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  archived: () => [...itemKeys.all, 'archived'] as const,
  detail: (id: number | string) => [...itemKeys.all, 'detail', String(id)] as const,
  barcode: (code: string) => [...itemKeys.all, 'barcode', code] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch all items
 */
export const useItems = () => {
  return useQuery<Item[]>({
    queryKey: itemKeys.lists(),
    queryFn: getItems,
  })
}

/**
 * Fetch a single item by ID
 */
export const useItem = (id?: number | string) => {
  return useQuery<Item>({
    queryKey: itemKeys.detail(id!),
    queryFn: () => getItemById(id!),
    enabled: Boolean(id),
  })
}

/**
 * Fetch archived items
 */
export const useArchivedItems = () => {
  return useQuery<Item[]>({
    queryKey: itemKeys.archived(),
    queryFn: getArchivedItems,
  })
}

/**
 * Lookup an item by barcode
 */
export const useItemByBarcode = (barcode?: string) => {
  return useQuery<Item | null>({
    queryKey: itemKeys.barcode(barcode!),
    queryFn: () => getItemByBarcode(barcode!),
    enabled: Boolean(barcode),
  })
}

// ---------------------------------------------------------------------------
// Item Catalog Mutations
// ---------------------------------------------------------------------------

/**
 * Add a new item catalog entry + initial stock batch
 */
export const useCreateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newItem: AddItemData) => addItem(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

/**
 * Update item quantity (with Optimistic UI updates across primary batch & aggregated quantity)
 */
export const useUpdateItemQuantity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity }: { id: number | string; quantity: number }) =>
      updateItemQuantity(id, quantity),

    // Optimistic Update: Reflect top-level quantity and primary batch changes immediately
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.lists() })

      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.lists())

      if (previousItems) {
        queryClient.setQueryData<Item[]>(
          itemKeys.lists(),
          previousItems.map((item) => {
            if (String(item.id) !== String(id)) return item

            // Update primary stock batch in optimistic cache if present
            const updatedStocks = [...(item.stocks || [])]
            if (updatedStocks.length > 0) {
              updatedStocks[0] = { ...updatedStocks[0], quantity }
            }

            return {
              ...item,
              quantity, // Aggregated total quantity
              stocks: updatedStocks,
            }
          })
        )
      }

      return { previousItems }
    },

    // Rollback if server fails
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.lists(), context.previousItems)
      }
    },

    // Always re-sync after settling
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

/**
 * Delete an item (Soft-delete catalog item and all associated stock batches)
 */
export const useDeleteItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteItemById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

/**
 * Restore an archived item
 */
export const useRestoreItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => restoreItemById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

// ---------------------------------------------------------------------------
// Granular Stock Batch Mutations (New)
// ---------------------------------------------------------------------------

/**
 * Add a new standalone stock batch to an existing item (e.g., bought another box)
 */
export const useAddStockBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, batch }: { itemId: number | string; batch: AddStockBatchData }) =>
      addStockBatch(itemId, batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

/**
 * Update a specific stock batch (e.g., change expiration date or quantity of batch #2)
 */
export const useUpdateStockBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, data }: { stockId: number | string; data: Partial<ItemStock> }) =>
      updateStockBatch(stockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

/**
 * Delete or consume a specific stock batch without deleting the item catalog entry
 */
export const useDeleteStockBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (stockId: number | string) => deleteStockBatch(stockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}
