import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateBatchQuantity, openBatchUnit, transferBatch } from '../api'

export function useBatchMutations() {
  const queryClient = useQueryClient()

  const invalidateItems = () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  }

  const updateBatchQtyMutation = useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: number; quantity: number }) =>
      updateBatchQuantity(stockId, quantity),
    onSuccess: invalidateItems,
  })

  const openBatchUnitMutation = useMutation({
    mutationFn: (stockId: number) => openBatchUnit(stockId),
    onSuccess: invalidateItems,
  })

  const transferBatchMutation = useMutation({
    mutationFn: ({
      stockId,
      targetLocationId,
      quantity,
    }: {
      stockId: number
      targetLocationId: number
      quantity: number
    }) => transferBatch(stockId, targetLocationId, quantity),
    onSuccess: invalidateItems,
  })

  return {
    updateBatchQtyMutation,
    openBatchUnitMutation,
    transferBatchMutation,
  }
}
