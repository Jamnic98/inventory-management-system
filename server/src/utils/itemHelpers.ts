import { Request } from 'express'
import jwt from 'jsonwebtoken'
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
  // Primary: Use user attached by requireAuth middleware
  if (req.user && typeof req.user.id === 'number') {
    return req.user.id
  }

  // Secondary: Extract from Bearer JWT token in Authorization header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key'
      const decoded = jwt.verify(token, jwtSecret) as { id: number }
      const parsedJwtId = parseId(String(decoded.id))
      if (!isNaN(parsedJwtId)) {
        return parsedJwtId
      }
    } catch {
      // Invalid/expired token
    }
  }

  // Fallback: x-user-id header (for automated tests / legacy)
  const userIdHeader = req.headers['x-user-id'] || req.cookies?.user_session
  if (userIdHeader) {
    const parsed = parseId(String(userIdHeader))
    return isNaN(parsed) ? null : parsed
  }

  return null
}
/**
 * Enriches a raw catalog item + stock batches with calculated inventory flags
 */
export const enrichItem = (item: ItemWithStocks): EnrichedItem => {
  const stocks = item.stocks || []
  const now = new Date()

  // Calculate aggregated total quantity across all active batches
  const totalQuantity = stocks.reduce((acc, stock) => acc + (stock.quantity || 0), 0)

  // Check low stock condition
  const isLowStock = item.lowStockThreshold != null && totalQuantity <= item.lowStockThreshold

  // Check if any batch has exceeded its 'opened + useWithinDays' window
  const isOpenedExpired = stocks.some((stock) => {
    if (!stock.openedOn || !item.useWithinDays) return false
    const expireBy = new Date(stock.openedOn)
    expireBy.setDate(expireBy.getDate() + item.useWithinDays)
    return expireBy < now
  })

  // Check calendar expiration
  const isExpired = stocks.some((stock) => {
    return stock.expirationDate ? new Date(stock.expirationDate) < now : false
  })

  // Safely find the primary (earliest expiring) stock batch
  const sortedStocks = [...stocks].sort((a, b) => {
    if (!a.expirationDate) return 1
    if (!b.expirationDate) return -1
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  })
  const primaryStock = sortedStocks[0] || null

  return {
    ...item,
    stocks,
    quantity: totalQuantity,
    isLowStock,
    isOpenedExpired,
    isExpired,

    // Primary stock fallbacks for single-location components
    locationId: primaryStock?.locationId ?? null,
    location: primaryStock?.location ?? null,
    expirationDate: primaryStock?.expirationDate ?? null,
    openedOn: primaryStock?.openedOn ?? null,
  }
}
