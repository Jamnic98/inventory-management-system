import { Request, Response, NextFunction } from 'express'
import { getHomeDashboardData } from '../services/dashboard.service.js'
import prisma from '../db.js'
import { sendRestockListEmail } from '../services/email.service.js'

/**
 * GET /api/dashboard
 * Fetch all dashboard widgets/lists for the authenticated user
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
 * Fetch users who can receive notifications
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

    // 1. Fetch current user info for sender details
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })

    // 2. Fetch targeted recipients
    const recipients = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { email: true },
    })

    // 3. Build scope filter for items/locations
    const locationScopeFilter =
      scope === 'public' ? { isPrivate: false } : scope === 'private' ? { isPrivate: true } : {}

    // 4. Query all items with stock filtered by scope and threshold
    const items = await prisma.item.findMany({
      where: {
        userId,
        lowStockThreshold: { not: null }, // Only items with explicit thresholds
      },
      include: {
        stocks: {
          where: { location: locationScopeFilter },
          include: { location: { select: { label: true } } },
        },
      },
    })

    const restockItems = items
      .map((item) => {
        const totalQty = item.stocks.reduce((acc, s) => acc + s.quantity, 0)
        const locationName = item.stocks[0]?.location?.label || 'General'
        const threshold = item.lowStockThreshold!

        return {
          label: item.label,
          currentQty: totalQty,
          threshold,
          isOutOfStock: totalQty === 0,
          needsRestock: totalQty <= threshold,
          locationName,
        }
      })
      .filter((item) => item.needsRestock)

    if (restockItems.length === 0) {
      return res.status(400).json({ message: 'No items matching criteria require restocking.' })
    }

    // 5. Dispatch emails
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
/**
 * GET /api/dashboard/restock-preview?scope=public
 */
export async function getRestockPreviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const scope = (req.query.scope as 'public' | 'private' | 'both') || 'public'

    const locationFilter =
      scope === 'public'
        ? { userId: null }
        : scope === 'private'
          ? { userId: { not: null } }
          : undefined

    const items = await prisma.item.findMany({
      where: {
        userId,
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
      .filter((item) => {
        // 1. If scope isn't 'both', exclude items that have no stocks in this scope
        if (scope !== 'both' && item.stocks.length === 0) {
          return false
        }
        return true
      })
      .map((item) => {
        const totalQty = item.stocks.reduce((acc, s) => acc + s.quantity, 0)
        const locationName = item.stocks[0]?.location?.label || 'Unassigned'
        const threshold = item.lowStockThreshold!

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
