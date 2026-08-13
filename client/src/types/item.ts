import { Location } from './location'
import { User } from './user'

// -----------------------------------------------------------------------------
// Stock / Inventory Batch Model
// -----------------------------------------------------------------------------
export interface ItemStock {
  id: number
  itemId: number
  locationId?: number | null
  quantity: number
  expirationDate?: string | Date | null
  openedOn?: string | Date | null
  deletedAt?: string | Date | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null

  // Optional relations
  location?: Partial<Location> | null
}

// -----------------------------------------------------------------------------
// Full Master Catalog Item model (enriched with computed fields)
// -----------------------------------------------------------------------------
export interface Item {
  id: number
  label: string
  barcode?: string | null
  useWithinDays?: number | null
  lowStockThreshold?: number | null
  userId?: number | null // null = shared, number = personal item

  deletedAt?: string | Date | null // null = active, timestamp = archived
  createdAt?: string | Date | null
  updatedAt?: string | Date | null

  // Nested Inventory Batches
  stocks: ItemStock[]

  // Aggregated & computed helper properties from backend
  quantity: number // Total sum across all active batches
  isLowStock?: boolean
  isOpenedExpired?: boolean
  isExpired?: boolean

  // Primary batch fallbacks (for backwards compatibility with single-location components)
  locationId?: number | null
  location?: Partial<Location> | null
  expirationDate?: string | Date | null
  openedOn?: string | Date | null

  // Optional relations
  user?: Partial<User> | null
}

// -----------------------------------------------------------------------------
// Payload Types
// -----------------------------------------------------------------------------

// Payload for creating new catalog items and initial stock batch
export interface AddItemData {
  label: string
  quantity?: number
  barcode?: string | null
  expirationDate?: string | Date | null
  openedOn?: string | Date | null
  useWithinDays?: number | null
  lowStockThreshold?: number | null
  locationId?: number | null
  userId?: number | null
}

// Payload for updating existing items / primary stock batch
export interface UpdateItemData extends Partial<AddItemData> {
  stockId?: number // Optional: target a specific stock batch during update
}

// Payload for adding a new standalone batch to an existing catalog item
export interface AddStockBatchData {
  quantity: number
  locationId?: number | null
  expirationDate?: string | Date | null
  openedOn?: string | Date | null
}

// -----------------------------------------------------------------------------
// UI Filter & Sort State
// -----------------------------------------------------------------------------
export interface ItemFilters {
  search: string
  locationId: number | null
  stockStatus: 'all' | 'low_stock'
  expiryStatus: 'all' | 'expiring_soon' | 'expired'
  archivedStatus?: 'active' | 'archived' | 'all'
  ownership?: 'all' | 'personal' | 'shared'
  sortBy: 'label' | 'expirationDate' | 'quantity' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

export interface TransferItemPayload {
  targetLocationId: number
  quantity: number
}

export interface GetItemsParams {
  page?: number
  limit?: number
  search?: string
  locationId?: number
}
