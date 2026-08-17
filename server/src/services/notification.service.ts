import prisma from '../db.js'
import { sendNotificationEmail } from './email.service.js'

export type ItemEventType = 'LOW_STOCK' | 'EXPIRING' | 'ITEM_UPDATED'

interface NotifyOptions {
  locationId: number
  itemId: number
  itemName: string
  eventType: ItemEventType
  details?: string
  sendEmailAlert?: boolean
}

export const notifyLocationSubscribers = async ({
  locationId,
  itemId,
  itemName,
  eventType,
  details,
  sendEmailAlert = true,
}: NotifyOptions) => {
  try {
    // 1. Get subscribers with matching preferences and user emails
    const subscriptions = await prisma.locationSubscription.findMany({
      where: {
        locationId,
        ...(eventType === 'LOW_STOCK' && { notifyLowStock: true }),
        ...(eventType === 'EXPIRING' && { notifyExpiring: true }),
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    if (subscriptions.length === 0) return

    const titleMap: Record<ItemEventType, string> = {
      LOW_STOCK: 'Low Stock Alert',
      EXPIRING: 'Expiration Alert',
      ITEM_UPDATED: 'Item Updated',
    }

    const title = titleMap[eventType] || 'Notification'
    const message = details ? `${itemName}: ${details}` : `${itemName} needs attention.`

    // 2. Insert into the in-app Notification table
    await prisma.notification.createMany({
      data: subscriptions.map((sub) => ({
        userId: sub.userId,
        title,
        message,
        locationId,
        itemId,
      })),
    })

    // 3. Trigger emails using your existing helper
    if (sendEmailAlert) {
      for (const sub of subscriptions) {
        if (!sub.user?.email) continue

        // Fire without awaiting so it won't block the request execution loop
        sendNotificationEmail(sub.user.email, title, message).catch((err) =>
          console.error(`[Email Error] Failed to send email to ${sub.user.email}:`, err)
        )
      }
    }
  } catch (error) {
    console.error('Failed to notify location subscribers:', error)
  }
}
