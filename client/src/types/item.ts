// Full Item model as returned by backend API (enriched with computed fields)
export interface Item {
  id: number
  label: string
  quantity: number
  barcode?: string | null
  expirationDate?: string | Date | null
  openedOn?: string | Date | null
  useWithinDays?: number | null
  lowStockThreshold?: number | null
  locationId?: number | null
  userId?: number | null // null = shared, number = personal item
  // TODO: set specific types
  deletedAt?: string | Date | null // null = active, timestamp = archived
  createdAt?: string | Date | null
  updatedAt?: string | Date | null

  // Computed helper properties from backend
  isLowStock?: boolean
  isOpenedExpired?: boolean

  // Optional relations
  // TODO: use actual types?
  location?: { id: number; name: string } | null
  user?: { id: number; name: string } | null
}

// Payload for creating new items
export interface AddItemData {
  label: string
  quantity: number
  barcode?: string | null
  expirationDate?: string | Date | null
  openedOn?: string | Date | null
  useWithinDays?: number | null
  lowStockThreshold?: number | null
  locationId?: number | null
  userId?: number | null
}

// Payload for updating existing items
export type UpdateItemData = Partial<AddItemData>

// Filter & Sort State for UI Filtering
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
