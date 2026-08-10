import { apiClient, isAPIError } from './client'
import type { AddItemData, Item } from '../types'

// Collection API Calls
export const getItems = async (): Promise<Item[]> => {
  return apiClient.get<Item[]>('/items')
}

export const addItem = async (item: AddItemData): Promise<Item> => {
  return apiClient.post<Item>('/items', item)
}

export const getArchivedItems = async (): Promise<Item[]> => {
  return apiClient.get<Item[]>('/items/archived')
}

// Single Item API Calls
export const getItemById = async (itemId: number | string): Promise<Item> => {
  return apiClient.get<Item>(`/items/${itemId}`)
}

export const updateItemQuantity = async (
  itemId: number | string,
  quantity: number
): Promise<Item> => {
  return apiClient.patch<Item>(`/items/${itemId}`, { quantity })
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
