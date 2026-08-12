import { apiClient } from '.'
import type { ItemStock } from '../types'

export interface TransferStockPayload {
  targetLocationId: number
  quantity: number
}

/**
 * Transfer a quantity of a specific stock batch to a new location.
 * POST /stocks/:stockId/transfer
 */
export const transferStock = async (
  stockId: number | string,
  targetLocationId: number,
  quantity: number
): Promise<ItemStock> => {
  return apiClient.post<ItemStock>(`/stocks/${stockId}/transfer`, {
    targetLocationId,
    quantity,
  } satisfies TransferStockPayload)
}

/**
 * Update specific properties of a single stock batch
 * PATCH /stocks/:stockId
 */
export const updateStockBatch = async (
  stockId: number | string,
  data: Partial<ItemStock>
): Promise<ItemStock> => {
  return apiClient.patch<ItemStock>(`/stocks/${stockId}`, data)
}

/**
 * Delete / consume a specific stock batch without removing the whole catalog item
 * DELETE /stocks/:stockId
 */
export const deleteStockBatch = async (stockId: number | string): Promise<void> => {
  await apiClient.delete(`/stocks/${stockId}`)
}

/**
 * Legacy / Alias helper if your components still call transferItem
 */
export const transferItem = transferStock
