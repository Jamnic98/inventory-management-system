import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  deleteStockBatch,
  openBatchUnit,
  restoreStockBatch,
  transferBatch,
  updateBatchQuantity,
} from '../api'

/**
 * Common cache invalidator so both item queries and dashboard stay in sync
 */
function useInvalidateInventory() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['items'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
  }
}

/**
 * Hook to mark a stock unit/batch as opened
 */
export function useOpenStockBatch() {
  const invalidate = useInvalidateInventory()

  return useMutation({
    mutationFn: (stockId: number) => openBatchUnit(stockId),
    onSuccess: () => invalidate(),
  })
}

/**
 * Hook to update batch quantity
 */
export function useUpdateStockQuantity() {
  const invalidate = useInvalidateInventory()

  return useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: number; quantity: number }) =>
      updateBatchQuantity(stockId, quantity),
    onSuccess: () => invalidate(),
  })
}

/**
 * Hook to transfer a batch to a new location
 */
export function useTransferStockBatch() {
  const invalidate = useInvalidateInventory()

  return useMutation({
    mutationFn: ({
      stockId,
      targetLocationId,
      quantity,
    }: {
      stockId: number
      targetLocationId: number
      quantity: number
    }) => transferBatch(stockId, targetLocationId, quantity),
    onSuccess: () => invalidate(),
  })
}

/**
 * Hook to soft-delete/consume a specific stock batch
 */
export function useDeleteStockBatch() {
  const invalidate = useInvalidateInventory()

  return useMutation({
    mutationFn: (stockId: number) => deleteStockBatch(stockId),
    onSuccess: () => invalidate(),
  })
}

// Define the restore mutation hook
export function useRestoreStockBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (stockId: number | string) => restoreStockBatch(stockId),
    onSuccess: () => {
      // Invalidate relevant queries so the restored stock batch appears back in the UI
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
  })
}

/**
 * Composite hook exposing all batch mutations in one call
 */
export function useBatchMutations() {
  const openBatchUnitMutation = useOpenStockBatch()
  const updateBatchQtyMutation = useUpdateStockQuantity()
  const transferBatchMutation = useTransferStockBatch()
  const deleteBatchMutation = useDeleteStockBatch()
  const restoreBatchMutation = useRestoreStockBatch()

  return {
    openBatchUnitMutation,
    updateBatchQtyMutation,
    transferBatchMutation,
    deleteBatchMutation,
    restoreBatchMutation,
  }
}
