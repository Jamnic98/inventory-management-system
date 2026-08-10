import { Request } from 'express'

import { Prisma } from '../generated/prisma/client.js'
import { parseId } from './index.js'

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

// Typed Prisma payload including the location relation
type ItemWithLocation = Prisma.ItemGetPayload<{
  include: { location: true }
}>

export interface EnrichedItem extends ItemWithLocation {
  isLowStock: boolean
  isOpenedExpired: boolean
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Extract active user ID from request headers (e.g. set by auth middleware or client header)
 */
export const getCurrentUserId = (req: Request): number | null => {
  const userIdHeader = req.headers['x-user-id']
  if (!userIdHeader) return null
  const parsedId = parseId(userIdHeader)
  return isNaN(parsedId) ? null : parsedId
}

/**
 * Enriches item object with derived UI flags
 */
export const enrichItem = (item: ItemWithLocation): EnrichedItem => {
  const isLowStock =
    item.lowStockThreshold !== null && item.lowStockThreshold !== undefined
      ? item.quantity <= item.lowStockThreshold
      : false

  let isOpenedExpired = false
  if (item.openedOn && item.useWithinDays) {
    const openedDate = new Date(item.openedOn)
    const expiryDate = new Date(openedDate)
    expiryDate.setDate(expiryDate.getDate() + item.useWithinDays)
    isOpenedExpired = new Date() > expiryDate
  }

  return {
    ...item,
    isLowStock,
    isOpenedExpired,
  }
}
