import { Request, Response, NextFunction } from 'express'
import { getHomeDashboardData } from '../services/dashboard.service.js'
import prisma from '../db.js'
import { sendRestockListEmail } from '../services/email.service.js'

/**
 * Helper to build consistent location scope filters across handlers
 */
function getLocationScopeFilter(scope: 'public' | 'private' | 'both') {
  if (scope === 'public') return { isPrivate: false }
  if (scope === 'private') return { isPrivate: true }
  return undefined
}

/**
 * GET /api/dashboard
 */
export async function getDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const data = await getHomeDashboardData(userId)
    return res.json(data)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/dashboard/recipients
 */
export async function getRestockRecipientsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    return res.json(users)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/dashboard/send-restock-email
 */
export async function sendRestockEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { recipientIds, scope = 'public' } = req.body as {
      recipientIds: number[]
      scope: 'public' | 'private' | 'both'
    }

    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required.' })
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })

    const recipients = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { email: true },
    })

    const locationFilter = getLocationScopeFilter(scope)

    const items = await prisma.item.findMany({
      where: {
        // Include items owned by user or items in accessible locations
        OR: [{ userId }, { userId: null }],
        lowStockThreshold: { not: null },
      },
      include: {
        stocks: {
          where: locationFilter ? { location: locationFilter } : undefined,
          include: { location: { select: { label: true } } },
        },
      },
    })

    const restockItems = items
      .map((item) => {
        // Calculate total stock across matching locations (fallback to item.quantity if direct field exists)
        const totalQty =
          item.stocks.length > 0
            ? item.stocks.reduce((acc, s) => acc + s.quantity, 0)
            : ((item as any).quantity ?? 0)

        const locationName = item.stocks[0]?.location?.label || 'Unassigned'
        const threshold = item.lowStockThreshold ?? 1

        return {
          id: item.id,
          label: item.label,
          currentQty: totalQty,
          threshold,
          isOutOfStock: totalQty === 0,
          needsRestock: totalQty <= threshold, // ✅ Correct <= comparison
          locationName,
        }
      })
      .filter((item) => item.needsRestock)

    if (restockItems.length === 0) {
      return res.status(400).json({ message: 'No items matching criteria require restocking.' })
    }

    const senderName = currentUser?.name || currentUser?.email || 'A team member'
    const sendPromises = recipients
      .filter((r) => Boolean(r.email))
      .map((r) => sendRestockListEmail(r.email, senderName, restockItems))

    await Promise.all(sendPromises)

    return res.json({
      message: `Restock email sent successfully to ${sendPromises.length} recipient(s).`,
      itemCount: restockItems.length,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/dashboard/restock-preview?scope=public
 */
export async function getRestockPreviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const scope = (req.query.scope as 'public' | 'private' | 'both') || 'public'
    const locationFilter = getLocationScopeFilter(scope)

    const items = await prisma.item.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        lowStockThreshold: { not: null },
      },
      include: {
        stocks: {
          where: locationFilter ? { location: locationFilter } : undefined,
          include: {
            location: { select: { label: true } },
          },
        },
      },
    })

    const restockItems = items
      .map((item) => {
        const totalQty =
          item.stocks.length > 0
            ? item.stocks.reduce((acc, s) => acc + s.quantity, 0)
            : ((item as any).quantity ?? 0)

        const locationName = item.stocks[0]?.location?.label || 'Unassigned'
        const threshold = item.lowStockThreshold ?? 1

        return {
          id: item.id,
          label: item.label,
          currentQty: totalQty,
          threshold,
          isOutOfStock: totalQty === 0,
          needsRestock: totalQty <= threshold,
          locationName,
        }
      })
      .filter((item) => item.needsRestock)

    return res.json(restockItems)
  } catch (error) {
    next(error)
  }
}
