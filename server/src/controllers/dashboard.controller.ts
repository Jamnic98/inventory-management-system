import { Request, Response, NextFunction } from 'express'
import { getHomeDashboardData } from '../services/dashboard.service.js'
import prisma from '../db.js'
import { sendRestockListEmail } from '../services/email.service.js'
import { getRestockItems, RestockScope } from '../utils/database.js'

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
      scope: RestockScope
    }

    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required.' })
    }

    const restockItems = await getRestockItems(userId, scope)

    if (restockItems.length === 0) {
      return res.status(400).json({ message: 'No items matching criteria require restocking.' })
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })

    const recipients = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { email: true },
    })

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

    const scope = (req.query.scope as RestockScope) || 'public'
    const restockItems = await getRestockItems(userId, scope)

    return res.json(restockItems)
  } catch (error) {
    next(error)
  }
}
