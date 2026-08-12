import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateStockBatch, deleteStockBatch, transferStock } from '../api'
import { itemKeys } from './useItems'
import type { ItemStock } from '../types'

export interface TransferStockVariables {
  stockId: number | string
  targetLocationId: number
  quantity: number
}

/**
 * Transfer a quantity of a specific stock batch to another location
 */
export const useTransferStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, targetLocationId, quantity }: TransferStockVariables) =>
      transferStock(stockId, targetLocationId, quantity),
    onSuccess: () => {
      // Invalidate item/stock queries so tables and location counts re-fetch automatically
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

/**
 * Alias helper for backward compatibility if components still import useTransferItem
 */
export const useTransferItem = useTransferStock
