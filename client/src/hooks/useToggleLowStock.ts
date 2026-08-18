import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toggleItemLowStock } from '../api'

export const useToggleLowStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isManuallyLowStock }: { id: number; isManuallyLowStock: boolean }) =>
      toggleItemLowStock(id, isManuallyLowStock),
    onSuccess: () => {
      // Invalidate relevant queries so Dashboard and Items Table refresh automatically
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
