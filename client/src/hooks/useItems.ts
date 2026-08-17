import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addItem,
  addStockBatch,
  deleteItemById,
  getItemByBarcode,
  getItemById,
  getItems,
  restoreItemById,
  updateItem,
  updateItemQuantity,
} from '../api/items'
import type {
  AddItemData,
  AddStockBatchData,
  GetItemsParams,
  Item,
  PaginatedResponse,
  UpdateItemParams,
} from '../types'

// Central Query Keys
export const itemKeys = {
  all: ['items'] as const,
  list: (params?: GetItemsParams) => [...itemKeys.lists(), params] as const,
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
export function useItems(params?: GetItemsParams) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => (params ? getItems(params) : null),
    enabled: Boolean(params),
    placeholderData: (previousData) => previousData,
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
 * Lookup an item by barcode
 */
export const useItemByBarcode = (barcode?: string) => {
  const cleanBarcode = barcode?.trim()

  return useQuery<Item | null>({
    queryKey: itemKeys.barcode(cleanBarcode || ''),
    queryFn: () => getItemByBarcode(cleanBarcode!),
    enabled: Boolean(cleanBarcode),
    staleTime: 1000 * 60 * 5, // 5 minute cache
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
 * Update item
 */
export const useUpdateItem = () => {
  const queryClient = useQueryClient()

  return useMutation<Item, Error, UpdateItemParams>({
    mutationFn: ({ itemId, data }) => updateItem(itemId, data),
    onSuccess: (updatedItem) => {
      // Invalidate all item lists / main queries
      queryClient.invalidateQueries({ queryKey: itemKeys.all })

      // Invalidate or update the specific barcode query cache if a barcode exists
      if (updatedItem.barcode) {
        queryClient.invalidateQueries({
          queryKey: itemKeys.barcode(updatedItem.barcode.trim()),
        })
      }

      // Update or invalidate single item detail cache if you use detail keys
      if (itemKeys.detail) {
        queryClient.invalidateQueries({
          queryKey: itemKeys.detail(updatedItem.id),
        })
      }
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

    onMutate: async ({ id, quantity }) => {
      // Cancel any outgoing refetches for list queries
      await queryClient.cancelQueries({ queryKey: itemKeys.lists() })

      // Snapshot all matching paginated lists for rollback
      const previousData = queryClient.getQueriesData<PaginatedResponse<Item>>({
        queryKey: itemKeys.lists(),
      })

      // Optimistically update every active list cache
      queryClient.setQueriesData<PaginatedResponse<Item>>({ queryKey: itemKeys.lists() }, (old) => {
        if (!old) return old

        return {
          ...old,
          data: old.data.map((item) => {
            if (String(item.id) !== String(id)) return item

            const updatedStocks = [...(item.stocks || [])]
            if (updatedStocks.length > 0) {
              const delta = quantity - (item.quantity ?? 0)
              const primaryQty = updatedStocks[0].quantity ?? 0

              updatedStocks[0] = {
                ...updatedStocks[0],
                quantity: Math.max(0, primaryQty + delta),
              }
            }

            return {
              ...item,
              quantity,
              stocks: updatedStocks,
            }
          }),
        }
      })

      return { previousData }
    },

    onError: (_err, _variables, context) => {
      // Roll back all paginated queries
      context?.previousData?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },

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
