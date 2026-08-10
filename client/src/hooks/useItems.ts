import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addItem,
  deleteItemById,
  getArchivedItems,
  getItemByBarcode,
  getItemById,
  getItems,
  restoreItemById,
  updateItemQuantity,
} from '../api/items'
import type { AddItemData, Item } from '../types'

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
// Mutations
// ---------------------------------------------------------------------------

/**
 * Add a new item
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
 * Update item quantity (with Optimistic UI updates)
 */
export const useUpdateItemQuantity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity }: { id: number | string; quantity: number }) =>
      updateItemQuantity(id, quantity),

    // Optimistic Update: Immediately reflect quantity changes in UI before server ACK
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.lists() })

      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.lists())

      if (previousItems) {
        queryClient.setQueryData<Item[]>(
          itemKeys.lists(),
          previousItems.map((item) =>
            String(item.id) === String(id) ? { ...item, quantity } : item
          )
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
 * Delete an item
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
