import { apiClient, isAPIError } from './client'
import type {
  AddItemData,
  AddStockBatchData,
  GetItemsParams,
  Item,
  PaginatedResponse,
  UpdateItemData,
} from '../types'

// -----------------------------------------------------------------------------
// Catalog / Item Collection API Calls
// -----------------------------------------------------------------------------

export const getItems = async (params?: GetItemsParams): Promise<PaginatedResponse<Item>> => {
  return apiClient.get<PaginatedResponse<Item>>('/items', { params })
}
export const addItem = async (item: AddItemData): Promise<Item> => {
  return apiClient.post<Item>('/items', item)
}

export const getArchivedItems = async (): Promise<Item[]> => {
  return apiClient.get<Item[]>('/items/archived')
}

// -----------------------------------------------------------------------------
// Single Item API Calls
// -----------------------------------------------------------------------------

export const getItemById = async (itemId: number | string): Promise<Item> => {
  return apiClient.get<Item>(`/items/${itemId}`)
}

/**
 * Update general catalog fields or top-level batch parameters
 */
export const updateItem = async (itemId: number | string, data: UpdateItemData): Promise<Item> => {
  return apiClient.patch<Item>(`/items/${itemId}`, data)
}

/**
 * Convenience helper for quick quantity updates on the primary stock batch
 */
export const updateItemQuantity = async (
  itemId: number | string,
  quantity: number
): Promise<Item> => {
  return updateItem(itemId, { quantity })
}

export const deleteItemById = async (itemId: number | string): Promise<void> => {
  await apiClient.delete(`/items/${itemId}`)
}

export const restoreItemById = async (itemId: number | string): Promise<Item> => {
  return apiClient.post<Item>(`/items/${itemId}/restore`)
}

export const getItemByBarcode = async (barcode: string): Promise<Item | null> => {
  try {
    return await apiClient.get<Item>(`/items/barcode/${barcode}`)
  } catch (error: unknown) {
    if (isAPIError(error) && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Add a new stock batch to an existing catalog item
 */
export const addStockBatch = async (
  itemId: number | string,
  batch: AddStockBatchData
): Promise<Item> => {
  return apiClient.post<Item>(`/items/${itemId}/stocks`, batch)
}
