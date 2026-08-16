import { Item, ItemStock } from '../types/item'

// Helper to calculate effective expiration date
export const getEffectiveExpiration = (
  item: Item | ItemStock,
  useWithinDays?: number | null
): Date | null => {
  let openExpiry: Date | null = null
  const effectiveUseWithin = 'useWithinDays' in item ? item.useWithinDays : useWithinDays

  if (item.openedOn && effectiveUseWithin) {
    openExpiry = new Date(item.openedOn)
    openExpiry.setDate(openExpiry.getDate() + effectiveUseWithin)
  }

  const hardExpiry = item.expirationDate ? new Date(item.expirationDate) : null

  if (openExpiry && hardExpiry) {
    return openExpiry < hardExpiry ? openExpiry : hardExpiry
  }
  return openExpiry || hardExpiry
}

// Helper to determine status badge display
export const getStatus = (item: Item) => {
  if (item.deletedAt) {
    return { label: 'Archived', color: 'bg-gray-100 text-gray-600 border border-gray-300' }
  }

  if (item.quantity == null || item.quantity <= 0) {
    return { label: 'Out', color: 'bg-rose-100 text-rose-800' }
  }

  if (item.isOpenedExpired) {
    return { label: 'Opened Expired', color: 'bg-red-100 text-red-800' }
  }

  const effectiveExpiry = getEffectiveExpiration(item, item.useWithinDays)
  const now = new Date()

  if (effectiveExpiry) {
    const diffDays = Math.ceil((effectiveExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' }
    if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'bg-amber-100 text-amber-800' }
  }

  const isLowStock =
    item.lowStockThreshold != null && item.quantity > 0 && item.quantity <= item.lowStockThreshold

  if (isLowStock) {
    return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' }
  }

  return { label: 'OK', color: 'bg-green-100 text-green-800' }
}

// Helper to safely convert Date / ISO string to YYYY-MM-DD for <input type="date" />
export const formatDateForInput = (dateVal?: string | Date | null): string => {
  if (!dateVal) return ''
  const dateObj = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
  if (isNaN(dateObj.getTime())) return '' // Prevents invalid date crashes

  return dateObj.toISOString().split('T')[0]
}
