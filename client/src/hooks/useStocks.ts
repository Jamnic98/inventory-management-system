import { useMutation, useQueryClient } from '@tanstack/react-query'

import { openBatchUnit, transferBatch, updateBatchQuantity } from '../api'

/**
 * Common cache invalidator so both the item list and dashboard stay in sync
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
    onSuccess: () => {
      invalidate()
    },
  })
}

/**
 * Hook to update batch quantity
 */
export function useUpdateStockQuantity() {
  const invalidate = useInvalidateInventory()

  return useMutation({
    mutationFn: ({ stockId, newQuantity }: { stockId: number; newQuantity: number }) =>
      updateBatchQuantity(stockId, newQuantity),
    onSuccess: () => {
      invalidate()
    },
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
    onSuccess: () => {
      invalidate()
    },
  })
}
