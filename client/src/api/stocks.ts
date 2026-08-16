import { apiClient } from '.'
import type { ItemStock } from '../types'

export interface TransferStockPayload {
  targetLocationId: number
  quantity: number
}

/**
 * Update the quantity of a specific stock batch
 * PATCH /stocks/:stockId
 */
export const updateBatchQuantity = async (
  stockId: number | string,
  quantity: number
): Promise<ItemStock> => {
  return apiClient.patch<ItemStock>(`/stocks/${stockId}`, { quantity })
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
 * Open a unit from a specific stock batch
 * POST /stocks/:stockId/open
 */
export const openBatchUnit = async (stockId: number | string): Promise<ItemStock> => {
  return apiClient.post<ItemStock>(`/stocks/${stockId}/open`)
}

/**
 * Transfer a quantity of a specific stock batch to a new location.
 * POST /stocks/:stockId/transfer
 */
export const transferBatch = async (
  stockId: number | string,
  targetLocationId: number,
  quantity: number
): Promise<ItemStock> => {
  return apiClient.post<ItemStock>(`/stocks/${stockId}/transfer`, {
    targetLocationId,
    quantity,
  } satisfies TransferStockPayload)
}

// Alias for backwards compatibility if referenced elsewhere as `transferStock`
export const transferStock = transferBatch

/**
 * Delete / consume a specific stock batch without removing the whole catalog item
 * DELETE /stocks/:stockId
 */
export const deleteStockBatch = async (stockId: number | string): Promise<void> => {
  await apiClient.delete(`/stocks/${stockId}`)
}
