import type { Request, Response } from 'express'
import prisma from '../db.js'
import { parseId } from '../utils/index.js'

// GET /api/notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    })

    return res.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

// PATCH /api/notifications/mark-read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return res.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications read:', error)
    return res.status(500).json({ error: 'Failed to update notifications' })
  }
}

// PATCH /api/notifications/:id/read
export const markSingleNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const notificationId = parseId(req.params.id)

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })

    return res.json({ success: true })
  } catch (error) {
    console.error('Error marking notification read:', error)
    return res.status(500).json({ error: 'Failed to update notification' })
  }
}
