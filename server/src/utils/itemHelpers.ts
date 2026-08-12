import { Request } from 'express'
import { Prisma } from '../generated/prisma/client.js'

import { parseId } from './index.js'

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

// Typed Prisma payload including nested stocks and their location relation
export type ItemWithStocks = Prisma.ItemGetPayload<{
  include: {
    stocks: {
      include: { location: true }
    }
  }
}>

export interface EnrichedItem extends Omit<ItemWithStocks, 'stocks'> {
  stocks: ItemWithStocks['stocks']

  // Computed aggregated fields
  quantity: number
  isLowStock: boolean
  isOpenedExpired: boolean
  isExpired: boolean

  // Primary stock properties (for backward compatibility with single-location UI components)
  locationId: number | null
  location: ItemWithStocks['stocks'][number]['location'] | null
  expirationDate: Date | null
  openedOn: Date | null
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Extracts and parses current userId from request headers or auth state
 */
export const getCurrentUserId = (req: Request): number | null => {
  const userIdHeader = req.headers['x-user-id']
  if (!userIdHeader) return null
  const parsed = parseId(String(userIdHeader))
  return isNaN(parsed) ? null : parsed
}

/**
 * Enriches a raw catalog item + stock batches with calculated inventory flags
 */
export const enrichItem = (item: ItemWithStocks): EnrichedItem => {
  const stocks = item.stocks || []
  const now = new Date()

  // 1. Calculate aggregated total quantity across all active batches
  const totalQuantity = stocks.reduce((acc, stock) => acc + (stock.quantity || 0), 0)

  // 2. Check if total inventory falls below catalog low-stock threshold
  const isLowStock =
    item.lowStockThreshold !== null &&
    item.lowStockThreshold !== undefined &&
    totalQuantity <= item.lowStockThreshold

  // 3. Check if any stock batch has passed its 'Opened + Use Within Days' window
  const isOpenedExpired = stocks.some((stock) => {
    if (!stock.openedOn || !item.useWithinDays) return false
    const expireBy = new Date(stock.openedOn)
    expireBy.setDate(expireBy.getDate() + item.useWithinDays)
    return expireBy < now
  })

  // 4. Check if any stock batch has passed its calendar expiration date
  const isExpired = stocks.some((stock) => {
    return stock.expirationDate ? new Date(stock.expirationDate) < now : false
  })

  // 5. Select primary batch (earliest expiring) for legacy single-location views
  const primaryStock = stocks[0] || null

  return {
    ...item,
    stocks,
    quantity: totalQuantity,
    isLowStock,
    isOpenedExpired,
    isExpired,

    // Primary stock fallbacks for frontend backward compatibility
    locationId: primaryStock?.locationId ?? null,
    location: primaryStock?.location ?? null,
    expirationDate: primaryStock?.expirationDate ?? null,
    openedOn: primaryStock?.openedOn ?? null,
  }
}
